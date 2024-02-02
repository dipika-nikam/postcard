const express = require("express");
const app = express()
const User = require('../models/userModel');
const Postcard = require('../models/postcardModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const helper = require('../services/helper');
const moment = require('moment');
const errorHandle = require('../services/errorHendler')

require('dotenv').config();
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!email || !password) {
            return res.status(401).json({ success: false, message: "Email and password are required for login" });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: 'You are not register user' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const accessToken = jwt.sign(
            {
                user: {
                    username: user.username,
                    email: user.email,
                    id: user.id,
                },
            },
            process.env.JWT_SECRET,
            { expiresIn: "15h" }
        );

        res.status(200).json({ success: true, data: { email: email, password: password, accessToken: accessToken }, message: "You are login sucessfully" });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Email and password not valid' });
    }
}

exports.createPostcard = async (req, res) => {
    try {
        const { error, value } = helper.postcard.validate(req.body);
        if (error) {
            const responseMessage = errorHandle.handleValidationError(error);
            return res.status(422).json({
                success: false,
                message: responseMessage,
            });
        }
        const {
            recipientname, address1, address2, city, state, zipcode, message
        } = req.body;
        const { uniqueId, uniqueLink, expiryTimestamp } = helper.generateUniqueLink();
        const file = req.file;
        try {
            const zipCodeInfo = await helper.fetchZipCodeInfo(zipcode);
            const capitalizedState = state.charAt(0).toUpperCase() + state.slice(1);

            if (zipCodeInfo.length > 0) {
                const matchingAddress = zipCodeInfo.find(address =>
                    address.state === capitalizedState && address.postal_code === zipcode
                );
                if (matchingAddress) {
                    const newPostCardData = {
                        recipientname, address1, address2, city, state, zipcode, message, preview: uniqueLink
                    };
                    if (file) {
                        errorHandle.handleFileError(file);
                        const filePath = `uploads/${file.filename}`;
                        newPostCardData.images = filePath;
                    }
                    const newPostCard = await  Postcard.create({
                        id: uniqueId,
                        expires_at: expiryTimestamp,
                        ...newPostCardData,
                    });
                    return res.json({
                        success: true,
                        data: newPostCardData,
                        message: 'Postcard sent successfully'
                    });
                } else {
                    return res.json({ success: false, message: 'Address does not match with ZIP code information' });
                }
            } else {
                return res.json({ success: false, message: 'ZIP code does not exist' });
            }
        } catch (error) {
            console.error(error);
            return res.status(422).json({
                success: false,
                message: 'Error processing the file',
            });
        }
    } catch (error) {
        if (error.message.includes('zipcode')) {
            return res.status(404).json({ success: false, message: 'Please add a minimum 5-digit zipcode' });
        }
        return res.status(500).json({ success: false, message: 'Error processing the request' });
    }
};

exports.GetallPostcard = async(req,res) =>{
    try {
        const { error: validationError, value: searchParams } = helper.postcardSearchSchema.validate(req.query);
        const user_id = req.user.id
        if (validationError) {
            return res.status(422).json({
                success: false,
                message: validationError.details.map(detail => detail.message).join(', '),
            });
        }

        const { search, page, pageSize, limit } = searchParams;
        
        let postcards;
        let nextPage;
        let prevPage;
        if (search) {
            postcards = await helper.searchPostcards(search, page, pageSize, limit);
        } else {
            postcards = await helper.getPostcards(page, pageSize, limit);
        }
        if (!postcards || postcards.length === 0) {
            return res.status(200).json({ success: true, message: `Does not find any data according to   ${search}` });
        }
        const totalPostcardsCount = await Postcard.countDocuments();
        const totalPages = Math.ceil(totalPostcardsCount / pageSize);
        if (search) {
            if (page <= totalPages || totalPages === 1) {
                nextPage = `/api/get/postcard/?page=${page + 1}&search=${search}`;
            }

            if (page > 1) {
                prevPage = `/api/get/postcard/?page=${page - 1}&search=${search}`;
            }
            const formattedPostcards = postcards.map(postcard => {
                const { id, user_id, expires_at,__v, ...rest } = postcard._doc;
                return rest;
            });
            res.json({
                success: true,
                data: formattedPostcards,
                message: "Retrieved postcard sucessfully"
            });
        }else{
            if (page <= totalPages || totalPages === 1) {
                nextPage = `/api/get/postcard/?page=${page + 1}`;
            }

            if (page > 1) {
                prevPage = `/api/get/postcard/?page=${page - 1}`;
            }
            const formattedPostcards = postcards.map(postcard => {
                const { id, user_id,expires_at,__v, ...rest } = postcard._doc;
                return rest;
            });
            res.json({
                success: true,
                data: formattedPostcards,
                message: "Retrieved postcard sucessfully"
            });        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
}   

exports.GetallPostcardlink = async (req, res) => {
    try {
        const { counter } = req.params;
        if (!counter) {
            return res.status(400).json({ success: false, error: 'Invalid counter parameter' });
        }
        const postCard = await Postcard.findOne({ id: counter });

        if (!postCard) {
            return res.status(404).json({ success: false, error: 'Postcard not found' });
        }
        const currentMoment = moment();
        if (postCard.expires_at && currentMoment.isAfter(moment(postCard.expires_at))) {
            return res.status(419).json({ success: false, error: 'Postcard has expired' });
        }
        postCard.accessCounter = (postCard.accessCounter || 0) + 1;
        await postCard.save();
        const responseObject = {
            message: 'Postcard opened successfully',
            open_count: postCard.open_count,
            success: true,
            data: {recipientname: postCard.recipientname,
                address1: postCard.address1,
                address2: postCard.address2,
                city: postCard.city,
                state: postCard.state,
                zipcode: postCard.zipcode,
                message: postCard.message,
                images: postCard.images,
                accessCounter: postCard.accessCounter,},
        };

        res.status(201).json(responseObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error processing the request' });
    }
};

exports.updatePostcardLink = async ({ params: { id } }, res) => {
    try {
        const postcard = await Postcard.findById(id);

        if (!postcard) {
            return res.status(404).json({ success: false, message: 'Postcard not found' });
        }

        const { uniqueId, uniqueLink, expiryTimestamp } = helper.generateUniqueLink();
        postcard.id = uniqueId;
        postcard.preview = uniqueLink;
        postcard.expires_at = new Date(expiryTimestamp);
        await postcard.save();

        const response = {
            success: true,
            data: { _id: postcard._id, preview: postcard.preview, accessCounter: postcard.accessCounter, expires_at: postcard.expires_at },
            message: 'Postcard link updated successfully',
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
};
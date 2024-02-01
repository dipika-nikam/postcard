// controller/userController.js
const express = require("express");
const app = express()
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const Joi = require("joi");
const helper  = require('../services/helper');
const moment = require('moment');

require('dotenv').config();
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.User.findOne({ email });
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

        res.status(200).json({ success: true, data: req.body, token: accessToken, message: "You are login sucessfully" });
    }catch (error) {
        res.status(500).json({ success: false, message: 'Email and password not valid' });
    }
}


const postcard = Joi.object({
    recipientname: Joi.string()
      .regex(/^[A-Za-z]+(?: [A-Za-z0-9.,()\-]+)*$/)
      .trim()
      .required(),
    address1: Joi.string().required(),
    address2: Joi.string(),
    city:Joi.string().required(),
    state: Joi.string().required(),
    zipcode: Joi.string().required(),
    message: Joi.string().required(),
    
});

exports.createPostcard = async (req, res) => {
    try {
        const { error, value } = postcard.validate(req.body);
        if (error){
            if (error.message.includes('"recipientname"')){
                if (error.message.includes('"recipientname" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'Recipient name is required please add Recipient name.',
                    });
                }
                return res.status(422).json({
                    success : false,
                    message: 'Recipient names must begin with a letter and only include letters.',
                })
            }else if (error.message.includes('"address1"')){
                if (error.message.includes('"address1" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'Address is required please add address.',
                    });
                }
            }else if (error.message.includes('"city"')){
                if (error.message.includes('"city" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'City is required please add City.',
                    });
                }
            }else if (error.message.includes('"state"')){
                if (error.message.includes('"state" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'State is required please add satate.',
                    });
                }
            }else if (error.message.includes('"zipcode"')){
                if (error.message.includes('"zipcode" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'Zipcode is required please add code.',
                    });
                }
            }else if (error.message.includes('"message"')){
                if (error.message.includes('"message" is required')){
                    return res.status(422).json({
                      success : false,
                      message: 'message is required please add message.',
                    });
                }
            }
        }else{
            const { recipientname, address1, address2, city, state, zipcode, message } = req.body;
            const { uniqueId, uniqueLink,  expiryTimestamp } = helper.generateUniqueLink();
            const file = req.file;
            const url = new URL('https://api.zipcodestack.com/v1/search');
            const params = {
                codes: zipcode,
            };
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const headers = {
                'apikey': '01HNCGGFBYGYHE7W7812W5FCMD',
                'Accept': 'application/json',
            };
            const response = await fetch(url, {
                method: 'GET',
                headers,
            });
            const responseData = await response.json();
            const capitalizedState = state.charAt(0).toUpperCase() + state.slice(1);
            const zipCodeInfo = responseData.results[zipcode];
            if (zipCodeInfo && zipCodeInfo.length > 0) {
                const matchingAddress = zipCodeInfo.find(address => 
                    address.state === capitalizedState &&
                    address.postal_code === zipcode
                );
                if (matchingAddress) {
                    if (!file) {
                        const newPostCardData = {
                            recipientname,
                            address1,
                            address2,
                            city,
                            state,
                            zipcode,
                            message,
                            preview: uniqueLink
                        };
                
                        const newPostCard = await User.PostCard.create({
                            id: uniqueId,
                            expires_at:expiryTimestamp,
                            ...newPostCardData,
                        });
                        res.json({ success: true, data: newPostCardData, message: 'Postcard sent successfully' });   

                    }else{
                        try{
                            if (!file.mimetype.startsWith('image')) {
                                throw new Error('Invalid image file');
                            }
                            const filePath = 'uploads/' + file.filename;  
                            const newPostCardData = {
                                recipientname,
                                address1,
                                address2,
                                city,
                                state,
                                zipcode,
                                message,
                                images: filePath,
                                preview: uniqueLink
                            };
                    
                            const newPostCard = await User.PostCard.create({
                                id: uniqueId,
                                expires_at:expiryTimestamp,
                                ...newPostCardData,
                            });
                            res.json({ success: true, data: newPostCardData, message: 'Postcard sent successfully' });   
                        }catch(error){
                            console.error(error);
                            res.status(422).json({
                                success: false,
                                message: 'Error processing the file',
                            });
                        }                  
                    }
                } else {
                    res.json({ success: false, message: 'Address does not match with ZIP code information' });
                }
            } else {
                res.json({ success: false, message: 'ZIP code does not exist' });
            }
        }
    } catch (error) {
        console.error(error);
        if (error.message.includes('zipcode')) {
            res.status(404).json({ success: false, message: 'Please add a minimum 5-digit zipcode' });
        }
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
};

const postcardSearchSchema = Joi.object({
    search: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).default(10),
    limit: Joi.number().integer().min(1),
});

exports.GetallPostcard = async(req,res) =>{
    try {
        const { error: validationError, value: searchParams } = postcardSearchSchema.validate(req.query);
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
            postcards = await helper.getPostcards(page, pageSize);
        }
        if (!postcards || postcards.length === 0) {
            return res.status(200).json({ success: true, message: `Does not find any data according to   ${search}` });
        }
        const totalPostcardsCount = await User.PostCard.countDocuments();
        const totalPages = Math.ceil(totalPostcardsCount / pageSize);
        if (search) {
            if (page <= totalPages || totalPages === 1) {
                nextPage = `/api/get/postcard/?page=${page + 1}&search=${search}`;
            }

            if (page > 1) {
                prevPage = `/api/get/postcard/?page=${page - 1}&search=${search}`;
            }
            const formattedPostcards = postcards.map(postcard => {
                const { id, expires_at, ...rest } = postcard._doc;
                return rest;
            });
            res.json({
                success: true,
                links: {
                    next: nextPage,
                    previous: prevPage,
                },
                data: formattedPostcards,
                totalPages: totalPages,
            });
        }else{
            if (page <= totalPages || totalPages === 1) {
                nextPage = `/api/get/postcard/?page=${page + 1}`;
            }

            if (page > 1) {
                prevPage = `/api/get/postcard/?page=${page - 1}`;
            }
            const formattedPostcards = postcards.map(postcard => {
                const { id, expires_at, ...rest } = postcard._doc;
                return rest;
            });
            res.json({
                success: true,
                links: {
                    next: nextPage,
                    previous: prevPage,
                },
                data: formattedPostcards,
                totalPages: totalPages,
            });        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
}   

exports.GetallPostcardlink = async (req, res) => {
    try {
        const { counter } = req.params;
        const filter = { id: counter };

        const postCard = await User.PostCard.findOne({ id: counter });

        if (!postCard) {
            return res.status(404).json({ error: 'Postcard not found' });
        }
        if (postCard.expires_at && moment().isAfter(moment(postCard.expires_at))) {
            return res.status(404).json({ error: 'Postcard has expired' });
        }

        postCard.accessCounter = postCard.accessCounter || 0;
        postCard.accessCounter += 1;

        await postCard.save();

        const responseObject = {
            message: 'Postcard opened successfully',
            open_count: postCard.open_count,
            success: true,
            data: {
                recipientname: postCard.recipientname,
                address1: postCard.address1,
                address2: postCard.address2,
                city: postCard.city,
                state: postCard.state,
                zipcode: postCard.zipcode,
                message: postCard.message,
                images: postCard.images,
                preview: postCard.preview,
                accessCounter: postCard.accessCounter,
            },
        };

        res.json(responseObject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
};

exports.updatePostcardLink = async (req, res) => {
    try {
        const { id } = req.params;
        const postcard = await User.PostCard.findById(id);

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
            data: {
                // Omitting "id" from the data object
                _id: postcard._id,
                recipientname: postcard.recipientname,
                address1: postcard.address1,
                address2: postcard.address2,
                city: postcard.city,
                state: postcard.state,
                zipcode: postcard.zipcode,
                message: postcard.message,
                images: postcard.images,
                preview: postcard.preview,
                accessCounter: postcard.accessCounter,
                expires_at: postcard.expires_at,
            },
            message: 'Postcard link updated successfully',
        };
        res.json(response   );
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error processing the request' });
    }
};

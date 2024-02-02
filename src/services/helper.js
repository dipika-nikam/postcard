const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel'); 
const PostCard = require('../models/postcardModel')
const Joi = require("joi");

const getPostcards = async (page, pageSize, limit) => {
    const postcards = await PostCard.find()
    .skip((page - 1) * limit)
    .limit(limit);
    return postcards;
};

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

const postcardSearchSchema = Joi.object({
    search: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).default(10),
    limit: Joi.number().integer().min(1),
});

const searchPostcards = async (search, page, pageSize, limit) => {
    try {
        let query = {
            $or: [
                { recipientname: { $regex: new RegExp(search, 'i') } },
                { city: { $regex: new RegExp(search, 'i') } },
                { state: { $regex: new RegExp(search, 'i') } },
                { zipcode: isNaN(parseInt(search)) ? 0 : parseInt(search) },
            ],
        };
        const postcards = await PostCard.find(query)
            .skip((page - 1) * pageSize) 
            .limit(limit || pageSize);

        return postcards;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const generateUniqueLink = () => {
    const uniqueId = uuidv4();
    const expiryTimestamp = Date.now() + 60 * 1000; // 1 min expiration
    // const expiryTimestamp = Date.now() + 10000; // 24 hours expiration
    const accessCounter = 0;

    const uniqueLink = `http://localhost:3000/api/link/${uniqueId}`;
    return { uniqueId, uniqueLink, expiryTimestamp };
};

const fetchZipCodeInfo = async (zipcode) => {
    const url = `https://api.zipcodestack.com/v1/search?codes=${zipcode}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': '01HNCGGFBYGYHE7W7812W5FCMD',
                'Accept': 'application/json',
            },
        });

        const { results } = await response.json();
        return results[zipcode] || [];
    } catch (error) {
        console.error('Error fetching ZIP code information:', error);
        return [];
    }
};

module.exports = {
    getPostcards,
    searchPostcards,
    generateUniqueLink,
    fetchZipCodeInfo,
    postcard,
    postcardSearchSchema
};

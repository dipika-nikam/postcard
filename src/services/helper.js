const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel'); 

const getPostcards = async (page) => {
    const postcards = await User.PostCard.find()
        .skip((page - 1) * 5)
        .limit(5);
    return postcards;
};

const searchPostcards = async (search, page, limit) => {
    let query = {
        $or: [
            { recipientname: {$regex: new RegExp(search, 'i') }} ,
            { city: { $regex: new RegExp(search, 'i') } },
            { state: { $regex: new RegExp(search, 'i') } },
            { zipcode: isNaN(parseInt(search)) ? 0 : parseInt(search) },
        ],
    };

    const postcards = await User.PostCard.find(query)
        .skip((page - 1) * 5)
        .limit(limit);

    return postcards;
};

const generateUniqueLink = () => {
    const uniqueId = uuidv4();
    const expiryTimestamp = Date.now() + 60 * 1000; // 1 min expiration
    // const expiryTimestamp = Date.now() + 10000; // 24 hours expiration

    console.log('Link will expire at:', new Date(expiryTimestamp).toISOString());
    const accessCounter = 0;

    const uniqueLink = `http://localhost:3000/api/get/${uniqueId}`;
    return { uniqueId, uniqueLink, expiryTimestamp };
};

module.exports = {
    getPostcards,
    searchPostcards,
    generateUniqueLink
};

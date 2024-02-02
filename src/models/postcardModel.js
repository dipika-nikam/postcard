const mongoose = require('mongoose');
const User = require('./userModel')

const postCard = new mongoose.Schema({
    user_id: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: User 
    }],
    recipientname: {
        type: String,
        require: true,
    },
    address1: {
        type: String,
        require: true
    },
    address2: {
        type: String,
    },
    city: {
        type: String,
        require: true
    },
    state: {
        type: String,
        require: true
    },
    zipcode: {
        type: Number,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value for zipcode',
        },
        min: [5, 'zipcode cannot be negative'],
    },
    message: {
        type: String,
        require: true
    },
    images: {
        type: String
    },
    id:{
        type:String
    },
    preview:{
        type:String
    },
    accessCounter: {
        type: Number, 
        default: 0
    },
    expires_at: {
        type: Date,
    },

})

const PostCard =  mongoose.model('postcard', postCard);

module.exports = PostCard;

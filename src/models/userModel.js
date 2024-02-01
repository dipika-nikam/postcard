const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
});


const postCard = new mongoose.Schema({
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

const User = mongoose.model('User', userSchema);
const PostCard =  mongoose.model('postcard', postCard);

module.exports = {User,PostCard};

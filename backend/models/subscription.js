const { required } = require('joi');
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true 
    },
    amount: {
        type: Number,
        required:true,
        min: 0
    },
    duration: {
        type: Number,
        required:true,
        min: 1
    },
    status: {
        type: Boolean,
        default: true
    }
})

module.exports = mongoose.model('Subscription', subscriptionSchema);
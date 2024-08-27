const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.ObjectId,
        required: true,
        refPath: 'userType',//Dynamically set ref path for Admin and User
        unique: true
    },
    userType:{
        type: String,
        required: true,
        enum: ['User', 'Admin']
    },
    token:{
        type: String,
        required: true
    },
    created_at:{
        type: Date,
        default: Date.now,// set to the current date and time at the moment of document creation. With () "createdAt" will be the time when the schema was defined, not the time when the document was created.
        expires: 3600 //Token will expire 1 hour after its creation.
    }
});

module.exports = mongoose.model('Token', tokenSchema);

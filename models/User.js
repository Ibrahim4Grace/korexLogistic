const mongoose = require(`mongoose`);
const userSchema = new mongoose.Schema({

    senderName:{
        type: String,
        required: true
    },
    senderGender:{
        type: String,
        required: true
    },
    senderDob:{
        type: String,
        required: true
    },
    senderNumber:{
        type: String,
        required: true
    },
    selectMembership:{
        type: String,
        required: true
    },
    senderEmail:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    senderAddress:{
        type: String,
        required: true
    },
    senderCity:{
        type: String,
        required: true
    },
    senderState:{
        type: String,
        required: true
    },
    postCode:{
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    image:{
        data: Buffer,
        contentType: String
    },
    senderRole:{
        type: String,
    },
    shippingLabels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    failedLoginAttempts: {   
        type: Number,
        default: 0 
    },
    accountLocked: { 
        type: Boolean, 
        default: false 
    },
    // for email verification
    isVerified: { 
        type: Boolean, 
        default: false
     },
     verificationToken: { 
        type: String, 
    },
    
    date_added: {
        type: Date,
        default: Date.now()
    }

});



const User = mongoose.model('registeredUser', userSchema);

module.exports =  User


// shippingLabels in User Schema:

// Purpose: The shippingLabels field is used to establish a relationship between a registered user and the notifications related to shipping labels created by that user. It stores the ObjectId references to the notifications in the Notification schema.
// Usage: When a user creates a shipping label, a new notification is created, and its ObjectId is stored in the shippingLabels array of the user who created the label. This allows for easy retrieval of all notifications associated with a specific user.

// the shippingLabels field is an array that can hold multiple mongoose.Schema.Types.ObjectId references to the Notification model.
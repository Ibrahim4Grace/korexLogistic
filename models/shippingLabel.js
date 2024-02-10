const mongoose = require(`mongoose`);
const labelSchema = new mongoose.Schema({

    senderName:{
        type: String,
        required: true
    },
    senderEmail:{
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
    shippingMethod:{
        type: String,
        required: true
    },
    recipientName:{
        type: String,
        required: true
    },
    recipientEmail:{
        type: String,
        required: true
    },
    recipientNumber:{
        type: String,
        required: true
    },
    recipientAddress:{
        type: String,
        required: true
    },
    recipientCity:{
        type: String,
        required: true
    },
    recipientState:{
        type: String,
        required: true
    },
    shippingAmount:{
        type: String,
    },
    // Link to the user who created the label
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registeredUser'
    },
    trackingID:{
        type: String,

    },
    deliveryDay:{
        type: String,
    },
    deliveryDate:{
        type: String,
    },
    deliveryMonth:{
        type: String,
    },
    deliveryTime:{
        type: String,
    },
    statusMessage:{
        type: String,
    },
    date_added: {
        type: Date,
        default: Date.now()
    }

});


const shippingLabel = mongoose.model('shippingLabel', labelSchema);

module.exports =  shippingLabel


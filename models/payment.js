const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    reference: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    date_added: {
        type: Date,
        default: Date.now()
    },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

// The status field is of type String and has an enum constraint, meaning it can only have one of the specified values: 'pending', 'success', or 'failed'.

// You can customize the enum values according to your application's needs, adding more statuses if necessary.
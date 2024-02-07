const mongoose = require(`mongoose`);
const msgSchema = new mongoose.Schema({

    message:{
        type: String, 
    },
    senderName: {
        type: String
    },
    senderRole: {
        type: String, 
    },
    userId: {
        type: mongoose.Schema.Types.Mixed, // Use the type ObjectId to store user _id
        ref: 'registeredUser', // Reference the User model
    },
    adminId: {
      type: mongoose.Schema.Types.Mixed,  // Allow both ObjectId and String
      ref: 'Admin',
    },
    date_added: {
        type: Date,
        default: Date.now()
    }


});

const Chat = mongoose.model('userChat', msgSchema);
module.exports =  Chat

// Using mongoose.Schema.Types.Mixed for the adminId field provides flexibility by allowing it to store values of mixed types, such as both ObjectId and String. If this change resolved an issue you were facing with socket.io and checking admin IDs, it suggests that the flexibility of the mixed type was beneficial in that specific scenario.
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'registeredUser' // Reference to the user who created the label
  },
  senderName: {
    type: String,
  },
  message: String,

  status: {
    type: String,
    default: 'unread'
  },
  count: {
    type: Number,
    default: 0,
  },
  date_added: {
    type: Date,
    default: Date.now()
  },

});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

const socketIO = require("socket.io");
const Notification = require('../models/notification');

// Function to get the notification count from the database
const getNotificationCount = async () => {
    try {
        const count = await Notification.countDocuments();
        return count;
    } catch (error) {
        console.error('Error getting notification count from the database:', error);
        throw error;
    }
};

// Function to update the notification count in the database
const updateNotificationCount = async () => {
    try {
      await Notification.updateMany({}, { $inc: { count: 1 } });
      console.log('Notification count updated successfully.');
        console.log('Notification count updated successfully.');
    } catch (error) {
        console.error('Error updating notification count in the database:', error);
        throw error;
    }
};

// Export the setup function
const notificationIoSetup = (io) => {
    const notificationIo = io.of('/notifications');

    notificationIo.on('connection', async (socket) => {
        console.log('Notification socket connected');

        // Emit initial count on connection
        const notificationCount = await getNotificationCount();
        socket.emit('notification-count-updated', { count: notificationCount });
        console.log('Initial count emitted on connection:', notificationCount);

        // Handle new notification events
        socket.on('new-notification', async (data) => {
            console.log('Received new notification:', data);

            // Increment the count in the database
            try {
                await updateNotificationCount();
                console.log('Notification count updated successfully.');
            } catch (error) {
                console.error('Error updating notification count in the database:', error);
            }

            // Emit updated count to all connected clients
            const updatedCount = await getNotificationCount();
            notificationIo.emit('notification-count-updated', { count: updatedCount });
            console.log('Updated count emitted to all clients:', updatedCount);

            // Emit new-notification event to all clients
            notificationIo.emit('new-notification', data);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Notification socket disconnected');
        });
    });

    return notificationIo;
};

module.exports = notificationIoSetup;

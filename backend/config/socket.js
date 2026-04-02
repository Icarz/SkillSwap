

const emitNotification = (req, notificationData) => {
    // Get the io instance from the Express app, which is attached to the request (req)
    const io = req.app.get('io');
    if (io) {
        // Emit an event to a specific user's room
        io.to(notificationData.userId.toString()).emit('new-notification', notificationData);
        console.log(`📢 Notification emitted to user ${notificationData.userId}:`, notificationData.message);
    } else {
        console.error("❌ Socket.io instance (io) is not available for emitting notifications.");
    }
};

module.exports = { emitNotification };
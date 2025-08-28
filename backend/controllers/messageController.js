const Message = require("../models/Message");
const User = require("../models/User");

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.id;

    const message = new Message({
      sender,
      receiver,
      content,
    });

    await message.save();

    // Populate sender details for real-time emission
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name');

    // Get Socket.IO instance and emit new message event
    const io = req.app.get('io');
    io.to(receiver.toString()).emit('new-message', populatedMessage);
    io.to(receiver.toString()).emit('new-notification', {
      type: 'message',
      message: `You have a new message from ${populatedMessage.sender.name}`,
      relatedId: populatedMessage._id,
      timestamp: new Date()
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.params.userId;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name avatar")
      .populate("receiver", "name");

    res.json(messages);
  } catch (error) {
    console.error("Get user messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.getConversationThread = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "name avatar")
      .populate("receiver", "name");

    res.json(messages);
  } catch (error) {
    console.error("Get conversation thread error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

exports.getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread message count" });
  }
};
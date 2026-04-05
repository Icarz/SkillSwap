const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.id;

    // Validate receiver is a real ObjectId
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: "Invalid receiver ID" });
    }

    // Prevent messaging yourself
    if (receiver === sender) {
      return res.status(400).json({ error: "Cannot send a message to yourself" });
    }

    // Ensure receiver exists
    const receiverExists = await User.exists({ _id: receiver });
    if (!receiverExists) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }
    if (content.trim().length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }

    const message = new Message({ sender, receiver, content: content.trim() });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar");

    // Emit real-time events if Socket.io is available
    const io = req.app.get("io");
    if (io) {
      io.to(receiver.toString()).emit("new-message", populatedMessage);
      io.to(receiver.toString()).emit("new-notification", {
        type: "message",
        message: `New message from ${populatedMessage.sender.name}`,
        relatedId: populatedMessage._id,
        timestamp: new Date(),
      });
    }

    res.status(201).json({ message: "Message sent successfully", data: populatedMessage });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Inbox: latest messages per conversation for the authenticated user
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Only the authenticated user can access their own inbox
    if (userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to view these messages" });
    }

    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar");

    res.json(messages);
  } catch (error) {
    console.error("Get user messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Conversation thread between two users
exports.getConversationThread = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Authenticated user must be one of the two participants
    if (req.user.id !== userId && req.user.id !== otherUserId) {
      return res.status(403).json({ error: "Not authorized to view this conversation" });
    }

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const query = {
      $or: [
        { sender: userId,      receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar")
        .populate("receiver", "name avatar"),
      Message.countDocuments(query),
    ]);

    // Mark messages sent to the authenticated user as read
    await Message.updateMany(
      { sender: otherUserId, receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get conversation thread error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

exports.getUnreadMessageCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to get unread message count" });
  }
};

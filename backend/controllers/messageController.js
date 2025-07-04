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
    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
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
      .populate("sender", "name")
      .populate("receiver", "name");

    res.json(messages);
  } catch (error) {
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
      .populate("sender", "name")
      .populate("receiver", "name");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

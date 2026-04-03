const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// Speeds up inbox queries (sender or receiver lookups)
messageSchema.index({ sender: 1, receiver: 1 });
// Speeds up unread count queries
messageSchema.index({ receiver: 1, isRead: 1 });
// Speeds up time-sorted fetches
messageSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);

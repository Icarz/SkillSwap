const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true, // Prevent duplicate skills
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
skillSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model("Skill", skillSchema);

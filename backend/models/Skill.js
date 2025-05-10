const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase:true
  },
  category: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Skill", skillSchema);

const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: true,
  },
  type: {
    type: String,
    enum: ["offer", "request"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "completed",
      "cancelled",
      // --- NEW STATUSES FOR SWAPS ---
      "proposed-swap",
      "accepted-swap",
      "rejected-swap",
    ],
    default: "pending",
  },
  acceptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // --- NEW FIELDS FOR SWAPS ---
  // The transaction this one is linked to for a swap
  linkedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  // The transaction that originally proposed the swap (useful for queries)
  proposedSwap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  // --- END NEW FIELDS ---
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
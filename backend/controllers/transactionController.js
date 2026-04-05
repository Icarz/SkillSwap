const Transaction = require("../models/Transaction");
const Skill = require("../models/Skill");

// ✅ Create a new transaction (offer or request)
const createTransaction = async (req, res) => {
  const { skill, type } = req.body;

  if (!["offer", "request"].includes(type)) {
    return res.status(400).json({ error: "Invalid transaction type" });
  }

  try {
    const skillExists = await Skill.exists({ _id: skill });
    if (!skillExists) {
      return res.status(400).json({ error: "Skill not found" });
    }

    const transaction = new Transaction({
      user: req.user.id,
      skill,
      type,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// ✅ Get transactions for the authenticated user (both owned and accepted)
const getMyTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const query = {
      $or: [
        { user: req.user.id },
        { acceptor: req.user.id },
      ],
    };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("user", "name email avatar")
        .populate("acceptor", "name email avatar")
        .populate("skill", "name category")
        .populate("linkedTransaction")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve transactions" });
  }
};

// ✅ Update the status of a transaction
const updateTransactionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "pending",
    "accepted",
    "completed",
    "cancelled",
    "proposed-swap",
    "accepted-swap",
    "rejected-swap",
  ];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    // Find the transaction. Populate is optional here, but useful for the ID.
    const transaction = await Transaction.findById(id).populate(
      "linkedTransaction"
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // --- NEW LOGIC FOR HANDLING SWAPS ---
    if (status === "accepted-swap" && transaction.status === "proposed-swap") {
      // Ensure the user updating is the owner of the transaction
      if (transaction.user.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to accept this swap." });
      }

      // 1. Update the current transaction
      transaction.status = "accepted-swap";
      await transaction.save();

      // 2. Find and update the LINKED transaction
      if (transaction.linkedTransaction) {
        // Find the actual linked document by its ID
        const linkedTxDoc = await Transaction.findById(
          transaction.linkedTransaction._id
        );
        if (linkedTxDoc) {
          linkedTxDoc.status = "accepted-swap";
          await linkedTxDoc.save(); // Now this will work
        }
      }
    } else if (
      status === "rejected-swap" &&
      transaction.status === "proposed-swap"
    ) {
      if (transaction.user.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to reject this swap." });
      }

      transaction.status = "rejected-swap";
      await transaction.save();

      if (transaction.linkedTransaction) {
        const linkedTxDoc = await Transaction.findById(
          transaction.linkedTransaction._id
        );
        if (linkedTxDoc) {
          linkedTxDoc.status = "rejected-swap";
          await linkedTxDoc.save();
        }
      }
    }
    // --- END NEW LOGIC ---

    // --- EXISTING LOGIC FOR NON-SWAP STATUSES ---
    else if (status === "accepted") {
      if (transaction.user.toString() === req.user.id) {
        return res
          .status(400)
          .json({ error: "You cannot accept your own transaction." });
      }
      transaction.status = "accepted";
      transaction.acceptor = req.user.id;
      await transaction.save();
    } else {
      // Handle other status updates (completed, cancelled, etc.)
      transaction.status = status;
      await transaction.save();
    }

    // Fetch the fully updated transaction to return
    const updated = await Transaction.findById(id)
      .populate("skill")
      .populate("linkedTransaction");
    res.json(updated);
  } catch (err) {
    console.error("Error in updateTransactionStatus:", err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
};

// 🔍 Filter transactions by status and/or type
const filterMyTransactions = async (req, res) => {
  const { status, type } = req.query;

  const allowedStatuses = ["pending", "accepted", "completed", "cancelled", "proposed-swap", "accepted-swap", "rejected-swap"];
  const allowedTypes = ["offer", "request"];

  const andFilters = [];

  // Add status filter if provided and valid
  if (status) {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }
    andFilters.push({ status });
  }

  // Add type filter if provided and valid
  if (type) {
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type filter" });
    }
    andFilters.push({ type });
  }

  const query = {
    $or: [{ user: req.user.id }, { acceptor: req.user.id }],
    ...(andFilters.length > 0 ? { $and: andFilters } : {}),
  };

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  try {
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("user", "name email avatar")
        .populate("acceptor", "name email avatar")
        .populate("skill")
        .populate("linkedTransaction")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to filter transactions" });
  }
};

// ✅ Delete a transaction (owner or acceptor only)
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const isOwner = transaction.user.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ error: "Only the transaction creator can delete it" });
    }

    await transaction.deleteOne();
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
};

// 🌐 Get all transactions for any user (profile view by logged-in user)
const getPublicUserTransactions = async (req, res) => {
  const { userId } = req.params;
  try {
    const transactions = await Transaction.find({
      $or: [{ user: userId }, { acceptor: userId }],
    })
      .populate("user", "name email avatar")
      .populate("acceptor", "name email avatar")
      .populate("skill", "name category")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve transactions" });
  }
};

// ✅ Export controller functions
module.exports = {
  createTransaction,
  getMyTransactions,
  updateTransactionStatus,
  deleteTransaction,
  filterMyTransactions,
  getPublicUserTransactions,
};

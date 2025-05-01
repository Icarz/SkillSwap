const Transaction = require('../models/Transaction');

// ✅ Create a new transaction (offer or request)
const createTransaction = async (req, res) => {
  const { skill, type } = req.body;

  if (!['offer', 'request'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  try {
    const transaction = new Transaction({
      user: req.user.id,
      skill,
      type
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

// ✅ Get all transactions for the logged-in user
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('skill')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
};

// ✅ Update the status of a transaction
const updateTransactionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

// ✅ Delete a transaction (optional)
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// ✅ Export controller functions
module.exports = {
  createTransaction,
  getMyTransactions,
  updateTransactionStatus,
  deleteTransaction
};

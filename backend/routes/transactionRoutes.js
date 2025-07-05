const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getMyTransactions,
  updateTransactionStatus,
  deleteTransaction,
  filterMyTransactions,
} = require("../controllers/transactionController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/filter", filterMyTransactions);
router.get("/", getMyTransactions);
router.patch("/:id", updateTransactionStatus);
router.delete("/:id", deleteTransaction);

module.exports = router;

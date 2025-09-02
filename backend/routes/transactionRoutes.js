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
const { proposeSwap } = require("../controllers/swapController");

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/filter", filterMyTransactions);
router.get("/", getMyTransactions);
router.patch("/:id", updateTransactionStatus);
router.delete("/:id", deleteTransaction);
router.post("/:id/propose-swap", proposeSwap);

module.exports = router;

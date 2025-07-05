const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/messages", authMiddleware, messageController.sendMessage);
router.get(
  "/messages/:userId",
  authMiddleware,
  messageController.getUserMessages
);
router.get(
  "/messages/:userId/:otherUserId",
  authMiddleware,
  messageController.getConversationThread
);

module.exports = router;

// the messages endpoints are perfectly working//

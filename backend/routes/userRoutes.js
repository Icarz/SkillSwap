const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  searchUsers,
  findMatches,
  createReview,
  getReviews
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.get("/search", searchUsers);
router.get("/matches", authMiddleware, findMatches);
router.post("/review", authMiddleware, createReview);
router.get("/reviews/:userId", getReviews);

module.exports = router;

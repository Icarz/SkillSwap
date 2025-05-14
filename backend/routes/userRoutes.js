const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  findMatches,
  createReview,
  getReviews,
  deleteReview  
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// 1. Static paths first
router.get("/me", authMiddleware, getProfile);
router.get("/search", authMiddleware, searchUsers);
router.get("/matches", authMiddleware, findMatches); 
router.post("/review", authMiddleware, createReview);

// 2. Parameterized paths last
router.get("/reviews/:userId", getReviews); 
router.get("/:userId", authMiddleware, getUserById);
router.delete("/reviews/:reviewId", authMiddleware, deleteReview);
router.put("/me", authMiddleware, updateProfile);

module.exports = router;

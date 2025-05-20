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

// Rate limiting configuration
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later"
});

// 1. Protected routes (require authentication)
router.use(authMiddleware);

// User profile routes
router.get("/me", getProfile);
router.put("/me", updateProfile);

// Skill-based routes
router.get("/search", apiLimiter, searchUsers); // Add rate limiting to search
router.get("/matches", findMatches);

// Review routes
router.post("/review", createReview);
router.get("/reviews/:userId", getReviews);
router.delete("/reviews/:reviewId", deleteReview);

// Public profile route (keep after specific routes)
router.get("/:userId", getUserById);

module.exports = router;
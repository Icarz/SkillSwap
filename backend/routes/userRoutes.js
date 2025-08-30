const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const {
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  findMatches,
  createReview,
  getReviews,
  deleteReview,
  uploadAvatar,
  uploadAvatarMulter,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// --- Rate limiting configuration ---
const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
});

// --- Protected routes (require authentication) ---
router.use(authMiddleware);

// User profile routes
router.get("/me", getProfile);
router.put("/me", updateProfile);

// --- NEW: Upload avatar route ---
router.put(
  "/me/avatar",
  (req, res, next) => {
    console.log("Multer processing starting...");
    uploadAvatarMulter(req, res, (err) => {
      if (err) {
        console.error("Multer processing error:", err);
        return res.status(400).json({
          error: err.message,
          code: err.code,
          field: err.field,
        });
      }
      console.log("Multer processing completed");
      next();
    });
  },
  uploadAvatar
);

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
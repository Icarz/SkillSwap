const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const {
  getProfile,
  updateProfile,
  getUserById,
  getAllUsers,
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

// --- Public routes (no auth required) ---
router.get("/all", getAllUsers);
router.get("/search", apiLimiter, searchUsers);
router.get("/reviews/:userId", getReviews);

// --- Protected routes (require authentication) ---
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

router.put(
  "/me/avatar",
  authMiddleware,
  (req, res, next) => {
    uploadAvatarMulter(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: err.message,
          code: err.code,
          field: err.field,
        });
      }
      next();
    });
  },
  uploadAvatar
);

router.get("/matches", authMiddleware, findMatches);
router.post("/review", authMiddleware, createReview);
router.delete("/reviews/:reviewId", authMiddleware, deleteReview);

// Public profile route (keep after specific routes)
router.get("/:userId", getUserById);

module.exports = router;
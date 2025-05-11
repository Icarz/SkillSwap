const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  findMatches,
  createReview,
  getReviews
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, getProfile);
router.get("/users/:userId", authMiddleware, getUserById);
router.put("/me", authMiddleware, updateProfile);
router.get("/search", searchUsers);
router.get("/matches", authMiddleware, findMatches);
router.post("/review", authMiddleware, createReview);
router.get("/reviews/:userId", getReviews);

module.exports = router;

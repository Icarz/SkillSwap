const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getSkillsByCategory,
  createCategory
} = require("../controllers/categoryController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware"); // You'll need to create this

// Public routes
router.get("/", getAllCategories);
router.get("/:categoryId/skills", getSkillsByCategory);

// Admin-protected routes
router.post("/", authMiddleware, adminMiddleware, createCategory);

module.exports = router;
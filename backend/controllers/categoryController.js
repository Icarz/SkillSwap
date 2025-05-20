const Category = require("../models/Category");
const Skill = require("../models/Skill");

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("[getAllCategories] Error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get skills by category
const getSkillsByCategory = async (req, res) => {
  try {
    const skills = await Skill.find({ 
      category: req.params.categoryId 
    }).select("name");
    
    res.json(skills);
  } catch (err) {
    console.error("[getSkillsByCategory] Error:", err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
};

// Admin-only: Create new category
const createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const newCategory = await Category.create({ 
      name, 
      icon: icon || "🛠️", 
      description 
    });
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("[createCategory] Error:", err);
    res.status(400).json({ error: "Category creation failed" });
  }
};

module.exports = {
  getAllCategories,
  getSkillsByCategory,
  createCategory
};
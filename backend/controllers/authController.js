const User = require("../models/User");
const Skill = require("../models/Skill");
const Category = require("../models/Category");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { name, email, password, skills = [], bio, learning = [] } = req.body;

  try {
    // Get default category (e.g., "programming")
    const defaultCategory = await Category.findOne({ name: "programming" });
    if (!defaultCategory) {
      return res.status(500).json({ message: "System configuration error" });
    }

    // Convert skill names to ObjectIds (keep existing logic)
    const convertToSkillIds = async (skillNames) => {
      const skillIds = [];
      for (const name of skillNames) {
        let skill = await Skill.findOne({ name });
        if (!skill) {
          skill = new Skill({ name, category: defaultCategory._id });
          await skill.save();
        }
        skillIds.push(skill._id);
      }
      return skillIds;
    };

    const skillIds = await convertToSkillIds(skills);
    const learningIds = await convertToSkillIds(learning);

    const newUser = new User({
      name,
      email,
      password,
      skills: skillIds,
      bio,
      learning: learningIds,
    });

    await newUser.save();

    // 🔥 Key Change: Populate skills and learning before responding
    const populatedUser = await User.findById(newUser._id).populate(
      "skills learning",
      "name"
    );

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        skills: populatedUser.skills, // Now with names
        learning: populatedUser.learning, // Now with names
        bio: populatedUser.bio,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        learning: user.learning,
        bio: user.bio,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  register,
  login,
};

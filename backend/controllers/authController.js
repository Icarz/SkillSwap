const User = require("../models/User");
const Skill = require("../models/Skill");
const Category = require("../models/Category");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Constants
const DEFAULT_CATEGORY = "programming";
const TOKEN_EXPIRY = "7d";

// Utility: Populate user with skill details
const populateUserSkills = (user) => {
  return User.findById(user._id).populate({
    path: "skills learning",
    select: "name",
    populate: {
      path: "category",
      select: "name icon"
    }
  });
};

const register = async (req, res) => {
  const { name, email, password, skills = [], bio, learning = [] } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check for existing user
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Get default category
    const defaultCategory = await Category.findOne({ name: DEFAULT_CATEGORY });
    if (!defaultCategory) {
      throw new Error("Default skill category not found in database");
    }

    // Process skills with category assignment
    const processSkills = async (skillNames) => {
      return Promise.all(
        skillNames.map(async (name) => {
          const skill = await Skill.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${name}$`, "i") } },
            { 
              $setOnInsert: { 
                name: name.toLowerCase(),
                category: defaultCategory._id 
              }
            },
            { upsert: true, new: true }
          );
          return skill._id;
        })
      );
    };

    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      skills: await processSkills(skills),
      learning: await processSkills(learning),
      bio
    });

    await newUser.save();

    // Generate token and respond with populated user data
    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    const populatedUser = await populateUserSkills(newUser);

    res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        skills: populatedUser.skills,
        learning: populatedUser.learning,
        bio: populatedUser.bio
      }
    });

  } catch (error) {
    console.error("[register] Error:", error.message, error.stack);
    res.status(500).json({ 
      message: "Registration failed",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user with password selected
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token and respond with user data
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRY }
    );

    const populatedUser = await populateUserSkills(user);

    res.json({
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        skills: populatedUser.skills,
        learning: populatedUser.learning,
        bio: populatedUser.bio
      }
    });

  } catch (error) {
    console.error("[login] Error:", error.message, error.stack);
    res.status(500).json({ 
      message: "Login failed",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  register,
  login
};
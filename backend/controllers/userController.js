const User = require("../models/User");
const Review = require("../models/Review");
const Fuse = require("fuse.js");
const Skill = require("../models/Skill");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("skills learning", "name");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getProfile] Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get another user's public profile by ID  
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("skills learning", "name");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getUserById] Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    const { bio, skills, learning } = req.body;

    if (bio) updateData.bio = bio;

    // Case-insensitive skill/learning handling with bulk operations
    const processSkills = async (arr, field) => {
      if (!Array.isArray(arr)) return;
      
      const skillIds = await Promise.all(
        arr.map(async (name) => {
          const skill = await Skill.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${name}$`, "i") } },
            { $setOnInsert: { name } },
            { upsert: true, new: true }
          );
          return skill._id;
        })
      );
      
      updateData[field] = skillIds;
    };

    await Promise.all([
      processSkills(skills, "skills"),
      processSkills(learning, "learning")
    ]);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).populate("skills learning", "name");

    res.json(updatedUser);
  } catch (err) {
    console.error("[updateProfile] Error:", err.message);
    res.status(500).json({ error: "Profile update failed" });
  }
};

// Search users by skills (with MongoDB pre-filter)
const searchUsers = async (req, res) => {
  try {
    const skillQuery = req.query.skills;
    if (!skillQuery) {
      return res.status(400).json({ error: "?skills=react,node parameter required" });
    }

    const searchSkills = skillQuery.split(",").map(s => s.trim().toLowerCase());

    // 1. First find skills that match the search terms
    const matchedSkills = await Skill.find({
      name: { $in: searchSkills }
    });

    if (matchedSkills.length === 0) {
      return res.json([]); // No matching skills found
    }

    // 2. Find users who have ANY of the matched skill IDs
    const users = await User.find({
      skills: { $in: matchedSkills.map(s => s._id) }
    })
      .select("-password")
      .populate("skills", "name"); // Populate skill names

    // 3. Format for response
    const results = users.map(user => ({
      ...user.toObject(),
      matchedSkills: user.skills.filter(skill => 
        searchSkills.includes(skill.name.toLowerCase())
      )
    }));

    res.json(results);

  } catch (err) {
    console.error("[searchUsers] Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

// Matchmaking with pagination
const findMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const users = await User.find({
      _id: { $ne: currentUser._id },
      skills: { $in: currentUser.learning },
      learning: { $in: currentUser.skills }
    })
      .select("-password")
      .populate("skills learning", "name")
      .limit(20); // Pagination

    res.json(users);
  } catch (err) {
    console.error("[findMatches] Error:", err.message);
    res.status(500).json({ error: "Matchmaking failed" });
  }
};

// Leave a review
const createReview = async (req, res) => {
  try {
    const { reviewedUserId, rating, comment } = req.body;
    if (!reviewedUserId || !rating || !comment) {
      return res.status(400).json({ error: "All fields required" });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error("[createReview] Error:", err.message);
    res.status(500).json({ error: "Review submission failed" });
  }
};

// Get user reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("[getReviews] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

module.exports = {
  getProfile,
  getUserById,
  updateProfile,
  searchUsers,
  findMatches,
  createReview,
  getReviews
};
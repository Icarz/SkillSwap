const User = require("../models/User");
const Review = require("../models/Review");
const Skill = require("../models/Skill");
const Category = require("../models/Category");
const Fuse = require("fuse.js");

// Constants
const DEFAULT_CATEGORY = "programming";

// Utility: Populate user skills with categories
const populateUser = (query) => {
  return query.populate({
    path: "skills learning",
    populate: {
      path: "category",
      select: "name icon",
    },
  });
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await populateUser(
      User.findById(req.user.id).select("-password")
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getProfile] Error:", err.message, err.stack);
    res.status(500).json({
      error: "Server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
};

// Get another user's public profile by ID
const getUserById = async (req, res) => {
  try {
    const user = await populateUser(
      User.findById(req.params.userId).select("-password")
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("[getUserById] Error:", err.message, err.stack);
    res.status(500).json({ error: "Server error" });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    const { bio, skills, learning } = req.body;

    if (bio) updateData.bio = bio;

    // Get default category for new skills
    const defaultCategory = await Category.findOne({ name: DEFAULT_CATEGORY });
    if (!defaultCategory) {
      throw new Error("Default category not configured");
    }

    // Process skills with category assignment
    const processSkills = async (arr, field) => {
      if (!Array.isArray(arr)) return;

      const skillIds = await Promise.all(
        arr.map(async (name) => {
          const skill = await Skill.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${name}$`, "i") } },
            {
              $setOnInsert: {
                name,
                category: defaultCategory._id,
              },
            },
            { upsert: true, new: true }
          );
          return skill._id;
        })
      );

      updateData[field] = skillIds;
    };

    await Promise.all([
      processSkills(skills, "skills"),
      processSkills(learning, "learning"),
    ]);

    const updatedUser = await populateUser(
      User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true })
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("[updateProfile] Error:", err.message, err.stack);
    res.status(500).json({
      error: "Profile update failed",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
};

// Search users by skills
const searchUsers = async (req, res) => {
  try {
    const skillQuery = req.query.skills;
    if (!skillQuery) {
      return res.status(400).json({
        error: "?skills=react,node parameter required",
      });
    }

    const searchSkills = skillQuery
      .split(",")
      .map((s) => s.trim().toLowerCase());
    const categoryFilter = req.query.category
      ? { category: await Category.findOne({ name: req.query.category }) }
      : {};

    const matchedSkills = await Skill.find({
      name: { $in: searchSkills },
      ...categoryFilter,
    });

    if (matchedSkills.length === 0) {
      return res.json([]);
    }

    const users = await populateUser(
      User.find({
        skills: { $in: matchedSkills.map((s) => s._id) },
      }).select("-password")
    );

    const results = users.map((user) => ({
      ...user.toObject(),
      matchedSkills: user.skills.filter((skill) =>
        searchSkills.includes(skill.name.toLowerCase())
      ),
    }));

    res.json(results);
  } catch (err) {
    console.error("[searchUsers] Error:", err.message, err.stack);
    res.status(500).json({ error: "Search failed" });
  }
};

// Matchmaking with pagination
const findMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    const users = await populateUser(
      User.find({
        _id: { $ne: currentUser._id },
        skills: { $in: currentUser.learning },
        learning: { $in: currentUser.skills },
      })
        .select("-password")
        .limit(20)
    );

    res.json(users);
  } catch (err) {
    console.error("[findMatches] Error:", err.message, err.stack);
    res.status(500).json({ error: "Matchmaking failed" });
  }
};

// Reviews (unchanged but with improved error handling)
const createReview = async (req, res) => {
  try {
    const { reviewedUserId, rating, comment } = req.body;

    if (![1, 2, 3, 4, 5].includes(Number(rating))) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    if (reviewedUserId === req.user.id) {
      return res.status(400).json({ error: "Cannot review yourself" });
    }

    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
    });
    if (existingReview) {
      return res.status(400).json({ error: "You already reviewed this user" });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      rating,
      comment,
    });

    await review.save();
    const populatedReview = await Review.findById(review._id).populate(
      "reviewer",
      "name avatar"
    );

    res.status(201).json(populatedReview);
  } catch (err) {
    console.error("[createReview] Error:", err.message, err.stack);
    res.status(500).json({
      error: "Review submission failed",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
};

// Get user reviews
const getReviews = async (req, res) => {
  // Must match export name
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewedUser: userId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("[getReviews] Error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  // Must match export name
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      reviewer: req.user.id,
    });

    if (!review) {
      return res
        .status(404)
        .json({ error: "Review not found or not owned by you" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("[deleteReview] Error:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

module.exports = {
  getProfile,
  getUserById,
  updateProfile,
  searchUsers,
  findMatches,
  createReview,
  getReviews,
  deleteReview,
};

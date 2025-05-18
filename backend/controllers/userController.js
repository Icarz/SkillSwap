const User = require("../models/User");
const Review = require("../models/Review");
const Fuse = require("fuse.js");
const Skill = require("../models/Skill");
const Category = require("../models/Category");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "skills learning",
        populate: {
          path: "category",
          select: "name icon",
        },
      });
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
      .populate({
        path: "skills learning",
        populate: {
          path: "category",
          select: "name icon",
        },
      });
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
      processSkills(learning, "learning"),
    ]);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).populate({
      path: "skills learning",
      populate: {
        path: "category",
        select: "name icon",
      },
    });

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
      return res
        .status(400)
        .json({ error: "?skills=react,node parameter required" });
    }

    const searchSkills = skillQuery
      .split(",")
      .map((s) => s.trim().toLowerCase());

    // 1. First find skills that match the search terms
    const matchedSkills = await Skill.find({
      name: { $in: searchSkills },
    });

    if (matchedSkills.length === 0) {
      return res.json([]); // No matching skills found
    }

    // 2. Find users who have ANY of the matched skill IDs
    const users = await User.find({
      skills: { $in: matchedSkills.map((s) => s._id) },
    })
      .select("-password")
      .populate({
        path: "skills learning",
        populate: {
          path: "category",
          select: "name icon",
        },
      }); // Populate skill names

    // 3. Format for response
    const results = users.map((user) => ({
      ...user.toObject(),
      matchedSkills: user.skills.filter((skill) =>
        searchSkills.includes(skill.name.toLowerCase())
      ),
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
      learning: { $in: currentUser.skills },
    })
      .select("-password")
      .populate({
        path: "skills learning",
        populate: {
          path: "category",
          select: "name icon",
        },
      })
      .limit(20); // Pagination

    res.json(users);
  } catch (err) {
    console.error("[findMatches] Error:", err.message);
    res.status(500).json({ error: "Matchmaking failed" });
  }
};
//_______________________________________________________//
//____________Reviews___________________________________//

// Leave a review
const createReview = async (req, res) => {
  try {
    const { reviewedUserId, rating, comment } = req.body;

    // Validation
    if (![1, 2, 3, 4, 5].includes(Number(rating))) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    // Prevent self-reviews
    if (reviewedUserId === req.user.id) {
      return res.status(400).json({ error: "Cannot review yourself" });
    }

    // Check for existing review
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

    // Populate fresh data
    const populatedReview = await Review.findById(review._id).populate(
      "reviewer",
      "name avatar"
    );

    res.status(201).json(populatedReview);
  } catch (err) {
    console.error("[createReview] Error:", err);
    res.status(500).json({
      error: "Review submission failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get user reviews
const getReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    // Optional: Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const reviews = await Review.find({ reviewedUser: userId })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments({ reviewedUser: userId });

    res.json({
      reviews,
      meta: {
        page,
        limit,
        total,
        hasNext: total > page * limit,
      },
    });
  } catch (err) {
    console.error("[getReviews] Error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.reviewId,
      reviewer: req.user.id, // Ownership check
    });

    if (!review) {
      return res.status(404).json({
        error: "Review not found or not owned by you",
      });
    }

    await Review.deleteOne({ _id: review._id });
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

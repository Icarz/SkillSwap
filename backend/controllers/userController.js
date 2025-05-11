const User = require("../models/User");
const Review = require("../models/Review"); // Make sure you create this model
const Fuse = require("fuse.js");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get another user's public profile by ID
const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


// Update current user profile
const updateProfile = async (req, res) => {
  const { name, bio, skills, learning } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skills, learning },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Could not update profile" });
  }
};

// Searching users by skill
const searchUsers = async (req, res) => {
  const skillQuery = req.query.skills;

  if (!skillQuery) {
    return res
      .status(400)
      .json({
        error: "Skills query parameter is required (e.g. ?skills=react,node)",
      });
  }

  const searchSkills = skillQuery
    .split(",")
    .map((skill) => skill.trim().toLowerCase());

  try {
    const users = await User.find().select("-password");

    const fuse = new Fuse(users, {
      keys: ["skills"],
      threshold: 0.4,
      includeScore: true,
    });

    let allResults = [];
    searchSkills.forEach((skill) => {
      const results = fuse.search(skill);
      allResults.push(...results);
    });

    const userMap = new Map();

    allResults.forEach(({ item, score }) => {
      if (!userMap.has(item._id.toString())) {
        userMap.set(item._id.toString(), {
          user: item,
          totalScore: score,
          matches: 1,
        });
      } else {
        const existing = userMap.get(item._id.toString());
        existing.totalScore += score;
        existing.matches += 1;
      }
    });

    const rankedUsers = Array.from(userMap.values())
      .sort((a, b) => {
        if (b.matches === a.matches) {
          return a.totalScore - b.totalScore;
        }
        return b.matches - a.matches;
      })
      .map((entry) => entry.user);

    res.json(rankedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Matchmaking logic
const findMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: currentUser._id },
      skills: { $in: currentUser.learning },
      learning: { $in: currentUser.skills },
    }).select("-password");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while finding matches" });
  }
};

// Leave a review for another user
const createReview = async (req, res) => {
  const { reviewedUserId, rating, comment } = req.body;

  if (!reviewedUserId || !rating || !comment) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const reviewedUser = await User.findById(reviewedUserId);
    if (!reviewedUser) {
      return res.status(404).json({ error: "Reviewed user not found" });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      rating,
      comment,
    });

    await review.save();
    res.json({ message: "Review submitted", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error submitting review" });
  }
};

// Get all reviews for a user
const getReviews = async (req, res) => {
  const { userId } = req.params;

  try {
    const reviews = await Review.find({ reviewedUser: userId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching reviews" });
  }
};

// ✅ Export all
module.exports = {
  getProfile,
  getUserById,
  updateProfile,
  searchUsers,
  findMatches,
  createReview,
  getReviews,
};

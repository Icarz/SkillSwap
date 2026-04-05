const User = require("../models/User");
const Review = require("../models/Review");
const Transaction = require("../models/Transaction");
const Skill = require("../models/Skill");
const Category = require("../models/Category");

// ===== Multer for file upload (NEW) =====
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Configure multer storage for avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads", "avatars");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use userId + timestamp + ext for uniqueness
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "_" + Date.now() + ext);
  },
});

// File filter for images only
const avatarFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Multer middleware for avatar upload
const uploadAvatarMulter = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
}).single("avatar");

// ===== End Multer config =====

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

// Utility: Attach transactionCount to an array of user plain objects
const attachTransactionCounts = async (users) => {
  const ids = users.map((u) => u._id);
  const stats = await Transaction.aggregate([
    { $match: { status: { $ne: "cancelled" }, $or: [{ user: { $in: ids } }, { acceptor: { $in: ids } }] } },
    { $project: { participants: { $setUnion: [["$user"], [{ $ifNull: ["$acceptor", "$user"] }]] } } },
    { $unwind: "$participants" },
    { $match: { participants: { $in: ids } } },
    { $group: { _id: "$participants", count: { $sum: 1 } } },
  ]);
  const map = {};
  stats.forEach((s) => { map[s._id.toString()] = s.count; });
  return users.map((u) => ({ ...u, transactionCount: map[u._id.toString()] ?? 0 }));
};

// Utility: Attach avgRating + reviewCount to an array of user plain objects
const attachRatings = async (users) => {
  const ids = users.map((u) => u._id);
  const stats = await Review.aggregate([
    { $match: { reviewedUser: { $in: ids } } },
    { $group: { _id: "$reviewedUser", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const map = {};
  stats.forEach((s) => { map[s._id.toString()] = s; });
  return users.map((u) => {
    const s = map[u._id.toString()];
    return { ...u, avgRating: s ? Math.round(s.avg * 10) / 10 : null, reviewCount: s ? s.count : 0 };
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

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Get default category for new skills
    const defaultCategory = await Category.findOne({ name: DEFAULT_CATEGORY });
    if (!defaultCategory) {
      throw new Error("Default category not configured");
    }

    // Process skills with category assignment
    const processSkills = async (arr, field) => {
      if (!Array.isArray(arr)) return;

      const validItems = arr.filter((item) => item != null);

      if (validItems.length === 0) {
        updateData[field] = [];
        return;
      }

      const skillIds = await Promise.all(
        validItems.map(async (skillObj) => {
          if (!skillObj || !skillObj.name) return null;

          const trimmedName = skillObj.name.trim().toLowerCase();
          if (!trimmedName) return null;

          try {
            const skill = await Skill.findOneAndUpdate(
              { name: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
              {
                $setOnInsert: {
                  name: trimmedName,
                  category: skillObj.category || defaultCategory._id,
                },
              },
              { upsert: true, new: true, runValidators: true }
            );
            return skill._id;
          } catch (dbError) {
            console.error(`Database error processing skill '${trimmedName}':`, dbError.message);
            return null;
          }
        })
      );

      updateData[field] = skillIds.filter((id) => id !== null);
    };

    await Promise.all([
      processSkills(skills, "skills"),
      processSkills(learning, "learning"),
    ]);

    const updatedUser = await populateUser(
      User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("[updateProfile] Error:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: "Profile update failed",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
};

// ===== NEW: Upload Avatar Controller =====
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
      details: "Please select an image file",
    });
  }

  try {
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    const populatedUser = await populateUser(User.findById(user._id));
    return res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
      user: populatedUser,
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({
      error: "Failed to update avatar",
      details: error.message,
    });
  }
};
// ===== END uploadAvatar =====

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const excludeId = req.user?.id;
    const users = await populateUser(
      User.find(excludeId ? { _id: { $ne: excludeId } } : {}).select("-password").limit(50)
    );
    const withRatings = await attachRatings(users.map((u) => u.toObject()));
    const result = await attachTransactionCounts(withRatings);
    res.json(result);
  } catch (err) {
    console.error("[getAllUsers] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
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
    let categoryFilter = {};
    if (req.query.category) {
      const foundCategory = await Category.findOne({ name: req.query.category });
      if (!foundCategory) return res.json([]);
      categoryFilter = { category: foundCategory._id };
    }

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

    const plain = users.map((user) => ({
      ...user.toObject(),
      matchedSkills: user.skills.filter((skill) =>
        searchSkills.includes(skill.name.toLowerCase())
      ),
    }));
    const withRatings = await attachRatings(plain);
    const results = await attachTransactionCounts(withRatings);

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
    const { reviewedUser, rating, comment } = req.body;

    // Check all required fields
    if (!reviewedUser || !rating || !comment) {
      return res
        .status(400)
        .json({ error: "reviewedUser, rating, and comment are required" });
    }

    // Prevent self-review
    if (reviewedUser === req.user.id) {
      return res.status(400).json({ error: "Cannot review yourself" });
    }

    // Validate rating
    const numericRating = Number(rating);
    if (![1, 2, 3, 4, 5].includes(numericRating)) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    // Prevent duplicate review
    const existingReview = await Review.findOne({
      reviewer: req.user.id,
      reviewedUser,
    });
    if (existingReview) {
      return res.status(400).json({ error: "You already reviewed this user" });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewedUser,
      rating: numericRating,
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
  getAllUsers,
  searchUsers,
  findMatches,
  createReview,
  getReviews,
  deleteReview,
  uploadAvatar, // <--- Export the new controller
  uploadAvatarMulter, // <--- Export multer middleware for use in routes
};

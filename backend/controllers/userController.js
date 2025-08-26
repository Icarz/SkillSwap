const User = require("../models/User");
const Review = require("../models/Review");
const Skill = require("../models/Skill");
const Category = require("../models/Category");
const Fuse = require("fuse.js");

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
    console.log("=== UPDATE PROFILE REQUEST BODY ===");
    console.log("req.body:", JSON.stringify(req.body, null, 2));
    
    const updateData = {};
    const { bio, skills, learning } = req.body;
    
    console.log("Raw skills from request:", skills);
    console.log("Raw learning from request:", learning);

    if (bio) {
      console.log("Bio found, adding to updateData:", bio);
      updateData.bio = bio;
    }

    // Get default category for new skills
    console.log("Looking for default category:", DEFAULT_CATEGORY);
    const defaultCategory = await Category.findOne({ name: DEFAULT_CATEGORY });
    if (!defaultCategory) {
      console.error("Default category not found:", DEFAULT_CATEGORY);
      throw new Error("Default category not configured");
    }
    console.log("Default category found:", defaultCategory._id);

    // Process skills with category assignment
    const processSkills = async (arr, field) => {
      console.log(`\n=== PROCESSING ${field.toUpperCase()} ===`);
      console.log(`Input ${field} array:`, arr);
      
      if (!Array.isArray(arr)) {
        console.log(`${field} is not an array, skipping`);
        return;
      }

      // First, filter out any null/undefined items from the array
      const validItems = arr.filter(item => item != null);
      console.log(`Valid items after null filter for ${field}:`, validItems);
      
      if (validItems.length === 0) {
        console.log(`No valid items found for ${field}, skipping`);
        updateData[field] = [];
        return;
      }

      const skillIds = await Promise.all(
        validItems.map(async (skillObj, index) => {
          console.log(`\nProcessing ${field} item ${index + 1}:`, skillObj);
          
          // Add null check for skillObj itself
          if (!skillObj) {
            console.log(`Item ${index + 1} is null, skipping`);
            return null;
          }
          
          if (!skillObj.name) {
            console.log(`Item ${index + 1} has no name property:`, skillObj);
            return null;
          }

          const name = skillObj.name;
          console.log(`Extracted name: '${name}'`);
          
          if (!name || name.trim() === "") {
            console.log(`Item ${index + 1} has empty name, skipping`);
            return null;
          }

          const trimmedName = name.trim().toLowerCase();
          console.log(`Looking for skill: '${trimmedName}'`);
          
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
            
            console.log(`Skill processed successfully: ${skill._id} - '${skill.name}'`);
            return skill._id;
          } catch (dbError) {
            console.error(`Database error processing skill '${trimmedName}':`, dbError.message);
            return null;
          }
        })
      );

      // Filter out any null entries
      const filteredSkillIds = skillIds.filter(id => id !== null);
      console.log(`Final ${field} IDs:`, filteredSkillIds);
      updateData[field] = filteredSkillIds;
    };

    console.log("\n=== STARTING SKILL PROCESSING ===");
    await Promise.all([
      processSkills(skills, "skills"),
      processSkills(learning, "learning"),
    ]);

    console.log("\n=== FINAL UPDATE DATA ===");
    console.log("updateData:", JSON.stringify(updateData, null, 2));

    console.log("Updating user in database...");
    const updatedUser = await populateUser(
      User.findByIdAndUpdate(
        req.user.id, 
        { $set: updateData }, 
        { new: true, runValidators: true }
      )
    );

    console.log("User updated successfully");
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
  console.log("Upload request received", {
    headers: req.headers,
    file: req.file
      ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        }
      : null,
    user: req.user,
  });

  if (!req.file) {
    console.error("No file received in upload");
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

    console.log("Avatar successfully uploaded:", avatarUrl);
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
  uploadAvatar, // <--- Export the new controller
  uploadAvatarMulter, // <--- Export multer middleware for use in routes
};
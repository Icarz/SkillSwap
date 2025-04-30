const User = require("../models/User");
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

  // Parse and normalize skill query
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

    // Perform fuzzy search for each skill, collect results
    let allResults = [];

    searchSkills.forEach((skill) => {
      const results = fuse.search(skill);
      allResults.push(...results);
    });

    // Group by user ID and aggregate scores
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

    // Convert back to array and sort by best match (lowest total score, most matches)
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

// 🔁 Matchmaking logic
const findMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: currentUser._id }, // exclude self
      skills: { $in: currentUser.learning },
      learning: { $in: currentUser.skills },
    }).select("-password");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while finding matches" });
  }
};

// ✅ Export all
module.exports = {
  getProfile,
  updateProfile,
  searchUsers,
  findMatches,
};

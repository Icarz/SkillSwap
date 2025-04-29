const User = require('../models/User');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  const { name, bio, skills } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, skills },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile' });
  }
};

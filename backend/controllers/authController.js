const User = require('../models/User');
const Skill = require('../models/Skill');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
  const { name, email, password, skills = [], bio, learning = [] } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 🔄 Convert skill names to ObjectIds
    const convertToSkillIds = async (skillNames) => {
      const skillIds = [];
      for (const name of skillNames) {
        let skill = await Skill.findOne({ name });
        if (!skill) {
          skill = new Skill({ name });
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
      learning: learningIds
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        skills: newUser.skills,
        learning: newUser.learning,
        bio: newUser.bio
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        learning:user.learning,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

module.exports = {
  register,
  login
};

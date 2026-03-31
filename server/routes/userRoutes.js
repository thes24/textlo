const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddle');

// GET /api/users
// Get all users except current user
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      '-password'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile
// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, avatar } = req.body;

    // Validation
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if username is taken by another user
    const existingUser = await User.findOne({
      username: username.trim(),
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Update user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username.trim();
    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

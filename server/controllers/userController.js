const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// get all users except current user
// GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
  })
    .select('-password')
    .sort({ username: 1 });

  res.json(users);
});

// search users
// GET /api/users/search?q=query
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Search query is required');
  }

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
  })
    .select('-password')
    .limit(10);

  res.json(users);
});

module.exports = {
  getUsers,
  searchUsers,
};

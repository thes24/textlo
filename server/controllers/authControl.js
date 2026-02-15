const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// register new user
// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // validate
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // check
  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // create
  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// login user
// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Pleass add all fields');
  }

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid Credentials');
  }
});

// get current user
// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    status: user.status,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

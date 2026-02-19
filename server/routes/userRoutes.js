const express = require('express');
const router = express.Router();
const { getUsers, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddle');

router.get('/', protect, getUsers);
router.get('/search', protect, searchUsers);

module.exports = router;

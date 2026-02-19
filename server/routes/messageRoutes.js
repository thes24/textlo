const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddle');

router.post('/', protect, sendMessage);
router.get('/:convId', protect, getMessages);
router.put('/:msgId/read', protect, markAsRead);

module.exports = router;

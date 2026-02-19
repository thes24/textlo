const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddle');

router.post('/', protect, createConversation);
router.get('/', protect, getConversations);
router.get('/:id', protect, getConversationById);
router.post('/:id', protect, deleteConversation);

module.exports = router;

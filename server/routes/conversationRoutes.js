const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversationById,
  deleteConversation,
} = require('../controllers/conversationController');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddle');

router.post('/', protect, createConversation);
router.get('/:id', protect, getConversationById);
router.post('/:id', protect, deleteConversation);

// GET /api/conversations
// Get all conversations for current user
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username email avatar status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map((conv) => {
      const unreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount,
      };
    });

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const {
  sendMessage,
  getMessages,
  markAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddle');

router.post('/', protect, sendMessage);

router.put('/:msgId/read', protect, markAsRead);

// GET /api/messages/:convId
// get all mesages in a conversation
router.get('/:convId/search', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({ messages: [] });
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(req.params.convId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Search messages
    const messages = await Message.find({
      convId: req.params.convId,
      content: { $regex: q, $options: 'i' },
    })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:convId', protect, getMessages);

module.exports = router;

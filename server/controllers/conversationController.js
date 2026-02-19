const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// create or get a direct conversation
// POST /api/conversations
const createConversation = asyncHandler(async (req, res) => {
  const { ptpId } = req.body;

  if (!ptpId) {
    res.status(400);
    throw new Error('Participant Id is required');
  }

  const participant = await User.findById(ptpId);

  if (!participant) {
    res.status(404);
    throw new Error('User not found');
  }

  // check conversation if exists
  let conversation = await Conversation.findOne({
    type: 'direct',
    participants: {
      $all: [req.user._id, ptpId],
      $size: 2,
    },
  })
    .populate('participants', 'username avatar status')
    .populate('lastMessage');

  // if conversation does not exists, create
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, ptpId],
      type: 'direct',
    });

    conversation = await conversation.populate(
      'participants',
      'username avatar status'
    );
  }

  res.json(conversation);
});

// get all conversation for current user
// GET /api/conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'username avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  res.json(conversations);
});

// get conversation by id
// GET /api/conversations/:id
const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', 'username avatar status')
    .populate('lastMessage');

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(conversation);
});

// delete conversation
// DELETE /api/conversation/:id
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params._id);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // check if user is a participant
  const isParticipant = conversation.participants.includes(req.user._id);

  if (!isParticipant) {
    res.status(403);
    throw new Error('Access denied');
  }

  await conversation.deleteOne();

  res.json({ message: 'Conversation deleted' });
});

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
};

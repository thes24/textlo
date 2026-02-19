const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// send message
// POST /api/messages
const sendMessage = asyncHandler(async (req, res) => {
  const { convId, content, type } = req.body;

  if (!convId || !content) {
    res.status(400);
    throw new Error('ConvId and content are required');
  }

  // check if conversation exists and user is participant
  const conversation = await Conversation.findById(convId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.includes(req.user._id);

  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant in this conversation');
  }

  // create message
  const message = await Message.create({
    convId,
    sender: req.user._id,
    content,
    type: type || 'text',
  });

  // update conversation last message
  conversation.lastMessage = message._id;
  await conversation.save();

  // populate sender info
  await message.populate('sender', 'username avatar');

  res.status(201).json(message);
});

// get message for conversation
// GET /api/messages/:convId
const getMessages = asyncHandler(async (req, res) => {
  const { convId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // check if conversation exists and user is a participant
  const conversation = await Conversation.findById(convId);

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const isParticipant = conversation.participants.includes(req.user._id);

  if (!isParticipant) {
    res.status(403);
    throw new Error('You are not a participant in this conversation');
  }

  const messages = await Message.find({ convId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('sender', 'username avatar')
    .exec();

  const count = await Message.countDocuments({ convId });

  res.json({
    messages: messages.reverse(),
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  });
});

// mark message as read
// PUT /api/messages/:msgId/read
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.msgId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // only the reciever can mark as read
  if (message.sender.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot mark your own message as read');
  }

  message.read = true;
  message.readAt = Date.now();
  await message.save();

  res.json(message);
});

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
};

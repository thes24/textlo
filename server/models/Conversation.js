const mongoose = require('mongoose');

const convSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// direct message duplicate
convSchema.index(
  { participants: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'direct' },
  }
);

module.exports = mongoose.model('Conversation', convSchema);

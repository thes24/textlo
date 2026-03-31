const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // user joins
    socket.on('join', async (userId) => {
      try {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;

        await User.findByIdAndUpdate(userId, {
          status: 'online',
        });

        const currOnlineUsers = Array.from(onlineUsers.keys());
        socket.emit('online_users', currOnlineUsers);
        io.emit('user_online', userId);

        console.log(`👤 User ${userId} is online`);
      } catch (error) {
        console.error('❌ Join error:', error);
      }
    });

    // send message
    socket.on('send_message', async (data) => {
      try {
        const { convId, content, senderId, type, imageUrl } = data;

        const message = await Message.create({
          convId,
          sender: senderId,
          content: content || '',
          type: type || 'text',
          imageUrl: imageUrl || null,
        });

        await message.populate('sender', 'username avatar');

        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: message._id,
        });

        const conversation = await Conversation.findById(convId);

        conversation.participants.forEach((ptpId) => {
          if (ptpId.toString() !== senderId) {
            const currentCount =
              conversation.unreadCount?.get(ptpId.toString()) || 0;
            conversation.unreadCount.set(ptpId.toString(), currentCount + 1);
          }
        });

        await conversation.save();

        // send to all participants (including sender)
        conversation.participants.forEach((ptpId) => {
          const ptpSocketId = onlineUsers.get(ptpId.toString());
          if (ptpSocketId) {
            io.to(ptpSocketId).emit('receive_message', message);
          }
        });
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // join and leave conversation
    socket.on('join_conversation', (convId) => {
      socket.join(convId);
    });

    socket.on('leave_conversation', (convId) => {
      socket.leave(convId);
    });

    // typing indicator
    socket.on('typing', (data) => {
      const { convId, userId } = data;
      socket.to(convId).emit('user_typing', { userId, convId });
    });

    socket.on('stop_typing', (data) => {
      const { convId, userId } = data;
      socket.to(convId).emit('user_stop_typing', { userId, convId });
    });

    // mark as read
    socket.on('mark_read', async ({ msgId, userId }) => {
      try {
        const message = await Message.findById(msgId);

        if (message && !message.read) {
          message.read = true;
          message.readAt = new Date();
          await message.save();

          // Reset unread count for this user in the conversation
          const conversation = await Conversation.findById(message.convId);
          if (conversation) {
            conversation.unreadCount.set(userId, 0);
            await conversation.save();
          }

          // Notify sender
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', { msgId });
          }

          // Notify the user who marked as read (for unread count update)
          const userSocketId = onlineUsers.get(userId);
          if (userSocketId) {
            io.to(userSocketId).emit('unread_count_updated', {
              convId: message.convId,
              count: 0,
            });
          }
        }
      } catch (error) {
        console.error('❌ Mark read error:', error);
      }
    });

    // disconnect
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;

        if (userId) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: Date.now(),
          });

          io.emit('user_offline', userId);

          console.log(`👋 User ${userId} disconnected`);
        }
      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
    });
  });
};

module.exports = socketHandler;

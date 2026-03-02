const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// manage online user (usrId to socketId)
const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // user joins
    socket.on('join', async (userId) => {
      try {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;

        //update user status to online
        await User.findByIdAndUpdate(userId, {
          status: 'online',
        });

        const currOnlineUsers = Array.from(onlineUsers.keys());
        socket.emit('online_users', currOnlineUsers);

        // inform all other users, this user is online
        io.emit('user_online', userId);

        console.log(`User ${userId} is online`);
      } catch (error) {
        console.error('Join error:', error);
      }
    });

    // send message
    socket.on('send_message', async (data) => {
      try {
        const { convId, content, senderId } = data;

        // create message in database
        const message = await Message.create({
          convId,
          sender: senderId,
          content,
          type: 'text',
        });

        // populate sender info
        await message.populate('sender', 'username avatar');

        // update conversation
        await Conversation.findByIdAndUpdate(convId, {
          lastMessage: message._id,
        });

        // get conversation to find participants
        const conversation = await Conversation.findById(convId);

        // send to all participants
        conversation.participants.forEach((ptpId) => {
          const participantIdStr = ptpId.toString();

          if (participantIdStr === senderId) {
            return;
          }

          const ptpSocketId = onlineUsers.get(ptpId.toString());
          if (ptpSocketId) {
            io.to(ptpSocketId).emit('receive_message', message);
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'failed to send message' });
      }
    });

    // join and leave
    socket.on('join_conversation', (convId) => {
      socket.join(convId);
      console.log(`✅ Socket ${socket.id} joined room: ${convId}`);
    });

    socket.on('leave_conversation', (convId) => {
      socket.leave(convId);
      console.log(`❌ Socket ${socket.id} left room: ${convId}`);
    });

    // typing indicator
    socket.on('typing', (data) => {
      const { convId, userId } = data;
      console.log('⌨️  Typing event received:', data);
      // to same conversation room only
      socket.to(convId).emit('user_typing', {
        userId,
        convId,
      });
    });

    socket.on('stop_typing', (data) => {
      const { convId, userId } = data;
      console.log('🛑 Stop typing event received:', data);
      socket.to(convId).emit('user_stop_typing', {
        userId,
        convId,
      });
    });

    // mark as read
    socket.on('mark_read', async (data) => {
      try {
        const { msgId, userId } = data;
        const message = await Message.findById(msgId);

        // if not my message mark read
        if (message && message.sender.toString() !== userId) {
          message.read = true;
          message.readAt = Date.now();
          await message.save();

          // notify sender mark read
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', {
              msgId,
            });
          }
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // disconnect
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;

        if (userId) {
          // delete from online users
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: Date.now(),
          });

          // notify all online users that this person is offline
          io.emit('user_offline', userId);

          console.log(`User ${userId} disconnected`);
        }
      } catch (error) {
        console.log('Disconnect error:', error);
      }
    });
  });
};

module.exports = socketHandler;

const User = require('../models/User');
const Message = require('../models/Message');

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('Connected to socket.io:', socket.id);

    // Setup user with their own room (their user ID) for direct notifications
    socket.on('setup', (userData) => {
      socket.join(userData._id);
      socket.emit('connected');
      console.log('User joined room:', userData._id);
    });

    socket.on('join chat', (room) => {
      socket.join(room);
      console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('new message', (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
      if (!chat.users) return console.log('chat.users not defined');
      chat.users.forEach((user) => {
        if (user._id === newMessageRecieved.sender._id) return;
        socket.in(user._id).emit('message recieved', newMessageRecieved);
      });
    });

    socket.on('message delivered', async ({ messageId, userId, chatId }) => {
      // Notify sender immediately for ultra-low latency
      socket.in(chatId).emit('status updated', { messageId, userId, status: 'delivered', chatId });
      
      try {
        const message = await Message.findById(messageId);
        if (message && !message.deliveredTo.includes(userId)) {
          message.deliveredTo.push(userId);
          await message.save();
        }
      } catch (error) {
        console.error('Error updating delivered status:', error);
      }
    });

    socket.on('message seen', async ({ messageId, userId, chatId }) => {
      // Notify immediately for ultra-low latency
      socket.in(chatId).emit('status updated', { messageId, userId, status: 'seen', chatId });

      try {
        const message = await Message.findById(messageId);
        if (message && !message.seenBy.includes(userId)) {
          message.seenBy.push(userId);
          if (!message.deliveredTo.includes(userId)) message.deliveredTo.push(userId);
          await message.save();
        }
      } catch (error) {
        console.error('Error updating seen status:', error);
      }
    });

    socket.on('chat seen', async ({ chatId, userId }) => {
      // Broadcast to everyone in the chat room that this user has seen everything
      socket.in(chatId).emit('chat marked seen', { chatId, userId });

      try {
        // Bulk update in database
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, seenBy: { $ne: userId } },
          { $addToSet: { seenBy: userId, deliveredTo: userId } }
        );
      } catch (error) {
        console.error('Error bulk updating seen status:', error);
      }
    });

    socket.on('message edited', (updatedMessage) => {
      var chat = updatedMessage.chat;
      if (!chat.users) return;
      chat.users.forEach((user) => {
        if (user._id === updatedMessage.sender._id) return;
        socket.in(user._id).emit('message updated', updatedMessage);
      });
    });

    socket.on('message deleted', (deletedMessage) => {
      var chat = deletedMessage.chat;
      if (!chat.users) return;
      chat.users.forEach((user) => {
        if (user._id === deletedMessage.sender._id) return;
        socket.in(user._id).emit('message updated', deletedMessage);
      });
    });

    // Calling feature events
    socket.on('call-user', ({ userToCall, signalData, from, name, avatar, type }) => {
      socket.to(userToCall).emit('incoming-call', { signal: signalData, from, name, avatar, type });
    });

    socket.on('answer-call', (data) => {
      socket.to(data.to).emit('call-accepted', data.signal);
    });

    socket.on('end-call', ({ to }) => {
      socket.to(to).emit('call-ended');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });
};

module.exports = setupSockets;

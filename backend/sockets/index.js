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
      try {
        const message = await Message.findById(messageId).populate('sender', '_id');
        if (message && !message.deliveredTo.includes(userId)) {
          message.deliveredTo.push(userId);
          await message.save();
          // Notify sender
          socket.in(message.sender._id.toString()).emit('status updated', { messageId, userId, status: 'delivered', chatId });
        }
      } catch (error) {
        console.error('Error updating delivered status:', error);
      }
    });

    socket.on('message seen', async ({ messageId, userId, chatId }) => {
      try {
        const message = await Message.findById(messageId).populate('sender', '_id');
        if (message && !message.seenBy.includes(userId)) {
          message.seenBy.push(userId);
          if (!message.deliveredTo.includes(userId)) message.deliveredTo.push(userId);
          await message.save();
          // Notify sender
          socket.in(message.sender._id.toString()).emit('status updated', { messageId, userId, status: 'seen', chatId });
        }
      } catch (error) {
        console.error('Error updating seen status:', error);
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

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });
};

module.exports = setupSockets;

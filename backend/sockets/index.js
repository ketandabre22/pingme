const User = require('../models/User');

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('Connected to socket.io:', socket.id);

    // Setup user with their own room (their user ID) for direct notifications
    socket.on('setup', (userData) => {
      socket.join(userData._id);
      socket.emit('connected');
      console.log('User joined room:', userData._id);
      
      // Update online status in DB if needed, though usually handled via REST login
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

    socket.off('setup', () => {
      console.log('USER DISCONNECTED');
      socket.leave(userData._id);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });
};

module.exports = setupSockets;

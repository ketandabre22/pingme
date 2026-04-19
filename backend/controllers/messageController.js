const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

// @desc    Get all messages
// @route   GET /api/messages/:chatId
// @access  Private
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar email')
      .populate('chat');
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log('Invalid data passed into request');
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'name avatar');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark messages as seen
// @route   PUT /api/messages/seen/:chatId
// @access  Private
const markMessagesAsSeen = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Find messages in the chat where this user is NOT in the seenBy array
    // and the sender is NOT this user
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        seenBy: { $ne: req.user._id }
      },
      {
        $push: { seenBy: req.user._id }
      }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Edit message
// @route   PUT /api/messages/edit
// @access  Private
const editMessage = async (req, res) => {
  const { messageId, content } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message Not Found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'You can only edit your own messages' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name avatar')
      .populate('chat');

    res.json(updatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete message (Soft Delete)
// @route   PUT /api/messages/delete
// @access  Private
const deleteMessage = async (req, res) => {
  const { messageId } = req.body;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message Not Found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'You can only delete your own messages' });
    }

    message.content = 'This message was deleted';
    message.isDeleted = true;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { 
  allMessages, 
  sendMessage, 
  markMessagesAsSeen,
  editMessage,
  deleteMessage
};

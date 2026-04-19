const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Create or fetch One to One Chat
// @route   POST /api/chats
// @access  Private
const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log('UserId param not sent with request');
    return res.sendStatus(400);
  }

  // Find if chat exists
  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate('users', '-password')
    .populate('latestMessage');

  isChat = await User.populate(isChat, {
    path: 'latestMessage.sender',
    select: 'name avatar email',
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // Create new chat
    var chatData = {
      chatName: 'sender',
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'users',
        '-password'
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chats
// @access  Private
const fetchChats = async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: 'latestMessage.sender',
          select: 'name avatar email',
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create Group Chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please fill all the fields' });
  }

  let users;
  try {
    users = typeof req.body.users === 'string' ? JSON.parse(req.body.users) : req.body.users;
  } catch (error) {
    return res.status(400).send({ message: 'Invalid users format' });
  }

  // Ensure unique users and filter out the creator's ID if it's already there
  const creatorId = req.user._id.toString();
  users = [...new Set(users.filter(id => id !== creatorId))];

  if (users.length < 1) {
    return res
      .status(400)
      .json({ message: 'At least one other user is required to form a group chat' });
  }

  // Add the creator to the group
  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Rename Group
// @route   PUT /api/chats/rename
// @access  Private
const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!updatedChat) {
    res.status(404).json({ message: 'Chat Not Found' });
  } else {
    res.json(updatedChat);
  }
};

// @desc    Add member to Group
// @route   PUT /api/chats/groupadd
// @access  Private
const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!added) {
    res.status(404).json({ message: 'Chat Not Found' });
  } else {
    res.json(added);
  }
};

// @desc    Remove member from Group
// @route   PUT /api/chats/groupremove
// @access  Private
const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate('users', '-password')
    .populate('groupAdmin', '-password');

  if (!removed) {
    res.status(404).json({ message: 'Chat Not Found' });
  } else {
    res.json(removed);
  }
};

// @desc    Update Group Icon
// @route   PUT /api/chats/groupicon
// @access  Private
const updateGroupIcon = async (req, res) => {
  const { chatId, groupIcon } = req.body;

  if (!chatId || !groupIcon) {
    return res.status(400).json({ message: "Please provide chatId and groupIcon" });
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { groupIcon: groupIcon },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404).json({ message: "Chat Not Found" });
  } else {
    res.json(updatedChat);
  }
};

module.exports = { 
  accessChat, 
  fetchChats, 
  createGroupChat, 
  renameGroup, 
  addToGroup, 
  removeFromGroup,
  updateGroupIcon
};

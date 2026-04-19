const User = require('../models/User');
const Support = require('../models/Support');

// @desc    Get all users or search users by name/email
// @route   GET /api/users
// @access  Private
const allUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select('-password');
  
  res.json(users);
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites', 'name avatar email isOnline lastSeen');

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;
      
      if (req.body.preferences) {
        user.preferences = { ...user.preferences, ...req.body.preferences };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        favorites: updatedUser.favorites,
        preferences: updatedUser.preferences,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle favorite user
// @route   POST /api/users/favorites
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.favorites.indexOf(targetUserId);
    
    if (index === -1) {
      // Add to favorites
      user.favorites.push(targetUserId);
    } else {
      // Remove from favorites
      user.favorites.splice(index, 1);
    }

    const updatedUser = await user.save();
    
    // Populate favorites to return full user objects for UI
    await updatedUser.populate('favorites', 'name avatar email isOnline lastSeen');

    res.json(updatedUser.favorites);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Submit support request
// @route   POST /api/users/support
// @access  Private
const submitSupport = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const supportRequest = await Support.create({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      message,
    });

    // In a real app, you would use nodemailer here to send to dabreketan.1@gmail.com
    console.log(`[SUPPORT TICKET] New request from ${req.user.email}: ${message}`);

    res.status(201).json({ message: 'Support request submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { allUsers, updateSettings, toggleFavorite, submitSupport };

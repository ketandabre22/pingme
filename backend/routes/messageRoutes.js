const express = require('express');
const {
  allMessages,
  sendMessage,
  markMessagesAsSeen,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);
router.route('/seen/:chatId').put(protect, markMessagesAsSeen);
router.route('/edit').put(protect, editMessage);
router.route('/delete').put(protect, deleteMessage);

module.exports = router;

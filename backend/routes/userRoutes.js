const express = require('express');
const { allUsers, updateSettings, toggleFavorite, submitSupport } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, allUsers);
router.route('/settings').put(protect, updateSettings);
router.route('/favorites').post(protect, toggleFavorite);
router.route('/support').post(protect, submitSupport);

module.exports = router;

const express = require('express');
const searchController = require('../controllers/searchController');
const authController = require('../controllers/authController');

const router = express.Router();
router
  .route('/users/search/:pageNum')
  .get(authController.requireAuth, searchController.searchUsers);
router
  .route('/tweets/search/:pageNum')
  .get(authController.requireAuth, searchController.searchTweets);

module.exports = router;

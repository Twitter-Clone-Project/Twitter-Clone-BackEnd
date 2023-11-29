const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();
router.route('/users/search').get(searchController.searchUsers);
router.route('/tweets/search').get(searchController.searchTweets);

module.exports = router;

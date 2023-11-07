const express = require('express');
const tweetsController = require('../controllers/tweetsController');

const router = express.Router();

router.route('/add').post(tweetsController.addTweet);

module.exports = router;

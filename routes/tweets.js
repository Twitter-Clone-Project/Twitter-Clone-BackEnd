const express = require('express');
const tweetsController = require('../controllers/tweetsController');

const router = express.Router();

router.route('/add').post(tweetsController.addTweet);
router.route('/:tweetId/deleteTweet').delete(tweetsController.deleteTweet);
router.route('/:tweetId').get(tweetsController.getTweet);

module.exports = router;

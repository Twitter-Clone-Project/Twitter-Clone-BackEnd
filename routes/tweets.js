const express = require('express');
const tweetsController = require('../controllers/tweetsController');

const router = express.Router();

router.route('/add').post(tweetsController.addTweet);
router.route('/:tweetId/deleteTweet').delete(tweetsController.deleteTweet);
router.route('/:tweetId').get(tweetsController.getTweet);
router.route('/:tweetId/addLike').post(tweetsController.addLike);
router.route('/:tweetId/deleteLike').delete(tweetsController.deleteLike);
router.route('/:tweetId/addMedia').post(tweetsController.addMedia);
router.route('/:tweetId/media').get(tweetsController.getMediaOfTweet);

module.exports = router;

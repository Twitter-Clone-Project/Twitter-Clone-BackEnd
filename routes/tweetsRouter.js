const express = require('express');
const tweetsController = require('../controllers/tweetsController');

const {
  addTweetValidation,
  addMediaValidation,
} = require('../middlewares/validations/tweet');

const router = express.Router();

router.route('/add').post(addTweetValidation, tweetsController.addTweet);
router.route('/:tweetId/deleteTweet').delete(tweetsController.deleteTweet);
router.route('/:tweetId').get(tweetsController.getTweet);
router.route('/:tweetId/addLike').post(tweetsController.addLike);
router.route('/:tweetId/deleteLike').delete(tweetsController.deleteLike);
// router
//   .route('/:tweetId/addMedia')
//   .post(addMediaValidation, tweetsController.addMedia);
router.route('/:tweetId/media').get(tweetsController.getMediaOfTweet);
router.route('/:tweetId/retweeters').get(tweetsController.getRetweetersOfTweet);
router.route('/:tweetId/likers').get(tweetsController.getLikersOfTweet);
router.route('/:tweetId/replies').get(tweetsController.getRepliesOfTweet);
router.route('/:tweetId/retweet').post(tweetsController.retweet);

module.exports = router;

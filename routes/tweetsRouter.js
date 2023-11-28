const express = require('express');
const tweetsController = require('../controllers/tweetsController');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const { addTweetValidation } = require('../middlewares/validations/tweet');

const router = express.Router();

router
  .route('/add')
  .post(
    authController.requireAuth,
    tweetsController.uploadFiles,
    addTweetValidation,
    validateRequest,
    tweetsController.addTweet,
  );
router.route('/:tweetId/deleteTweet').delete(tweetsController.deleteTweet);
router
  .route('/:tweetId')
  .get(authController.requireAuth, tweetsController.getTweet);
router
  .route('/:tweetId/addLike')
  .post(authController.requireAuth, tweetsController.addLike);
router
  .route('/:tweetId/deleteLike')
  .delete(authController.requireAuth, tweetsController.deleteLike);
// router
//   .route('/:tweetId/addMedia')
//   .post(addMediaValidation, tweetsController.addMedia);
router.route('/:tweetId/media').get(tweetsController.getMediaOfTweet);
router
  .route('/:tweetId/retweeters')
  .get(authController.requireAuth, tweetsController.getRetweetersOfTweet);
router
  .route('/:tweetId/likers')
  .get(authController.requireAuth, tweetsController.getLikersOfTweet);

router.route('/:tweetId/replies').get(tweetsController.getRepliesOfTweet);
router.route('/:tweetId/retweet').post(tweetsController.retweet);

module.exports = router;

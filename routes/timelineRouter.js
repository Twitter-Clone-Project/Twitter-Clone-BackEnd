const express = require('express');
const timelineController = require('../controllers/timelineController');
const authController = require('../controllers/authController');

const router = express.Router();
router
  .route('/:pageNum/timeline')
  .get(authController.requireAuth, timelineController.getTweets);
router
  .route('/:userId/tweets/:pageNum')
  .get(authController.requireAuth, timelineController.getUserTweets);
router
  .route('/:userId/mentions/:pageNum')
  .get(authController.requireAuth, timelineController.getUserMentions);
router
  .route('/:userId/likedTweets/:pageNum')
  .get(authController.requireAuth, timelineController.getUserLikes);

module.exports = router;

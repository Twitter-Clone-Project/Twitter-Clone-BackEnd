const express = require('express');
const timelineController = require('../controllers/timelineController');
const authController = require('../controllers/authController');

const router = express.Router();
router.route('/:pageNum/timeline').get(authController.requireAuth,timelineController.getTweets);
router.route('/:userId/tweets').get(timelineController.getUserTweets);

module.exports = router;

const express = require('express');
const timelineController = require('../controllers/timelineController');

const router = express.Router();

router.route('/:userId/timeline').get(timelineController.getTweets);

module.exports = router;

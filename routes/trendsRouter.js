const express = require('express');
const trendsController = require('../controllers/trendsController');
const authController = require('../controllers/authController');
const router = express.Router();

router.route('/').get(trendsController.getTrends);
router
  .route('/:trendName/tweets')
  .get(authController.requireAuth, trendsController.getTweetsForTrend);

module.exports = router;

const express = require('express');
const interactionsController = require('../controllers/interactionsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/:username/followers')
  .get(authController.requireAuth, interactionsController.getListOfFollowers);
router
  .route('/:username/followings')
  .get(authController.requireAuth, interactionsController.getListOfFollowings);
router
  .route('/:username/follow')
  .post(authController.requireAuth, interactionsController.follow);
router
  .route('/:username/unfollow')
  .delete(authController.requireAuth, interactionsController.unFollow);
module.exports = router;

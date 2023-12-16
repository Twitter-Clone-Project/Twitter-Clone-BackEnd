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
router
  .route('/:username/mute')
  .post(authController.requireAuth, interactionsController.mute);
router
  .route('/:username/unmute')
  .delete(authController.requireAuth, interactionsController.unmute);
router
  .route('/mutedUsers')
  .get(authController.requireAuth, interactionsController.getListOfMutes);
router
  .route('/:username/block')
  .post(authController.requireAuth, interactionsController.block);
router
  .route('/:username/unblock')
  .delete(authController.requireAuth, interactionsController.unblock);
router
  .route('/blockedUsers')
  .get(authController.requireAuth, interactionsController.getListOfBlocks);

module.exports = router;

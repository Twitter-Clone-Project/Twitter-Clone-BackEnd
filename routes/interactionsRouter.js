const express = require('express');
const interactionsController = require('../controllers/interactionsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/:userId/followers')
  .get(interactionsController.getListOfFollowers);
router
  .route('/:userId/following')
  .get(interactionsController.getListOfFollowings);
router
  .route('/:userId/follow')
  .post(authController.requireAuth, interactionsController.follow);
router
  .route('/:userId/unfollow')
  .delete(authController.requireAuth, interactionsController.unFollow);
module.exports = router;

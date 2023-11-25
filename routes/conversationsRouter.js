const express = require('express');
const conversationsController = require('../controllers/conversationsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.requireAuth, conversationsController.getConversations);

module.exports = router;

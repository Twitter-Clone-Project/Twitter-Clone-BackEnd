const express = require('express');
const conversationsController = require('../controllers/conversationsController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(authController.requireAuth, conversationsController.getConversations);

router
  .route('/:conversationId/history')
  .get(
    authController.requireAuth,
    conversationsController.getConversationHistory,
  );

module.exports = router;


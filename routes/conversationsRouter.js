const express = require('express');
const conversationsController = require('../controllers/conversationsController');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const {
  startChatValidationRules,
  leaveChatValidationRules,
} = require('../middlewares/validations/conversation');
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

router
  .route('/unseenConversationsCnt')
  .get(
    authController.requireAuth,
    conversationsController.getUnseenConversationsCnt,
  );

router
  .route('/startConversation')
  .post(
    authController.requireAuth,
    startChatValidationRules,
    validateRequest,
    conversationsController.startConversation,
  );

router
  .route('/leaveConversation')
  .delete(
    authController.requireAuth,
    leaveChatValidationRules,
    validateRequest,
    conversationsController.leaveConversation,
  );
module.exports = router;

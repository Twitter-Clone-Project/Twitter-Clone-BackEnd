const { body } = require('express-validator');

exports.startChatValidationRules = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('You can start a new conversation with at least one user'),
];

exports.leaveChatValidationRules = [
  body('conversationId')
    .not()
    .isEmpty()
    .withMessage('conversation Id required'),
];

const { body } = require('express-validator');

exports.startChatValidationRules = [
  body('user1Id').not().isEmpty().withMessage('user1 is required'),
  body('user2Id').not().isEmpty().withMessage('user2 is required'),
];

exports.leaveChatValidationRules = [
  body('conversationId')
    .not()
    .isEmpty()
    .withMessage('conversation Id required'),
];

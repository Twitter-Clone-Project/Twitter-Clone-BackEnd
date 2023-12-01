const { body } = require('express-validator');

exports.updateUsernameValidationRules = [
  body('newUsername')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
];

exports.updateEmailValidationRules = [
  body('newEmail').isEmail().withMessage('Invalid email address'),
];

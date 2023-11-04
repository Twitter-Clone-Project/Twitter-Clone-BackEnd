const { body } = require('express-validator');

exports.signupValidationRules = [
  body('name')
    .isString()
    .matches(/^[a-zA-Z\s]+$/)
    .isLength({ min: 3 })
    .withMessage('Name must be at least 2 characters'),
  body('username')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('dateOfBirth')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('gRecaptchaResponse')
    .isString()
    .notEmpty()
    .withMessage('Recaptcha response is required'),
];

exports.signinValidationRules = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Invalid Password'),
];

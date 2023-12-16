/**
 * userValidationRules.js
 *
 * This module exports validation rules for various user-related actions,
 */

const { body } = require('express-validator');

/**
 * Validation rules for user signup.
 */
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
  body('email').toLowerCase().isEmail().withMessage('Invalid email address'),
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

/**
 * Validation rules for user signin.
 */
exports.signinValidationRules = [
  body('email').toLowerCase().isEmail().withMessage('Invalid email address'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Invalid Password'),
];

/**
 * Validation rules for OTP verification.
 */
exports.otpValidationRules = [
  body('otp')
    .matches(/^[a-z0-9]+$/)
    .isLength({ min: 8, max: 8 })
    .not()
    .isEmpty()
    .withMessage('Invalid OTP'),
];

/**
 * Validation rules for changing the user's password.
 */
exports.changePasswordValidationRules = [
  body('currentPassword')
    .not()
    .isEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .not()
    .isEmpty()
    .withMessage('New password is required')
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('newPasswordConfirm').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

/**
 * Validation rules for forgetting the user's password.
 */
exports.forgetPasswordValidationRules = [
  body('email').toLowerCase().isEmail().withMessage('Invalid email address'),
];

/**
 * Validation rules for resending email confirmation.
 */
exports.resendEmailValidationRules = [
  body('email').toLowerCase().isEmail().withMessage('Invalid email address'),
];

/**
 * Validation rules for OTP verification with email.
 */
exports.otpWithEmailValidationRules = [
  body('email').toLowerCase().isEmail().withMessage('Invalid email address'),
  body('otp')
    .matches(/^[a-z0-9]+$/)
    .isLength({ min: 8, max: 8 })
    .not()
    .isEmpty()
    .withMessage('Invalid OTP'),
];

/**
 * Validation rules for resetting the user's password.
 */
exports.resetPasswordValidationRules = [
  body('newPassword')
    .not()
    .isEmpty()
    .withMessage('New password is required')
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('newPasswordConfirm').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

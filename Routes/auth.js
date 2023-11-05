const express = require('express');
const authController = require('../Controllers/authController');
const validateRequest = require('../Middlewares/validateRequest');
const {
  signupValidationRules,
  signinValidationRules,
  validateOTP,
} = require('../Middlewares/Validations/user');

const router = express.Router();

router
  .route('/signup')
  .post(signupValidationRules, validateRequest, authController.signup);

router
  .route('/signin')
  .post(signinValidationRules, validateRequest, authController.signin);

router.route('/signout').post(authController.signout);

router.route('/signWithGoogle').post(authController.signWithGoogle);
router.route('/google/callback').get(authController.oauthGooogleCallback);

router
  .route('/confirmEmail')
  .post(
    authController.requireAuth,
    validateOTP,
    authController.confirmEmailByOTP,
  );
module.exports = router;

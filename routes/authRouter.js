const express = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const {
  signupValidationRules,
  signinValidationRules,
  otpValidationRules,
  changePasswordValidationRules,
  resetPasswordValidationRules,
  forgetPasswordValidationRules,
} = require('../middlewares/validations/user');

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
    otpValidationRules,
    validateRequest,
    authController.confirmEmailByOTP,
  );

router
  .route('/resendConfirmEmail')
  .post(authController.requireAuth, authController.resendConfirmationEmail);

router
  .route('/updatePassword')
  .patch(
    authController.requireAuth,
    changePasswordValidationRules,
    validateRequest,
    authController.changePassword,
  );

router
  .route('/forgetPassword')
  .post(
    forgetPasswordValidationRules,
    validateRequest,
    authController.forgetPassword,
  );

router
  .route('/resetPassword/:resetToken')
  .patch(
    resetPasswordValidationRules,
    validateRequest,
    authController.resetPassword,
  );

module.exports = router;

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
  resetCodeValidationRules,
  otpWithEmailValidationRules,
} = require('../middlewares/validations/user');

const router = express.Router();

router
  .route('/signup')
  .post(signupValidationRules, validateRequest, authController.signup);

router
  .route('/signin')
  .post(signinValidationRules, validateRequest, authController.signin);

router.route('/me').get(authController.requireAuth, authController.getMe);

router.route('/signout').post(authController.signout);

router.route('/signWithGoogle').post(authController.signWithGoogle);
router.route('/google/callback').get(authController.oauthGooogleCallback);

router
  .route('/confirmEmailAfterSignup')
  .post(
    authController.requireAuth,
    otpValidationRules,
    validateRequest,
    authController.addEmailToBody,
    authController.checkOTP,
    authController.confirmEmailAfterSignup,
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
  .route('/verifyEmailInFrgtPass')
  .post(
    otpWithEmailValidationRules,
    validateRequest,
    authController.checkOTP,
    authController.verifyEmailInFrgtPass,
  );

router
  .route('/resetPassword')
  .patch(
    resetPasswordValidationRules,
    validateRequest,
    authController.resetPassword,
  );

module.exports = router;

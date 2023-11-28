const express = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const {
  signupValidationRules,
  signinValidationRules,
  changePasswordValidationRules,
  resetPasswordValidationRules,
  forgetPasswordValidationRules,
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
  .route('/verifyEmail')
  .post(
    otpWithEmailValidationRules,
    validateRequest,
    authController.checkOTP,
    authController.confirmEmail,
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
  .route('/resetPassword')
  .patch(
    authController.requireAuth,
    resetPasswordValidationRules,
    validateRequest,
    authController.resetPassword,
  );

module.exports = router;

const express = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const {
  signupValidationRules,
  signinValidationRules,
  validateOTP,
  validateChangePassword,
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
    validateOTP,
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
    validateChangePassword,
    validateRequest,
    authController.changePassword,
  );

module.exports = router;

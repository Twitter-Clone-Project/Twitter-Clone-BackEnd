const express = require('express');
const authController = require('../Controllers/authController');
const validateRequest = require('../Middlewares/validateRequest');
const {
  signupValidationRules,
  signinValidationRules,
} = require('../Middlewares/Validations/user');

const router = express.Router();

router
  .route('/signup')
  .post(signupValidationRules, validateRequest, authController.signup);

router
  .route('/signin')
  .post(signinValidationRules, validateRequest, authController.signin);

router.route('/signWithGoogle').post(authController.signWithGoogle);
router.route('/google/callback').get(authController.oauthGooogleCallback);
module.exports = router;

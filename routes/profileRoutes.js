const express = require('express');
const profileController = require('../controllers/profileController');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const {
  updateUsernameValidationRules,
  updateEmailValidationRules,
  updateProfileValidationRules,
  imagesValidation,
  otpWithEmailValidationRules
} = require('../middlewares/validations/profile');

const router = express.Router();

router
  .route('/:username')
  .get(authController.requireAuth, profileController.getUserProfile);

router
  .route('/updateUsername')
  .patch(
    authController.requireAuth,
    updateUsernameValidationRules,
    validateRequest,
    profileController.updateUsername,
  );

router
  .route('/updateEmail')
  .patch(
    authController.requireAuth,
    updateEmailValidationRules,
    validateRequest,
    profileController.updateEmail,
  );
router
  .route('/updateProfile')
  .patch(
    authController.requireAuth,
    profileController.uploadFiles,
    updateProfileValidationRules,
    imagesValidation,
    validateRequest,
    profileController.updateProfile,
  );
  router.route('/updaterawan').patch(profileController.rawanusers);

  router
    .route('/verifyEmail')
    .post(
      authController.requireAuth,
      otpWithEmailValidationRules,
      validateRequest,
      authController.checkOTP,
      profileController.confirmUpdateEmail,
    );
    
module.exports = router;

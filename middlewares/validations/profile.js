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

exports.updateProfileValidationRules = [
  body('name')
    .isString()
    .matches(/^[a-zA-Z\s]+$/)
    .isLength({ min: 3 })
    .withMessage('Name must be at least 2 characters'),
  body('birthDate')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('bio').isString().withMessage('Bio must String'),
  body('website').isURL().withMessage('Invalid website. Use URL format'),
  body('location').isString().withMessage('Location must String'),
];
exports.imagesValidation = [
  body('profilePhoto').custom((value, { req }) => {
    const attachmentsArray = req.files.profilePhoto; // Get profilePhoto from req.files

    const isValidAttachments = attachmentsArray.every((attachment) => {
      const extension = path.extname(attachment.originalname);
      const isImageOrVideo = [
        '.jpg',
        '.jpeg',
        '.png',
        '.tif',
        '.tiff',
        '.svg',
        '.eps',
        '.raw',
        '.webp',
        '.heic',
      ].includes(extension.toLowerCase());
      return isImageOrVideo;
    });

    if (!isValidAttachments) {
      throw new Error('Profile photo must be an image or video');
    }
    return true;
  }),

  body('bannerPhoto').custom((value, { req }) => {
    const attachmentsArray = req.files.bannerPhoto; // Get bannerPhoto from req.files

    const isValidAttachments = attachmentsArray.every((attachment) => {
      const extension = path.extname(attachment.originalname);
      const isImageOrVideo = [
        '.jpg',
        '.jpeg',
        '.png',
        '.tif',
        '.tiff',
        '.svg',
        '.eps',
        '.raw',
        '.webp',
        '.heic',
      ].includes(extension.toLowerCase());
      return isImageOrVideo;
    });

    if (!isValidAttachments) {
      throw new Error('Banner photo must be an image or video');
    }
    return true;
  }),
];

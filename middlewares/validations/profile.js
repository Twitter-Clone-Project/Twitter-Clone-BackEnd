const { body } = require('express-validator');
const path = require('path');
const AppError = require('../../services/AppError');

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
    .optional()
    .isString()
    .matches(/^[a-zA-Z\s]+$/)
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('birthDate')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('bio').optional().isString().withMessage('Bio must String'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website. Use URL format'),
  body('location').optional().isString().withMessage('Location must String'),
];
exports.imagesValidation = [
  body('profilePhoto')
    .optional()
    .custom((value, { req }) => {
      if (!req.files || !req.files.profilePhoto) return true;
      const attachmentsArray = Array.isArray(req.files.profilePhoto)
        ? req.files.profilePhoto
        : [req.files.profilePhoto];
      if (!attachmentsArray) return true;
      console.log(attachmentsArray);
      const isValidAttachments = attachmentsArray.every((attachment) => {
        const extension = path.extname(attachment.originalname);
        const isImage = [
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
        return isImage;
      });

      if (!isValidAttachments) {
        throw new AppError('Profile photo must be an image ', 400);
      }
      return true;
    }),
  body('bannerPhoto')
    .optional()
    .custom((value, { req }) => {
      if (!req.files || !req.files.bannerPhoto) return true;
      const attachmentsArray = Array.isArray(req.files.bannerPhoto)
        ? req.files.bannerPhoto
        : [req.files.bannerPhoto];
      if (!attachmentsArray) return true;

      const isValidAttachments = attachmentsArray.every((attachment) => {
        const extension = path.extname(attachment.originalname);
        const isImage = [
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
        return isImage;
      });

      if (!isValidAttachments) {
        throw new AppError('Banner photo must be an image', 400);
      }
      return true;
    }),
];
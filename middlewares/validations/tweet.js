const path = require('path');
const { body } = require('express-validator');
const AppError = require('../../services/AppError');

exports.addMediaValidation = [
  body('media').custom((value, { req }) => {
    if (!req.files || !req.files.media) return true;
    const attachmentsArray = Array.isArray(req.files.media)
      ? req.files.media
      : [req.files.media];
    if (!attachmentsArray) return true;
    const isValidAttachments = attachmentsArray.every((attachment) => {
      const extension = path.extname(attachment.originalname);
      const isImageOrVideo = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.bmp',
        '.mp4',
        '.avi',
        '.mov',
        '.wmv',
      ].includes(extension.toLowerCase());
      return isImageOrVideo;
    });

    if (!isValidAttachments) {
      throw new AppError('attachment must be image or video', 400);
    }
    return true;
  }),
];

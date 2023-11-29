const path = require('path');
const { body } = require('express-validator');

exports.addTweetValidation = [
  body('tweetText').custom((value, { req }) => {
    const { tweetText } = req.body;

    if (!tweetText || tweetText.trim() === '') {
      throw new Error('Tweet can not be empty');
    }

    return true;
  }),
  // body('attachments').custom((value, { req }) => {
  //   const attachmentsArray = Array.isArray(req.fields.attachments)
  //     ? req.fields.attachments
  //     : [req.fields.attachments];
  //   if (!attachmentsArray) return true;
  //   const isValidAttachments = attachmentsArray.every((attachment) => {
  //     const extension = path.extname(attachment);
  //     const isImageOrVideo = [
  //       '.jpg',
  //       '.jpeg',
  //       '.png',
  //       '.gif',
  //       '.bmp',
  //       '.mp4',
  //       '.avi',
  //       '.mov',
  //       '.wmv',
  //     ].includes(extension.toLowerCase());
  //     return isImageOrVideo;
  //   });

  //   if (!isValidAttachments) {
  //     throw new Error('Attachments must be images or videos');
  //   }
  //   return true;
  // }),
];

exports.addMediaValidation = [
  body('media').custom((value, { req }) => {
    const attachmentsArray = Array.isArray(req.files.media)
      ? req.fields.attachments
      : [req.fields.attachments];

    const isValidAttachments = attachmentsArray.every((attachment) => {
      const extension = path.extname(attachment);
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
      throw new Error('Attachments must be images or videos');
    }
    return true;
  }),
];

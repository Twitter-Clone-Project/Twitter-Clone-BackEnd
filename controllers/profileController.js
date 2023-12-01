const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const multer = require('multer');
const AWS = require('aws-sdk');

const User = require('../models/entites/User');
const Follow = require('../models/relations/Follow');
const Mute = require('../models/relations/Mute');
const Block = require('../models/relations/Block');

// Set up multer storage and limits
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
exports.uploadFiles = upload.fields([{ name: 'media' }]);

async function uploadMedia(mediaArray) {
  const s3 = new AWS.S3({
    credentials: {
      accessKeyId: 'AKIAWK2IJRF55BVEYPX4',
      secretAccessKey: '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',
    },
  });

  const uploadPromises = mediaArray.map(async (media) => {
    const uploadParams = {
      Bucket: 'kady-twitter-images',
      Key: Date.now() + media.originalname,
      Body: Buffer.from(media.buffer),
      ContentType: media.mimetype,
      ACL: 'public-read',
    };

    try {
      const data = await s3.upload(uploadParams).promise();
      console.log('Upload Success', data.Location);
     // return data.Location;
    } catch (err) {
      console.error('Error uploading media:', err);
      throw err; // Re-throw the error to be caught by the calling code
    }
  });

  try {
    // Wait for all uploads to complete
    const locations = await Promise.all(uploadPromises);
    return locations;
  } catch (err) {
    console.error('Error uploading media:', err);
    throw err; // Re-throw the error to be caught by the calling code
  }
}
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;
  const user = await AppDataSource.getRepository(User).findOne({
    where: { username: username },
    select: {
      userId: true,
      isConfirmed: true,
      username: true,
      email: true,
      name: true,
      followersCount: true,
      followingsCount: true,
      bio: true,
      birthDate: true,
      website: true,
      location: true,
      imageUrl: true,
      bannerUrl: true,
    },
  });
  let isFollowed = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: user.userId,
      followerId: currUserId,
    },
  });
  let isFollowing = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: currUserId,
      followerId: user.userId,
    },
  });
  let isMuted = await AppDataSource.getRepository(Mute).findOne({
    where: {
      userId: currUserId,
      mutedId: user.userId,
    },
  });
  let isBlocked = await AppDataSource.getRepository(Block).findOne({
    where: {
      userId: currUserId,
      blockedId: user.userId,
    },
  });
  isMuted = !!isMuted;
  isBlocked = !!isBlocked;
  isFollowed = !!isFollowed;
  isFollowing = !!isFollowing;
  user.isMuted = isMuted;
  user.isBlocked = isBlocked;
  user.isFollowed = isFollowed;
  user.isFollowing = isFollowing;

  res.status(200).json({
    status: true,
    data: {
      user: user,
    },
  });
});

exports.updateUsername = catchAsync(async (req, res, next) => {
  const currUserId = req.currentUser.userId;
  const { newUsername } = req.body;
  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: currUserId },
  });
  user.username = newUsername;

  const savedUser = await AppDataSource.getRepository(User).save(user);

  res.status(200).json({
    status: true,
    data: {
      newUsername: newUsername,
    },
  });
});
exports.updateEmail = catchAsync(async (req, res, next) => {
  const currUserId = req.currentUser.userId;
  const { newEmail } = req.body;
  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: currUserId },
  });
  user.email = newEmail;

  const savedUser = await AppDataSource.getRepository(User).save(user);

  res.status(200).json({
    status: true,
    data: {
      newEmail: newEmail,
    },
  });
});
// exports.updateProfile = catchAsync(async (req, res, next) => {
//   const { name, bio, website, location, birthDate } = req.body;
//   let image = req.files;
//   //let banner = req.files.bannerPhoto;
//   console.log(image);
//   const currUserId = req.currentUser.userId;
//   const attachments = await uploadMedia(image);
//   console.log(attachments);

//   //   const user = await AppDataSource.getRepository(User).findOne({
//   //     where: { userId: currUserId },
//   //   });
//   //   user.bio = bio;
//   //   user.imageUrl = imageURl;
//   //   user.bannerUrl = bannerURl;
//   //   user.name = name;
//   //   user.birthDate = birthDate;
//   //   user.website = website;
//   //   user.location = location;

//   //   const savedUser = await AppDataSource.getRepository(User).save(user);

//   //   res.status(200).json({
//   //     status: true,
//   //     data: {
//   //       newEmail: newEmail,
//   //     },
//   //   });
// });

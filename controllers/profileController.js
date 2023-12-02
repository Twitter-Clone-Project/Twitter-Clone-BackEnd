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
exports.uploadFiles = upload.fields([
  { name: 'profilePhoto' },
  { name: 'bannerPhoto' },
]);

const defaultBanner =
  'https://kady-twitter-images.s3.amazonaws.com/DefaultBanner.png';

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
      Key: media.originalname,
      Body: Buffer.from(media.buffer),
      ContentType: media.mimetype,
      ACL: 'public-read',
    };

    try {
      const data = await s3.upload(uploadParams).promise();
      console.log('Upload Success', data.Location);
      return data.Location;
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

function getKeyFromLocation(location) {
  const url = new URL(location);
  const pathArray = url.pathname.split('/');
  const key = pathArray.slice(1).join('/'); // Join path segments after the first '/'
  return decodeURIComponent(key); // Decoding URI component if needed
}
async function deleteFromS3(Location) {
  const s3 = new AWS.S3({
    credentials: {
      accessKeyId: 'AKIAWK2IJRF55BVEYPX4',
      secretAccessKey: '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',
    },
  });
  const keyName = getKeyFromLocation(Location);

  const deleteParams = {
    Bucket: 'kady-twitter-images',
    Key: keyName,
  };

  try {
    const data = await s3.deleteObject(deleteParams).promise();
    console.log('Successfully deleted:', keyName);
    return data;
  } catch (err) {
    console.error('Error deleting object:', err);
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
  let isBlockingMe = await AppDataSource.getRepository(Block).findOne({
    where: {
      userId: user.userId,
      blockedId: currUserId,
    },
  });
  isMuted = !!isMuted;
  isBlocked = !!isBlocked;
  isFollowed = !!isFollowed;
  isFollowing = !!isFollowing;
  isBlockingMe = !!isBlockingMe;
  user.isMuted = isMuted;
  user.isBlocked = isBlocked;
  user.isFollowed = isFollowed;
  user.isFollowing = isFollowing;
  user.isBlockingMe = isBlockingMe;
  user.createdAt = null;

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
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, bio, website, location, birthDate, isUpdated } = req.body;
  let image = req.files.profilePhoto;
  let banner = req.files.bannerPhoto;

  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: currUserId },
  });

  if (image) {
    const imageUrl = await uploadMedia([image[0]]);
    user.imageUrl = imageUrl[0];
  }
  if (isUpdated == 'TRUE') {
    if (banner) {
      const bannerUrl = await uploadMedia([banner[0]]);
      user.bannerUrl = bannerUrl[0];
    } else if (user.bannerUrl != defaultBanner) {
      await deleteFromS3(user.bannerUrl);
      user.bannerUrl = defaultBanner;
    }
  }

  user.bio = bio;
  user.name = name;
  user.birthDate = birthDate;
  user.website = website;
  user.location = location;

  const savedUser = await AppDataSource.getRepository(User).save(user);

  res.status(200).json({
    status: true,
    data: {
      userId: savedUser.userId,
      username: savedUser.username,
      isConfirmed: savedUser.isConfirmed,
      email: savedUser.email,
      name: savedUser.name,
      bio: savedUser.bio,
      website: savedUser.website,
      location: savedUser.location,
      imageUrl: savedUser.imageUrl,
      bannerUrl: savedUser.bannerUrl,
      followersCount: savedUser.followersCount,
      followingsCount: savedUser.followingsCount,
      birthDate: savedUser.birthDate,
    },
  });
});



const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const multer = require('multer');
const AWS = require('aws-sdk');

const User = require('../models/entites/User');
const Follow = require('../models/relations/Follow');
const Mute = require('../models/relations/Mute');
const Block = require('../models/relations/Block');
const Email = require('../services/Email');
const {createAndSendToken} = require('../controllers/authController');

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
      createdAt: true,
    },
  });
  if (user) {
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

    res.status(200).json({
      status: true,
      data: {
        user: user,
      },
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
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
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { userId: currUserId },
  });
  const otp = user.createOTP();
  await userRepository.save(user);
  user.email = newEmail;

  await new Email(user, { otp }).sendEmail(
    'updateEmail',
    'Confirm your email on X',
  );

  res.status(200).json({
    status: true,
    message: 'Email with otp send successfully',
  });
});

exports.confirmUpdateEmail = catchAsync(async (req, res, next) => {
  const { userRepository, user, newEmail } = res.locals;

  user.setIsConfirmed(true);
  user.email = newEmail;
  await userRepository.save(user);

  createAndSendToken(user, req, res, 200);
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, bio, website, location, birthDate, isUpdated } = req.body;
  let image = null;
  let banner = null;
  if (req.files) {
    image = req.files.profilePhoto;
    banner = req.files.bannerPhoto;
  }
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: currUserId },
  });

  if (image) {

    if(user.imageUrl){
      await deleteFromS3(user.imageUrl);
    }
    const imageUrl = await uploadMedia([image[0]]);
    user.imageUrl = imageUrl[0];
  }
  if (isUpdated && isUpdated == 'TRUE') {
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

exports.rawanusers = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  console.log(email);

  const user = await AppDataSource.getRepository(User).findOne({
    where: { email: email },
  });
  if(email){
  user.followersCount = 0;
  user.followingsCount = 0;
  user.isConfirmed = true;

  const savedUser = await AppDataSource.getRepository(User).save(user);

  const result2 = await AppDataSource.getRepository(Follow)
    .createQueryBuilder()
    .delete()
    .from(Follow)
    .where('followerId = :userId or userId = :followerId', {
      followerId: user.userId,
      userId: user.userId,
    })
    .execute();
  console.log(result2.affected);

  res.status(200).json({
    status: true,
    data: {
      userId: savedUser.userId,
      username: savedUser.username,
      isConfirmed: savedUser.isConfirmed,
      email: savedUser.email,
      name: savedUser.name,
      followersCount: savedUser.followersCount,
      followingsCount: savedUser.followingsCount,
    },
  });
}else {
  es.status(404).json({
    status: false,
    message: "email not found",
  });
}
});



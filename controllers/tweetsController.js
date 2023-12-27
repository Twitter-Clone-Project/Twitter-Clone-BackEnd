const { validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');
const Reply = require('../models/entites/Reply');
const Trend = require('../models/entites/Trend');
const Like = require('../models/relations/Like');
const LikeReply = require('../models/relations/LikeReply');
const Repost = require('../models/relations/Repost');
const Follow = require('../models/relations/Follow');
const Support = require('../models/relations/Support');

const multer = require('multer');

// Set up multer storage and limits
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
exports.uploadFiles = upload.fields([{ name: 'media' }]);

async function checkTweet(tweetId, next) {
  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });
  if (!tweet) return next(new AppError('No tweet exists with this id', 400));
}

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

function getFileType(url) {
  const extension = url.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(extension)) {
    return 'video';
  } else {
    return 'unknown';
  }
}

/**
 * Controller for tweets addition
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {AppError} If tweet is empty and no media is provided.
 * @throws {AppError} If tweet has more than 4 attachments.
 * @returns {Object} JSON response with the newly added tweet details.
 */
exports.addTweet = catchAsync(async (req, res, next) => {
  // Extract tweetText, trends, and files (media) from the request.
  let { tweetText } = req.body;
  const { trends } = req.body;
  const files = req.files;

  // Flag to check the validity of media attachments.
  let validMedia = true;

  // Check if no media is provided.
  if (!files || !files.media) {
    validMedia = false;
  }

  // Validate tweetText based on media presence.
  if (!validMedia && (!tweetText || tweetText === '')) {
    return next(new AppError('tweet can not be empty', 400));
  }

  // If validMedia and no tweetText, set tweetText to an empty string.
  if (validMedia && (!tweetText || tweetText === '')) {
    tweetText = '';
  }

  // Check if the tweet has more than 4 attachments.
  if (validMedia && files.media.length > 4) {
    return next(
      new AppError('tweet can not have more than 4 attachments', 400),
    );
  }

  // Convert trends to an array if it's not already.
  trendsArray = Array.isArray(trends) ? trends : trends ? [trends] : [];

  // Extract userId from the current user in the request.
  const userId = req.currentUser.userId;

  // Create a new Tweet instance.
  const tweet = new Tweet();
  tweet.userId = userId;
  tweet.text = tweetText;
  tweet.time = new Date(Date.now());

  // Save the tweet to the database.
  const savedTweet = await AppDataSource.getRepository(Tweet).save(tweet);

  // Fetch user details from the database.
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: userId,
    },
  });

  // Initialize an array to store media attachments.
  let attachments = [];

  // If validMedia, upload media attachments and store their URLs.
  if (validMedia) {
    attachments = await uploadMedia(files.media);
  }

  // Iterate over each attachment and save them to the database.
  for (const m of attachments) {
    const media = new Media();
    media.tweetId = savedTweet.tweetId;
    media.url = m;
    media.type = getFileType(m);
    const savedMedia = await AppDataSource.getRepository(Media).save(media);
  }

  // Iterate over trends and handle their addition or increment count.
  for (const trend of trendsArray) {
    const existingTrend = await AppDataSource.getRepository(Trend).findOne({
      where: {
        name: trend,
      },
    });

    let newTrend = null;

    if (existingTrend) {
      existingTrend.count = BigInt(existingTrend.count) + BigInt(1);
      await AppDataSource.getRepository(Trend).save(existingTrend);
    } else {
      const newTrendLocal = new Trend();
      newTrendLocal.name = trend;
      await AppDataSource.getRepository(Trend).save(newTrendLocal);
      newTrend = newTrendLocal;
    }

    const support = new Support();
    support.trendId = existingTrend ? existingTrend.trendId : newTrend.trendId;
    support.tweetId = tweet.tweetId;
    const savedSupport =
      await AppDataSource.getRepository(Support).save(support);
  }

  // Fetch media attachments associated with the savedTweet.
  const tweetMedia = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: savedTweet.tweetId,
    },
  });

  // Extract media URLs from the tweetMedia array.
  let tweetMediaUrls = [];
  if (validMedia) {
    tweetMediaUrls = tweetMedia.map((media) => media.url);
  }

  // Convert tweet time to a UTC Date object.
  tweetTime = new Date(savedTweet.time + 'UTC');

  // Send the JSON response with the newly added tweet details.
  res.status(200).json({
    status: true,
    data: {
      id: savedTweet.tweetId,
      text: savedTweet.text,
      createdAt: tweetTime,
      user: {
        userId: user.userId,
        imageUrl: user.imageUrl,
        screenName: user.name,
        username: user.username,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingsCount,
        isFollowed: false,
        isFollowing: false,
      },
      attachmentsUrl: tweetMediaUrls,
      isRetweet: false,
      isLiked: false,
      isRetweeted: false,
      isReplied: false,
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      retweetedUser: {},
    },
  });
});

exports.deleteTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  checkTweet(tweetId, next);
  const tweetRepository = AppDataSource.getRepository(Tweet);

  const result = await tweetRepository
    .createQueryBuilder()
    .delete()
    .from(Tweet)
    .where('tweetId = :tweetId', { tweetId: tweetId })
    .execute();

  if (!result.affected || !(result.affected > 0))
    return next(new AppError('error in deleting tweet , id is not exist', 400));

  res.status(200).json({
    status: true,
    message: 'tweet is deleted successfully',
  });
});

exports.getTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;
  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });
  if (!tweet) return next(new AppError('No tweet exists with this id', 400));
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: tweet.userId,
    },
  });
  if (!user) return next(new AppError('No user exists', 400));
  const attachments = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: tweetId,
    },
  });
  const likesCount = await AppDataSource.getRepository(Like).count({
    where: {
      tweetId: tweetId,
    },
  });
  const repostsCount = await AppDataSource.getRepository(Repost).count({
    where: {
      tweetId: tweetId,
    },
  });
  const repliesCount = await AppDataSource.getRepository(Reply).count({
    where: {
      tweetId: tweetId,
    },
  });

  let isLiked = await AppDataSource.getRepository(Like).findOne({
    where: {
      userId: currUserId,
      tweetId: tweetId,
    },
  });

  let isReposted = await AppDataSource.getRepository(Repost).findOne({
    where: {
      userId: currUserId,
      tweetId: tweetId,
    },
  });

  let isReplied = await AppDataSource.getRepository(Reply).findOne({
    where: {
      userId: currUserId,
      tweetId: tweetId,
    },
  });

  let isFollowed = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: tweet.userId,
      followerId: currUserId,
    },
  });

  let isFollowing = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: currUserId,
      followerId: tweet.userId,
    },
  });

  isFollowed = !!isFollowed;
  isFollowing = !!isFollowing;

  isLiked = !!isLiked;
  isReposted = !!isReposted;
  const tweetMediaUrls = attachments.map((media) => media.url);

  tweetTime = new Date(tweet.time + 'UTC');

  res.status(200).json({
    status: true,
    data: {
      id: tweet.tweetId,
      text: tweet.text,
      createdAt: tweetTime,
      user: {
        userId: user.userId,
        imageUrl: user.imageUrl,
        screenName: user.name,
        username: user.username,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingsCount,
        isFollowed: isFollowed,
        isFollowing: isFollowing,
      },
      attachmentsURL: tweetMediaUrls,
      isRetweet: false,
      isLiked: isLiked,
      isRetweeted: isReposted,
      isReplied: isReplied,
      likesCount: likesCount,
      retweetsCount: repostsCount,
      repliesCount: repliesCount,
      retweetedUser: {},
    },
  });
});

exports.addLike = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);

  let isLiked = await AppDataSource.getRepository(Like).findOne({
    where: {
      userId: currUserId,
      tweetId: tweetId,
    },
  });
  if (isLiked) {
    res.status(400).json({
      status: false,
      message: 'user already likes this tweet',
    });
  }
  const like = new Like();
  like.userId = currUserId;
  like.tweetId = tweetId;
  const savedLike = await AppDataSource.getRepository(Like).save(like);

  res.status(200).json({
    status: true,
    message: 'like is added successfully',
  });
});

exports.deleteLike = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);

  const likeRepository = AppDataSource.getRepository(Like);

  const result = await likeRepository
    .createQueryBuilder()
    .delete()
    .from(Like)
    .where('tweetId = :tweetId AND userId = :userId', {
      tweetId: tweetId,
      userId: currUserId,
    })
    .execute();

  if (!result.affected || !(result.affected > 0))
    return next(new AppError('error deleting like', 400));

  res.status(200).json({
    status: true,
    message: 'like is deleted successfully',
  });
});

exports.addMedia = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  let validMedia = true;
  const files = req.files;
  if (!files || !files.media) {
    validMedia = false;
  }
  checkTweet(tweetId, next);
  const tweetRepository = AppDataSource.getRepository(Tweet);
  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });
  const media = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: tweetId,
    },
  });
  if (validMedia && media.length + files.media.length > 4)
    return next(
      new AppError('tweet can not have more than 4 attachments', 400),
    );
  let uploadMed = [];
  if (validMedia) {
    uploadMed = await uploadMedia(files.media);
  }

  if (!media || media.length === 0) {
    for (const m of uploadMed) {
      const med = new Media();
      med.tweetId = tweetId;
      med.url = m;
      med.type = 'image';
      const savedMedia = await AppDataSource.getRepository(Media).save(med);
    }
  } else {
    for (const m of uploadMed) {
      const med = new Media();
      med.tweetId = tweetId;
      med.url = m;
      med.type = 'image';
      const savedMedia = await AppDataSource.getRepository(Media).save(med);
    }
  }

  if (validMedia) {
    res.status(200).json({
      status: true,
      message: 'media is added successfully',
    });
  } else {
    return next(new AppError('No media provided', 400));
  }
});

exports.getMediaOfTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;

  checkTweet(tweetId, next);
  const attachments = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: tweetId,
    },
  });
  const tweetMediaUrls = attachments.map((media) => media.url);
  if (tweetMediaUrls.length > 0) {
    res.status(200).json({
      status: true,
      data: tweetMediaUrls,
    });
  } else {
    res.status(200).json({
      status: true,
      data: [],
    });
  }
});

exports.getRetweetersOfTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);
  const retweets = await AppDataSource.getRepository(Repost)
    .createQueryBuilder('repost')
    .innerJoinAndMapOne(
      'repost.user',
      User,
      'user',
      'user.userId = repost.userId',
    )
    .where('repost.tweetId = :tweetId', { tweetId })
    .getMany();

  const retweeters = retweets.map((retweets) => retweets.user);

  const finalRetweetersPromises = retweeters.map(async (retweeter) => {
    const {
      userId,
      name,
      username,
      imageUrl,
      bio,
      followersCount,
      followingsCount,
    } = retweeter;
    const isFollowed = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: retweeter.userId,
        followerId: currUserId,
      },
    });
    let isFollowing = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: currUserId,
        followerId: retweeter.userId,
      },
    });
    return {
      id: userId,
      name: name,
      screenName: username,
      imageUrl: imageUrl,
      bio: bio,
      isFollowed: !!isFollowed,
      isFollowing: !!isFollowing,
      followersCount: followersCount,
      followingCount: followingsCount,
    };
  });
  const finalRetweeters = await Promise.all(finalRetweetersPromises);

  res.status(200).json({
    status: true,
    data: finalRetweeters,
  });
});

exports.getLikersOfTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);
  const likes = await AppDataSource.getRepository(Like)
    .createQueryBuilder('like')
    .innerJoinAndMapOne('like.user', User, 'user', 'user.userId = like.userId')
    .where('like.tweetId = :tweetId', { tweetId })
    .getMany();

  const likers = likes.map((likes) => likes.user);

  const finalLikersPromises = likers.map(async (liker) => {
    const {
      userId,
      name,
      username,
      imageUrl,
      bio,
      followersCount,
      followingsCount,
    } = liker;
    const isFollowed = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: liker.userId,
        followerId: currUserId,
      },
    });
    let isFollowing = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: currUserId,
        followerId: liker.userId,
      },
    });
    return {
      id: userId,
      name: name,
      screenName: username,
      imageUrl: imageUrl,
      bio: bio,
      isFollowed: !!isFollowed,
      isFollowing: !!isFollowing,
      followersCount: followersCount,
      followingCount: followingsCount,
    };
  });
  const finalLikers = await Promise.all(finalLikersPromises);

  res.status(200).json({
    status: true,
    data: finalLikers,
  });
});

exports.getRepliesOfTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;

  checkTweet(tweetId, next);

  const replies = await AppDataSource.getRepository(Reply)
    .createQueryBuilder('reply')
    .innerJoinAndMapOne(
      'reply.user',
      User,
      'user',
      'user.userId = reply.userId',
    )
    .where('reply.tweetId = :tweetId', { tweetId })
    .getMany();

  const repliesPromises = replies.map(async (reply) => {
    // const likesCount = await AppDataSource.getRepository(LikeReply).count({
    //   where: {
    //     replyId: reply.replyId,
    //   },
    // });
    replyTime = new Date(reply.time + 'UTC');
    return {
      replyId: reply.replyId,
      replyTweetId: reply.tweetId,
      replyUserId: reply.userId,
      replyText: reply.text,
      createdAt: replyTime,
      username: reply.user.username,
      screenName: reply.user.name,
      bio: reply.user.bio,
      imageUrl: reply.user.imageUrl,
    };
  });
  let repliesRes = await Promise.all(repliesPromises);
  repliesRes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: true,
    data: repliesRes,
  });
});

exports.retweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);

  let isRetweeted = await AppDataSource.getRepository(Repost).findOne({
    where: {
      userId: currUserId,
      tweetId: tweetId,
    },
  });
  if (isRetweeted) {
    res.status(400).json({
      status: false,
      message: 'user already reposts this tweet',
    });
  }
  const repost = new Repost();
  repost.userId = currUserId;
  repost.tweetId = tweetId;
  const savedRepost = await AppDataSource.getRepository(Repost).save(repost);

  res.status(200).json({
    status: true,
    message: 'Repost is done successfully',
  });
});

exports.addReply = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const replyText = req.body.text;
  const currUserId = req.currentUser.userId;

  checkTweet(tweetId, next);

  const reply = new Reply();
  reply.userId = currUserId;
  reply.tweetId = tweetId;
  reply.text = replyText;
  reply.time = new Date(Date.now());
  const savedReply = await AppDataSource.getRepository(Reply).save(reply);
  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });
  if (!tweet) return next(new AppError('No tweet exists with this id', 400));

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: reply.userId,
    },
  });
  if (!user) return next(new AppError('No user exists', 400));

  let isFollowed = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: tweet.userId,
      followerId: currUserId,
    },
  });
  isFollowed = !!isFollowed;
  replyTime = new Date(savedReply.time + 'UTC');
  res.status(200).json({
    status: true,
    message: 'Reply is added successfully',
    data: {
      replyId: savedReply.replyId,
      replyTweetId: savedReply.tweetId,
      replyUserId: savedReply.userId,
      replyText: savedReply.text,
      createdAt: replyTime,
      username: user.username,
      screenName: user.name,
      bio: user.bio,
      imageUrl: user.imageUrl,
      followersCount: user.followersCount,
      followingCount: user.followingsCount,
      isFollowed: isFollowed,
    },
  });
});

exports.deleteReply = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const { replyId } = req.params;
  const currUserId = req.currentUser.userId;
  console.log(tweetId, replyId, currUserId);

  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });

  const replyRepository = AppDataSource.getRepository(Reply);
  let result;
  if (currUserId == tweet.userId) {
    result = await replyRepository
      .createQueryBuilder()
      .delete()
      .from(Reply)
      .where('replyId = :replyId', { replyId: replyId })
      .execute();
  } else {
    result = await replyRepository
      .createQueryBuilder()
      .delete()
      .from(Reply)
      .where('replyId = :replyId', { replyId: replyId })
      .andWhere('userId = :currUserId', { currUserId: currUserId })
      .execute();
  }

  if (!result.affected || !(result.affected > 0))
    return next(new AppError('Error in deleting reply', 400));

  res.status(200).json({
    status: true,
    message: 'Reply is deleted successfully',
  });
});

exports.deleteRetweet = catchAsync(async (req, res, next) => {
  const { retweetId } = req.params;
  const currUserId = req.currentUser.userId;
  console.log(retweetId, currUserId);

  const retweetsRepository = AppDataSource.getRepository(Repost);
  result = await retweetsRepository
    .createQueryBuilder()
    .delete()
    .from(Repost)
    .where('tweetId = :retweetId', { retweetId: retweetId })
    .andWhere('userId = :currUserId', { currUserId: currUserId })
    .execute();

  if (!result.affected || !(result.affected > 0))
    return next(new AppError('Error in deleting retweet', 400));

  res.status(200).json({
    status: true,
    message: 'Retweet is deleted successfully',
  });
});

const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');
const Reply = require('../models/entites/Reply');
const Like = require('../models/relations/Like');
const Repost = require('../models/relations/Repost');

function getCurrentTimestamp() {
  const date = new Date(Date.now());
  const pad = (n) => (n < 10 ? `0${n}` : n);

  const formattedDate = `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;

  return formattedDate;
}

async function checkTweet(tweetId, next) {
  const tweet = await AppDataSource.getRepository(Tweet).findOne({
    where: {
      tweetId: tweetId,
    },
  });
  if (!tweet) return next(new AppError('No tweet exists with this id', 400));
}

exports.addTweet = catchAsync(async (req, res, next) => {
  const { text, attachments } = req.body;
  const { userId } = req.cookies;
  const tweet = new Tweet();
  tweet.userId = userId;
  tweet.text = text;
  tweet.time = getCurrentTimestamp();

  const savedTweet = await AppDataSource.getRepository(Tweet).save(tweet);

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: userId,
    },
  });
  if (attachments.length > 4)
    return next(
      new AppError('tweet can not have more than 4 attachments', 400),
    );
  const media = new Media();
  media.tweetId = savedTweet.tweetId;
  media.url = attachments;
  media.type = 'image';
  const savedMedia = await AppDataSource.getRepository(Media).save(media);

  res.status(200).json({
    status: true,
    data: {
      id: savedTweet.tweetId,
      text: savedTweet.text,
      createdAt: savedTweet.time,
      user: {
        profileImageURL: user.imageUrl,
        screenName: user.name,
        userName: user.username,
      },
      attachmentsURL: attachments,
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
  const currUserId = req.cookies.userId;
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
  const attachments = await AppDataSource.getRepository(Media).findOne({
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

  isLiked = !!isLiked;
  isReposted = !!isReposted;

  res.status(200).json({
    status: true,
    data: {
      id: tweet.tweetId,
      text: tweet.text,
      createdAt: tweet.time,
      user: {
        profileImageURL: user.c,
        screenName: user.name,
        userName: user.username,
      },
      attachmentsURL: attachments,
      isLiked: isLiked,
      isRetweeted: isReposted,
      likesCount: likesCount,
      retweetsCount: repostsCount,
      repliesCount: repliesCount,
    },
  });
});

exports.addLike = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;
  const currUserId = req.cookies.userId;

  checkTweet(tweetId, next);

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
  const currUserId = req.cookies.userId;

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
  const { media } = req.body;

  checkTweet(tweetId, next);
  const attachments = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: tweetId,
    },
  });
  if (attachments.length + media.length > 4)
    return next(
      new AppError('tweet can not have more than 4 attachments', 400),
    );

  const med = new Media();
  med.tweetId = tweetId;
  med.url = media;
  med.type = 'image';
  await AppDataSource.getRepository(Media).save(med);

  res.status(200).json({
    status: true,
    message: 'media is added successfully',
  });
});

exports.getMediaOfTweet = catchAsync(async (req, res, next) => {
  const { tweetId } = req.params;

  checkTweet(tweetId, next);
  const attachments = await AppDataSource.getRepository(Media).find({
    where: {
      tweetId: tweetId,
    },
  });
  if (attachments.length > 0) {
    res.status(200).json({
      status: true,
      data: attachments,
    });
  } else {
    return next(new AppError('there is no attachments for this tweet', 400));
  }
});

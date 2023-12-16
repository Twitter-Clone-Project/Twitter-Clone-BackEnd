const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');

async function getTweetInfo(tweetId, userId) {
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
      userId: userId,
      tweetId: tweetId,
    },
  });

  let isReposted = await AppDataSource.getRepository(Repost).findOne({
    where: {
      userId: userId,
      tweetId: tweetId,
    },
  });

  let isReplied = await AppDataSource.getRepository(Reply).findOne({
    where: {
      userId: userId,
      tweetId: tweetId,
    },
  });

  isLiked = !!isLiked;
  isReposted = !!isReposted;
  isReplied = !!isReplied;

  return {
    likesCount,
    repostsCount,
    repliesCount,
    isLiked,
    isReposted,
    isReplied,
  };
}

exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const currUserUsername = req.currentUser.username;
  const currUserName = req.currentUser.name;

  if (!query) {
    return next(new AppError('No tweet exists with this id', 400));
  }

  const users = await AppDataSource.getRepository(User).find();
  const matchingUsers = users.filter(
    (user) =>
      (user.username.toLowerCase().includes(query.toLowerCase()) &&
        query.toLowerCase() != currUserUsername.toLowerCase()) ||
      (user.name.toLowerCase().includes(query.toLowerCase()) &&
        query.toLowerCase() != currUserName.toLowerCase()),
  );

  const usersPromises = matchingUsers.map(async (user) => {
    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      username: user.username,
      profileImageURL: user.imageUrl,
    };
  });
  let usersRes = await Promise.all(usersPromises);
  if (usersRes.length) {
    res.status(200).json({
      status: true,
      data: usersRes,
    });
  } else {
    res.status(404).json({
      status: true,
      message: 'Nothing found',
    });
  }
});

exports.searchTweets = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError('No tweet exists with this id', 400));
  }

  const tweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'user',
      'user.userId = tweet.userId',
    )
    .innerJoinAndMapOne(
      'tweet.attachmentsUrl',
      Media,
      'mediaTweet',
      'mediaTweet.tweetId = tweet.tweetId',
    )
    .getMany();

  const matchingTweets = tweets.filter((tweet) =>
    tweet.text.toLowerCase().includes(query.toLowerCase()),
  );

  const tweetsPromises = matchingTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, userId);
    return {
      id: tweet.tweetId,
      text: tweet.text,
      createdAt: tweet.time,
      attachmentsURL: tweet.attachmentsUrl,
      user: {
        id: tweet.user.userId,
        email: tweet.user.email,
        name: tweet.user.name,
        username: tweet.user.username,
      },
      isRetweet: false,
      isLiked: tweetInfo.isLiked,
      isRetweeted: tweetInfo.isReposted,
      isReplied: tweetInfo.isReplied,
      likesCount: tweetInfo.likesCount,
      retweetsCount: tweetInfo.repostsCount,
      repliesCount: tweetInfo.repliesCount,
    };
  });
  let tweetsRes = await Promise.all(tweetsPromises);
  if (tweetsRes.length) {
    res.status(200).json({
      status: true,
      data: tweetsRes,
    });
  } else {
    res.status(404).json({
      status: true,
      message: 'Nothing found',
    });
  }
});

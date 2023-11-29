const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');

exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError('No tweet exists with this id', 400));
  }

  const users = await AppDataSource.getRepository(User).find();
  const matchingUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase()),
  );

  const usersPromises = matchingUsers.map(async (user) => {
    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      username: user.username,
    };
  });
  let usersRes = await Promise.all(usersPromises);
  res.status(200).json({
    status: true,
    data: usersRes,
  });
});

exports.searchTweets = catchAsync(async (req, res, next) => {
  console.log('hello');
  const { query } = req.query;
  console.log(query);

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
  console.log(tweets);

  const matchingTweets = tweets.filter((tweet) =>
    tweet.text.toLowerCase().includes(query.toLowerCase()),
  );

  const tweetsPromises = matchingTweets.map(async (tweet) => {
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
    };
  });
  let tweetsRes = await Promise.all(tweetsPromises);
  res.status(200).json({
    status: true,
    data: tweetsRes,
  });
});

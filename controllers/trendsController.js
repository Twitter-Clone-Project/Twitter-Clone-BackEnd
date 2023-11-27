const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');
const Trend = require('../models/entites/Trend');
const Reply = require('../models/entites/Reply');
const Support = require('../models/relations/Support');
const Repost = require('../models/relations/Repost');
const Like = require('../models/relations/Like');

async function getTweetInfo(tweetId, currUserId) {
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
  

exports.getTrends = catchAsync(async (req, res, next) => {
  const trends = await AppDataSource.getRepository(Trend)
    .createQueryBuilder('trend')
    .orderBy('trend.count', 'DESC')
    .select('trend.name')
    .getMany();

  res.status(200).json({
    status: 'true',
    data: trends,
  });
});

exports.getTweetsForTrend = catchAsync(async (req, res, next) => {
  const { trendName } = req.params;
  const currUser = req.currentUser.userId;
  const trend = await AppDataSource.getRepository(Trend).findOne({
    where: { name: trendName },
  });
  const trendId = trend.trendId;
  const tweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Support, 'support', 'support.tweetId = tweet.tweetId')
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
    .where('support.trendId = :trendId', { trendId })
    .getMany();

  const retweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Repost, 'repost', 'repost.tweetId = tweet.tweetId')
    .innerJoin(Support, 'support', 'support.tweetId = support.tweetId')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'userTweet',
      'userTweet.userId = tweet.userId',
    )
    .innerJoinAndMapOne(
      'tweet.retweeter',
      User,
      'userRetweeter',
      'userRetweeter.userId = repost.userId',
    )
    .innerJoinAndMapOne(
      'tweet.attachmentsUrl',
      Media,
      'mediaTweet',
      'mediaTweet.tweetId = tweet.tweetId',
    )
    .where('support.trendId = :trendId', { trendId })
    .getMany();

  const tweetsPromises = tweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUser);
    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweet.time,
      attachmentsUrl: tweet.attachmentsUrl.url,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        profileImageURL: tweet.user.imageUrl,
      },
      isLiked: tweetInfo.isLiked,
      isRetweeted: tweetInfo.isReposted,
      isReplied: tweetInfo.isReplied,
      likesCount: tweetInfo.likesCount,
      retweetsCount: tweetInfo.repostsCount,
      repliesCount: tweetInfo.repliesCount,
    };
  });
  const tweetsRes = await Promise.all(tweetsPromises);

  const retweetsPromises = retweets.map(async (tweet) => {
    const retweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    return {
      id: tweet.tweetId,
      isRetweet: true,
      text: tweet.text,
      createdAt: tweet.time,
      attachmentsUrl: tweet.attachmentsUrl.url,
      retweetedUser: {
        userId: tweet.retweeter.userId,
        username: tweet.retweeter.username,
        screenName: tweet.retweeter.name,
        profileImageURL: tweet.retweeter.imageUrl,
      },
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        profileImageURL: tweet.user.imageUrl,
      },
      isLiked: retweetInfo.isLiked,
      isRetweeted: retweetInfo.isReposted,
      isReplied: retweetInfo.isReplied,
      likesCount: retweetInfo.likesCount,
      retweetsCount: retweetInfo.repostsCount,
      repliesCount: retweetInfo.repliesCount,
    };
  });
  const retweetsRes = await Promise.all(retweetsPromises);

  totalRes = tweetsRes.concat(retweetsRes);
  totalRes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: 'true',
    data: totalRes,
  });
});

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
const Follow = require('../models/relations/Follow');

const numTweetsPerPage = 10;

/**
 * Retrieves information about the relationship between a user and another user.
 *
 * @param {string} userId - The ID of the user to retrieve information about.
 * @param {string} currUserId - The ID of the current user.
 * @returns {Promise<Object>} A Promise representing the asynchronous operation, resolving to an object with 'isFollowed' and 'isFollowing' properties.
 */
async function getUserInfo(userId, currUserId) {
  let isFollowed = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: userId,
      followerId: currUserId,
    },
  });

  let isFollowing = await AppDataSource.getRepository(Follow).findOne({
    where: {
      userId: currUserId,
      followerId: userId,
    },
  });

  isFollowed = !!isFollowed;
  isFollowing = !!isFollowing;

  return {
    isFollowed,
    isFollowing,
  };
}

/**
 * Retrieves information about a tweet, including the counts of likes, reposts, and replies,
 * and whether the current user has liked, reposted, or replied to the tweet.
 *
 * @param {string} tweetId - The ID of the tweet to retrieve information about.
 * @param {string} currUserId - The ID of the current user.
 * @returns {Promise<Object>} A Promise representing the asynchronous operation, resolving to an object with 'likesCount', 'repostsCount', 'repliesCount', 'isLiked', 'isReposted', and 'isReplied' properties.
 */
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

let totalRes = [];

/**
 * Retrieves all tweets associated with a specific trend, including both original tweets and retweets.
 *
 * @param {string} trendId - The ID of the trend to retrieve tweets for.
 * @param {string} currUserId - The ID of the current user.
 * @returns {void>} A Promise representing the asynchronous operation, resolving to an array of tweet objects.
 */
async function getAllTweets(trendId, currUserId) {
  const tweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Support, 'support', 'support.tweetId = tweet.tweetId')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'user',
      'user.userId = tweet.userId',
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
    .where('support.trendId = :trendId', { trendId })
    .getMany();

  const tweetsPromises = tweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweet.time,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        profileImageURL: tweet.user.imageUrl,
        bio: tweet.user.bio,
        followersCount: tweet.user.followersCount,
        followingCount: tweet.user.followingsCount,
        isFollowed: tweeterInfo.isFollowed,
        isFollowing: tweeterInfo.isFollowing,
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
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const retweeterInfo = await getUserInfo(tweet.retweeter.userId, currUserId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    return {
      id: tweet.tweetId,
      isRetweet: true,
      text: tweet.text,
      createdAt: tweet.time,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {
        userId: tweet.retweeter.userId,
        username: tweet.retweeter.username,
        screenName: tweet.retweeter.name,
        profileImageURL: tweet.retweeter.imageUrl,
        bio: tweet.retweeter.bio,
        followersCount: tweet.retweeter.followersCount,
        followingCount: tweet.retweeter.followingsCount,
        isFollowed: retweeterInfo.isFollowed,
        isFollowing: retweeterInfo.isFollowing,
      },
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        profileImageURL: tweet.user.imageUrl,
        bio: tweet.user.bio,
        followersCount: tweet.user.followersCount,
        followingCount: tweet.user.followingsCount,
        isFollowed: tweeterInfo.isFollowed,
        isFollowing: tweeterInfo.isFollowing,
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
}

/**
 * Retrieves the trending topics.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next function.
 * @returns {Object} A Promise representing the asynchronous operation.
 *
 * @throws {AppError} If there's an issue with the database.
 */
exports.getTrends = catchAsync(async (req, res, next) => {
  const trends = await AppDataSource.getRepository(Trend)
    .createQueryBuilder('trend')
    .orderBy('trend.count', 'DESC')
    .select(['trend.trendId', 'trend.name', 'trend.count'])
    .getMany();

  res.status(200).json({
    status: 'true',
    data: trends,
  });
});

/**
 * Retrieves tweets associated with a specific trend and paginates the results.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next function.
 * @returns {Object} A Promise representing the asynchronous operation.
 *
 * @throws {AppError} If there's an issue with the database.
 */
exports.getTweetsForTrend = catchAsync(async (req, res, next) => {
  const { trendName } = req.params;
  const { pageNum } = req.params;
  const currUser = req.currentUser.userId;
  const trend = await AppDataSource.getRepository(Trend).findOne({
    where: { name: trendName },
  });
  if (trend) {
    const trendId = trend.trendId;
    if (parseInt(pageNum, 10) === 1) {
      await getAllTweets(trendId, currUser);
    }
    const resTweets = totalRes.slice(
      (pageNum - 1) * numTweetsPerPage,
      pageNum * numTweetsPerPage,
    );
    res.status(200).json({
      status: true,
      data: resTweets,
      total: totalRes.length,
    });
  } else {
    res.status(200).json({
      status: true,
      data: [],
      total: 0,
    });
  }
});

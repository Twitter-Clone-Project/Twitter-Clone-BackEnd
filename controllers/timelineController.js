const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');
const Reply = require('../models/entites/Reply');
const Like = require('../models/relations/Like');
const Repost = require('../models/relations/Repost');
const Follow = require('../models/relations/Follow');
const Mention = require('../models/relations/Mention');

let tweetsTotalRes = [];
let userTweetsTotalRes = [];
let userMentionsTotalRes = [];
let userLikesTotalRes = [];
const numTweetsPerPage = 10;

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

async function getFirstTweets(userId) {
  const tweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Follow, 'follow', 'follow.userId = tweet.userId')
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
    .where('follow.followerId = :userId', { userId })
    .getMany();

  const retweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Repost, 'repost', 'repost.tweetId = tweet.tweetId')
    .innerJoin(Follow, 'follow', 'follow.userId = repost.userId')
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
    .where('follow.followerId = :userId', { userId })
    .getMany();

  const tweetsPromises = tweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, userId);
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
    const retweetInfo = await getTweetInfo(tweet.tweetId, userId);
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

  tweetsTotalRes = tweetsRes.concat(retweetsRes);
  tweetsTotalRes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

exports.getTweets = catchAsync(async (req, res, next) => {
  const { pageNum } = req.params;
  const userId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstTweets(userId);
  }

  const resTweets = tweetsTotalRes.slice(
    (pageNum - 1) * numTweetsPerPage,
    pageNum * numTweetsPerPage,
  );
  res.status(200).json({
    status: true,
    data: resTweets,
    total: tweetsTotalRes.length,
  });
});

async function getFirstUserTweets(userId, currUserId) {
  const userTweets = await AppDataSource.getRepository(Tweet)
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
    .where('tweet.userId = :userId', { userId })
    .getMany();

  const userRetweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Repost, 'repost', 'repost.tweetId = tweet.tweetId')
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
    .where('repost.userId = :userId', { userId })
    .getMany();

  const tweetsPromises = userTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
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

  const retweetsPromises = userRetweets.map(async (tweet) => {
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

  userTweetsTotalRes = tweetsRes.concat(retweetsRes);
  userTweetsTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserTweets = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserTweets(userId, currUserId);
  }

  const resTweets = userTweetsTotalRes.slice(
    (pageNum - 1) * numTweetsPerPage,
    pageNum * numTweetsPerPage,
  );
  res.status(200).json({
    status: true,
    data: resTweets,
    total: userTweetsTotalRes.length,
  });
});

async function getFirstUserMentions(userId, currUserId) {
  const userMentionsTweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Mention, 'mention', 'mention.tweetId = tweet.tweetId')
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
    .where('mention.mentionedId = :userId', { userId })
    .getMany();

  const tweetsPromises = userMentionsTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
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

  userMentionsTotalRes = tweetsRes;
  userMentionsTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserMentions = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserMentions(userId, currUserId);
  }

  const resTweets = userMentionsTotalRes.slice(
    (pageNum - 1) * numTweetsPerPage,
    pageNum * numTweetsPerPage,
  );
  res.status(200).json({
    status: true,
    data: resTweets,
    total: userMentionsTotalRes.length,
  });
});

async function getFirstUserLikes(userId, currUserId) {
  const userLikesTweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Like, 'like', 'like.tweetId = tweet.tweetId')
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
    .where('like.userId = :userId', { userId })
    .getMany();

  const tweetsPromises = userLikesTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
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

  userLikesTotalRes = tweetsRes;
  userLikesTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserLikes = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserLikes(userId, currUserId);
  }

  const resTweets = userLikesTotalRes.slice(
    (pageNum - 1) * numTweetsPerPage,
    pageNum * numTweetsPerPage,
  );
  res.status(200).json({
    status: true,
    data: resTweets,
    total: userLikesTotalRes.length,
  });
});

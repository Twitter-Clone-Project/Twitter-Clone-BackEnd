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
const Block = require('../models/relations/Block');
const Mute = require('../models/relations/Mute');

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
    .where('follow.followerId = :userId', { userId })
    .getMany();

  const mutedUsers = await AppDataSource.getRepository(Mute).find({
    where: {
      userId: userId,
    },
  });
  const mutedUsersIds = mutedUsers.map((user) => user.mutedId);
  const blockedUsers = await AppDataSource.getRepository(Block).find({
    where: {
      userId: userId,
    },
  });
  const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
  const blockedByUsers = await AppDataSource.getRepository(Block).find({
    where: {
      blockedId: userId,
    },
  });
  const blockedByUsersIds = blockedByUsers.map((user) => user.userId);
  const tweetsPromises = tweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, userId);
    const tweeterInfo = await getUserInfo(tweet.userId, userId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');

    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        imageUrl: tweet.user.imageUrl,
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
    const retweetInfo = await getTweetInfo(tweet.tweetId, userId);
    const tweeterInfo = await getUserInfo(tweet.userId, userId);
    const retweeterInfo = await getUserInfo(tweet.retweeter.userId, userId);
    const retweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const retweetMediaUrls = retweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');
    return {
      id: tweet.tweetId,
      isRetweet: true,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: retweetMediaUrls,
      retweetedUser: {
        userId: tweet.retweeter.userId,
        username: tweet.retweeter.username,
        screenName: tweet.retweeter.name,
        imageUrl: tweet.retweeter.imageUrl,
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
        imageUrl: tweet.user.imageUrl,
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

  const tweetsTotalResTemp = tweetsRes.concat(retweetsRes);
  tweetsTotalRes = tweetsTotalResTemp.filter((tweet) => {
    const isMutedUser =
      mutedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && mutedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedUser =
      blockedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && blockedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedByUser =
      blockedByUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet &&
        blockedByUsersIds.includes(tweet.retweetedUser.userId));

    return !isMutedUser && !isBlockedUser && !isBlockedByUser;
  });
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

async function getFirstUserTweets(username, currUserId) {
  const { userId } = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  const userTweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'user',
      'user.userId = tweet.userId',
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
    .where('repost.userId = :userId', { userId })
    .getMany();

  const blockedUsers = await AppDataSource.getRepository(Block).find({
    where: {
      userId: userId,
    },
  });
  const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
  const blockedByUsers = await AppDataSource.getRepository(Block).find({
    where: {
      blockedId: userId,
    },
  });
  const blockedByUsersIds = blockedByUsers.map((user) => user.userId);
  const tweetsPromises = userTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');
    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        imageUrl: tweet.user.imageUrl,
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

  const retweetsPromises = userRetweets.map(async (tweet) => {
    const retweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const retweeterInfo = await getUserInfo(tweet.retweeter.userId, currUserId);
    const retweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const retweetMediaUrls = retweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');
    return {
      id: tweet.tweetId,
      isRetweet: true,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: retweetMediaUrls,
      retweetedUser: {
        userId: tweet.retweeter.userId,
        username: tweet.retweeter.username,
        screenName: tweet.retweeter.name,
        imageUrl: tweet.retweeter.imageUrl,
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
        imageUrl: tweet.user.imageUrl,
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

  const userTweetsTotalResTemp = tweetsRes.concat(retweetsRes);
  userTweetsTotalRes = userTweetsTotalResTemp.filter((tweet) => {
    const isBlockedUser =
      blockedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && blockedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedByUser =
      blockedByUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet &&
        blockedByUsersIds.includes(tweet.retweetedUser.userId));

    const isRetweetedUser =
      tweet.isRetweet &&
      tweet.retweetedUser.userId == userId &&
      tweet.user.userId != userId;

    return !isBlockedUser && !isBlockedByUser && !isRetweetedUser;
  });
  userTweetsTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserTweets = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserTweets(username, currUserId);
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

async function getFirstUserMentions(username, currUserId) {
  const { userId } = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  const userMentionsTweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Mention, 'mention', 'mention.tweetId = tweet.tweetId')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'user',
      'user.userId = tweet.userId',
    )
    .where('mention.mentionedId = :userId', { userId })
    .getMany();
  const mutedUsers = await AppDataSource.getRepository(Mute).find({
    where: {
      userId: userId,
    },
  });
  const mutedUsersIds = mutedUsers.map((user) => user.mutedId);
  const blockedUsers = await AppDataSource.getRepository(Block).find({
    where: {
      userId: userId,
    },
  });
  const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
  const blockedByUsers = await AppDataSource.getRepository(Block).find({
    where: {
      blockedId: userId,
    },
  });
  const blockedByUsersIds = blockedByUsers.map((user) => user.userId);
  const tweetsPromises = userMentionsTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');
    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        imageUrl: tweet.user.imageUrl,
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

  const userMentionsTotalResTemp = tweetsRes;
  userMentionsTotalRes = userMentionsTotalResTemp.filter((tweet) => {
    const isMutedUser =
      mutedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && mutedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedUser =
      blockedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && blockedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedByUser =
      blockedByUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet &&
        blockedByUsersIds.includes(tweet.retweetedUser.userId));

    return !isMutedUser && !isBlockedUser && !isBlockedByUser;
  });
  userMentionsTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserMentions = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserMentions(username, currUserId);
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

async function getFirstUserLikes(username, currUserId) {
  const { userId } = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  const userLikesTweets = await AppDataSource.getRepository(Tweet)
    .createQueryBuilder('tweet')
    .innerJoin(Like, 'like', 'like.tweetId = tweet.tweetId')
    .innerJoinAndMapOne(
      'tweet.user',
      User,
      'user',
      'user.userId = tweet.userId',
    )
    .where('like.userId = :userId', { userId })
    .getMany();

  const mutedUsers = await AppDataSource.getRepository(Mute).find({
    where: {
      userId: userId,
    },
  });
  const mutedUsersIds = mutedUsers.map((user) => user.mutedId);
  const blockedUsers = await AppDataSource.getRepository(Block).find({
    where: {
      userId: userId,
    },
  });
  const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
  const blockedByUsers = await AppDataSource.getRepository(Block).find({
    where: {
      blockedId: userId,
    },
  });
  const blockedByUsersIds = blockedByUsers.map((user) => user.userId);
  const tweetsPromises = userLikesTweets.map(async (tweet) => {
    const tweetInfo = await getTweetInfo(tweet.tweetId, currUserId);
    const tweeterInfo = await getUserInfo(tweet.userId, currUserId);
    const tweetMedia = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweet.tweetId,
      },
    });
    const tweetMediaUrls = tweetMedia.map((media) => media.url);
    tweetTime = new Date(tweet.time + 'UTC');
    return {
      id: tweet.tweetId,
      isRetweet: false,
      text: tweet.text,
      createdAt: tweetTime,
      attachmentsUrl: tweetMediaUrls,
      retweetedUser: {},
      user: {
        userId: tweet.user.userId,
        username: tweet.user.username,
        screenName: tweet.user.name,
        imageUrl: tweet.user.imageUrl,
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

  const userLikesTotalResTemp = tweetsRes;
  userLikesTotalRes = userLikesTotalResTemp.filter((tweet) => {
    const isMutedUser =
      mutedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && mutedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedUser =
      blockedUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet && blockedUsersIds.includes(tweet.retweetedUser.userId));

    const isBlockedByUser =
      blockedByUsersIds.includes(tweet.user.userId) ||
      (tweet.isRetweet &&
        blockedByUsersIds.includes(tweet.retweetedUser.userId));

    return !isMutedUser && !isBlockedUser && !isBlockedByUser;
  });
  userLikesTotalRes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

exports.getUserLikes = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const { pageNum } = req.params;
  const currUserId = req.currentUser.userId;

  if (parseInt(pageNum, 10) === 1) {
    await getFirstUserLikes(username, currUserId);
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

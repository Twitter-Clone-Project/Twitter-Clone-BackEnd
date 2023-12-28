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
const Block = require('../models/relations/Block');

let usersRes = [];
let tweetsRes = [];
const numResultsPerPage = 10;

/**
 * Retrieves information about a tweet, including like, repost, and reply counts,
 * as well as the user's interaction status with the tweet (liked, reposted, replied).
 *
 * @function
 * @async
 * @param {string} tweetId - The ID of the target tweet.
 * @param {string} userId - The ID of the current user.
 * @returns {Object} Object containing counts and flags related to the tweet.
 */
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

/**
 * Retrieves information about a user's relationship status with the current user.
 *
 * @function
 * @async
 * @param {string} userId - The ID of the target user.
 * @param {string} currUserId - The ID of the current user.
 * @returns {Object} Object containing boolean flags indicating whether the current user is followed and following the target user.
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
 * Checks if a search query is valid.
 *
 * @function
 * @param {string} query - The search query to be validated.
 * @returns {boolean} Returns true if the query is valid, otherwise false.
 */
function isValidSearchQuery(query) {
  console.log('query ', query, ' 1');
  if (typeof query !== 'string' || query.trim() === '') {
    return false;
  }

  if (
    query[0] == ',' ||
    query[0] == ' ' ||
    (query[0] == '.' && query.length == 1)
  ) {
    return false;
  }

  return true;
}

/**
 * Searches for users based on a query and current user information.
 *
 * @function
 * @async
 * @param {string} query - The search query for users.
 * @param {Object} currUser - The current user object.
 * @returns {void}
 */
async function searchFirstUsers(query, currUser) {
  let usersList = [];
  if (isValidSearchQuery(query)) {
    const users = await AppDataSource.getRepository(User).find();
    const blockedUsers = await AppDataSource.getRepository(Block).find({
      where: {
        userId: currUser.userId,
      },
    });
    const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
    const blockedByUsers = await AppDataSource.getRepository(Block).find({
      where: {
        blockedId: currUser.userId,
      },
    });
    const blockedByUsersIds = blockedByUsers.map((user) => user.userId);
    const matchingUsers = users.filter(
      (user) =>
        (user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.name.toLowerCase().includes(query.toLowerCase())) &&
        user.userId != currUser.userId &&
        !blockedUsersIds.includes(user.userId) &&
        !blockedByUsersIds.includes(user.userId),
    );

    if (matchingUsers.length > 0) {
      const usersPromises = matchingUsers.map(async (user) => {
        const userInfo = await getUserInfo(user.userId, currUser.userId);
        if (user.userId !== currUser.userId) {
          return {
            id: user.userId,
            email: user.email,
            screenName: user.name,
            username: user.username,
            profileImageURL: user.imageUrl,
            imageURL: user.imageUrl,
            bio: user.bio,
            followersCount: user.followersCount,
            followingCount: user.followingsCount,
            isFollowed: userInfo.isFollowed,
            isFollowing: userInfo.isFollowing,
          };
        }
      });

      usersList = await Promise.all(usersPromises);
    }
  }
  usersRes = usersList;
}

/**
 * Controller for searching users based on a query.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {AppError} If the query parameter is missing.
 * @returns {Object} JSON response with the search results and total count.
 */
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  if (!query) {
    return next(new AppError('No tweet exists with this id', 400));
  }
  const currUser = req.currentUser;
  const { pageNum } = req.params;
  if (parseInt(pageNum, 10) === 1) {
    await searchFirstUsers(query, currUser);
  }

  const users = usersRes.slice(
    (pageNum - 1) * numResultsPerPage,
    pageNum * numResultsPerPage,
  );
  res.status(200).json({
    status: true,
    data: users,
    total: usersRes.length,
  });
});

/**
 * Searches for tweets based on a query and current user information.
 *
 * @function
 * @async
 * @param {string} query - The search query for tweets.
 * @param {string} currUserId - The ID of the current user.
 * @returns {void}
 */
async function searchFirstTweets(query, currUserId) {
  let tweetsList = [];
  if (isValidSearchQuery(query)) {
    const tweets = await AppDataSource.getRepository(Tweet)
      .createQueryBuilder('tweet')
      .innerJoinAndMapOne(
        'tweet.user',
        User,
        'user',
        'user.userId = tweet.userId',
      )
      .getMany();

    const blockedUsers = await AppDataSource.getRepository(Block).find({
      where: {
        userId: currUserId,
      },
    });
    const blockedUsersIds = blockedUsers.map((user) => user.blockedId);
    const blockedByUsers = await AppDataSource.getRepository(Block).find({
      where: {
        blockedId: currUserId,
      },
    });
    const blockedByUsersIds = blockedByUsers.map((user) => user.userId);

    const matchingTweets = tweets.filter(
      (tweet) =>
        tweet.text.toLowerCase().includes(query.toLowerCase()) &&
        !blockedUsersIds.includes(tweet.user.userId) &&
        !blockedByUsersIds.includes(tweet.user.userId),
    );

    if (matchingTweets.length > 0) {
      const tweetsPromises = matchingTweets.map(async (tweet) => {
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
          text: tweet.text,
          createdAt: tweet.time,
          user: {
            userId: tweet.user.userId,
            profileImageURL: tweet.user.imageUrl,
            imageURL: tweet.user.imageUrl,
            screenName: tweet.user.name,
            username: tweet.user.username,
            bio: tweet.user.bio,
            followersCount: tweet.user.followersCount,
            followingCount: tweet.user.followingsCount,
            isFollowed: tweeterInfo.isFollowed,
            isFollowing: tweeterInfo.isFollowing,
          },
          attachmentsURL: tweetMediaUrls,
          isRetweet: false,
          isLiked: tweetInfo.isLiked,
          isRetweeted: tweetInfo.isReposted,
          isReplied: tweetInfo.isReplied,
          likesCount: tweetInfo.likesCount,
          retweetsCount: tweetInfo.repostsCount,
          repliesCount: tweetInfo.repliesCount,
          retweetedUser: {},
        };
      });
      tweetsList = await Promise.all(tweetsPromises);
    }
  }

  tweetsRes = tweetsList;
}

/**
 * Controller for searching tweets based on a query.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {AppError} If the query parameter is missing.
 * @returns {Object} JSON response with the search results and total count.
 */
exports.searchTweets = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  if (!query) {
    return next(new AppError('No tweet exists with this id', 400));
  }
  const currUserId = req.currentUser.userId;
  const { pageNum } = req.params;
  if (parseInt(pageNum, 10) === 1) {
    await searchFirstTweets(query, currUserId);
  }

  const tweets = tweetsRes.slice(
    (pageNum - 1) * numResultsPerPage,
    pageNum * numResultsPerPage,
  );
  res.status(200).json({
    status: true,
    data: tweets,
    total: tweetsRes.length,
  });
});

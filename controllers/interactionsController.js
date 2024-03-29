const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const socketService = require('../services/WebSocket');

const Follow = require('../models/relations/Follow');
const Mute = require('../models/relations/Mute');
const Block = require('../models/relations/Block');
const User = require('../models/entites/User');

/**
 * Filters the specified properties from each object in the array.
 *
 * @function
 * @param {Object[]} result - The array of objects to filter.
 * @returns {Object[]} - The filtered array of objects.
 */
const filterObj = (result) => {
  const newArray = result.map(
    ({
      userId,
      username,
      name,
      bio,
      imageUrl,
      isFollowed,
      isFollowing,
      followersCount,
      followingsCount,
    }) => ({
      userId,
      username,
      name,
      bio,
      imageUrl,
      isFollowed,
      isFollowing,
      followersCount,
      followingsCount,
    }),
  );
  return newArray;
};

/**
 * Marks the followed users in array1 based on the userId presence in array2.
 *
 * @function
 * @param {Object[]} array1 - The array of users to mark.
 * @param {Object[]} array2 - The array of followed users.
 * @returns {Object[]} - The array of users with the 'isFollowed' property marked.
 */
function markFollowedUsers(array1, array2) {
  return array1.map((user1) => {
    const isFollowed = array2.some((user2) => user2.userId === user1.userId);
    return { ...user1, isFollowed };
  });
}
/**
 * Marks the following users in array1 based on the followerId presence in array2.
 *
 * @function
 * @param {Object[]} array1 - The array of users to mark.
 * @param {Object[]} array2 - The array of following users.
 * @returns {Object[]} - The array of users with the 'isFollowing' property marked.
 */
function markFollowingUsers(array1, array2) {
  return array1.map((user1) => {
    const isFollowing = array2.some(
      (user2) => user2.followerId === user1.userId,
    );
    return { ...user1, isFollowing };
  });
}

/**
 * Retrieves the list of followers for a given user.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.getListOfFollowers = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    const name = user.name;
    const followersQuery = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('follow.userId = :userId', { userId: user.userId })
      .innerJoin(Follow, 'follow', 'follow.followerId = user.userId')
      .select([
        'user.userId',
        'user.username',
        'user.name',
        'user.bio',
        'user.imageUrl',
        'user.followersCount',
        'user.followingsCount',
      ])
      .groupBy('user.userId')
      .getMany();
    const isFollowedQuery = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('follow.followerId = :userId', { userId: req.currentUser.userId })
      .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
      .select(['user.userId'])
      .getMany();
    const isFollowingQuery = await AppDataSource.getRepository(Follow)
      .createQueryBuilder('follow')
      .where('follow.userId = :userId', { userId: req.currentUser.userId })
      .select(['follow.followerId'])
      .getMany();

    let followersList = markFollowedUsers(followersQuery, isFollowedQuery);
    followersList = markFollowingUsers(followersList, isFollowingQuery);
    followersList = filterObj(followersList);
    res.status(200).json({
      status: true,
      data: {
        users: followersList,
        name: name,
      },
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Retrieves the list of users that the specified user is following.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.getListOfFollowings = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    const name = user.name;
    const followingQuery = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('follow.followerId = :userId', { userId: user.userId })
      .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
      .select([
        'user.userId',
        'user.username',
        'user.name',
        'user.bio',
        'user.imageUrl',
        'user.followersCount',
        'user.followingsCount',
      ])
      .groupBy('user.userId')
      .getMany();
    const isFollowedQuery = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('follow.followerId = :userId', { userId: req.currentUser.userId })
      .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
      .select(['user.userId'])
      .getMany();
    const isFollowingQuery = await AppDataSource.getRepository(Follow)
      .createQueryBuilder('follow')
      .where('follow.userId = :userId', { userId: req.currentUser.userId })
      .select(['follow.followerId'])
      .getMany();

    let followingList = markFollowedUsers(followingQuery, isFollowedQuery);
    followingList = markFollowingUsers(followingList, isFollowingQuery);

    followingList = filterObj(followingList);

    res.status(200).json({
      status: true,
      data: {
        users: followingList,
        name: name,
      },
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Follows the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.follow = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isFollowed = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: user.userId,
        followerId: currUserId,
      },
    });
    isFollowed = !!isFollowed;
    if (isFollowed) {
      res.status(400).json({
        status: false,
        message: 'Cant follow this user twice ',
      });
      return;
    }
    let isBlocked = await AppDataSource.getRepository(Block).findOne({
      where: {
        userId: currUserId,
        blockedId: user.userId,
      },
    });
    isBlocked = !!isBlocked;
    if (isBlocked) {
      res.status(400).json({
        status: false,
        message: 'Cant follow this user',
      });
      return;
    }
    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant follow yourself ',
      });
      return;
    }
    user.followersCount = BigInt(user.followersCount) + BigInt(1);

    const currUser = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: currUserId,
      },
    });
    currUser.followingsCount = BigInt(currUser.followingsCount) + BigInt(1);

    const follow = new Follow();
    follow.userId = user.userId;
    follow.followerId = currUserId;

    try {
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(User, user);
        await transactionalEntityManager.save(User, currUser);
        await transactionalEntityManager.save(Follow, follow);
      });

      console.log('All operations succeeded. Changes committed.');
    } catch (error) {
      console.error('Transaction failed. Changes rolled back:', error);
    }

    await socketService.emitNotification(currUserId, user.userId, 'Follow');
    res.status(200).json({
      status: true,
      message: 'follow is added successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Unfollows the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.unFollow = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isFollowed = await AppDataSource.getRepository(Follow).findOne({
      where: {
        userId: user.userId,
        followerId: currUserId,
      },
    });
    isFollowed = !!isFollowed;
    if (!isFollowed) {
      res.status(400).json({
        status: false,
        message: 'Cant unfollow this user you dont follow him ',
      });
      return;
    }
    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant unfollow yourself ',
      });
      return;
    }

    if (BigInt(user.followersCount) - BigInt(1) >= 0) {
      user.followersCount = BigInt(user.followersCount) - BigInt(1);
    } else {
      res.status(400).json({
        status: false,
        message:
          'cant unfollow this user , followings count cant be negative  ',
      });
      return;
    }

    const currUser = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: currUserId,
      },
    });
    if (BigInt(currUser.followingsCount) - BigInt(1) >= 0) {
      currUser.followingsCount = BigInt(currUser.followingsCount) - BigInt(1);
    } else {
      res.status(400).json({
        status: false,
        message:
          'cant unfollow this user , followings count cant be negative  ',
      });
      return;
    }

    try {
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(User, user);
        await transactionalEntityManager.save(User, currUser);
        const followRepository = AppDataSource.getRepository(Follow);
        const result = await followRepository
          .createQueryBuilder()
          .delete()
          .from(Follow)
          .where('followerId = :followerId AND userId = :userId', {
            followerId: currUserId,
            userId: user.userId,
          })
          .execute();

        if (!result.affected || !(result.affected > 0))
          return next(new AppError('error in unfollowing', 400));
      });

      console.log('All operations succeeded. Changes committed.');
    } catch (error) {
      console.error('Transaction failed. Changes rolled back:', error);
    }

    await socketService.emitNotification(currUserId, user.userId, 'unFollow');
    res.status(200).json({
      status: true,
      message: 'unfollow is done successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Mutes the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.mute = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isBlocked = await AppDataSource.getRepository(Block).findOne({
      where: {
        userId: currUserId,
        blockedId: user.userId,
      },
    });
    isBlocked = !!isBlocked;
    if (isBlocked) {
      res.status(400).json({
        status: false,
        message: 'Cant mute this user ',
      });
      return;
    }
    let isMuted = await AppDataSource.getRepository(Mute).findOne({
      where: {
        userId: currUserId,
        mutedId: user.userId,
      },
    });
    isMuted = !!isMuted;
    if (isMuted) {
      res.status(400).json({
        status: false,
        message: 'Cant mute this user twice ',
      });
      return;
    }

    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant mute yourself ',
      });
      return;
    }
    const mute = new Mute();
    mute.userId = currUserId;
    mute.mutedId = user.userId;
    const savedMute = await AppDataSource.getRepository(Mute).save(mute);

    res.status(200).json({
      status: true,
      message: 'mute is added successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Unmutes the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.unmute = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isMuted = await AppDataSource.getRepository(Mute).findOne({
      where: {
        userId: currUserId,
        mutedId: user.userId,
      },
    });
    isMuted = !!isMuted;
    if (!isMuted) {
      res.status(400).json({
        status: false,
        message: 'Cant unmute this user twice ',
      });
      return;
    }
    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant unmute yourself ',
      });
      return;
    }
    const result = await AppDataSource.getRepository(Mute)
      .createQueryBuilder()
      .delete()
      .from(Mute)
      .where('mutedId = :mutedId AND userId = :userId', {
        mutedId: user.userId,
        userId: currUserId,
      })
      .execute();

    if (!result.affected || !(result.affected > 0))
      return next(new AppError('error in unmuting', 400));

    res.status(200).json({
      status: true,
      message: 'unmute is done successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Retrieves the list of users that the current user has muted.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.getListOfMutes = catchAsync(async (req, res, next) => {
  const currUserId = req.currentUser.userId;

  const mutesQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('mute.userId = :userId', { userId: currUserId })
    .innerJoin(Mute, 'mute', 'mute.mutedId = user.userId')
    .select([
      'user.userId',
      'user.username',
      'user.name',
      'user.bio',
      'user.imageUrl',
      'user.followersCount',
      'user.followingsCount',
    ])
    .groupBy('user.userId')
    .getMany();

  const isFollowedQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.followerId = :userId', { userId: currUserId })
    .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
    .select(['user.userId'])
    .getMany();
  const isFollowingQuery = await AppDataSource.getRepository(Follow)
    .createQueryBuilder('follow')
    .where('follow.userId = :userId', { userId: currUserId })
    .select(['follow.followerId'])
    .getMany();

  let mutesList = markFollowedUsers(mutesQuery, isFollowedQuery);
  mutesList = markFollowingUsers(mutesList, isFollowingQuery);
  mutesList = filterObj(mutesList);
  res.status(200).json({
    status: true,
    data: {
      users: mutesList,
    },
  });
});

/**
 * Blocks the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.block = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isBlocked = await AppDataSource.getRepository(Block).findOne({
      where: {
        userId: currUserId,
        blockedId: user.userId,
      },
    });
    isBlocked = !!isBlocked;
    if (isBlocked) {
      res.status(400).json({
        status: false,
        message: 'Cant block this user twice ',
      });
      return;
    }
    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant block yourself ',
      });
      return;
    }

    const currUser = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: currUserId,
      },
    });

    const block = new Block();
    block.userId = currUserId;
    block.blockedId = user.userId;

    try {
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        const userRepository = transactionalEntityManager.getRepository(User);
        const followRepository =
          transactionalEntityManager.getRepository(Follow);
        const blockRepository = transactionalEntityManager.getRepository(Block);

        const result = await followRepository
          .createQueryBuilder()
          .delete()
          .from(Follow)
          .where('followerId = :followerId AND userId = :userId', {
            followerId: currUserId,
            userId: user.userId,
          })
          .execute();

        if (result.affected && result.affected > 0) {
          // check if current user follow the blocked user or not
          if (BigInt(currUser.followingsCount) - BigInt(1) >= 0) {
            currUser.followingsCount =
              BigInt(currUser.followingsCount) - BigInt(1);
          } else {
            res.status(400).json({
              status: false,
              message:
                'cant block this user , followings count cant be negative  ',
            });
            return;
          }

          if (BigInt(user.followersCount) - BigInt(1) >= 0) {
            user.followersCount = BigInt(user.followersCount) - BigInt(1);
          } else {
            res.status(400).json({
              status: false,
              message:
                'cant block this user , followers count cant be negative  ',
            });
            return;
          }
        }

        const result2 = await followRepository
          .createQueryBuilder()
          .delete()
          .from(Follow)
          .where('followerId = :userId AND userId = :followerId', {
            followerId: currUserId,
            userId: user.userId,
          })
          .execute();

        if (result2.affected && result2.affected > 0) {
          // check if cuurent user follow the blocked user or not
          if (BigInt(currUser.followersCount) - BigInt(1) >= 0) {
            currUser.followersCount =
              BigInt(currUser.followersCount) - BigInt(1);
          } else {
            res.status(400).json({
              status: false,
              message:
                'cant block this user , followers count cant be negative  ',
            });
            return;
          }

          if (BigInt(user.followingsCount) - BigInt(1) >= 0) {
            user.followingsCount = BigInt(user.followingsCount) - BigInt(1);
          } else {
            res.status(400).json({
              status: false,
              message:
                'cant block this user , followings count cant be negative  ',
            });
            return;
          }
        }

        await userRepository.save(user);
        await userRepository.save(currUser);

        const savedBlock = await blockRepository.save(block);
      });

      console.log('All operations succeeded. Changes committed.');
    } catch (error) {
      console.error('Transaction failed. Changes rolled back:', error);
    }
    res.status(200).json({
      status: true,
      message: 'block is added successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Unblocks the user specified by the username.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.unblock = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (user) {
    let isBlocked = await AppDataSource.getRepository(Block).findOne({
      where: {
        userId: currUserId,
        blockedId: user.userId,
      },
    });
    isBlocked = !!isBlocked;
    if (!isBlocked) {
      res.status(400).json({
        status: false,
        message: 'Cant unblock this user twice ',
      });
      return;
    }
    if (currUserId == user.userId) {
      res.status(400).json({
        status: false,
        message: 'Cant unblock yourself ',
      });
      return;
    }
    const result = await AppDataSource.getRepository(Block)
      .createQueryBuilder()
      .delete()
      .from(Block)
      .where('blockedId = :blockedId AND userId = :userId', {
        blockedId: user.userId,
        userId: currUserId,
      })
      .execute();

    if (!result.affected || !(result.affected > 0))
      return next(new AppError('error in unBlocking', 400));

    res.status(200).json({
      status: true,
      message: 'unblock done successfully',
    });
  } else {
    res.status(404).json({
      status: false,
      message: 'There is no user with this user name  ',
    });
  }
});

/**
 * Gets the list of users blocked by the current user.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the function completes.
 */
exports.getListOfBlocks = catchAsync(async (req, res, next) => {
  const currUserId = req.currentUser.userId;

  const blocksQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('block.userId = :userId', { userId: currUserId })
    .innerJoin(Block, 'block', 'block.blockedId = user.userId')
    .select([
      'user.userId',
      'user.username',
      'user.name',
      'user.bio',
      'user.imageUrl',
      'user.followersCount',
      'user.followingsCount',
    ])
    .groupBy('user.userId')
    .getMany();
  const isFollowedQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.followerId = :userId', { userId: currUserId })
    .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
    .select(['user.userId'])
    .getMany();
  const isFollowingQuery = await AppDataSource.getRepository(Follow)
    .createQueryBuilder('follow')
    .where('follow.userId = :userId', { userId: currUserId })
    .select(['follow.followerId'])
    .getMany();

  let blocksList = markFollowedUsers(blocksQuery, isFollowedQuery);
  blocksList = markFollowingUsers(blocksList, isFollowingQuery);
  blocksList = filterObj(blocksList);

  res.status(200).json({
    status: true,
    data: {
      users: blocksList,
    },
  });
});

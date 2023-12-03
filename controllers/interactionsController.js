const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Follow = require('../models/relations/Follow');
const Mute = require('../models/relations/Mute');
const Block = require('../models/relations/Block');
const User = require('../models/entites/User');

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

function markFollowedUsers(array1, array2) {
  return array1.map((user1) => {
    const isFollowed = array2.some((user2) => user2.userId === user1.userId);
    return { ...user1, isFollowed };
  });
}
function markFollowingUsers(array1, array2) {
  return array1.map((user1) => {
    const isFollowing = array2.some(
      (user2) => user2.followerId === user1.userId,
    );
    return { ...user1, isFollowing };
  });
}
exports.getListOfFollowers = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });

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

});

exports.getListOfFollowings = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });

  const name = user.name;
  console.log(name);
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
});

exports.follow = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  console.log(user);
  if (currUserId == user.userId) {
    res.status(400).json({
      status: false,
      message: 'Cant follow yourself ',
    });
    return;
  }
  user.followersCount = BigInt(user.followersCount) + BigInt(1);
  await AppDataSource.getRepository(User).save(user);

  const currUser = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: currUserId,
    },
  });
  currUser.followingsCount = BigInt(currUser.followingsCount) + BigInt(1);
  await AppDataSource.getRepository(User).save(currUser);
  const follow = new Follow();
  follow.userId = user.userId;
  follow.followerId = currUserId;
  const savedFollow = await AppDataSource.getRepository(Follow).save(follow);

  res.status(200).json({
    status: true,
    message: 'follow is added successfully',
  });
});

exports.unFollow = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (currUserId == user.userId) {
    res.status(400).json({
      status: false,
      message: 'Cant unfollow yourself ',
    });
    return;
  }
  user.followersCount = BigInt(user.followersCount) - BigInt(1);
  await AppDataSource.getRepository(User).save(user);

  const currUser = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: currUserId,
    },
  });
  currUser.followingsCount = BigInt(currUser.followingsCount) - BigInt(1);
  await AppDataSource.getRepository(User).save(currUser);

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

  res.status(200).json({
    status: true,
    message: 'unfollow is done successfully',
  });
});

exports.mute = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
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
});

exports.unmute = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
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
});
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
    ])
    .groupBy('user.userId')
    .getMany();
  let mutesList = filterObj(mutesQuery);
  res.status(200).json({
    status: true,
    data: {
      users: mutesList,
    },
  });
});
exports.block = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
  if (currUserId == user.userId) {
    res.status(400).json({
      status: false,
      message: 'Cant block yourself ',
    });
    return;
  }

  user.followersCount = BigInt(user.followersCount) - BigInt(1);
  await AppDataSource.getRepository(User).save(user);

  const currUser = await AppDataSource.getRepository(User).findOne({
    where: {
      userId: currUserId,
    },
  });
  currUser.followingsCount = BigInt(currUser.followingsCount) - BigInt(1);
  await AppDataSource.getRepository(User).save(currUser);

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


  const block = new Block();
  block.userId = currUserId;
  block.blockedId = user.userId;
  const savedBlock = await AppDataSource.getRepository(Block).save(block);

  res.status(200).json({
    status: true,
    message: 'block is added successfully',
  });
});

exports.unblock = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const currUserId = req.currentUser.userId;

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      username: username,
    },
  });
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
});

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
    ])
    .groupBy('user.userId')
    .getMany();
  let blocksList = filterObj(blocksQuery);
  res.status(200).json({
    status: true,
    data: {
      users: blocksList,
    },
  });
});

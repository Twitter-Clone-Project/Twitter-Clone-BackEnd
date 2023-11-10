const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');

const Follow = require('../models/relations/Follow');
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
      followerCount,
    }) => ({
      userId,
      username,
      name,
      bio,
      imageUrl,
      isFollowed,
      isFollowing,
      followerCount,
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
  const { userId } = req.params;
  const followersQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.userId = :userId', { userId: userId })
    .innerJoin(Follow, 'follow', 'follow.followerId = user.userId')
    .select([
      'user.userId',
      'user.username',
      'user.name',
      'user.bio',
      'user.imageUrl',
    ])
    .groupBy('user.userId')
    .getMany();
  const isFollowedQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.followerId = :userId', { userId: req.cookies.userId })
    .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
    .select(['user.userId'])
    .getMany();
  const isFollowingQuery = await AppDataSource.getRepository(Follow)
    .createQueryBuilder('follow')
    .where('follow.userId = :userId', { userId: req.cookies.userId })
    .select(['follow.followerId'])
    .getMany();

  let followersList = markFollowedUsers(followersQuery, isFollowedQuery);
  followersList = markFollowingUsers(followersList, isFollowingQuery);
  console.log(followersList);
  followersList = filterObj(followersList);

  if (followersList.length > 0) {
    res.status(200).json({
      status: true,
      data: {
        users: followersList,
      },
    });
  } else {
    return next(new AppError('There is no followers for this user', 404));
  }
});

exports.getListOfFollowings = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const followingQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.followerId = :userId', { userId: userId })
    .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
    .select([
      'user.userId',
      'user.username',
      'user.name',
      'user.bio',
      'user.imageUrl',
    ])
    .groupBy('user.userId')
    .getMany();
  const isFollowedQuery = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('follow.followerId = :userId', { userId: req.cookies.userId })
    .innerJoin(Follow, 'follow', 'follow.userId = user.userId')
    .select(['user.userId'])
    .getMany();
  const isFollowingQuery = await AppDataSource.getRepository(Follow)
    .createQueryBuilder('follow')
    .where('follow.userId = :userId', { userId: req.cookies.userId })
    .select(['follow.followerId'])
    .getMany();

  //   const followers = await AppDataSource.getRepository(Follow)
  //     .createQueryBuilder('follow')
  //     .leftJoinAndSelect('follow.follower', 'follower')
  //     .select(['follower.userId', 'COUNT(follow.followerId) as followerCount'])
  //     .groupBy('follower.userId')
  //     .getRawMany();
  //   const followings = await AppDataSource.getRepository(Follow)
  //     .createQueryBuilder('follow')
  //     .leftJoinAndSelect('follow.follower', 'follower')
  //     .leftJoinAndSelect('follow.user', 'following') // Join to get followings
  //     .select([
  //       'follower.userId',
  //       'COUNT(DISTINCT follower.userId) as followerCount',
  //       'COUNT(DISTINCT following.userId) as followingCount',
  //     ])
  //     .groupBy('follower.userId')
  //     .getRawMany();
  //   console.log(followers);
  //   console.log(followings);
  let followingList = markFollowedUsers(followingQuery, isFollowedQuery);
  followingList = markFollowingUsers(followingList, isFollowingQuery);

  followingList = filterObj(followingList);

  if (followingList.length > 0) {
    res.status(200).json({
      status: true,
      data: {
        users: followingList,
      },
    });
  } else {
    return next(new AppError('There is no followings for this user', 404));
  }
});

exports.follow = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const currUserId = req.cookies.userId;
  console.log(userId);
  console.log(currUserId);

  const follow = new Follow();
  follow.userId = userId;
  follow.followerId = currUserId;
  const savedFollow = await AppDataSource.getRepository(Follow).save(follow);

  res.status(200).json({
    status: true,
    message: 'follow is added successfully',
  });
});

exports.unFollow = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const currUserId = req.cookies.userId;

  const followRepository = AppDataSource.getRepository(Follow);

  const result = await followRepository
    .createQueryBuilder()
    .delete()
    .from(Follow)
    .where('followerId = :followerId AND userId = :userId', {
      followerId: currUserId,
      userId: userId,
    })
    .execute();

  if (!result.affected || !(result.affected > 0))
    return next(new AppError('error in unfollowing', 400));

  res.status(200).json({
    status: true,
    message: 'unfollow is done successfully',
  });
});

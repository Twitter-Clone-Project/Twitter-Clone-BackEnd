const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');
const Reply = require('../models/entites/Reply');
const Like = require('../models/relations/Like');
const Repost = require('../models/relations/Repost');

function getCurrentTimestamp() {
  const date = new Date(Date.now());
  const pad = (n) => (n < 10 ? `0${n}` : n);

  const formattedDate = `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;

  return formattedDate;
}

exports.addTweet = catchAsync(async (req, res, next) => {
  try {
    const { text, attachments } = req.body;
    const userId = req.cookies.userId;
    const tweet = new Tweet();
    tweet.userId = userId;
    tweet.text = text;
    tweet.time = getCurrentTimestamp();

    const savedTweet = await AppDataSource.getRepository(Tweet).save(tweet);

    const user = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: userId,
      },
    });

    for (const attach of attachments) {
      const media = new Media();
      media.tweetId = savedTweet.tweetId;
      media.url = attach;
      media.type = 'image';
      await AppDataSource.getRepository(Media).save(media);
    }

    res.status(200).json({
      status: true,
      data: {
        id: savedTweet.tweetId,
        text: savedTweet.text,
        createdAt: savedTweet.time,
        user: {
          profileImageURL: user.imageUrl,
          screenName: user.name,
          userName: user.username,
        },
        attachmentsURL: attachments,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error occurs when adding tweet',
    });
  }
});

exports.deleteTweet = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    console.log(tweetId)
    const tweetRepository = AppDataSource.getRepository(Tweet);

    const result = await tweetRepository
      .createQueryBuilder()
      .delete()
      .from(Tweet)
      .where("tweetId = :tweetId", { tweetId: tweetId })
      .execute();

    if (result.affected && result.affected > 0) {
      res.status(200).json({
        status: true,
        message: 'tweet is deleted successfully',
      });
    }
    else {
      res.status(400).json({
        status: false,
        message: 'error while deleting tweet',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error while deleting tweet',
    });
  }
});

exports.getTweet = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const currUserId = req.cookies.userId;
    const tweet = await AppDataSource.getRepository(Tweet).findOne({
      where: {
        tweetId: tweetId,
      },
    });
    const user = await AppDataSource.getRepository(User).findOne({
      where: {
        userId: tweet.userId,
      },
    });
    const attachments = await AppDataSource.getRepository(Media).findOne({
      where: {
        tweetId: tweetId,
      },
    });

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

    isLiked = isLiked ? true : false;
    isReposted = isReposted ? true : false;

    res.status(200).json({
      status: true,
      data: {
        id: tweet.tweetId,
        text: tweet.text,
        createdAt: tweet.time,
        user: {
          profileImageURL: user.imageUrl,
          screenName: user.name,
          userName: user.username,
        },
        attachmentsURL: attachments,
        isLiked: isLiked,
        isRetweeted: isReposted,
        likesCount: likesCount,
        retweetsCount: repostsCount,
        repliesCount: repliesCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error while getting tweet',
    });
  }
});

exports.addLike = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const currUserId = req.cookies.userId;
    const like = new Like();
    like.userId = currUserId;
    like.tweetId = tweetId;
    const savedLike = await AppDataSource.getRepository(Like).save(like);

    res.status(200).json({
      status: true,
      message: 'like is added successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error occurs when adding like',
    });
  }
});

exports.deleteLike = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const currUserId = req.cookies.userId;

    const likeRepository = AppDataSource.getRepository(Like);

    const result = await likeRepository
      .createQueryBuilder()
      .delete()
      .from(Like)
      .where("tweetId = :tweetId AND userId = :userId", { tweetId: tweetId, userId: currUserId })
      .execute();

    if (result.affected && result.affected > 0) {
      res.status(200).json({
        status: true,
        message: 'like is deleted successfully',
      });
    }
    else {
      res.status(400).json({
        status: false,
        message: 'error while deleting like',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error occurs when deleting like',
    });
  }
});

exports.addMedia = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const { media } = req.body;

    const med = new Media();
    med.tweetId = tweetId;
    med.url = media;
    med.type = 'image';
    await AppDataSource.getRepository(Media).save(med);

    res.status(200).json({
      status: true,
      message: 'media is added successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error occurs when adding media',
    });
  }
});

exports.getMediaOfTweet = catchAsync(async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;

    const attachments = await AppDataSource.getRepository(Media).find({
      where: {
        tweetId: tweetId,
      },
    });
    if (attachments.length > 0) {
      res.status(200).json({
        status: true,
        data: attachments,
      });
    }
    else {
      res.status(400).json({
        status: false,
        message: 'no attachments for this tweet',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({
      status: false,
      message: 'error occurs when getting media',
    });
  }
});
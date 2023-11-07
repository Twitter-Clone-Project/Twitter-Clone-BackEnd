const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');

const Tweet = require('../models/entites/Tweet');
const User = require('../models/entites/User');
const Media = require('../models/entites/Media');

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
  const { userId, text, attachments } = req.body;
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

  for (const attach in attachments) {
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
});

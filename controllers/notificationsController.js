const catchAsync = require('../middlewares/catchAsync');
const { AppDataSource } = require('../dataSource');
const Notification = require('../models/entites/Notification');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const { userId } = req.currentUser;

  const notifications = await AppDataSource.getRepository(Notification).find({
    relations: ['sender'],
    where: { userId },
    select: [
      'notificationId',
      'timestamp',
      'isSeen',
      'content',
      'sender.name',
      'sender.imageUrl',
    ],
  });

  await AppDataSource.getRepository(Notification).update(
    { isSeen: false, userId },
    { isSeen: true },
  );

  res.status(200).json({
    status: true,
    data: {
      notifications: notifications.map((notification) => {
        return {
          notificationId: notification.notificationId,
          timestamp: notification.timestamp,
          isSeen: notification.isSeen,
          content: notification.content,
          senderImgUrl: notification.sender.name,
        };
      }),
    },
  });
});

exports.getUnseenNotificationsCnt = catchAsync(async (req, res, next) => {
  const { userId } = req.currentUser;
  const unseenCnt = await AppDataSource.getRepository(Notification).count({
    where: { userId, isSeen: false },
  });

  res.status(200).json({
    status: true,
    data: { unseenCnt },
  });
});

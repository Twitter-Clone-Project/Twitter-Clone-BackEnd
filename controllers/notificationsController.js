const catchAsync = require('../middlewares/catchAsync');
const { AppDataSource } = require('../dataSource');
const Notification = require('../models/entites/Notification');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const { userId } = req.currentUser;

  const notifications = await AppDataSource.getRepository(Notification).find({
    relations: ['sender'],
    where: { userId },
    order: { timestamp: 'DESC' },
    select: [
      'notificationId',
      'timestamp',
      'isSeen',
      'type',
      'content',
      'sender.name',
      'sender.imageUrl',
      'sender.username',
    ],
  });

  res.status(200).json({
    status: true,
    data: {
      notifications: notifications.map((notification) => {
        return {
          notificationId: notification.notificationId,
          timestamp: notification.timestamp,
          isSeen: notification.isSeen,
          type: notification.type,
          content: notification.content,
          senderImgUrl: notification.sender.imageUrl,
          senderUsername: notification.sender.username,
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

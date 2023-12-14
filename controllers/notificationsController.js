const catchAsync = require('../middlewares/catchAsync');
const { AppDataSource } = require('../dataSource');
const Notification = require('../models/entites/Notification');

exports.getNotifications = catchAsync(async (req, res, next) => {
  const { userId } = req.currentUser;

  const notifications = await AppDataSource.getRepository(Notification).findOne(
    {
      relations: ['user', 'sender'],
      where: { userId },
      select: [
        'notificationId',
        'timestamp',
        'isSeen',
        'content',
        'sender.name',
        'sender.imageUrl',
      ],
    },
  );
});

exports.getUnseenNotificationsCnt = catchAsync(async (req, res, next) => {});

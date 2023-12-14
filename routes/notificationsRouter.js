const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router
  .route('/')
  .get(authController.requireAuth, notificationsController.getNotifications);

router
  .route('/unseenNotificationsCnt')
  .get(
    authController.requireAuth,
    notificationsController.getUnseenNotificationsCnt,
  );

module.exports = router;

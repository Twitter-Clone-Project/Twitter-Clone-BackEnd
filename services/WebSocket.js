const Message = require('../models/entites/Message');
const User = require('../models/entites/User');
const Notification = require('../models/entites/Notification');
const Conversation = require('../models/entites/Conversation');
const AppError = require('./AppError');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class SocketService {
  constructor() {
    this.onlineUsers = new Map();
    this.io = null;
    this.server = null;
    this.socket = null;
  }

  async emitNotification(senderId, receiverId, type = '') {
    type = type.toUpperCase();
    const userRepository = this.AppDataSource.getRepository(User);

    const sender = await userRepository.findOne({
      select: { name: true, imageUrl: true, username: true },
      where: { userId: senderId },
    });

    let content = '';
    switch (type) {
      case 'CHAT':
        content = `${sender.name} sent you a message`;
        break;
      case 'MENTION':
        content = `${sender.name} mentioned you`;
        break;
      case 'FOLLOW':
        content = `${sender.name} followed you`;
        break;
      case 'UNFOLLOW':
        content = `${sender.name} unfollowed you`;
        break;
      default:
        throw new AppError('Unknown notification type: ' + type);
    }

    const notification = new Notification(
      receiverId,
      senderId,
      content,
      false,
      type,
    );
    await this.AppDataSource.getRepository(Notification).insert(notification);

    if (receiverId && sender) {
      this.io.sockets
        .in(`user_${receiverId}_room`)
        .emit('notification-receive', {
          notificationId: notification.notificationId,
          content: notification.content,
          timestamp: notification.timestamp,
          senderImgUrl: sender.imageUrl,
          senderUsername: sender.username,
          isSeen: notification.isSeen,
          type: notification.type,
        });
    }
  }

  updateAppDataSource(dataSource) {
    this.AppDataSource = dataSource;
  }

  initializeSocket(server, AppDataSource) {
    this.server = server;
    this.AppDataSource = AppDataSource;

    this.io = require('socket.io')(this.server, {
      cors: {
        origin: (origin, callback) => {
          callback(null, true);
        },
        credentials: true,
        allowedHeaders: ['token'],
      },
    });

    this.io
      .use(async (socket, next) => {
        if (!socket.handshake.headers.token) {
          console.log('Socket is not logged in');
          return next();
        }

        try {
          const payload = await promisify(jwt.verify)(
            socket.handshake.headers.token,
            process.env.JWT_SECRET_KEY,
          );

          const user = await AppDataSource.getRepository(User).findOne({
            where: { userId: payload.id },
            select: {
              userId: true,
              username: true,
              email: true,
              name: true,
            },
          });

          if (!user) {
            console.log('User does no longer exist');
            return;
          }

          socket.userData = user ? user : {};

          socket.join(`user_${user.userId}_room`);

          next();

        } catch (error) {
          console.log(error.message);
          return;
        }



      })
      .on('connection', (socket) => {
        console.log('socket connected');

        // temp event as a alternative to token
        socket.on('add-user', async ({ userId }) => {
          const user = await AppDataSource.getRepository(User).findOne({
            where: { userId },
            select: {
              userId: true,
              username: true,
              email: true,
              name: true,
            },
          });

          if (!user) {
            throw new AppError('User does no longer exist', 401);
          }

          socket.userData = user ? user : {};

          socket.join(`user_${user.userId}_room`);
        });

        socket.on('msg-send', async ({ receiverId, conversationId, text }) => {
          if (!receiverId || !conversationId || !text)
            throw new AppError('message data are required', 400);
          const { userId, username } = socket.userData;

          const conversation = await AppDataSource.getRepository(
            Conversation,
          ).findOne({
            where: { conversationId: conversationId },
            select: { isUsersActive: true },
          });

          if (!conversation) return;

          let isSeen = false;
          isSeen = conversation.isUsersActive[`userId_${receiverId}`];
          const newMessage = new Message(
            conversationId,
            userId,
            receiverId,
            text,
            isSeen,
          );
          await AppDataSource.getRepository(Message).insert(newMessage);

          if (receiverId) {
            socket.to(`user_${receiverId}_room`).emit('msg-receive', {
              senderId: newMessage.senderId,
              messageId: newMessage.messageId,
              conversationId: newMessage.conversationId,
              isSeen: newMessage.isSeen,
              time: newMessage.time,
              text: newMessage.text,
              senderUsername: username,
              isFromMe: false,
            });
          }

          if (userId) {
            this.io.sockets.in(`user_${userId}_room`).emit('msg-redirect', {
              senderId: newMessage.senderId,
              messageId: newMessage.messageId,
              conversationId: newMessage.conversationId,
              isSeen: newMessage.isSeen,
              time: newMessage.time,
              text: newMessage.text,
              senderUsername: username,
              isFromMe: true,
            });
          }
        });

        socket.on('mark-notifications-as-seen', async () => {
          const { userId } = socket.userData;
          await AppDataSource.getRepository(Notification).update(
            { isSeen: false, userId },
            { isSeen: true },
          );
        });

        socket.on('chat-opened', async ({ conversationId, contactId }) => {
          if (!conversationId || !contactId)
            throw new AppError('chat data is required', 400);
          const { userId } = socket.userData;

          await AppDataSource.createQueryBuilder()
            .update(Conversation)
            .set({
              isUsersActive: () =>
                `jsonb_set(isUsersActive, '{userId_${userId}}', 'true')`,
            })
            .where('conversationId = :conversationId', {
              conversationId,
            })
            .execute();

          if (contactId) {
            socket.to(`user_${contactId}_room`).emit('status-of-contact', {
              conversationId,
              inConversation: true,
              isLeaved: false,
            });
          }

          await AppDataSource.getRepository(Message).update(
            { conversationId, receiverId: userId },
            { isSeen: true },
          );
        });

        socket.on('chat-closed', async ({ contactId, conversationId }) => {
          if (!contactId || !conversationId)
            throw new AppError('chat data are required', 400);
          const { userId } = socket.userData;

          await AppDataSource.createQueryBuilder()
            .update(Conversation)
            .set({
              isUsersActive: () =>
                `jsonb_set(isUsersActive, '{userId_${userId}}', 'false')`,
            })
            .where('conversationId = :conversationId', {
              conversationId,
            })
            .execute();

          if (contactId) {
            socket.to(`user_${contactId}_room`).emit('status-of-contact', {
              conversationId,
              inConversation: false,
              isLeaved: false,
            });
          }
        });

        socket.on('disconnect', async () => {
          console.log(`Server disconnected from a client`);
          const { userId } = socket.userData;

          if (!userId) return;

          await AppDataSource.createQueryBuilder()
            .update(Conversation)
            .set({
              isUsersActive: () =>
                `jsonb_set(isUsersActive, '{userId_${userId}}', 'false')`,
            })
            .where('"user1Id" = :userId OR "user2Id" = :userId', {
              userId,
            })
            .execute();

          // if (activeConversation) {
          //   activeConversation.isUsersActive[`userId_${userId}`] = false;
          //   await conversationRepository.save(activeConversation);

          //   const contactId =
          //     activeConversation.user1Id == userId
          //       ? activeConversation.user2Id
          //       : activeConversation.user1Id;

          //   // bug: should send it to one only, can solve this by maping each userId with array of sockets and set with each socket an identifier for the window rhat the user connected to it.
          //   if (contactId) {
          //     socket.to(`user_${contactId}_room`).emit('status-of-contact', {
          //       conversationId: activeConversation.conversationId,
          //       inConversation: false,
          //       isLeaved: false,
          //     });
          //   }
          // }
        });
      });
    console.log('WebSocket initialized ✔️');
  }
}

module.exports = new SocketService();

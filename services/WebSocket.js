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

    const receiver = this.onlineUsers.get(receiverId);

    const sender = await userRepository.findOne({
      select: { name: true, imageUrl: true, username: true },
      where: { userId: senderId },
    });

    const senderSocket = this.onlineUsers.get(senderId);
    sender.socketId = senderSocket.socketId;

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

    if (receiver.socketId && sender.socketId) {
      this.io.sockets.sockets
        .get(sender.socketId)
        .to(receiver.socketId)
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
        origin: '*',
      },
      credentials: true,
      allowedHeaders: ['token'],
    });

    this.io
      .use(async (socket, next) => {
        if (!socket.handshake.headers && !socket.handshake.headers.token)
          return new AppError('user is not logged in', 401);

        const payload = await promisify(jwt.verify)(
          socket.handshake.headers.token,
          process.env.JWT_SECRET_KEY,
        );
        socket.userId = payload.id;

        const userId = payload.id.toString();
        if (!this.onlineUsers.has(userId)) {
          this.onlineUsers.set(userId, {
            socketId: socket.id,
            userId,
          });
        }

        next();
      })
      .on('connection', (socket) => {
        console.log('socket connected');

        socket.on(
          'msg-send',
          async ({ receiverId, conversationId, text, isSeen }) => {
            if (!receiverId || !conversationId || !text)
              throw new AppError('message data are required', 400);
            const { userId } = socket;
            const receiver = this.onlineUsers.get(receiverId);

            const isFound = await AppDataSource.getRepository(
              Conversation,
            ).exist({
              where: { conversationId: conversationId },
            });

            const newMessage = new Message(
              conversationId,
              userId,
              receiverId,
              text,
              isSeen,
            );
            console.log(isFound);
            if (!isFound) {
              socket.emit('status-of-contact', {
                conversationId: conversationId,
                inConversation: false,
                isLeaved: true,
              });
            } else {
              await AppDataSource.getRepository(Message).insert(newMessage);

              if (receiver.socketId) {
                socket.to(receiver.socketId).emit('msg-receive', newMessage);
              }
            }
          },
        );

        socket.on('mark-notifications-as-seen', async () => {
          const { userId } = socket;
          await AppDataSource.getRepository(Notification).update(
            { isSeen: false, userId },
            { isSeen: true },
          );
        });

        socket.on('chat-opened', async ({ conversationId, contactId }) => {
          if (!conversationId || !contactId)
            throw new AppError('chat data is required', 400);
          const { userId } = socket;

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

          const receiver = this.onlineUsers.get(contactId);

          if (receiver.socketId) {
            socket.to(receiver.socketId).emit('status-of-contact', {
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
          const { userId } = socket;

          const receiver = this.onlineUsers.get(contactId);

          if (receiver.socketId) {
            socket.to(receiver.socketId).emit('status-of-contact', {
              conversationId,
              inConversation: false,
              isLeaved: false,
            });
          }

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
        });

        socket.on('disconnect', async () => {
          console.log(`Server disconnected from a client`);
          const { userId } = socket;

          if (!userId) return;
          this.onlineUsers.delete(userId);

          const conversationRepository =
            AppDataSource.getRepository(Conversation);

          const activeConversation = await conversationRepository
            .createQueryBuilder()
            .where('"user1Id" = :userId OR "user2Id" = :userId', {
              userId,
            })
            .andWhere(`"isUsersActive"->>'userId_${userId}' = 'true'`)
            .getOne();

          if (activeConversation) {
            activeConversation.isUsersActive[`userId_${userId}`] = false;
            await conversationRepository.save(activeConversation);

            const contactId =
              activeConversation.user1Id == userId
                ? activeConversation.user2Id
                : activeConversation.user1Id;

            const openContact = this.onlineUsers.get(contactId);

            if (openContact && openContact.socketId) {
              socket.to(openContact.socketId).emit('status-of-contact', {
                conversationId: activeConversation.conversationId,
                inConversation: false,
                isLeaved: false,
              });
            }
          }
        });
      });
    console.log('WebSocket initialized ✔️');
  }
}

module.exports = new SocketService();

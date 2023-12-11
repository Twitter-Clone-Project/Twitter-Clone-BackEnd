const User = require('../models/entites/User');
const Message = require('../models/entites/Message');
const Notification = require('../models/entites/Notification');
const Conversation = require('../models/entites/Conversation');

class SocketService {
  constructor() {
    this.io = null;
    this.server = null;
    this.socket = null;
  }

  async emitNotification(
    senderSocketId,
    receiverSocketId,
    receiverId,
    content,
    isFromChat,
  ) {
    const notification = new Notification(
      receiverId,
      content,
      isFromChat,
      false,
    );
    await this.AppDataSource.getRepository(Notification).insert(notification);

    if (receiverSocketId && senderSocketId) {
      this.io.sockets.sockets
        .get(senderSocketId)
        .to(receiverSocketId)
        .emit('chat-notification-receive', notification);
    }
  }

  initializeSocket(server, AppDataSource) {
    this.server = server;
    this.AppDataSource = AppDataSource;

    this.io = require('socket.io')(this.server, {
      cors: {
        origin: '*',
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log('socket connected');

      socket.on('add-user', async (userData) => {
        await AppDataSource.getRepository(User).update(
          { userId: userData.userId },
          { socketId: socket.id, isOnline: true },
        );

        const onlineUsers = await AppDataSource.getRepository(User).find({
          select: {
            name: true,
            userId: true,
            username: true,
            email: true,
            isOnline: true,
          },
          where: { isOnline: true },
        });

        socket.emit('getOnlineUsers', onlineUsers);
      });

      socket.on('msg-send', async (message) => {
        const receiver = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true, userId: true },
          where: { userId: message.receiverId },
        });

        const sender = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true },
          where: { userId: message.senderId },
        });

        const isFound = await AppDataSource.getRepository(Conversation).exist({
          where: { conversationId: message.conversationId },
        });

        const newMessage = new Message(
          message.conversationId,
          message.senderId,
          message.receiverId,
          message.text,
          message.isSeen,
        );

        if (!isFound && receiver.socketId) {
          newMessage.text = 'this conversation has been deleted';
          socket.to(receiver.socketId).emit('msg-receive', newMessage);
        } else {
          await AppDataSource.getRepository(Message).insert(newMessage);

          if (receiver.socketId) {
            socket.to(receiver.socketId).emit('msg-receive', message);

            await this.emitNotification(
              sender.socketId,
              receiver.socketId,
              receiver.userId,
              `${sender.name} sent you a message`,
              true,
            );
          }
        }
      });

      socket.on('mark-notifications-as-seen', async (data) => {
        await AppDataSource.getRepository(Notification).update(
          { isSeen: false, isFromChat: false, userId: data.userId },
          { isSeen: true },
        );
      });

      socket.on('chat-opened', async (data) => {
        await AppDataSource.getRepository(Notification).update(
          { isSeen: false, isFromChat: true, userId: data.userId },
          { isSeen: true },
        );

        await AppDataSource.createQueryBuilder()
          .update(Conversation)
          .set({
            isUsersActive: () =>
              `jsonb_set(isUsersActive, '{userId_${data.userId}}', 'true')`,
          })
          .where('conversationId = :conversationId', {
            conversationId: data.conversationId,
          })
          .execute();

        const receiver = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true, userId: true },
          where: { userId: data.contactId },
        });

        if (receiver.socketId) {
          socket.to(receiver.socketId).emit('status-of-contact', {
            conversationId: data.conversationId,
            inConversation: true,
          });
        }

        await AppDataSource.getRepository(Message).update(
          { conversationId: data.conversationId, receiverId: data.userId },
          { isSeen: true },
        );
      });

      socket.on('chat-closed', async (data) => {
        const receiver = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true, userId: true },
          where: { userId: data.contactId },
        });

        if (receiver.socketId) {
          socket.to(receiver.socketId).emit('status-of-contact', {
            conversationId: data.conversationId,
            inConversation: false,
          });
        }

        await AppDataSource.createQueryBuilder()
          .update(Conversation)
          .set({
            isUsersActive: () =>
              `jsonb_set(isUsersActive, '{userId_${data.userId}}', 'false')`,
          })
          .where('conversationId = :conversationId', {
            conversationId: data.conversationId,
          })
          .execute();
      });

      socket.on('disconnect', async () => {
        console.log(`Server disconnected from a client`);

        const userRepository = AppDataSource.getRepository(User);

        const user = await AppDataSource.getRepository(User).findOne({
          where: { socketId: socket.id },
          select: {
            userId: true,
            isConfirmed: true,
            isOnline: true,
            username: true,
            email: true,
            name: true,
          },
        });

        if (user) {
          await userRepository.update(
            { socketId: socket.id },
            { socketId: null, isOnline: false },
          );

          const conversationRepository =
            AppDataSource.getRepository(Conversation);

          const activeConversation = await conversationRepository
            .createQueryBuilder()
            .where('"user1Id" = :userId OR "user2Id" = :userId', {
              userId: user.userId,
            })
            .andWhere(`"isUsersActive"->>'userId_${user.userId}' = 'true'`)
            .getOne();

          if (activeConversation) {
            activeConversation.isUsersActive[`userId_${user.userId}`] = false;
            await conversationRepository.save(activeConversation);

            const contactId =
              activeConversation.user1Id == user.userId
                ? activeConversation.user2Id
                : activeConversation.user1Id;

            const openContact = await AppDataSource.getRepository(User).findOne(
              {
                where: { userId: contactId },
                select: {
                  socketId: true,
                },
              },
            );

            if (openContact && openContact.socketId) {
              socket.to(openContact.socketId).emit('status-of-contact', {
                conversationId: activeConversation.conversationId,
                inConversation: false,
              });
            }
          }
        }
      });
    });
    console.log('WebSocket initialized ✔️');
  }
}

module.exports = new SocketService();

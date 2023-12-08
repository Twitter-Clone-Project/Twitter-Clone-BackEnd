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
        // const conversation = await AppDataSource.getRepository(
        //   Conversation,
        // ).findOne({
        //   select: { activeUsersCnt },
        //   where: { conversationId: message.conversationId },
        // });

        // if (conversation.activeUsersCnt >= 2) {
        //   message.isSeen = true;
        // }

        const newMessage = new Message(
          message.conversationId,
          message.senderId,
          message.receiverId,
          message.text,
          message.isSeen,
        );
        await AppDataSource.getRepository(Message).insert(newMessage);

        const receiver = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true, userId: true },
          where: { userId: message.receiverId },
        });

        const sender = await AppDataSource.getRepository(User).findOne({
          select: { name: true, socketId: true },
          where: { userId: message.senderId },
        });

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

        // const updatedConv = await AppDataSource.createQueryBuilder()
        //   .update(Conversation)
        //   .set({
        //     activeUsersCnt: () => 'activeUsersCnt + 1',
        //   })
        //   .where('conversationId = :id', { id: data.conversationId })
        //   .returning('*') // Return all columns
        //   .execute();

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

        // await AppDataSource.createQueryBuilder()
        //   .update(Conversation)
        //   .set({
        //     activeUsersCnt: () => 'activeUsersCnt - 1',
        //   })
        //   .where('conversationId = :id', { id: data.conversationId })
        //   .execute();
      });

      socket.on('disconnect', async () => {
        console.log(`Server disconnected from a client`);

        await AppDataSource.getRepository(User).update(
          { socketId: socket.id },
          { socketId: null, isOnline: false },
        );
      });
    });
    console.log('WebSocket initialized ✔️');
  }
}

module.exports = new SocketService();

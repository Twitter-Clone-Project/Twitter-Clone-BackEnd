const User = require('../models/entites/User');
const Message = require('../models/entites/Message');
const Notification = require('../models/entites/Notification');

class SocketService {
  constructor() {
    this.onlineUsers = new Map();
    this.server = null;
    this.socket = null;
  }

  async emitNotification(userId, content) {
    const receiver = await AppDataSource.getRepository(User).find({
      where: { userId },
    });

    const notification = new Notification(userId, content, false);
    await AppDataSource.getRepository(Notification).insert(notification);

    if (receiver && receiver.socketId) {
      this.socket
        .to(receiver.socketId)
        .emit('chat-notification-receive', notification);
    }
  }

  initializeSocket(server, AppDataSource) {
    this.server = server;

    const io = require('socket.io')(this.server, {
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      this.socket = socket;

      socket.on('add-user', async (userData) => {
        await AppDataSource.getRepository(User).update(
          { userId: userData.userId },
          { socketId: socket.id, isOnline: true },
        );

        const onlineUsers = await AppDataSource.getRepository(User).find({
          where: { isOnline: true },
        });

        socket.emit('getOnlineUsers', onlineUsers);
      });

      socket.on('send-msg', async (message) => {
        const receiver = await AppDataSource.getRepository(User).find({
          where: { userId: message.receiverId },
        });

        const newMessage = new Message(
          message.conversationId,
          message.senderId,
          message.receiverId,
          message.text,
        );
        await AppDataSource.getRepository(Message).insert(newMessage);

        const sender = await AppDataSource.getRepository(User).find({
          select: { name: true },
          where: { userId: message.senderId },
        });

        await this.emitNotification(
          message.receiverId,
          `${sender.name} sent you a message`,
        );

        if (receiver.socketId) {
          socket.to(receiver.socketId).emit('msg-receive', message.text);
        }
      });

      socket.on('mark-notifications-as-seen', async () => {
        await AppDataSource.getRepository(Notification).update(
          { isSeen: false },
          { isSeen: true },
        );
      });

      socket.on('chat-opened', async (data) => {
        await AppDataSource.getRepository(Notification).update(
          { isSeen: false, isFromChat: true, userId: data.userId },
          { isSeen: true },
        );

        await AppDataSource.getRepository(Message).update(
          { conversationId: data.conversationId, receiverId: data.userId },
          { isSeen: true },
        );
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

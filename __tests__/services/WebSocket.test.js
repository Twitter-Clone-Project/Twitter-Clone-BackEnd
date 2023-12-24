const { createServer } = require('http');
const ioc = require('socket.io-client');
const uuid = require('uuid');
const socketService = require('../../services/WebSocket');
const Conversation = require('../../models/entites/Conversation');
const { AppDataSource } = require('../../dataSource');

describe('SocketService', () => {
  let httpServer, clientSocket1, clientSocket2, conversation;
  const email1 = `testuser_${uuid.v4()}@example.com`;
  const username1 = `user_${uuid.v4()}`;
  let userId1;

  const email2 = `testuser_${uuid.v4()}@example.com`;
  const username2 = `user_${uuid.v4()}`;
  let userId2;

  beforeAll((done) => {
    httpServer = createServer();
    httpServer.listen(async () => {
      socketService.initializeSocket(httpServer, AppDataSource);
      const port = httpServer.address().port;

      const { plainToken: token1, userId: user1 } = await global.signin(
        email1,
        username1,
      );
      const { plainToken: token2, userId: user2 } = await global.signin(
        email2,
        username2,
      );
      userId1 = user1;
      userId2 = user2;

      const conversationRepository = AppDataSource.getRepository(Conversation);
      const newConversation = new Conversation(userId1, userId2);

      await conversationRepository.save(newConversation);

      conversation = await conversationRepository.findOne({
        where: [
          { user1Id: userId1, user2Id: userId2 },
          { user2Id: userId1, user1Id: userId2 },
        ],
        select: ['user1Id', 'user2Id', 'conversationId'],
      });

      clientSocket1 = ioc(`http://localhost:${port}`, {
        withCredential: true,
        extraHeaders: {
          token: token1,
        },
      });

      clientSocket2 = ioc(`http://localhost:${port}`, {
        withCredential: true,
        extraHeaders: {
          token: token2,
        },
      });

      clientSocket1.on('connect', () => {});

      clientSocket2.on('connect', () => {});

      done();
    });
  });

  afterAll(async () => {
    // await clientSocket1.disconnect();
    // await clientSocket2.disconnect();
  });

  describe('msg-send-receive', () => {
    test('try to send message if the other conversation leaved', (done) => {
      clientSocket2.on('status-of-contact', (data) => {
        expect(data.isLeaved).toBe(true);

        done();
      });

      clientSocket2.emit('msg-send', {
        receiverId: userId1,
        conversationId: '133',
        text: 'hello world',
        isSeen: true,
      });
    });

    test('receive the message', (done) => {
      clientSocket2.on('msg-receive', (data) => {
        expect(data.text).toEqual('hello world');
        expect(data.isSeen).toEqual(true);
        done();
      });

      clientSocket1.emit('msg-send', {
        receiverId: userId2,
        conversationId: conversation.conversationId,
        text: 'hello world',
        isSeen: true,
      });
    });
  });
});

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

  test('if the another contact is active mark the message as seen', (done) => {
    clientSocket1.emit('chat-opened', {
      contactId: userId2,
      conversationId: conversation.conversationId,
    });
    clientSocket2.emit('chat-opened', {
      contactId: userId1,
      conversationId: conversation.conversationId,
    });

    clientSocket1.emit('msg-send', {
      receiverId: userId2,
      conversationId: conversation.conversationId,
      text: 'hello world',
    });

    clientSocket1.on('msg-redirect', (data) => {
      expect(data.text).toEqual('hello world');
      expect(data.isSeen).toEqual(true);
      done();
    });

    clientSocket2.on('msg-receive', (data) => {
      expect(data.text).toEqual('hello world');
      expect(data.isSeen).toEqual(true);
      done();
    });
    
  });

  // test('if the another contact is not active mark the message as unseen', (done) => {
  //   clientSocket1.emit('chat-opened', {
  //     contactId: userId2,
  //     conversationId: conversation.conversationId,
  //   });

  //   clientSocket1.emit('msg-send', {
  //     receiverId: userId2,
  //     conversationId: conversation.conversationId,
  //     text: 'hello world',
  //   });

  //   clientSocket1.on('msg-redirect', (data) => {
  //     expect(data.text).toEqual('hello world');
  //     expect(data.isSeen).toEqual(false);
  //     done();
  //   });
  //   clientSocket1.emit('chat-closed', {
  //     contactId: userId2,
  //     conversationId: conversation.conversationId,
  //   });
  // });
});

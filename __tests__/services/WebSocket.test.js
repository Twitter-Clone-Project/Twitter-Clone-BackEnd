const { createServer } = require('http');
const ioc = require('socket.io-client');
const uuid = require('uuid');
const socketService = require('../../services/WebSocket');
const MockAppDataSource = require('../../__mocks__/dataSource');

describe('SocketService', () => {
  let httpServer, clientSocket;

  beforeAll((done) => {
    httpServer = createServer();
    httpServer.listen(() => {
      socketService.initializeSocket(httpServer, MockAppDataSource);
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`, {
        withCredential: true,
        extraHeaders: {
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyIiwiaWF0IjoxNzAzMjY5NDk0LCJleHAiOjE3MDQxMzM0OTR9.yCd1m_DOWYnHTcP4-A3LIdYt8pVYnd7n19lkYYVabTM',
        },
      });

      clientSocket.on('connect', () => {
        done();
      });
    });
  });

  afterAll((done) => {
    clientSocket.disconnect();
    done();
  });

  describe('msg-send-receive', () => {
    test('send a status-of-contact if the other conversation leaved', (done) => {
      const receiverId = 'receiverUserId'; // Replace with a valid user ID
      const conversationId = 'conversationId'; // Replace with a valid conversation ID
      const text = 'Hello, this is a test message';
      const isSeen = false;

      MockAppDataSource.getRepository().exist = jest
        .fn()
        .mockResolvedValue(false);
      socketService.updateAppDataSource(MockAppDataSource);

      clientSocket.on('status-of-contact', (data) => {
        expect(data).toEqual({
          conversationId,
          inConversation: false,
          isLeaved: true,
        });
        done();
      });

      clientSocket.emit('msg-send', {
        receiverId,
        conversationId,
        text,
        isSeen,
      });
    });

    test('receive the message', () => {
      const receiverId = 'receiverUserId'; // Replace with a valid user ID
      const conversationId = 'conversationId'; // Replace with a valid conversation ID
      const text = 'Hello, this is a test message';
      const isSeen = false;

      MockAppDataSource.getRepository().exist = jest
        .fn()
        .mockResolvedValue(true);
      socketService.updateAppDataSource(MockAppDataSource);

      clientSocket.on('msg-receive', (data) => {
        expect(data.text).toEqual(text);
        done();
      });

      clientSocket.emit('msg-send', {
        receiverId,
        conversationId,
        text,
        isSeen,
      });
    });
  });
});

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
      clientSocket = ioc(`http://localhost:${port}`);
      clientSocket.on('connect', () => {
        done();
      });
    });
  });

  afterAll((done) => {
    clientSocket.disconnect();
    done();
  });

  test('should handle add-user event', (done) => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    // const { userId } = global.signin(email, username);

    clientSocket.emit('add-user', { userId: 30, name: 'testuser' });
    clientSocket.on('getOnlineUsers', (dt) => {
      console.log(dt);
      done();
    });
  });

  test('handle msg-send-receive event', async () => {});
});

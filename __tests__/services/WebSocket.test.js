const { createServer } = require('http');
const { Server } = require('socket.io');
const ioc = require('socket.io-client');
const uuid = require('uuid');
const socketService = require('../../services/WebSocket');
const { AppDataSource } = require('../../dataSource');

describe('SocketService', () => {
  let httpServer, io, clientSocket, serverSocket;

  beforeAll(async () => {
    return new Promise((resolve) => {
      httpServer = createServer();
      httpServer.listen(async () => {
        socketService.initializeSocket(httpServer, AppDataSource);
        const port = httpServer.address().port;
        clientSocket = ioc(`http://localhost:${port}`);
        clientSocket.on('connect', () => {
          resolve(); // Signal that setup is complete
        });
      });
    });
  });

  afterAll(() => {
    clientSocket.disconnect();
  });

  test('should handle add-user event', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { userId } = await global.signin(email, username);

    clientSocket.emit('add-user', { userId });
  });

  test('handle msg-send-receive event', async () => {});
});

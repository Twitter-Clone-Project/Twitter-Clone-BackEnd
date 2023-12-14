const { createServer } = require('http');
const { Server } = require('socket.io');
const ioc = require('socket.io-client');
const socketService = require('../../services/WebSocket');
const { AppDataSource } = require('../../dataSource');

describe('SocketService', () => {
  let httpServer, io, clientSocket, serverSocket;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`);
      socketService.initializeSocket(io, AppDataSource);
      io.on('connection', (socket) => {
        serverSocket = socket;
        console.log(socket.id);
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.disconnect();
  });

  test('should handle add-user event', async (done) => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { userId } = await global.signin(email, username);
    clientSocket.on('getOnlineUsers', (onlineUsers) => {
      expect(onlineUsers.length).toBe(1); // Assuming only one user is online
      done();
    });

    clientSocket.emit('add-user', { userId });
  });
});

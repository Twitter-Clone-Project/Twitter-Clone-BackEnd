const https = require('https');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('uncaught exception'.toUpperCase(), ',Shutting down......');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 2000;

const app = require('./app');
const { AppDataSource } = require('./dataSource');

app.use((req, res, next) => {
  req.appDataSource = AppDataSource;
  next();
});

let server;
(async () => {
  try {
    await AppDataSource.initialize();
    if (AppDataSource.isInitialized) {
      console.log('DB connection established ✔️');
      server = https
        .createServer(
          {
            cert: process.env.certificate.replace(/\\n/g, '\n'),
            key: process.env.privateKey.replace(/\\n/g, '\n'),
          },
          app,
        )
        .listen(PORT, () => {
          console.log(`Https Express server listening on port ${PORT} 🫡`);
        });
    }
  } catch (err) {
    console.log(err.name, err.message);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection'.toUpperCase(), ',Shutting down....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

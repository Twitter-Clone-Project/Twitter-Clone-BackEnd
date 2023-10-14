const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');

process.on('uncaughtException', (err) => {
  console.log('uncaught exception'.toUpperCase(), ',Shutting down......');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 2000;

const app = require('./app');

// => deployed atles String for later
// const DBString = process.env.DATABASE.replace(
//   '<password>',
//   process.env.PASSWORD
// );

let server;
mongoose.connect(process.env.DATABASE_LOCAL_URL).then(() => {
  console.log('DB connection established');
  server = http.createServer(app).listen(PORT, function () {
    console.log('Express server listening on port ' + PORT);
  });
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection'.toUpperCase(), ',Shutting down....');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

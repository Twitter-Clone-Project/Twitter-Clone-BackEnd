const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./services/AppError');

const app = express();

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Data sanitization against XSS => prevent XSS attacks
app.use(xss());

// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

// compress the responses
app.use(compression());

// limit the traffic => prevent DoS attacks
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 3000, // Limit each IP to 300 requests per `window` (here, per 60 minutes)
  message: {
    message: 'Too many requests, try again in an hour',
    status: 'warning',
  },
});

// Apply the rate limiting middleware to API calls only
app.use('/api', limiter);

app.use(cors({ origin: true, credentials: true }));

// just a testing middelware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // res.locals.jwt = req.cookies.jwt;
  // console.log(res.locals.jwt);
  // req.session.isAuth = true;
  // console.log(req.cookies);
  next();
});

const authRoutes = require('./routes/authRouter');
const interactionsRoutes = require('./routes/interactionsRouter');
const tweetsRoutes = require('./routes/tweetsRouter');
const timelineRoutes = require('./routes/timelineRouter');
const usersRouter = require('./routes/usersRouter');
const trendsRouter = require('./routes/trendsRouter');
const searchRouter = require('./routes/searchRouter');
const profileRoutes = require('./routes/profileRoutes');
const conversationsRoutes = require('./routes/conversationsRouter');
const notificationsRoutes = require('./routes/notificationsRouter');

app.use('/api/v1', searchRouter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/tweets', tweetsRoutes);
app.use('/api/v1/users', timelineRoutes);
app.use('/api/v1/users', interactionsRoutes);
app.use('/api/v1/trends', trendsRouter);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;

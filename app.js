const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const globalErrorHandler = require('./controllers/errorController');

//express app
const app = express();

// Development logging
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}

// Data sanitization against XSS => prevent XSS attacks
app.use(xss());

// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// compress the responses
app.use(compression());

// limit the traffic => prevent DoS attacks
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 300, // Limit each IP to 300 requests per `window` (here, per 60 minutes)
  message: {
    message: 'Too many requests, try again in an hour',
    status: 'warning',
  },
});

// Apply the rate limiting middleware to API calls only
app.use('/api', limiter);

const cors = require('cors');
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

// routes here

app.all('*', (req, res, next) => {});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;

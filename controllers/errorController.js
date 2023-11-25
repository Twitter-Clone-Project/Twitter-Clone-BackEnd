/**
 * errorController.js
 *
 * This module provides middleware for handling errors in an Express application.
 * It includes functions to handle various types of errors and send appropriate responses
 * based on the environment (development or production). Additionally, it exports an
 * Express middleware function that is used to handle errors in the entire application.
 */

const AppError = require('../services/AppError');

/**
 * Handles casting errors in the database.
 * @param {Object} err - The error object
 * @returns {AppError} - An instance of AppError with a specific error message
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * Handles duplicate field errors in the database.
 * @param {Object} err - The error object
 * @returns {AppError} - An instance of AppError with a specific error message
 */
const handleDuplicateFieldsDB = (err) => {
  const regex = /Key \(([^)]+)\)=\(([^)]+)\) already exists\./;
  const match = err.detail.match(regex);

  if (match) {
    const fieldName = match[1];
    const value = match[2];

    const message = `A record with the provided ${fieldName} (${value}) already exists. Please use another value.`;
    return new AppError(message, 400);
  }

  // If the error doesn't match the expected pattern, you can provide a generic message.
  return new AppError(
    'Duplicate field with the given value. Please use another value.',
    400,
  );
};

/**
 * Handles validation errors in the database.
 * @param {Object} err - The error object
 * @returns {AppError} - An instance of AppError with a specific error message
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handles invalid JSON Web Token (JWT) errors.
 * @returns {AppError} - An instance of AppError with a specific error message
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Handles expired JWT errors.
 * @returns {AppError} - An instance of AppError with a specific error message
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * Sends a production-friendly error response.
 * @param {AppError} err - An instance of AppError or an error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

/**
 * Sends a development-friendly error response.
 * @param {AppError} err - An instance of AppError or an error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const sendErrorDev = (err, req, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });

/**
 * Express middleware for handling errors.
 * @param {Object} err - The error object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || false;

  if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    error.message = err.message;

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === '23505') {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError(error);
    }
    sendErrorProd(error, req, res);
  } else {
    sendErrorDev(err, req, res);
  }
};

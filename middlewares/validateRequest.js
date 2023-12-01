/**
 * validateRequest.js
 *
 * This module exports a middleware function that uses the express-validator
 * library to validate the request. If there are validation errors, it creates
 * an AppError instance with a 400 status code and passes it to the next
 * middleware. If there are no errors, it passes the request to the next
 * middleware in the stack.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */

const { validationResult } = require('express-validator');
const AppError = require('../services/AppError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    const errorMessage = `Invalid input data: ${errorMessages.join('. ')}`;
    const statusCode = 400;

    const error = new AppError(errorMessage, statusCode);

    return next(error);
  }

  next();
};

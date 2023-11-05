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

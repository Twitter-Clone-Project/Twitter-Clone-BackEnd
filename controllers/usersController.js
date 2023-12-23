/**
 * userValidationController.js
 */

const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const User = require('../models/entites/User');

/**
 * Middleware function to check if a username already exists in the database.
 * Responds with a JSON object indicating the status and whether the username is found.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.isUsernameFound = catchAsync(async (req, res, next) => {
  const { username } = req.params;
  const userRepository = AppDataSource.getRepository(User);
  let isFound = false;

  // if this email signed but not confirmed remove it
  const delResult = await userRepository.delete({
    isConfirmed: false,
    username,
  });

  if (!delResult.affected) {
    isFound = await userRepository.exist({
      where: { username },
    });
  }

  res.status(200).json({
    status: true,
    data: { isFound },
  });
});

/**
 * Middleware function to check if an email already exists in the database.
 * Responds with a JSON object indicating the status and whether the email is found.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.isEmailFound = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  const userRepository = AppDataSource.getRepository(User);
  let isFound = false;

  // if this email signed but not confirmed remove it
  const delResult = await userRepository.delete({
    isConfirmed: false,
    email,
  });

  if (!delResult.affected) {
    isFound = await userRepository.exist({
      where: { email },
    });
  }

  res.status(200).json({
    status: true,
    data: { isFound },
  });
});

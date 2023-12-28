/**
 * File: authController.js
 * Description: This file contains the authentication-related controllers for user signup, signin, and OAuth2 authentication.
 */

const jwt = require('jsonwebtoken');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const AuthService = require('../services/AuthService');

const authService = new AuthService();

/**
 * Filters object properties based on specified fields.
 * @param {Object} obj - The object to be filtered
 * @param {...string} fields - The fields to include in the filtered object
 * @returns {Object} - The filtered object
 */

const filterObj = (obj, ...fields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

/**
 * Generates a JWT token for a given user ID.
 * @param {string} id - The user ID
 * @returns {string} - The generated JWT token
 */
exports.signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_TOKEN_EXPIRESIN,
  });

/**
 * Creates and sends a JWT token along with user data in the response.
 * @param {Object} user - The user object
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {number} statusCode - The HTTP status code for the response
 */
const createAndSendToken = (user, req, res, statusCode) => {
  const token = this.signToken(user.userId);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRESIN * 1000 * 24 * 60 * 60,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  const filteredUser = filterObj(
    user,
    'username',
    'email',
    'userId',
    'isConfirmed',
    'isOnline',
    'name',
    'imageUrl',
    'birthDate',
    'website',
    'location',
    'bio',
    'bannerUrl',
    'followingsCount',
    'followersCount',
    'createdAt',
  );

  res.status(statusCode).json({
    status: true,
    data: { user: filteredUser, token },
  });
};

/**
 * Controller for user signup.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.signup = catchAsync(async (req, res, next) => {
  const { body } = req;

  const { user } = await authService.signup(body);

  res.status(201).json({
    status: true,
    data: {
      user: filterObj(
        user,
        'username',
        'isOnline',
        'email',
        'userId',
        'isConfirmed',
        'createdAt',
        'name',
        'imageUrl',
        'birthDate',
        'website',
        'location',
        'bio',
        'bannerUrl',
        'followingsCount',
        'followersCount',
      ),
    },
  });
});

/**
 * Controller for user signin.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.signin = catchAsync(async (req, res, next) => {
  const { body } = req;

  const { user } = await authService.login(body);

  createAndSendToken(user, req, res, 200);
});

/**
 * Controller for initiating Google OAuth2 authentication.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.signWithGoogle = catchAsync(async (req, res, next) => {
  const { body } = req;
  const { existingUser } = await authService.signWithGoogle(body);

  createAndSendToken(existingUser, req, res, 200);
});

/**
 * Controller for signing out.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.signout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: true, message: 'Signed out successfully' });
};

/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.requireAuth = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, please login to get access', 401),
    );
  }

  const { user } = await authService.checkAuth(token);

  req.currentUser = user;
  req.token = token;
  next();
});

/**
 * Controller for getting user information.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.getMe = catchAsync(async (req, res, next) => {
  const {
    currentUser: { userId },
  } = req;

  const { user } = await authService.currentAuthedUser(userId);

  res.status(200).json({
    status: true,
    data: {
      user: filterObj(
        user,
        'username',
        'email',
        'userId',
        'isConfirmed',
        'name',
        'createdAt',
        'imageUrl',
        'birthDate',
        'website',
        'location',
        'bio',
        'bannerUrl',
        'followingsCount',
        'followersCount',
        'isOnline',
      ),
    },
    token: req.token,
  });
});

/**
 * Middleware to check the provided OTP for email confirmation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.checkOTP = catchAsync(async (req, res, next) => {
  const { body } = req;
  const { newEmail } = body;

  const { user } = await authService.checkOTP(body);

  res.locals.user = user;
  res.locals.newEmail = newEmail;
  next();
});

/**
 * Controller for confirming user email after OTP validation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.confirmEmail = catchAsync(async (req, res, next) => {
  const { user } = res.locals;

  const { user: userConfirmed } = await authService.confirmUserEmail(user);

  createAndSendToken(userConfirmed, req, res, 200);
});

/**
 * Controller for resending email confirmation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.resendConfirmationEmail = catchAsync(async (req, res, next) => {
  const { body } = req;

  await authService.sendConfirmationEmail(body);

  res.status(200).json({
    status: true,
    message: 'Confirmation email reseneded',
  });
});

/**
 * Controller for changing the user's password.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.changePassword = catchAsync(async (req, res, next) => {
  const {
    currentUser: { userId },
    body,
  } = req;

  const { user } = await authService.changePassword(body, userId);

  createAndSendToken(user, req, res, 200);
});

/**
 * Controller for initiating the password reset process.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { body } = req;

  await authService.sendConfirmationEmail(body);

  res.status(200).json({
    status: true,
    message: 'Password reset email sent successfully',
  });
});

/**
 * Controller for resetting the user's password after the reset request.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const {
    currentUser: { email },
    body,
  } = req;

  await authService.resetPassword(body, email);

  res.status(200).json({
    status: true,
    message: 'Password reseted successfully',
  });
});

/**
 * Middleware function to check if a username already exists in the database.
 * Responds with a JSON object indicating the status and whether the username is found.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.isUsernameFound = catchAsync(async (req, res, next) => {
  const {
    params: { username },
  } = req;

  if (!username) return next(new AppError('Enter the username', 400));

  const { isFound } = await authService.isUserFoundByUsername(username);

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
  const {
    params: { email },
  } = req;

  if (!email) return next(new AppError('Enter the email', 400));

  const { isFound } = await authService.isUserFoundByEmail(email);

  res.status(200).json({
    status: true,
    data: { isFound },
  });
});

module.exports.createAndSendToken = createAndSendToken;

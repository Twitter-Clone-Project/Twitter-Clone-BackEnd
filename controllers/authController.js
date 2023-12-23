/**
 * File: authController.js
 * Description: This file contains the authentication-related controllers for user signup, signin, and OAuth2 authentication.
 */

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { promisify } = require('util');
const crypto = require('crypto');

const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const Password = require('../services/Password');
const User = require('../models/entites/User');
const Email = require('../services/Email');

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
  const { name, username, email, password, dateOfBirth, gRecaptchaResponse } =
    req.body;

  const userRepository = AppDataSource.getRepository(User);

  // if this email signed but not confirmed remove it
  await userRepository.delete({
    isConfirmed: false,
    email,
    username,
  });

  if (process.env.NODE_ENV === 'production') {
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.ReCAPTCHA_SECRET_KEY}&response=${gRecaptchaResponse}`;

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const result = await response.json();
      if (!result.success) {
        return next(new AppError('reCAPTCHA verification failed'));
      }
    } else {
      return next(new AppError('Error in reCAPTCHA verification'));
    }
  }
  const hashedPassword = await Password.hashPassword(password);
  const user = new User(username, name, email, hashedPassword, dateOfBirth);

  const otp = user.createOTP();
  await userRepository.insert(user);

  await new Email(user, { otp }).sendConfirmationEmail();

  setTimeout(
    async () => {
      await userRepository
        .createQueryBuilder()
        .delete()
        .where('isConfirmed = false AND email = :email', { email: user.email })
        .execute();
    },
    2 * 60 * 1000,
  );

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
  const { email, password } = req.body;
  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select([
      'user.username',
      'user.email',
      'user.userId',
      'user.isConfirmed',
      'user.name',
      'user.imageUrl',
      'user.birthDate',
      'user.website',
      'user.location',
      'user.bio',
      'user.bannerUrl',
      'user.followingsCount',
      'user.followersCount',
      'user.createdAt',
      'user.isOnline',
    ])
    .from(User, 'user')
    .where('user.email = :email', { email })
    .addSelect('user.password')
    .getOne();

  if (!user) return next(new AppError('No User With Email', 400));

  const isCorrectPassword = await Password.comparePassword(
    password,
    user.password,
  );

  if (!isCorrectPassword) return next(new AppError('Wrong Password', 400));

  createAndSendToken(user, req, res, 200);
});

/**
 * Controller for initiating Google OAuth2 authentication.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.signWithGoogle = catchAsync(async (req, res, next) => {
  const { googleAccessToken } = req.body;

  if (!googleAccessToken) {
    return next(new AppError('The Google Access Token is required', 400));
  }
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
      },
    },
  );

  const { email, name } = await response.json();

  const existingUser = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select([
      'user.username',
      'user.email',
      'user.isOnline',
      'user.userId',
      'user.isConfirmed',
      'user.name',
      'user.imageUrl',
      'user.birthDate',
      'user.website',
      'user.location',
      'user.bio',
      'user.bannerUrl',
      'user.followingsCount',
      'user.followersCount',
      'user.createdAt',
    ])
    .from(User, 'user')
    .where('user.email = :email', { email })
    .getOne();

  if (!existingUser) {
    return next(new AppError('User not found. Please go to sign up', 404));
  }

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

  const payload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY,
  );

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select([
      'user.username',
      'user.email',
      'user.userId',
      'user.isConfirmed',
      'user.isOnline',
      'user.socketId',
    ])
    .from(User, 'user')
    .where('user.userId = :userId', { userId: payload.id })
    .getOne();

  if (!user) {
    return next(new AppError('User does no longer exist', 401));
  }

  req.currentUser = user;
  next();
});

/**
 * Controller for getting user information.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.getMe = catchAsync(async (req, res, next) => {
  // await socketService.emitNotification(62, req.currentUser.userId, 'Follow');
  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: req.currentUser.userId },
    select: {
      userId: true,
      createdAt: true,
      isConfirmed: true,
      isOnline: true,
      username: true,
      email: true,
      name: true,
      imageUrl: true,
      birthDate: true,
      bio: true,
      location: true,
      website: true,
      bannerUrl: true,
      followingsCount: true,
      followersCount: true,
    },
  });

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
  });
});

/**
 * Middleware to check the provided OTP for email confirmation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.checkOTP = catchAsync(async (req, res, next) => {
  const { otp, email, newEmail } = req.body;
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: {
      email: email,
    },
    select: {
      userId: true,
      isConfirmed: true,
      otpExpires: true,
      createdAt: true,
      otp: true,
      username: true,
      isOnline: true,
      email: true,
      name: true,
      imageUrl: true,
      birthDate: true,
      bio: true,
      location: true,
      website: true,
      bannerUrl: true,
      followingsCount: true,
      followersCount: true,
    },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.getOtp() !== hashedOTP) {
    return next(new AppError('Incorrect OTP', 400));
  }

  user.setOtp(null);
  if (new Date() > user.otpExpires) {
    user.setOtpExpires(null);
    await userRepository.save(user);
    return next(new AppError('OTP expired', 400));
  }

  user.setOtpExpires(null);

  res.locals.userRepository = userRepository;
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
  const { userRepository, user } = res.locals;

  user.setIsConfirmed(true);
  await userRepository.save(user);

  createAndSendToken(user, req, res, 200);
});

/**
 * Controller for resending email confirmation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.resendConfirmationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await AppDataSource.getRepository(User).findOne({
    where: { email },
    select: {
      userId: true,
      createdAt: true,
      isConfirmed: true,
      isOnline: true,
      username: true,
      email: true,
      name: true,
      imageUrl: true,
      birthDate: true,
      bio: true,
      location: true,
      website: true,
      bannerUrl: true,
      followingsCount: true,
      followersCount: true,
    },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }
  const userRepository = AppDataSource.getRepository(User);

  const otp = user.createOTP();
  await userRepository.save(user);

  await new Email(user, { otp }).sendConfirmationEmail();

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
  const { currentPassword, newPassword } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository
    .createQueryBuilder()
    .select([
      'user.username',
      'user.email',
      'user.userId',
      'user.isConfirmed',
      'user.createdAt',
      'user.isOnline',
      'user.name',
      'user.imageUrl',
      'user.birthDate',
      'user.website',
      'user.location',
      'user.bio',
      'user.bannerUrl',
      'user.followingsCount',
      'user.followersCount',
    ])
    .from(User, 'user')
    .where('user.userId = :userId', { userId: req.currentUser.userId })
    .addSelect('user.password')
    .getOne();

  const checkPassword = await Password.comparePassword(
    currentPassword,
    user.password,
  );

  if (!checkPassword) {
    return next(new AppError('Your Current Password is Wrong', 400));
  }

  const hashedPassword = await Password.hashPassword(newPassword);
  await userRepository.update(
    { userId: req.currentUser.userId },
    { password: hashedPassword },
  );

  createAndSendToken(user, req, res, 200);
});

/**
 * Controller for initiating the password reset process.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 */
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email },
    select: { email: true, userId: true, name: true },
  });

  if (!user) {
    return next(new AppError('No user registered with this email ', 404));
  }

  const otp = user.createOTP();
  await userRepository.save(user);

  try {
    await new Email(user, { otp }).sendConfirmationEmail();
  } catch (error) {
    user.setOtp(null);
    user.setOtpExpires(null);
    await userRepository.save(user);

    return next(new AppError('Error in sending the reset password email', 400));
  }

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
  const { newPassword } = req.body;

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email: req.currentUser.email },
    select: {
      userId: true,
      isConfirmed: true,
      createdAt: true,
      username: true,
      isOnline: true,
      email: true,
      name: true,
      imageUrl: true,
      birthDate: true,
      bio: true,
      location: true,
      website: true,
      bannerUrl: true,
      followingsCount: true,
      followersCount: true,
    },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const hashedPassword = await Password.hashPassword(newPassword);
  user.setPassword(hashedPassword);

  await userRepository.save(user);

  res.status(200).json({
    status: true,
    message: 'Password reseted  successfully',
  });
});

module.exports.createAndSendToken = createAndSendToken ;

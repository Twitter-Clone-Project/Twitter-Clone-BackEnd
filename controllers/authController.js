const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { promisify } = require('util');
const crypto = require('crypto');

const { AppDataSource } = require('../dataSource');
const catchAsync = require('../Middlewares/catchAsync');
const AppError = require('../Services/AppError');
const Password = require('../Services/Password');
const User = require('../Models/Entites/User');
const Email = require('../Services/Email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_TOKEN_EXPIRESIN,
  });

const createAndSendToken = (user, req, res, statusCode) => {
  const token = signToken(user.userId);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRESIN * 1000 * 24 * 60 * 60,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(statusCode).json({
    status: true,
    data: { user, token },
  });
};

const getUserData = async (accessToken) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
  );

  const userData = await response.json();
  return userData;
};

const createOAuth2Client = () => {
  const redirectUrl = 'https://ticketing.dev/api/users/auth/google/callback';

  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID_GOOGLE,
    process.env.CLIENT_SECRET_GOOGLE,
    redirectUrl,
  );

  return oAuth2Client;
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, username, email, password, dateOfBirth, gRecaptchaResponse } =
    req.body;

  // const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.ReCAPTCHA_SECRET_KEY}&response=${gRecaptchaResponse}`;

  // const response = await fetch(verificationUrl, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });

  // if (response.ok) {
  //   const result = await response.json();
  //   if (!result.success) {
  //     return next(new AppError('reCAPTCHA verification failed'));
  //   }
  // } else {
  //   return next(new AppError('Error in reCAPTCHA verification'));
  // }

  const hashedPassword = await Password.hashPassword(password);
  const user = new User(username, name, email, hashedPassword, dateOfBirth);

  const otp = user.createOTP();
  await AppDataSource.getRepository(User).save(user);

  await new Email(user, { otp }).sendConfirmationEmail();

  createAndSendToken(
    {
      email: user.email,
      name: user.name,
      username: user.username,
      userId: user.userId,
    },
    req,
    res,
    201,
  );
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await AppDataSource.getRepository(User).findOne({
    where: { email },
    select: {
      password: true,
      username: true,
      name: true,
      email: true,
      userId: true,
    },
  });

  if (!user) return next(new AppError('No User With Email', 400));

  const isCorrectPassword = await Password.comparePassword(
    password,
    user.password,
  );

  if (!isCorrectPassword) return next(new AppError('Wrong Password', 400));

  user.password = undefined;
  createAndSendToken(user, req, res, 200);
});

exports.signWithGoogle = (req, res) => {
  const oAuth2Client = createOAuth2Client();

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope:
      'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid ',
    prompt: 'consent',
  });

  res.json({ url: authorizeUrl });
};

exports.oauthGooogleCallback = async (req, res, next) => {
  const { code } = req.query;

  const oAuth2Client = createOAuth2Client();

  const response = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(response.tokens);
  const userData = await getUserData(oAuth2Client.credentials.access_token);

  const user = await AppDataSource.getRepository(User).findOne({
    where: { email: userData.email },
    select: {
      username: true,
      name: true,
      email: true,
      userId: true,
    },
  });

  if (!user) {
    return next(new AppError('User not found. Please go to sign up'));
  }

  const token = signToken(user.id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRESIN * 1000 * 24 * 60 * 60,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.redirect(303, `${req.protocol}://${req.get('host')}/home`);
};

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

  const user = await AppDataSource.getRepository(User).findOne({
    where: { userId: payload.id },
    select: {
      username: true,
      name: true,
      email: true,
      userId: true,
    },
  });

  if (!user) {
    return next(new AppError('User does no longer exist', 401));
  }

  req.currentUser = user;
  next();
});

exports.confirmEmailByOTP = catchAsync(async (req, res, next) => {
  const userRepository = AppDataSource.getRepository(User);

  const { otp } = req.body;
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await AppDataSource.getRepository(User).findOne({
    where: {
      email: req.currentUser.email,
      otp: hashedOTP,
    },
    select: {
      otpExpires: true,
      username: true,
      name: true,
      email: true,
      userId: true,
    },
  });

  if (!user) {
    return next(new AppError('Incorrect OTP', 400));
  }

  user.otp = null;

  if (new Date() > user.otpExpires) {
    user.otpExpires = null;
    await userRepository.save(user);
    return next(new AppError('OTP expired', 400));
  }

  user.otpExpires = null;
  user.isConfirmed = true;
  await userRepository.save(user);

  res
    .status(200)
    .json({ status: true, message: 'Email confirmed successfully' });
});

exports.resendConfirmationEmail = catchAsync(async (req, res, next) => {
  const user = req.currentUser;

  const otp = user.createOTP();
  await AppDataSource.getRepository(User).save(user);

  await new Email(user, { otp }).sendConfirmationEmail();
});

exports.signout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

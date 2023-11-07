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

const filterObj = (obj, ...fields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

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

  const filteredUser = filterObj(
    user,
    'userId',
    'isConfirmed',
    'username',
    'email',
  );

  res.status(statusCode).json({
    status: true,
    data: { user: filteredUser, token },
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
  await AppDataSource.getRepository(User).insert(user);

  await new Email(user, { otp }).sendConfirmationEmail();

  createAndSendToken(user, req, res, 201);
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select(['user.username', 'user.email', 'user.userId', 'user.isConfirmed'])
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

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select(['user.userId', 'user.isConfirmed'])
    .from(User, 'user')
    .where('user.email = :email', { email: userData.email })
    .getOne();

  if (!user) {
    return next(new AppError('User not found. Please go to sign up'));
  }

  const token = signToken(user.userId);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRESIN * 1000 * 24 * 60 * 60,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.redirect(303, `${req.protocol}://${req.get('host')}/home`);
};

exports.signout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res
    .status(200)
    .json({ status: 'success', message: 'Signed out successfully' });
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

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .select(['user.username', 'user.email', 'user.userId', 'user.isConfirmed'])
    .from(User, 'user')
    .where('user.userId = :userId', { userId: payload.id })
    .getOne();

  if (!user) {
    return next(new AppError('User does no longer exist', 401));
  }

  req.currentUser = user;
  next();
});

exports.confirmEmailByOTP = catchAsync(async (req, res, next) => {
  const { otp } = req.body;
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: {
      email: req.currentUser.email,
      otp: hashedOTP,
    },
    select: {
      otpExpires: true,
      isConfirmed: true,
      email: true,
      userId: true,
    },
  });

  if (!user) {
    return next(new AppError('Incorrect OTP', 400));
  }

  user.setOtp(null);
  if (new Date() > user.otpExpires) {
    user.setOtpExpires(null);
    await userRepository.save(user);
    return next(new AppError('OTP expired', 400));
  }

  user.setOtpExpires(null);
  user.setIsConfirmed(true);
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

  res.status(200).json({
    status: true,
    message: 'Confirmation email reseneded',
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository
    .createQueryBuilder()
    .select(['user.username', 'user.email', 'user.userId', 'user.isConfirmed'])
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

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { email },
    select: { email: true, userId: true, name: true },
  });

  if (!user) {
    return next(new AppError('No user registered with this email ', 400));
  }

  const resetToken = user.createPasswordResetToken();
  await userRepository.save(user);

  try {
    const url = `${req.protocol}://${req.get(
      'host',
    )}/resetPassword/${resetToken}`; //reset page url
    await new Email(user, { url }).sendResetPasswordEmail();
  } catch (error) {
    user.setPasswordResetToken(null);
    user.setPasswordResetTokenExpires(null);
    await userRepository.save(user);

    return next(new AppError('Error in sending the reset password email', 400));
  }

  res.status(200).json({
    status: true,
    message: 'Password reset email sent successfully',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  const hashedResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { passwordResetToken: hashedResetToken },
    select: { userId: true, passwordResetTokenExpires: true },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.setPasswordResetToken(null);

  if (user.passwordResetTokenExpires < new Date()) {
    user.setPasswordResetTokenExpires(null);
    await userRepository.save(user);

    return next(new AppError('Token expired', 400));
  }

  const hashedPassword = await Password.hashPassword(newPassword);
  user.setPassword(hashedPassword);
  user.setPasswordResetTokenExpires(null);
  await userRepository.save(user);

  res.status(200).json({
    status: true,
    message: 'Password reseted successfully ',
  });
});

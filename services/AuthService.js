const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const { AppDataSource } = require('../dataSource');
const AppError = require('./AppError');
const Password = require('./Password');
const User = require('../models/entites/User');
const Email = require('./Email');

/**
 * @class AuthService
 * @description Provides authentication-related functionalities for user registration, login, and related actions.
 */
class AuthService {
  constructor(model) {}

  /**
   * Handles user registration, including email verification through reCAPTCHA.
   * @method signup
   * @param {Object} body - An object containing user registration details (name, username, email, password, dateOfBirth, gRecaptchaResponse).
   * @returns {Object} - An object containing the newly registered user.
   */
  signup = async (body) => {
    const { name, username, email, password, dateOfBirth, gRecaptchaResponse } =
      body;

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
          throw new AppError('reCAPTCHA verification failed');
        }
      } else {
        throw new AppError('Error in reCAPTCHA verification');
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
          .where('isConfirmed = false AND email = :email', {
            email: user.email,
          })
          .execute();
      },
      2 * 60 * 1000,
    );

    return { user };
  };

  /**
   * Handles user login, validating credentials and returning user information upon successful login.
   * @method login
   * @param {Object} body - An object containing user login details (email, password).
   * @returns {Object} - An object containing user information.
   */
  login = async (body) => {
    const { email, password } = body;
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

    if (!user) throw new AppError('No User With Email', 400);

    const isCorrectPassword = await Password.comparePassword(
      password,
      user.password,
    );

    if (!isCorrectPassword) throw new AppError('Wrong Password', 400);

    return { user };
  };

  /**
   * Handles user authentication using Google OAuth, returning user information if the user exists.
   * @method signWithGoogle
   * @param {Object} body - An object containing the Google Access Token (`googleAccessToken`).
   * @returns {Object} - An object containing existing user information if found.
   */
  signWithGoogle = async (body) => {
    const { googleAccessToken } = body;

    if (!googleAccessToken) {
      throw new AppError('The Google Access Token is required', 400);
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
      throw new AppError('User not found. Please go to sign up', 404);
    }
    return { existingUser };
  };

  /**
   * Verifies and retrieves user information based on the provided JWT token.
   * @method checkAuth
   * @param {string} token - JWT token for user authentication.
   * @returns {Object} - An object containing user information.
   */
  checkAuth = async (token) => {
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
      ])
      .from(User, 'user')
      .where('user.userId = :userId', { userId: payload.id })
      .getOne();

    if (!user) {
      throw new AppError('User does no longer exist', 401);
    }
    return { user };
  };

  /**
   * Retrieves user information based on the provided userId.
   * @method currentAuthedUser
   * @param {string} userId - The userId for the user.
   * @returns {Object} - An object containing user information.
   */
  currentAuthedUser = async (userId) => {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { userId },
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
    return { user };
  };

  /**
   * Validates the provided OTP (One-Time Password) for user email confirmation.
   * @method checkOTP
   * @param {Object} body - An object containing OTP and email for validation.
   * @returns {Object} - An object containing user information if OTP is correct and not expired.
   */
  checkOTP = async (body) => {
    const { otp, email } = body;
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: {
        email,
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
      throw new AppError('User not found', 404);
    }

    if (user.getOtp() !== hashedOTP) {
      throw new AppError('Incorrect OTP', 400);
    }

    user.setOtp(null);
    if (new Date() > user.otpExpires) {
      user.setOtpExpires(null);
      await userRepository.save(user);
      throw new AppError('OTP expired', 400);
    }

    user.setOtpExpires(null);

    return { user };
  };

  /**
   * Confirms the user's email after successful validation of OTP.
   * @method confirmUserEmail
   * @param {Object} user - The user object to confirm the email for.
   * @returns {Object} - An object containing the confirmed user information.
   */
  confirmUserEmail = async (user) => {
    const userRepository = AppDataSource.getRepository(User);
    user.setIsConfirmed(true);
    await userRepository.save(user);

    return { user };
  };

  /**
   * Sends a confirmation email with a new OTP for the provided email.
   * @method sendConfirmationEmail
   * @param {Object} body - An object containing the email for which the confirmation email should be sent.
   * @returns {void}
   */
  sendConfirmationEmail = async (body) => {
    const { email } = body;

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
      throw new AppError('User not found', 404);
    }
    const userRepository = AppDataSource.getRepository(User);

    const otp = user.createOTP();
    await userRepository.save(user);

    try {
      await new Email(user, { otp }).sendConfirmationEmail();
    } catch (error) {
      user.setOtp(null);
      user.setOtpExpires(null);

      await userRepository.save(user);
      throw new AppError('Error in sending the reset password email', 400);
    }
  };

  /**
   * Changes the user's password after validating the current password.
   * @method changePassword
   * @param {Object} body - An object containing the currentPassword and newPassword for the password change.
   * @param {string} userId - The userId for the user whose password is to be changed.
   * @returns {Object} - An object containing the updated user information.
   */
  changePassword = async (body, userId) => {
    const { currentPassword, newPassword } = body;

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
      .where('user.userId = :userId', { userId })
      .addSelect('user.password')
      .getOne();

    const checkPassword = await Password.comparePassword(
      currentPassword,
      user.password,
    );

    if (!checkPassword) {
      throw new AppError('Your Current Password is Wrong', 400);
    }

    const hashedPassword = await Password.hashPassword(newPassword);
    await userRepository.update({ userId }, { password: hashedPassword });

    return { user };
  };

  /**
   * Resets the user's password after validating the reset request.
   * @method resetPassword
   * @param {Object} body - An object containing the newPassword for the password reset.
   * @param {string} email - The email of the user whose password is to be reset.
   * @returns {void}
   */
  resetPassword = async (body, email) => {
    const { newPassword } = body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email },
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

    if (!user) throw new AppError('User not found', 404);

    const hashedPassword = await Password.hashPassword(newPassword);
    user.setPassword(hashedPassword);

    await userRepository.save(user);
  };

  /**
   * Checks if a user with the provided username exists.
   * @method isUserFoundByUsername
   * @param {string} username - The username to check for existence.
   * @returns {Object} - An object indicating whether the user with the given username exists.
   */
  isUserFoundByUsername = async (username) => {
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

    return { isFound };
  };

  /**
   * Checks if a user with the provided email exists.
   * @method isUserFoundByEmail
   * @param {Object} params - An object containing the email to check for existence.
   * @returns {Object} - An object indicating whether the user with the given email exists.
   */
  isUserFoundByEmail = async (email) => {
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

    return { isFound };
  };
}

module.exports = AuthService;

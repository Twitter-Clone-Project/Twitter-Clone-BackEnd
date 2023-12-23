/**
 * testSetup.js
 *
 * This module contains setup code for testing using Jest and Supertest.
 * It initializes the necessary components, sets up mock functions, and
 * provides a global function for obtaining an authentication token.
 */

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const uuid = require('uuid');

const app = require('../app');
const { AppDataSource } = require('../dataSource');
const User = require('../models/entites/User');
const { signToken } = require('../controllers/authController');
const Password = require('../services/Password');

jest.mock('../services/Email.js');

beforeAll(async () => {
  await AppDataSource.initialize();

  if (AppDataSource.isInitialized) {
    console.log('Test db connected');
  }
});
beforeEach(async () => {
  // Clear all tables before each test
  // await clearDatabase();
});

afterAll(async () => {
  await AppDataSource.dropDatabase();
  console.log('Test db dropped');
});

global.signin = async (email, username) => {
  const hashedPassword = await Password.hashPassword('password');
  const user = new User(
    username,
    'Mahmoud Yahia',
    email,
    hashedPassword,
    '2023-11-03',
  );

  const otp = user.createOTP();

  const userRepository = AppDataSource.getRepository(User);
  user.isConfirmed = true;
  const user2 = await userRepository.insert(user);

  const token = signToken(user2.identifiers[0].userId);

  const userData = await userRepository.findOne({
    select: {
      userId: true,
    },
    where: { email },
  });

  return { token: `jwt=${token}`, otp, userId: userData.userId };
};

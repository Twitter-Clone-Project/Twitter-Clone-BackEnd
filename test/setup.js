/**
 * testSetup.js
 *
 * This module contains setup code for testing using Jest and Supertest.
 * It initializes the necessary components, sets up mock functions, and
 * provides a global function for obtaining an authentication token.
 */

const request = require('supertest');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });
const uuid = require('uuid');

const app = require('../app');
const { AppDataSource } = require('../dataSource');

beforeAll(async () => {
  jest.mock('../services/Email.js', () => {
    return jest.fn().mockImplementation(() => ({
      sendConfirmationEmail: jest.fn().mockResolvedValue(),
    }));
  });

  await AppDataSource.initialize();

  if (AppDataSource.isInitialized) {
    console.log('Test db connected');
  }
});

// beforeEach(async () => {
//   const tablesToClear = ['table_name1', 'table_name2']; // List of tables to truncate or delete

//   for (const table of tablesToClear) {
//     await pgPool.query(`TRUNCATE ${table} RESTART IDENTITY`);
//   }
// });

afterAll(async () => {
  await AppDataSource.dropDatabase();
  console.log('Test db dropped');
});

global.getToken = async () => {
  const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
  const uniqueUsername = `user_${uuid.v4()}`;
  const authRes = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      name: 'Mahmoud Yahia',
      username: uniqueUsername,
      email: uniqueEmail,
      password: 'password',
      passwordConfirm: 'password',
      dateOfBirth: '2023-11-03',
      gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
    })
    .set('Content-Type', 'application/json');

  const cookie = authRes.get('Set-Cookie');

  return cookie;
};

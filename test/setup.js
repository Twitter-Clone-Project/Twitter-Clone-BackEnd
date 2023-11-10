const request = require('supertest');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const app = require('../app');
// const { TestAppDataSource } = require('../dataSource');

beforeAll(async () => {
  // await TestAppDataSource.initialize();
});

// beforeEach(async () => {
//   const tablesToClear = ['table_name1', 'table_name2']; // List of tables to truncate or delete

//   for (const table of tablesToClear) {
//     await pgPool.query(`TRUNCATE ${table} RESTART IDENTITY`);
//   }
// });

afterAll(async () => {
  // await TestAppDataSource.dropDatabase();
});

global.signin = async () => {
  const authRes = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'user@example.com',
      password: 'password',
      passwordConfirm: 'password',
      name: 'user',
    })
    .expect(201);

  const cookie = authRes.get('Set-Cookie');

  return cookie;
};

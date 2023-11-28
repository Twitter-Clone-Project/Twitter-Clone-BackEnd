const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/users/:username/isUsernameFound', () => {
  test('returns 404, username not found', async () => {
    // const email = `testuser_${uuid.v4()}@example.com`;
    // const res = await request(app).get('/api/v1/users/7oooda/isEmailFound');
    // console.log(res);
    // expect(res.statusCode).toEqual(404);
    // expect(5).toBe(5);
  });

  // test('returns 200, username found', async () => {
  //   const email = `testuser_${uuid.v4()}@example.com`;
  //   const res = await request(app)
  //     .get('/api/v1/users/@7oooda/isUsernameFound')
  //     .set('Content-Type', 'application/json');
  //   expect(res.statusCode).toEqual(404);
  // });
});

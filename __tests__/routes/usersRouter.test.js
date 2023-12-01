const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/users/:username/isUsernameFound', () => {
  test('returns 404, username not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    await request(app).get('/api/v1/users/7oooda/isEmailFound').expect(404);
  });

  test('returns 200, username found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/${username}/isUsernameFound`)
      .expect(200);
  });
});

describe('GET /api/v1/users/:email/isEmailFound', () => {
  test('returns 404, email not found', async () => {
    await request(app)
      .get('/api/v1/users/7oooda@example.com/isEmailFound')
      .expect(404);
  });

  test('returns 200, email found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);

    await request(app).get(`/api/v1/users/${email}/isEmailFound`).expect(200);
  });
});

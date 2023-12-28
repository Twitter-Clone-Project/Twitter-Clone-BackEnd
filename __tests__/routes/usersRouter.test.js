const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/users/:username/isUsernameFound', () => {
  test('returns 404, username not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const { body } = await request(app)
      .get('/api/v1/users/7oooda/isUsernameFound')
      .expect(200);
    expect(body.data.isFound).toBe(false);
  });

  test('returns 200, username found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);
    const { body } = await request(app)
      .get(`/api/v1/users/${username}/isUsernameFound`)
      .expect(200);
    expect(body.data.isFound).toBe(true);
  });
});

describe('GET /api/v1/users/:email/isEmailFound', () => {
  test('returns 404, email not found', async () => {
    const { body } = await request(app)
      .get('/api/v1/users/7oooda@example.com/isEmailFound')
      .expect(200);

    expect(body.data.isFound).toBe(false);
  });

  test('returns 200, email found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);

    const { body } = await request(app)
      .get(`/api/v1/users/${email}/isEmailFound`)
      .expect(200);
    expect(body.data.isFound).toBe(true);
  });
});

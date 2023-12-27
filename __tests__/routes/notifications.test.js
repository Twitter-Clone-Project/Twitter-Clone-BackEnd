const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/notifications/', () => {
  test('returns 404, username not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    await request(app).get('/api/v1/notifictoins').expect(404);
  });

  test('returns 200, return notifications', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);

    await request(app).get(`/api/v1/notifications`).expect(200);
  });
});

describe('GET /api/v1/notifications/unseenNotificationsCnt', () => {
  test('returns 404, email not found', async () => {
    await request(app)
      .get('/api/v1/notifications/unseenNotificationsCnt')
      .expect(404);
  });

  test('returns 200, cnt returned', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    await global.signin(email, username);

    await request(app)
      .get(`/api/v1/notifications/unseenNotificationsCnt`)
      .expect(200);
  });
});

const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/conversations', () => {
  test('returns 404, username not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    await request(app).get('/api/v1/conversations').expect(401);
  });

  test('returns 200, return conversations', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    await request(app)
      .get(`/api/v1/conversations`)
      .set('Cookie', token)
      .expect(200);
  });

  test('returns 200, return startConversation', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await global.signin(email + '45', username + '45');

    const { body } = await request(app)
      .post(`/api/v1/conversations/startConversation`)
      .set('Cookie', token)
      .send({ userIds: [2] })
      .expect(200);
  });

  test('returns 200, leaveConversation', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await global.signin(email + '45', username + '45');

    await request(app)
      .post(`/api/v1/conversations/startConversation`)
      .set('Cookie', token)
      .send({ userIds: [2] });

    const { body } = await request(app)
      .delete(`/api/v1/conversations/leaveConversation`)
      .set('Cookie', token)
      .send({ conversationId: 1 })
      .expect(200);
  });

  test('returns 200, get unseen Conversations Cnt', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    await request(app)
      .get(`/api/v1/conversations/unseenConversationsCnt`)
      .set('Cookie', token)
      .expect(200);
  });

  test('returns 200, return conversations history', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await global.signin(email + '45', username + '45');

    await request(app)
      .post(`/api/v1/conversations/startConversation`)
      .set('Cookie', token)
      .send({ userIds: [2] });

    await request(app)
      .get(`/api/v1/conversations/1/history`)
      .set('Cookie', token)
      .expect(200);
  });
});

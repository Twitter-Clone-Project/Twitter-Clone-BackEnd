const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('POST /api/v1/tweets/add', () => {
  jest.setTimeout(100000);

  it('try to add empty tweet text and no media', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post('/api/v1/tweets/add')
      .set('Cookie', token)
      .field('tweetText', '')
      .set('Content-Type', 'multipart/form-data');
    expect(response.status).toEqual(400);
  });

  it('successfully adding non empty tweet and no media', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post('/api/v1/tweets/add')
      .set('Cookie', token)
      .field('tweetText', 'tweet test')
      .set('Content-Type', 'multipart/form-data');
    expect(response.status).toEqual(200);
  });

  it('successfully adding non empty tweet with trends and no media', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post('/api/v1/tweets/add')
      .set('Cookie', token)
      .field('tweetText', 'tweet test')
      .field('trends', 'trend test')
      .set('Content-Type', 'multipart/form-data');
    expect(response.status).toEqual(200);
  });
});

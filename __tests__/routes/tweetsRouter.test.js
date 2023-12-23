const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

async function createTestTweet(email, username) {
  const { token } = await global.signin(email, username);

  const response = await request(app)
    .post('/api/v1/tweets/add')
    .set('Cookie', token)
    .field('tweetText', 'test tweet')
    .set('Content-Type', 'multipart/form-data');

  const tweetId = BigInt(response.body.data.id);
  return { token, tweetId };
}

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

describe('DELETE /api/v1/tweets/:tweetId/deleteTweet', () => {
  jest.setTimeout(100000);

  it('successfully delete a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .delete(`/api/v1/tweets/${tweetId}/deleteTweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });

  it('attempt to delete a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/tweets/${fakeTweetId}/deleteTweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('GET /api/v1/tweets/:tweetId', () => {
  jest.setTimeout(100000);

  it('successfully retrieved a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .get(`/api/v1/tweets/${tweetId}`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to get a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .get(`/api/v1/tweets/${fakeTweetId}`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('GET /api/v1/tweets/:tweetId/media', () => {
  jest.setTimeout(100000);

  it('successfully retrieved media of a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .get(`/api/v1/tweets/${tweetId}/media`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to get media of a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .get(`/api/v1/tweets/${fakeTweetId}/media`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

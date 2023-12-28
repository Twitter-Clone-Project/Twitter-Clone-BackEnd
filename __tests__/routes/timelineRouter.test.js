const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/users/:pageNum/timeline', () => {
  test('try to get a list of tweets & retweets without sign in', async () => {
    const pageNum = 1;
    await request(app).get(`/api/v1/users/${pageNum}/timeline`).expect(401);
  });

  test('try to get list of tweets & retweets', async () => {
    const pageNum = 1;
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/${pageNum}/timeline`)
      .set('Cookie', token)
      .expect(200);
  });
});

describe('GET /api/v1/users/:username/tweets/:pageNum', () => {
  test('try to get a list of tweets for certain user without sign in', async () => {
    const username = `user_${uuid.v4()}`;
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/tweets/${pageNum}`)
      .expect(401);
  });

  test('try to get a list of tweets for certain user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/tweets/${pageNum}`)
      .set('Cookie', token)
      .expect(200);
  });
});

describe('GET /api/v1/users/:username/mentions/:pageNum', () => {
  test('try to get a list of mentions for certain user without sign in', async () => {
    const username = `user_${uuid.v4()}`;
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/mentions/${pageNum}`)
      .expect(401);
  });

  test('try to get a list of mentions for certain user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/mentions/${pageNum}`)
      .set('Cookie', token)
      .expect(200);
  });
});

describe('GET /api/v1/users/:username/likedTweets/:pageNum', () => {
  test('try to get a list of likedTweets for certain user without sign in', async () => {
    const username = `user_${uuid.v4()}`;
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/likedTweets/${pageNum}`)
      .expect(401);
  });

  test('try to get a list of likedTweets for certain user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    const pageNum = 1;
    await request(app)
      .get(`/api/v1/users/${username}/likedTweets/${pageNum}`)
      .set('Cookie', token)
      .expect(200);
  });
});

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
async function createTestReply(token, tweetId) {
  const response = await request(app)
    .post(`/api/v1/tweets/${tweetId}/addReply`)
    .set('Cookie', token)
    .send({
      text: 'reply test',
    })
    .set('Content-Type', 'application/json');

  const replyId = BigInt(response.body.data.replyId);
  return { replyId };
}

async function createTestLike(token, tweetId) {
  const response = await request(app)
    .post(`/api/v1/tweets/${tweetId}/addLike`)
    .set('Cookie', token);
}

async function createTestRetweet(token, tweetId) {
  const response = await request(app)
    .post(`/api/v1/tweets/${tweetId}/retweet`)
    .set('Cookie', token);
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

describe('POST /api/v1/tweets/:tweetId/addLike', () => {
  jest.setTimeout(100000);

  it('successfully adding like to a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${tweetId}/addLike`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to add like to a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${fakeTweetId}/addLike`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('DELETE /api/v1/tweets/:tweetId/deleteLike', () => {
  jest.setTimeout(100000);

  it('successfully deleting like from a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);
    await createTestLike(token,tweetId);
    const response = await request(app)
      .delete(`/api/v1/tweets/${tweetId}/deleteLike`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to delete like from a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/tweets/${fakeTweetId}/deleteLike`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('POST /api/v1/tweets/:tweetId/retweet', () => {
  jest.setTimeout(100000);

  it('successfully retweeting to a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${tweetId}/retweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to retweet to a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${fakeTweetId}/retweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('DELETE /api/v1/tweets/:tweetId/deleteRetweet', () => {
  jest.setTimeout(100000);

  it('successfully unretweet a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);
    await createTestRetweet(token,tweetId);
    const response = await request(app)
      .delete(`/api/v1/tweets/${tweetId}/deleteRetweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to unretweet a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/tweets/${fakeTweetId}/deleteRetweet`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

describe('POST /api/v1/tweets/:tweetId/addReply', () => {
  jest.setTimeout(100000);

  it('successfully add reply to a tweet with existing tweet ID', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${tweetId}/addReply`)
      .set('Cookie', token)
      .send({
        text: 'reply test',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toEqual(200);
  });
  it('attempt to add reply to a non-existing tweet ID', async () => {
    const fakeTweetId = '50000';

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/tweets/${fakeTweetId}/addReply`)
      .set('Cookie', token)
      .send({
        text: 'reply test',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toEqual(400);
  });
});

describe('DELETE /api/v1/tweets/:tweetId/deleteReplies/:replyId', () => {
  jest.setTimeout(100000);

  it('successfully delete reply from a tweet with existing tweet ID and replyId', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token, tweetId } = await createTestTweet(email, username);
    const { replyId } = await createTestReply(token, tweetId);
    const response = await request(app)
      .delete(`/api/v1/tweets/${tweetId}/deleteReplies/${replyId}`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
  it('attempt to delete reply from non-existing tweet ID or replyId', async () => {
    const fakeReplyId = '50000';
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token, tweetId } = await createTestTweet(email, username);

    const response = await request(app)
      .delete(`/api/v1/tweets/${tweetId}/deleteReplies/${fakeReplyId}`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });
});

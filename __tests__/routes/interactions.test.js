const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

async function createTestUser() {
  const anotherEmail = `testuser_${uuid.v4()}@example.com`;
  const anotherUsername = `user_${uuid.v4()}`;
  const { anothertoken } = await global.signin(anotherEmail, anotherUsername);
  return { anotherEmail, anotherUsername, anothertoken };
}

describe('POST /api/v1/users/:username/follow', () => {
  jest.setTimeout(100000);

  it('try to follow user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app).post(
      `/api/v1/users/${username}/follow`,
    );
    expect(response.status).toEqual(401);
  });

  it('try to follow a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .post(`/api/v1/users/${usernameFake}/follow`)
      .set('Cookie', token);

    expect(response.status).toEqual(404);
  });
  it('try to follow the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/follow`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });

  it('try to follow a user', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/follow`)
      .set('Cookie', token)
      .expect(500); ////////////
  });
});

describe('DELETE /api/v1/users/:username/unfollow', () => {
  jest.setTimeout(100000);

  it('try to unfollow user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unfollow`)
      .expect(401);
    expect(response.status).toEqual(401);
  });

  it('try to unfollow a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .delete(`/api/v1/users/${usernameFake}/unfollow`)
      .set('Cookie', token);
    expect(response.status).toEqual(404);
  });
  it('try to unfollow the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unfollow`)
      .set('Cookie', token);
    expect(response.status).toEqual(400);
  });

  it('try to unfollow a user that not followed', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);
    console.log(username, currusername);
    const response = await request(app)
      .delete(`/api/v1/users/${username}/unfollow`)
      .set('Cookie', token)
      .expect(400);
  });
});

describe('POST /api/v1/users/:username/block', () => {
  jest.setTimeout(100000);

  it('try to block user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app).post(
      `/api/v1/users/${username}/follow`,
    );
    expect(response.status).toEqual(401);
  });

  it('try to block a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .post(`/api/v1/users/${usernameFake}/block`)
      .set('Cookie', token);

    expect(response.status).toEqual(404);
  });
  it('try to block the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/block`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });

  it('try to block a user', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/block`)
      .set('Cookie', token);

    expect(response.status).toEqual(200);
  });
});

describe('DELETE /api/v1/users/:username/unblock', () => {
  jest.setTimeout(100000);

  it('try to unblock user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unblock`)
      .expect(401);
    expect(response.status).toEqual(401);
  });

  it('try to unblock a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .delete(`/api/v1/users/${usernameFake}/unblock`)
      .set('Cookie', token);
    expect(response.status).toEqual(404);
  });
  it('try to unblock the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unblock`)
      .set('Cookie', token);
    expect(response.status).toEqual(400);
  });

  it('try to unblock a user that not blocked', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);
    console.log(username, currusername);
    const response = await request(app)
      .delete(`/api/v1/users/${username}/unblock`)
      .set('Cookie', token)
      .expect(400);
  });
});
describe('POST /api/v1/users/:username/mute', () => {
  jest.setTimeout(100000);

  it('try to mute user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app).post(`/api/v1/users/${username}/mute`);
    expect(response.status).toEqual(401);
  });

  it('try to mute a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .post(`/api/v1/users/${usernameFake}/mute`)
      .set('Cookie', token);

    expect(response.status).toEqual(404);
  });
  it('try to mute the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/mute`)
      .set('Cookie', token);

    expect(response.status).toEqual(400);
  });

  it('try to mute a user', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);

    const response = await request(app)
      .post(`/api/v1/users/${username}/mute`)
      .set('Cookie', token)
      .expect(200);
  });
});
describe('DELETE /api/v1/users/:username/unmute', () => {
  jest.setTimeout(100000);

  it('try to unmute user while not logged in', async () => {
    const username = `user_${uuid.v4()}`;

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unmute`)
      .expect(401);
    expect(response.status).toEqual(401);
  });

  it('try to unmute a user not found', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    const usernameFake = `user_${uuid.v4()}`;
    const response = await request(app)
      .delete(`/api/v1/users/${usernameFake}/unmute`)
      .set('Cookie', token);
    expect(response.status).toEqual(404);
  });
  it('try to unmute the same user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .delete(`/api/v1/users/${username}/unmute`)
      .set('Cookie', token);
    expect(response.status).toEqual(400);
  });

  it('try to unmute a user that not muted', async () => {
    const curremail = `testuser_${uuid.v4()}@example.com`;
    const currusername = `user_${uuid.v4()}`;

    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(curremail, currusername);
    const { btoken } = await global.signin(email, username);
    console.log(username, currusername);
    const response = await request(app)
      .delete(`/api/v1/users/${username}/unmute`)
      .set('Cookie', token)
      .expect(400);
  });
});

describe('GET /api/v1/users/:username/followers', () => {
  test('try to get a list of followers without sign in', async () => {
    const username = `user_${uuid.v4()}`;
    await request(app).get(`/api/v1/users/${username}/followers`).expect(401);
  });

  test('try to get list of followers', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/${username}/followers`)
      .set('Cookie', token)
      .expect(200);
  });
});
describe('GET /api/v1/users/:username/followings', () => {
  test('try to get a list of followings without sign in', async () => {
    const username = `user_${uuid.v4()}`;
    await request(app).get(`/api/v1/users/${username}/followings`).expect(401);
  });

  test('try to get list of followings', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/${username}/followings`)
      .set('Cookie', token)
      .expect(200);
  });
});

describe('GET /api/v1/users/mutedUsers', () => {
  test('try to get a list of mutedUsers without sign in', async () => {
    await request(app).get('/api/v1/users/mutedUsers').expect(401);
  });

  test('try to get list of mutedUsers', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/mutedUsers`)
      .set('Cookie', token)
      .expect(200);
  });
});
describe('GET /api/v1/users/blockedUsers', () => {
  test('try to get a list of blockedUsers without sign in', async () => {
    await request(app).get('/api/v1/users/blockedUsers').expect(401);
  });

  test('try to get list of blockedUsers', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);
    await request(app)
      .get(`/api/v1/users/blockedUsers`)
      .set('Cookie', token)
      .expect(200);
  });
});

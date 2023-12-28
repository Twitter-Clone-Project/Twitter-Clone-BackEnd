const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('GET /api/v1/users/search/:pageNum', () => {
  test('try to search for certain user without sign in', async () => {
    const pageNum = 1;
    await request(app).get(`/api/v1/users/search/${pageNum}`).expect(401);
  });

  // Update your test cases like this:
  test('try to search for certain user', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    const pageNum = 1;
    const query = 'example';
    const response = await request(app)
      .get(`/api/v1/users/search/${pageNum}?query=${query}`)
      .set('Cookie', token);

    console.log(response.status); // Log the status code
    console.log(response.body); // Log the response body

    expect(response.status).toBe(200);
    // Add more assertions based on your response structure
  });
});

describe('GET /api/v1/tweets/search/:pageNum', () => {
  test('try to search for certain tweet without sign in', async () => {
    const pageNum = 1;
    await request(app).get(`/api/v1/tweets/search/${pageNum}`).expect(401);
  });

  test('try to search for certain tweet', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const { token } = await global.signin(email, username);
    const pageNum = 1;
    const query = 'example';
    const response = await request(app)
      .get(`/api/v1/tweets/search/${pageNum}?query=${query}`)
      .set('Cookie', token);

    console.log(response.status); // Log the status code
    console.log(response.body); // Log the response body

    expect(response.status).toBe(200);
    // Add more assertions based on your response structure
  });
});

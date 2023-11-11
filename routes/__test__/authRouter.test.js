const request = require('supertest');
const nock = require('nock');
const app = require('../../app');
const uuid = require('uuid');

describe('POST /api/v1/auth/signup', () => {
  jest.setTimeout(100000);
  test('returns 201 on successful signup', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const uniqueUsername = `user_${uuid.v4()}`;

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.name).toBe('Mahmoud Yahia');
  });

  test('returns 400 for validation errors', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const uniqueUsername = `user_${uuid.v4()}`;

    const res2 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'passwod',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');


    expect(res2.statusCode).toBe(400);
    expect(res2.body.status).toBe(false);
  });

  test('returns 400 when user allready exists', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const uniqueUsername = `user_${uuid.v4()}`;

    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    const res2 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    expect(res2.statusCode).toBe(400);
    expect(res2.body.status).toBe(false);
  });
});

describe('POST /api/v1/auth/signin', () => {
  test('returns 201, user and token on successful signin', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const uniqueUsername = `user_${uuid.v4()}`;

    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    const res = await request(app)
      .post('/api/v1/auth/signin')
      .send({
        email: uniqueEmail,
        password: 'password',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.name).toEqual('Mahmoud Yahia');
    expect(res.body.data.token).toBeDefined();
  });

  test('returns 400, signin with wrong password', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const uniqueUsername = `user_${uuid.v4()}`;

    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    const res = await request(app)
      .post('/api/v1/auth/signin')
      .send({
        email: uniqueEmail,
        password: 'pa4554ssord',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual(false);
  });

  test('returns 400, user not found', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;

    const res = await request(app)
      .post('/api/v1/auth/signin')
      .send({
        email: uniqueEmail,
        password: 'pa4554ssord',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual(false);
  });
});

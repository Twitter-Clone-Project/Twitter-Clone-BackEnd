const request = require('supertest');
const nock = require('nock');
const app = require('../../app');

describe('POST signup', () => {
  jest.setTimeout(10000);
  test('returns 201 on successful signup', async () => {
    // Mocking the Email class and its sendConfirmationEmail method
    // jest.mock('../../services/Email.js', () => {
    //   return jest.fn().mockImplementation(() => ({
    //     sendConfirmationEmail: jest.fn().mockResolvedValue(),
    //   }));
    // });

    // const res = await request(app)
    //   .post('/api/v1/auth/me')
    //   .send({
    //     name: 'Mohamed',
    //     username: 'string59',
    //     email: 'myehia59@gmail.com',
    //     password: 'password',
    //     passwordConfirm: 'password',
    //     dateOfBirth: '2023-11-03',
    //     gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
    //   })
    //   .set('Content-Type', 'application/json')
    //   .expect(201);
    let token =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbFR5cGUiOiJiYXJlIGVtYWlsIiwidXNlcm5hbWUiOiJ0Ml9oYW1hZGEiLCJpYXQiOjE2NjgxNzExOTMsImV4cCI6MTY2ODYwMzE5M30.5La8KnuxWTb2u0neXtSWNr_9seVWam0tFEUjAwpqlC0";
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set("Authorization", token)
      .set('Content-Type', 'application/json')
      .expect(201);
    console.log(res);
  });

  test('testing one', async () => {
    const res = await request(app).post('/api/v1/auth/sign').expect(201);
    expect(res.body.status).toBe(true);
  });
});

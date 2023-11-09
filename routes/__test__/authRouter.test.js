const app = require('../../app');
const request = require('supertest');

describe('POST signup', () => {
  it('returns 201 on successful signup', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({
      name: 'Mohamed',
      username: 'string58',
      email: 'myehia58@gmail.com',
      password: 'password',
      passwordConfirm: 'password',
      dateOfBirth: '2023-11-03',
      gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
    });

    expect(response.statusCode).toEqual(201);
  });
});

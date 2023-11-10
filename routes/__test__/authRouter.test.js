const app = require('../../app');
const request = require('supertest');

describe('POST signup', () => {
  test('returns 201 on successful signup', async () => {
    const response = await request(app).post('/api/v1/auth').send({
      name: 'Mohamed',
      username: 'string58',
      email: 'myehia58@gmail.com',
      password: 'password',
      passwordConfirm: 'password',
      dateOfBirth: '2023-11-03',
      gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
    });
    console.log(response);

  });
});

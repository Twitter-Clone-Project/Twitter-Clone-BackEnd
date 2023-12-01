const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');
const Email = require('../../services/Email');

describe('POST /api/v1/auth/signup', () => {
  jest.setTimeout(100000);

  it('try to sign up without username', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'testing@gmail.com', password: '123456789' });

    expect(response.status).toEqual(400);
  });

  it('try to sign up without email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ username: 'Beshoy', password: '123456789' });

    expect(response.status).toEqual(400);
  });

  it('try to sign up with invalid email', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({
      username: 'Beshoy',
      email: 'testing@gmail',
      password: '123456789',
    });

    expect(response.status).toEqual(400);
  });

  it('try to sign up without password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'testing@gmail.com', username: 'Beshoy' });

    expect(response.status).toEqual(400);
  });

  it('try to sign up with short password', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({
      email: 'testing@gmail.com',
      username: 'Beshoy',
      password: '123',
    });

    expect(response.status).toEqual(400);
  });

  test('returns 201 on successful signup', async () => {
    const uniqueEmail = `testuse22r_${uuid.v4()}@example.com`;
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

    expect(Email.prototype.sendConfirmationEmail).toHaveBeenCalled();
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

  test('returns 201 when signup with email exists but not confirmed', async () => {
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
      .set('Content-Type', 'application/json')
      .expect(201);

    expect(res2.body.status).toBe(true);
  });

  test('returns 400 when user allready exists', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { otp } = await global.signin(email, username);

    const res = await request(app)
      .post('/api/v1/auth/verifyEmail')
      .send({
        email,
        otp,
      })
      .set('Content-Type', 'application/json');

    const res2 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Mahmoud Yahia',
        username,
        email,
        password: 'password',
        passwordConfirm: 'password',
        dateOfBirth: '2023-11-03',
        gRecaptchaResponse: '6LeousYoAAAAACH0uCm7e4NKQkOWgrZWxmPPCMBZ',
      })
      .set('Content-Type', 'application/json');

    expect(res2.body.status).toBe(false);
    expect(res2.body.error.driverError.code).toEqual('23505');
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

describe('POST /api/v1/auth/verifyEmail', () => {
  test('return 400 in valid otp', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/verifyEmail')
      .send({
        email: uniqueEmail,
        otp: 'pa4554ssord',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual(false);
  });

  test('return 400 in valid email', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}example.com`;
    const res = await request(app)
      .post('/api/v1/auth/verifyEmail')
      .send({
        email: uniqueEmail,
        otp: '12345678',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toEqual(false);
  });

  test('return 404 when user with this email not found', async () => {
    const uniqueEmail = `testuser_${uuid.v4()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/verifyEmail')
      .send({
        email: uniqueEmail,
        otp: '12345678',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(404);
    expect(res.body.status).toEqual(false);
  });

  test('return 200, email verified successfully and token returned', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { otp } = await global.signin(email, username);

    const res = await request(app)
      .post('/api/v1/auth/verifyEmail')
      .send({
        email,
        otp,
      })
      .set('Content-Type', 'application/json');

    console.log(res);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.email).toEqual(email);
    expect(res.body.data.user.isConfirmed).toEqual(true);
    expect(res.body.data.token).toBeDefined();
  });
});

describe('POST /api/v1/auth/resendConfirmEmail', () => {
  test('returns 401, try to request resend Confirm Email if user not logged in', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;

    const res = await request(app)
      .post('/api/v1/auth/resendConfirmEmail')
      .send({
        email,
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(401);
  });

  test('returns 200, email resended successfully', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .post('/api/v1/auth/resendConfirmEmail')
      .set('Cookie', token)
      .send({
        email,
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
    expect(Email.prototype.sendConfirmationEmail).toHaveBeenCalled();
  });
});

describe('GET /api/v1/auth/me', () => {
  test('try to refresh user data if there is no token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual(false);
  });

  test('refresh  user data successfully', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', token)
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
  });
});

describe('POST /api/v1/auth/signout', () => {
  test('signout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signout')
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Signed out successfully');
    expect(res.get('Set-Cookie')).toBeDefined();
  });
});

describe('PATCH /api/v1/auth/updatePassword', () => {
  test('returns 400 ,try to change passowrd with wrong current password', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .patch('/api/v1/auth/updatePassword')
      .set('Cookie', token)
      .send({
        currentPassword: 'pass1',
        newPassword: '',
        newPasswordConfirm: '',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
  });

  test('returns 400, try to change passowrd with invalid new password', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .patch('/api/v1/auth/updatePassword')
      .set('Cookie', token)
      .send({
        currentPassword: 'password',
        newPassword: '123',
        newPasswordConfirm: '258',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(400);
  });
  test('returns 200, change passowrd successfully and cookie returned', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .patch('/api/v1/auth/updatePassword')
      .set('Cookie', token)
      .send({
        currentPassword: 'password',
        newPassword: '123asdqwe',
        newPasswordConfirm: '123asdqwe',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
    expect(res.get('Set-Cookie')).toBeDefined();
  });
});

describe('POST /api/v1/auth/forgetPassword', () => {
  test('returns 404, try to request forget password with wrong email', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;

    const res = await request(app)
      .post('/api/v1/auth/forgetPassword')
      .send({
        email,
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(404);
  });

  test('returns 200, request forget password email with email sent', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .post('/api/v1/auth/forgetPassword')
      .send({
        email,
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
    expect(Email.prototype.sendConfirmationEmail).toHaveBeenCalled();
  });
});

describe('PATCH /api/v1/auth/resetPassword', () => {
  test('returns 401, try to request reset password if the otp not verified', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;

    const res = await request(app)
      .patch('/api/v1/auth/resetPassword')
      .send({
        newPassword: 'password',
        newPasswordConfirm: 'password',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(401);
  });

  test('returns 200, reset password successfully', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const res = await request(app)
      .patch('/api/v1/auth/resetPassword')
      .set('Cookie', token)
      .send({
        newPassword: 'password',
        newPasswordConfirm: 'password',
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toEqual(200);
  });
});

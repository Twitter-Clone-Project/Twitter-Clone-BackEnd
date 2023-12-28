const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');
const Email = require('../../services/Email');

// describe('GET /api/v1/profile/:username', () => {
//   jest.setTimeout(100000);
//   test('try to get a profile data without sign in', async () => {
//     const username = `user_${uuid.v4()}`;
//     await request(app).get(`api/v1/profile/${username}`).expect(401);
//   });

//   test('try to get profile of user with wrong username', async () => {
//     const email = `testuser_${uuid.v4()}@example.com`;
//     const username = `user_${uuid.v4()}`;

//     const { token } = await global.signin(email, username);
//     const fakeusername = `user_${uuid.v4()}`;

//     await request(app)
//       .get(`api/v1/profile/${fakeusername}`)
//       .set('Cookie', token)
//       .expect(404);
//   });

//   test('try to get profile of user', async () => {
//     const email = `testuser_${uuid.v4()}@example.com`;
//     const username = `user_${uuid.v4()}`;

//     const { token } = await global.signin(email, username);
//     await request(app)
//       .get(`api/v1/profile/${username}`)
//       .set('Cookie', token)
//       .expect(200);
//   });
// });

describe('PATCH /api/v1/profile/updateUsername', () => {
  jest.setTimeout(100000);

  it('try to update user name while not logged in', async () => {
    const response = await request(app).patch('/api/v1/profile/updateUsername');
    expect(response.status).toEqual(401);
  });

  it('try to update user name ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const updatedusername = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateUsername')
      .send({
        newUsername: updatedusername,
      })
      .set('Content-Type', 'application/json')
      .set('Cookie', token)
      .expect(200);
  });
  it('try to update user name  with a name of 2 char ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateUsername')
      .send({
        newUsername: 'da',
      })
      .set('Content-Type', 'application/json')
      .set('Cookie', token)
      .expect(400);
  });
});

describe('PATCH /api/v1/profile/updateEmail', () => {
  jest.setTimeout(100000);

  it('try to update email while not logged in', async () => {
    const response = await request(app).patch('/api/v1/profile/updateEmail');
    expect(response.status).toEqual(401);
  });

  it('try to send email ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const newEmail = `testuser_${uuid.v4()}@example.com`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateEmail')
      .send({
        newEmail,
      })
      .set('Content-Type', 'application/json')
      .set('Cookie', token)
      .expect(200);
    expect(Email.prototype.sendEmail).toHaveBeenCalled();
  });
  it('try to send  invalid email ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;
    const newEmail = `testuser_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateEmail')
      .send({
        newEmail,
      })
      .set('Content-Type', 'application/json')
      .set('Cookie', token)
      .expect(400);
  });
  it('try to send  request without email ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateEmail')
      .send({})
      .set('Content-Type', 'application/json')
      .set('Cookie', token)
      .expect(400);
  });
});

describe('PATCH /api/v1/profile/updateProfile', () => {
  jest.setTimeout(100000);

  it('try to update profile while not logged in', async () => {
    const response = await request(app).patch('/api/v1/profile/updateProfile');
    expect(response.status).toEqual(401);
  });

  it('try to update profile without all data ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateProfile')
      .field('name', 'daneil')
      .field('bio', 'hello test')
      .set('Content-Type', 'multipart/form-data')
      .set('Cookie', token)
      .expect(200);
  });
  it('try to update profile with invalid birthdate which is 13 years before now  ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateProfile')
      .field('name', 'daneil')
      .field('bio', 'hello test')
      .field('birthDate', '2020-12-03')
      .set('Content-Type', 'multipart/form-data')
      .set('Cookie', token)
      .expect(400);
  });

  it('try to update profile with invalid data  ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateProfile')
      .field('name', 'da')
      .field('bio', 'hello test')
      .field('birthDate', '2020-12-03')
      .set('Content-Type', 'multipart/form-data')
      .set('Cookie', token)
      .expect(400);
  });

  it('try to update profile with all data  ', async () => {
    const email = `testuser_${uuid.v4()}@example.com`;
    const username = `user_${uuid.v4()}`;

    const { token } = await global.signin(email, username);

    const response = await request(app)
      .patch('/api/v1/profile/updateProfile')
      .field('name', 'dan')
      .field('bio', 'hello test')
      .field('birthDate', '2001-12-03')
      .field('website', 'www.google.com')
      .field('location', 'sraya el koba')
      .field('isUpdated', 'TRUE')
      .set('Content-Type', 'multipart/form-data')
      .set('Cookie', token)
      .expect(200);
  });
});

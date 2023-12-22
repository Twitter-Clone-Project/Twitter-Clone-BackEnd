const request = require('supertest');
const app = require('../../app');
const uuid = require('uuid');

describe('POST /api/v1/tweets/add', () => {
  jest.setTimeout(100000);

  it('try to add empty tweet text and no media', async () => {
    const response = await request(app)
      .post('/api/v1/tweets/add')
      .send({ tweetText: '', trends: null, media: null });
    console.log(response.body);
    expect(response.status).toEqual(400);
  });

  it('try to add more than 4 media in a tweet', async () => {
    const response = await request(app)
      .post('/api/v1/tweets/add')
      .send({
        tweetText: 'tweet test',
        trends: null,
        media: ['1.png', '2.png', '3.png', '4.png', '5.png'],
      });
    console.log(response.body);
    expect(response.status).toEqual(400);
  });

  it('successfully adding non empty tweet with no media', async () => {
    const response = await request(app).post('/api/v1/tweets/add').send({
      tweetText: 'tweet test',
      trends: null,
      media: null,
    });
    console.log(response.body);
    expect(response.status).toEqual(200);
  });
});

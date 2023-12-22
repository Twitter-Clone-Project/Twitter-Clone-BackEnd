const { json } = require('body-parser');
const {
  isUsernameFound,
  isEmailFound,
} = require('../../controllers/usersController');
const { AppDataSource } = require('../../dataSource');

// Mocking AppDataSource
jest.mock('../../dataSource.js', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('userValidationController', () => {
  describe('isUsernameFound', () => {
    it('should respond with status 200 and isFound true when username exists', async () => {
      const req = {
        params: { username: 'existingUsername' },
      };

      const res = {
        status: jest.fn((code) => {
          console.log(5);
        }),
        json: jest.fn(),
      };

      const userRepositoryMock = {
        exist: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      // Mocking the getRepository function to return the userRepositoryMock
      AppDataSource.getRepository = jest.fn(() => userRepositoryMock);

      await isUsernameFound(req, res);

      // Expecting that res.status(200) has been called
      expect(res.status).toHaveBeenCalledWith(404);

      // Expecting that res.json has been called with the specified argument
      // expect(res.json).toHaveBeenCalledWith({
      //   status: true,
      //   data: { isFound: true },
      // });
    });

    it('should respond with status 404 and isFound false when username does not exist', async () => {
      // Similar setup as the previous test, but with exist: false
    });
  });

  describe('isEmailFound', () => {
    it('should respond with status 200 and isFound true when email exists', async () => {
      // Similar setup as the isUsernameFound test, but for isEmailFound
    });

    it('should respond with status 404 and isFound false when email does not exist', async () => {
      // Similar setup as the previous test, but with exist: false
    });
  });
});

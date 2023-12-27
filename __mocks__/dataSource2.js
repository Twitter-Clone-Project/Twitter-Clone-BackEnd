// __mocks__/AppDataSource.js

class MockRepository {
  existReturnValue = true;

  insert = jest.fn();
  // exist = jest.fn().mockResolvedValue(this.existReturnValue);
  createQueryBuilder = jest.fn().mockReturnThis();
  where = jest.fn().mockReturnThis(); // Mock where method
  andWhere = jest.fn().mockReturnThis(); // Mock andWhere method
  getOne = jest.fn(); // Mock getOne method
}

class MockAppDataSource {
  static getRepository() {
    return new MockRepository();
  }
}

module.exports = MockAppDataSource;

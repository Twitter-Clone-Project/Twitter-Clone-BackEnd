// __mocks__/AppDataSource.js

const mockInsert = jest.fn();

class MockRepository {
  insert = mockInsert;
  
}

class MockAppDataSource {
  static getRepository() {
    return new MockRepository();
  }
}

module.exports = MockAppDataSource;

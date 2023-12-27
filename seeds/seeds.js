const { faker } = require('@faker-js/faker');
const fs = require('fs');
const dotenv = require('dotenv');
const User = require('../models/entites/User');
const Conversation = require('../models/entites/Conversation');
const Notification = require('../models/entites/Notification');

dotenv.config({ path: '../.env' });
process.env.NODE_ENV = 'development';

const { AppDataSource } = require('../dataSource');

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const conversations = JSON.parse(
  fs.readFileSync(`${__dirname}/conversations.json`, 'utf-8'),
);
const notifications = JSON.parse(
  fs.readFileSync(`${__dirname}/notifications.json`, 'utf-8'),
);

/**
 * Inserts all seeds in the collections
 */
const importData = async () => {
  await AppDataSource.initialize();

  try {
    // Insert the fake user data into the database
    await AppDataSource.getRepository(User).insert(users);
    await AppDataSource.getRepository(Conversation).insert(conversations);
    await AppDataSource.getRepository(Notification).insert(notifications);

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

/**
 * Deletes all collections' documents
 */
const deleteData = async () => {
  try {
    await AppDataSource.initialize();
    await AppDataSource.dropDatabase();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

const { faker } = require('@faker-js/faker');
const fs = require('fs');
const dotenv = require('dotenv');
const User = require('../models/entites/User');
const Conversation = require('../models/entites/Conversation');
const Notification = require('../models/entites/Notification');
const Tweet = require('../models/entites/Tweet');
const Trend = require('../models/entites/Trend');
const Reply = require('../models/entites/Reply');
const Media = require('../models/entites/Media');
const Message = require('../models/entites/Message');

const Follow = require('../models/relations/Follow');
const Block = require('../models/relations/Block');
const Repost = require('../models/relations/Repost');
const Like = require('../models/relations/Like');
const Mute = require('../models/relations/Mute');

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
const follows = JSON.parse(
  fs.readFileSync(`${__dirname}/follows.json`, 'utf-8'),
);
const blocks = JSON.parse(fs.readFileSync(`${__dirname}/blocks.json`, 'utf-8'));
const tweets = JSON.parse(fs.readFileSync(`${__dirname}/tweets.json`, 'utf-8'));
const trends = JSON.parse(fs.readFileSync(`${__dirname}/trends.json`, 'utf-8'));
const reposts = JSON.parse(
  fs.readFileSync(`${__dirname}/reposts.json`, 'utf-8'),
);
const replies = JSON.parse(
  fs.readFileSync(`${__dirname}/replies.json`, 'utf-8'),
);
const likes = JSON.parse(fs.readFileSync(`${__dirname}/likes.json`, 'utf-8'));
const media = JSON.parse(fs.readFileSync(`${__dirname}/Media.json`, 'utf-8'));
const mutes = JSON.parse(fs.readFileSync(`${__dirname}/mutes.json`, 'utf-8'));
const messages = JSON.parse(
  fs.readFileSync(`${__dirname}/messages.json`, 'utf-8'),
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
    await AppDataSource.getRepository(Tweet).insert(tweets);
    await AppDataSource.getRepository(Trend).insert(trends);
    await AppDataSource.getRepository(Reply).insert(replies);
    await AppDataSource.getRepository(Media).insert(media);
    await AppDataSource.getRepository(Mute).insert(mutes);
    await AppDataSource.getRepository(Message).insert(messages);

    await AppDataSource.getRepository(Follow).insert(follows);
    await AppDataSource.getRepository(Block).insert(blocks);
    await AppDataSource.getRepository(Repost).insert(reposts);
    await AppDataSource.getRepository(Like).insert(likes);

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

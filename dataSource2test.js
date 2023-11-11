const { DataSource } = require('typeorm');

const userSchema = require('./schemas/entites/userSchema');
const tweetSchema = require('./schemas/entites/tweetSchema');
const trendSchema = require('./schemas/entites/trendSchema');
const replySchema = require('./schemas/entites/replySchema');
const notificationSchema = require('./schemas/entites/notificationSchema');
const messageSchema = require('./schemas/entites/messageSchema');
const mediaSchema = require('./schemas/entites/mediaSchema');
const conversationSchema = require('./schemas/entites/conversationSchema');

const supportSchema = require('./schemas/relations/supportSchema');
const repostSchema = require('./schemas/relations/repostSchema');
const muteSchema = require('./schemas/relations/muteSchema');
const mentionSchema = require('./schemas/relations/mentionSchema');
const likeSchema = require('./schemas/relations/likeSchema');
const likeReplySchema = require('./schemas/relations/likeReplySchema');
const followSchema = require('./schemas/relations/followSchema');
const blockSchema = require('./schemas/relations/blockSchema');

class AppDataSource {
  static isInitialized = false;
  static dataSource = false;

  static async initialize(env) {
    if (this.isInitialized) {
      console.log('Data source is already initialized.');
      return;
    }

    try {
      if (env === 'test') {
        await this.initializeTestDatabase();
      } else {
        await this.initializeProductionDatabase();
      }

      this.isInitialized = true;

      console.log('Data source initialized successfully.');
    } catch (error) {
      console.error('Error initializing data source:', error);
    }
  }

  static async initializeTestDatabase() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_TEST_NAME,
      synchronize: false,
      logging: false,
      entities: [
        userSchema,
        tweetSchema,
        messageSchema,
        mediaSchema,
        conversationSchema,
        trendSchema,
        replySchema,
        notificationSchema,
        supportSchema,
        repostSchema,
        muteSchema,
        blockSchema,
        mentionSchema,
        likeReplySchema,
        likeSchema,
        followSchema,
      ],
    });
    console.log('Initializing test database...');
  }

  static async initializeProductionDatabase() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: false,
      logging: false,
      entities: [
        userSchema,
        tweetSchema,
        messageSchema,
        mediaSchema,
        conversationSchema,
        trendSchema,
        replySchema,
        notificationSchema,
        supportSchema,
        repostSchema,
        muteSchema,
        blockSchema,
        mentionSchema,
        likeReplySchema,
        likeSchema,
        followSchema,
      ],
      subscribers: [],
      migrations: [],
    });
    console.log('Initializing production database...');
  }
}

module.exports = { AppDataSource };

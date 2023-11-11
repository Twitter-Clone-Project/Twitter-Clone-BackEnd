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

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database:
    process.env.NODE_ENV === 'testing'
      ? process.env.DATABASE_TEST_NAME
      : process.env.DATABASE_NAME,
  synchronize:
    process.env.NODE_ENV === 'testing' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'production',
  logging:
    process.env.NODE_ENV === 'testing' ||
    process.env.NODE_ENV === 'development',
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

module.exports = { AppDataSource };

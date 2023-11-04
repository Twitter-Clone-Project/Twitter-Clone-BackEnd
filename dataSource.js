const { DataSource } = require('typeorm');

const userSchema = require('./Schemas/Entites/userSchema');
const tweetSchema = require('./Schemas/Entites/tweetSchema');
const trendSchema = require('./Schemas/Entites/trendSchema');
const replySchema = require('./Schemas/Entites/replySchema');
const notificationSchema = require('./Schemas/Entites/notificationSchema');
const messageSchema = require('./Schemas/Entites/messageSchema');
const mediaSchema = require('./Schemas/Entites/mediaSchema');
const conversationSchema = require('./Schemas/Entites/conversationSchema');

const supportSchema = require('./Schemas/Relations/supportSchema');
const repostSchema = require('./Schemas/Relations/repostSchema');
const muteSchema = require('./Schemas/Relations/muteSchema');
const mentionSchema = require('./Schemas/Relations/mentionSchema');
const likeSchema = require('./Schemas/Relations/likeSchema');
const likeReplySchema = require('./Schemas/Relations/likeReplySchema');
const followSchema = require('./Schemas/Relations/followSchema');
const blockSchema = require('./Schemas/Relations/blockSchema');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: true,
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

module.exports = { AppDataSource };

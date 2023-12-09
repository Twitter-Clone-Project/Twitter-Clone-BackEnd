const { EntitySchema } = require('typeorm');
const User = require('../../models/entites/User');

module.exports = new EntitySchema({
  name: 'User',
  target: User,
  columns: {
    userId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    username: {
      type: 'varchar',
      length: 60,
      unique: true,
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 50,
    },
    email: {
      type: 'varchar',
      unique: true,
      length: 70,
    },
    password: {
      type: 'varchar',
      select: false,
      length: 100,
    },
    imageUrl: {
      type: 'varchar',
      nullable: true,
      default:
        'https://kady-twitter-images.s3.amazonaws.com/defaultProfile.jpg',
    },
    bannerUrl: {
      type: 'varchar',
      nullable: true,
      default: 'https://kady-twitter-images.s3.amazonaws.com/DefaultBanner.png',
    },
    bio: {
      type: 'varchar',
      length: 160,
      nullable: true,
    },
    location: {
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    website: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    birthDate: {
      type: 'date',
    },
    isConfirmed: {
      type: 'boolean',
      default: false,
    },
    otp: {
      type: 'varchar',
      length: 150,
      nullable: true,
    },
    otpExpires: {
      type: 'timestamptz',
      nullable: true,
    },
    isOnline: {
      type: 'boolean',
      default: false,
    },
    socketId: {
      unique: true,
      nullable: true,
      type: 'varchar',
      length: 150,
    },
    followersCount: {
      type: 'bigint',
      nullable: true,
      default: 0,
    },
    followingsCount: {
      type: 'bigint',
      nullable: true,
      default: 0,
    },
    createdAt: {
      nullable: false,
      type: 'timestamptz',
      createDate: true,
    },
  },
});

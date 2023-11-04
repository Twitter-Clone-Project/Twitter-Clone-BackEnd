const { EntitySchema } = require('typeorm');
const User = require('../../Models/Entites/User');

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
      length: 8,
      nullable: true,
    },
    resetToken: {
      type: 'varchar',
      length: 150,
      nullable: true,
    },
    otpExpires: {
      type: 'timestamp',
      nullable: true,
    },
    resetTokenExpires: {
      type: 'timestamp',
      nullable: true,
    },
  },
});

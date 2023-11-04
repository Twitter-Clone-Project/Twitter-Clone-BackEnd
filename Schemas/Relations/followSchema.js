const { EntitySchema } = require('typeorm');
const Follow = require('../../Models/Relations/Follow');

module.exports = new EntitySchema({
  name: 'Follow',
  target: Follow,
  columns: {
    userId: {
      primary: true,
      type: 'bigint',
    },
    followerId: {
      primary: true,
      type: 'bigint',
    },
  },
  relations: {
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
    follower: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'followerId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});

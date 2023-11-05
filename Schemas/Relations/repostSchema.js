// Repost.js
const { EntitySchema } = require('typeorm');
const Repost = require('../../models/relations/Repost');

module.exports = new EntitySchema({
  name: 'Repost',
  target: Repost,
  columns: {
    userId: {
      primary: true,
      type: 'bigint',
    },
    tweetId: {
      primary: true,
      type: 'bigint',
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId', referencedColumnName: 'userId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
    tweet: {
      type: 'many-to-one',
      target: 'Tweet',
      joinColumn: { name: 'tweetId', referencedColumnName: 'tweetId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
  },
});

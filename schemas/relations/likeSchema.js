const { EntitySchema } = require('typeorm');
const Like = require('../../models/relations/Like');

module.exports = new EntitySchema({
  name: 'Like',
  target: Like,
  columns: {
    tweetId: {
      primary: true,
      type: 'bigint',
    },
    userId: {
      primary: true,
      type: 'bigint',
    },
  },
  relations: {
    tweet: {
      target: 'Tweet',
      type: 'many-to-one',
      joinColumn: { name: 'tweetId', referencedColumnName: 'tweetId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId', referencedColumnName: 'userId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
  },
});

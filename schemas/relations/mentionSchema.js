const { EntitySchema } = require('typeorm');
const Mention = require('../../models/relations/Mention');

module.exports = new EntitySchema({
  name: 'Mention',
  target: Mention,
  columns: {
    tweetId: {
      primary: true,
      type: 'bigint',
    },
    userId: {
      primary: true,
      type: 'bigint',
    },
    mentionedId: {
      primary: true,
      type: 'bigint',
    },
  },
  relations: {
    tweet: {
      target: 'Tweet',
      type: 'many-to-one',
      joinColumn: { name: 'tweetId', referencedColumnName: 'tweetId' },
      onDelete: 'CASCADE',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
    mentioned: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'mentionedId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});

const { EntitySchema } = require('typeorm');
const Media = require('../../models/entites/Media');

module.exports = new EntitySchema({
  name: 'Media',
  target: Media,
  columns: {
    mediaId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    tweetId: {
      primary: true,
      type: 'bigint',
    },
    url: {
      type: 'varchar',
    },
    type: {
      type: 'varchar',
      length: 10,
    },
  },
  relations: {
    tweet: {
      type: 'many-to-one',
      target: 'Tweet',
      joinColumn: { name: 'tweetId' },
      onDelete: 'CASCADE',
    },
  },
});

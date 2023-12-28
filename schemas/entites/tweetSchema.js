const { EntitySchema } = require('typeorm');
const Tweet = require('../../models/entites/Tweet');

module.exports = new EntitySchema({
  name: 'Tweet',
  target: Tweet,
  columns: {
    tweetId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    userId: {
      type: 'bigint',
    },
    text: {
      nullable: true,
      type: 'varchar',
      length: 280,
    },
    time: {
      type: 'timestamp',
    },
  },
  relations: {
    post: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});

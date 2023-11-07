const { EntitySchema } = require('typeorm');
const Reply = require('../../models/entites/Reply');

module.exports = new EntitySchema({
  name: 'Reply',
  target: Reply,
  columns: {
    replyId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    tweetId: {
      type: 'bigint',
    },
    userId: {
      type: 'bigint',
    },
    text: {
      type: 'varchar',
    },
  },
});

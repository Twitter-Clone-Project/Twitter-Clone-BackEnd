const { EntitySchema } = require('typeorm');
const Support = require('../../models/relations/Support');

module.exports = new EntitySchema({
  name: 'Support',
  target: Support,
  columns: {
    tweetId: {
      primary: true,
      type: 'bigint',
    },
    trendId: {
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
    trend: {
      target: 'Trend',
      type: 'many-to-one',
      joinColumn: { name: 'trendId', referencedColumnName: 'trendId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
  },
});

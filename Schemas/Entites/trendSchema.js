const { EntitySchema } = require('typeorm');
const Trend = require('../../Models/Entites/Trend');

module.exports = new EntitySchema({
  name: 'Trend',
  target: Trend,
  columns: {
    trendId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    name: {
      type: 'varchar',
    },
  },
  relations: {
    Support: {
      type: 'many-to-many',
      target: 'Tweet',
      joinTable: {
        name: 'Support',
      },
      cascade: true,
    },
  },
});

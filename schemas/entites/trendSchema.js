const { EntitySchema } = require('typeorm');
const Trend = require('../../models/entites/Trend');

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
});

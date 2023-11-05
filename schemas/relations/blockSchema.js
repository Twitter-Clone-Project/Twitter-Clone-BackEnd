const { EntitySchema } = require('typeorm');
const Block = require('../../models/relations/Block');

module.exports = new EntitySchema({
  name: 'Block',
  target: Block,
  columns: {
    userId: {
      primary: true,
      type: 'bigint',
    },
    blockedId: {
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
    blocked: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'blockedId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});

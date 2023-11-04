const { EntitySchema } = require('typeorm');
const Mute = require('../../Models/Relations/Mute');

module.exports = new EntitySchema({
  name: 'Mute',
  target: Mute,
  columns: {
    userId: {
      primary: true,
      type: 'bigint',
    },
    mutedId: {
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
    muted: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'mutedId', referencedColumnName: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});

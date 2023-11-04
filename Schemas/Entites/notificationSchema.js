const { EntitySchema } = require('typeorm');
const Notification = require('../../Models/Entites/Notification');

module.exports = new EntitySchema({
  name: 'Notification',
  target: Notification,
  columns: {
    notificationId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    userId: {
      type: 'bigint',
    },
    content: {
      type: 'varchar',
    },
    isSeen: {
      type: 'boolean',
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});

const { EntitySchema } = require('typeorm');
const Notification = require('../../models/entites/Notification');

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
      default: false,
    },
    isFromChat: {
      type: 'boolean',
      default: false,
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

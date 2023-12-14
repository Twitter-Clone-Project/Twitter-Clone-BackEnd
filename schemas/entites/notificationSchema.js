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
    senderId: {
      type: 'bigint',
    },
    content: {
      type: 'varchar',
    },
    isSeen: {
      type: 'boolean',
      default: false,
    },
    timestamp: {
      type: 'timestamptz',
    },
    type: {
      type: 'enum',
      enum: ['CHAT', 'MENTION', 'FOLLOW'],
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
    sender: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'userId' },
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});

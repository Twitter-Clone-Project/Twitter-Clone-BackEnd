const { EntitySchema } = require('typeorm');
const Message = require('../../Models/Entites/Message');

module.exports = new EntitySchema({
  name: 'Message',
  target: Message,
  columns: {
    conversationId: {
      primary: true,
      type: 'bigint',
    },
    senderId: {
      primary: true,
      type: 'bigint',
    },
    receiverId: {
      primary: true,
      type: 'bigint',
    },
    time: {
      type: 'timestamp',
    },
    text: {
      type: 'varchar',
    },
    isSeen: {
      type: 'boolean',
    },
  },
  relations: {
    conversation: {
      type: 'many-to-one',
      target: 'Conversation',
      joinColumn: { name: 'conversationId' },
      cascade: true,
      onDelete: 'CASCADE',
    },
    sender: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'senderId' },
      onDelete: 'SET NULL',
    },
    receiver: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'receiverId' },
      onDelete: 'SET NULL',
    },
  },
});

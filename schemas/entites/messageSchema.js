const { EntitySchema } = require('typeorm');
const Message = require('../../models/entites/Message');

module.exports = new EntitySchema({
  name: 'Message',
  target: Message,
  columns: {
    messageId: {
      type: 'bigint',
      primary: true,
      generated: true,
      nullable: false,
    },
    conversationId: {
      type: 'bigint',
    },
    senderId: {
      type: 'bigint',
    },
    receiverId: {
      type: 'bigint',
    },
    time: {
      type: 'timestamptz',
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

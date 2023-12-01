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
      nullable: true,
      type: 'bigint',
    },
    senderId: {
      nullable: true,
      type: 'bigint',
    },
    receiverId: {
      nullable: true,
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
      onDelete: 'SET NULL', // TODO SET NULL OR CASCADE
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

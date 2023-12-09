const { EntitySchema } = require('typeorm');
const Conversation = require('../../models/entites/Conversation');

module.exports = new EntitySchema({
  name: 'Conversation',
  target: Conversation,
  columns: {
    conversationId: {
      primary: true,
      type: 'bigint',
      generated: 'increment',
    },
    user1Id: {
      type: 'bigint',
    },
    user2Id: {
      type: 'bigint',
    },
    isUsersActive: {
      type: 'jsonb',
      default: {},
    },
  },
  uniques: [
    {
      name: 'unique_user_pair',
      columns: ['user1Id', 'user2Id'],
    },
  ],
  relations: {
    user1: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user1Id' },
      cascade: true,
      onDelete: 'CASCADE',
    },
    user2: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'user2Id' },
      cascade: true,
      onDelete: 'CASCADE',
    },
  },
});

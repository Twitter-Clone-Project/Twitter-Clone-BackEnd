const { EntitySchema } = require('typeorm');
const LikeReply = require('../../Models/Relations/LikeReply');

module.exports = new EntitySchema({
  name: 'LikeReply',
  target: LikeReply,
  columns: {
    replyId: {
      primary: true,
      type: 'bigint',
    },
    userId: {
      primary: true,
      type: 'bigint',
    },
  },
  relations: {
    reply: {
      target: 'Reply',
      type: 'many-to-one',
      joinColumn: { name: 'replyId', referencedColumnName: 'replyId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId', referencedColumnName: 'userId' }, // Define foreign key relationship
      onDelete: 'CASCADE',
    },
  },
});

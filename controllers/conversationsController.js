const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const Conversation = require('../models/entites/Conversation');
const Message = require('../models/entites/Message');

const { AppDataSource } = require('../dataSource');

const getUserConversations = async (userId) => {
  const conversationRepository = AppDataSource.getRepository(Conversation);

  const conversations = await conversationRepository.find({
    relations: ['user1', 'user2'],
    where: [{ user1Id: userId }, { user2Id: userId }], // $or
    select: [
      'user1Id',
      'user2Id',
      'conversationId',
      'user1.userId',
      'user1.email',
      'user1.name',
      'user1.username',
      'user1.imageUrl',
      'user2.userId',
      'user2.email',
      'user2.name',
      'user2.username',
      'user2.imageUrl',
    ],
  });

  const conversationDetails = await Promise.all(
    conversations.map(async (conversation, index) => {
      const otherUser =
        conversation.user1Id === userId
          ? conversation.user2
          : conversation.user1;

      const lastMessage = await AppDataSource.getRepository(Message).findOne({
        select: { isSeen: true, time: true, text: true, messageId: true },
        where: {
          conversationId: conversation.conversationId,
        },
        order: { time: 'DESC' },
      });

      return {
        conversationId: conversation.conversationId,
        contact: {
          id: otherUser.userId,
          email: otherUser.email,
          name: otherUser.name,
          username: otherUser.username,
          imageUrl: otherUser.imageUrl,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.messageId,
              text: lastMessage.text,
              timestamp: lastMessage.time,
              isSeen: lastMessage.isSeen,
            }
          : null,
      };
    }),
  );
  return conversationDetails;
};

exports.getConversations = catchAsync(async (req, res, next) => {
  const { currentUser } = req;

  const conversations = await getUserConversations(currentUser.userId);

  const sortedConversations = conversations.sort((a, b) => {
    const aLastMessageTime = a.lastMessage
      ? new Date(a.lastMessage.timestamp).getTime()
      : 0;
    const bLastMessageTime = b.lastMessage
      ? new Date(b.lastMessage.timestamp).getTime()
      : 0;

    return bLastMessageTime - aLastMessageTime;
  });

  res.status(200).json({
    status: true,
    data: { conversations: sortedConversations },
  });
});

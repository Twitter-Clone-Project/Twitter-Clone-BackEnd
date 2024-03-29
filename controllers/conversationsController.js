const catchAsync = require('../middlewares/catchAsync');
const AppError = require('../services/AppError');
const Conversation = require('../models/entites/Conversation');
const Message = require('../models/entites/Message');
const Follow = require('../models/relations/Follow');

const { AppDataSource } = require('../dataSource');


/**
 * Middleware function to check if a username already exists in the database.
 * Responds with a JSON object indicating the status and whether the username is found.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
const getUserConversations = async (userId) => {
  const conversationRepository = AppDataSource.getRepository(Conversation);

  const conversations = await conversationRepository.find({
    relations: ['user1', 'user2'],
    where: [{ user1Id: userId }, { user2Id: userId }], // $or
    select: [
      'user1Id',
      'user2Id',
      'conversationId',
      'isUsersActive',
      'user1.userId',
      'user1.email',
      'user1.name',
      'user1.followersCount',
      'user1.createdAt',
      'user1.username',
      'user1.imageUrl',
      'user2.userId',
      'user2.email',
      'user2.name',
      'user2.username',
      'user2.imageUrl',
      'user2.followersCount',
      'user2.createdAt',
    ],
  });

  const conversationDetails = await Promise.all(
    conversations.map(async (conversation, index) => {
      const otherUser =
        conversation.user1Id === userId
          ? conversation.user2
          : conversation.user1;

      const lastMessage = await AppDataSource.getRepository(Message).findOne({
        select: {
          isSeen: true,
          senderId: true,
          time: true,
          text: true,
          messageId: true,
        },
        where: {
          conversationId: conversation.conversationId,
        },
        order: { time: 'DESC' },
      });

      const isConversationSeen = lastMessage
        ? lastMessage.senderId === userId
          ? true
          : lastMessage.isSeen
        : true;

      const followRepository = AppDataSource.getRepository(Follow);
      const totalCountPromise = followRepository
        .createQueryBuilder('follow')
        .where('follow.userId = :user2Id', { user2Id: conversation.user2Id })
        .andWhere(
          (qb) => {
            const subQuery = qb
              .subQuery()
              .select('subFollow.followerId')
              .from(Follow, 'subFollow')
              .where('subFollow.userId = :user1Id', {
                user1Id: conversation.user1Id,
              })
              .getQuery();

            return `follow.followerId IN ${subQuery}`;
          },
          { user1Id: conversation.user1Id },
        )
        .getCount(); // Count of all common followers

      const [totalCount, commonFollowers] = await Promise.all([
        totalCountPromise,
        followRepository
          .createQueryBuilder('follow')
          .leftJoinAndSelect('follow.follower', 'follower')
          .where('follow.userId = :user2Id', { user2Id: conversation.user2Id })
          .andWhere(
            (qb) => {
              const subQuery = qb
                .subQuery()
                .select('subFollow.followerId')
                .from(Follow, 'subFollow')
                .where('subFollow.userId = :user1Id', {
                  user1Id: conversation.user1Id,
                })
                .getQuery();

              return `follow.followerId IN ${subQuery}`;
            },
            { user1Id: conversation.user1Id },
          )
          .take(2) // Limit the main query to the first two rows
          .getMany(),
      ]);

      return {
        conversationId: conversation.conversationId,
        isConversationSeen,
        contact: {
          inConversation:
            conversation.isUsersActive[`userId_${otherUser.userId}`],
          id: otherUser.userId,
          email: otherUser.email,
          name: otherUser.name,
          username: otherUser.username,
          imageUrl: otherUser.imageUrl,
          followersCount: otherUser.followersCount,
          createdAt: otherUser.createdAt,
          commonFollowers: commonFollowers.map(({ follower }) => {
            return {
              name: follower.name,
              username: follower.username,
              imageUrl: follower.imageUrl,
            };
          }),
          commonFollowersCnt: totalCount,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.messageId,
              text: lastMessage.text,
              timestamp: lastMessage.time,
              isSeen: lastMessage.isSeen,
              isFromMe: lastMessage.senderId === userId,
            }
          : null,
      };
    }),
  );
  return conversationDetails;
};

/**
 * Fetches and sorts conversations for the current user.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
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

/**
 * Retrieves the message history for a specific conversation.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
exports.getConversationHistory = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const { userId } = req.currentUser;

  if (!conversationId)
    return next(new AppError('Conversation id is required ', 400));

  const messages = await AppDataSource.getRepository(Message).find({
    select: {
      senderId: true,
      messageId: true,
      isSeen: true,
      time: true,
      text: true,
      messageId: true,
    },
    where: {
      conversationId,
    },
    order: { time: 'ASC' },
  });

  const history = messages.map((message) => {
    if (message.senderId === userId) {
      message = { ...message, isFromMe: true };
    } else {
      message = { ...message, isFromMe: false };
    }
    return message;
  });

  res.status(200).json({
    status: true,
    data: { messages: history },
  });
});


/**
 * Retrieves the count of unseen conversations for the current user.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
exports.getUnseenConversationsCnt = catchAsync(async (req, res, next) => {
  const { userId } = req.currentUser;
  const cnt = await AppDataSource.getRepository(Message)
    .createQueryBuilder('message')
    .select('COUNT(DISTINCT message.conversationId)', 'unseenCnt')
    .where('message.isSeen = :isSeen', { isSeen: false })
    .andWhere('message.receiverId = :userId', { userId })
    .getRawOne();

  res.status(200).json({
    status: true,
    data: {
      unseenCnt: cnt.unseenCnt,
    },
  });
});

/**
 * Initiates a new conversation between the current user and selected users.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
exports.startConversation = catchAsync(async (req, res, next) => {
  const { userIds } = req.body;
  const { userId: myId } = req.currentUser;
  const conversationRepository = AppDataSource.getRepository(Conversation);

  let newConversations = [];
  for (const userId of userIds) {
    const newConversation = new Conversation(
      Math.min(userId, parseInt(myId)),
      Math.max(parseInt(myId), userId),
    );

    await conversationRepository.save(newConversation);

    newConversations.push(newConversation);
  }

  res.status(200).json({
    status: true,
    data: { newConversations },
  });
});

/**
 * Deletes a conversation identified by the `conversationId`.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {void}
 */
exports.leaveConversation = catchAsync(async (req, res, next) => {
  const { conversationId } = req.body;
  const conversationRepository = AppDataSource.getRepository(Conversation);

  await conversationRepository.delete({ conversationId });

  res.status(200).json({
    status: true,
    message: 'conversation deleted successfully',
  });
});

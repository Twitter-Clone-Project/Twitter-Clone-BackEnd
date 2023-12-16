class Notification {
  constructor(userId, content, isFromChat, isSeen = false) {
    this.userId = userId;
    this.content = content;
    this.isSeen = isSeen;
    this.isFromChat = isFromChat;
  }
}
module.exports = Notification;

class Notification {
  constructor(userId, senderId, content, isSeen = false, type) {
    this.userId = userId;
    this.senderId = senderId;
    this.content = content;
    this.type = type;
    this.isSeen = isSeen;
    this.timestamp = new Date();
  }
}
module.exports = Notification;

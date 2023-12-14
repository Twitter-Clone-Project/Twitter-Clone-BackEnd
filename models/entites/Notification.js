class Notification {
  constructor(userId, content, isSeen = false, type) {
    this.userId = userId;
    this.content = content;
    this.type = type;
    this.isSeen = isSeen;
    this.timestamp = new Date();
  }
}
module.exports = Notification;

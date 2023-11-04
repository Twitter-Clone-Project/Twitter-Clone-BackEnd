class Notification {
  constructor(userId, content, isSeen = false) {
    this.userId = userId;
    this.content = content;
    this.isSeen = isSeen;
  }
}
module.exports = Notification;

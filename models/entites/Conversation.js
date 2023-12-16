class Conversation {
  constructor(user1Id, user2Id) {
    this.user1Id = user1Id;
    this.user2Id = user2Id;
    this.isUsersActive = {};
    this.isUsersActive[`userId_${this.user1Id}`] = false;
    this.isUsersActive[`userId_${this.user2Id}`] = false;
  }
}
module.exports = Conversation;

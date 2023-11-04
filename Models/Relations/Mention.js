class Mention {
  constructor(tweetId, userId, mentionedId) {
    this.tweetId = tweetId;
    this.userId = userId;
    this.mentionedId = mentionedId;
  }
}

module.exports = Mention;

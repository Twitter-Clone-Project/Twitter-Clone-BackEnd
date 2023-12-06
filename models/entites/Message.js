class Message {
  constructor(conversationId, senderId, receiverId, text, isSeen) {
    this.conversationId = conversationId;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.text = text;
    this.time = new Date();
    this.isSeen = isSeen;
  }
}

module.exports = Message;

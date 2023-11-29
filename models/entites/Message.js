class Message {
  constructor(
    conversationId,
    senderId,
    receiverId,
    text,
  ) {
    this.conversationId = conversationId;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.text = text;
    this.time = new Date();
    this.isSeen = false;
  }
}

module.exports = Message;

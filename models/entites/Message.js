class Message {
  constructor(
    conversationId,
    senderId,
    receiverId,
    text,
    time,
    isSeen = false,
  ) {
    this.conversationId = conversationId;
    this.senderI = senderId;
    this.receiverId = receiverId;
    this.text = text;
    this.time = time;
    this.isSeen = isSeen;
  }
}
module.exports = Message;

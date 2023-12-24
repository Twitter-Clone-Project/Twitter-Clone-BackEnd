# SocketService Documentation

## `connection` Event

- **Purpose**: Initializes when a new client (user) connects to the server. This event should be emitted when a user enters the website or when marked as online.
- **Action**: Sets up event listeners for the connected socket, including `add-user`, `send-msg`, `mark-notifications-as-seen`, and `disconnect.

## `msg-send` Event

- `Emit`
- **Purpose**: Sends a message from one user to another.
- **Payload**:
  - `message` - Object containing information about the message.
    - `conversationId` - ID of the conversation.
    - `receiverId` - ID of the message receiver.
    - `isSeen` - Indicates whether the message is seen.
    - `text` - The content of the message.
- **Action**:
  - Inserts the new message into the database.
  - Sends a chat notification to the receiver.
  - Emits the message to the receiver's socket.
- **Emits**:
  - `chat-notification-receive` - Sends a chat notification to the receiver.
  - `msg-receive` - Sends the message text to the receiver's socket.

## `msg-broadcast` Event

- `Listen`
- **Purpose**: Sends a chat message to all aother sender sockets if he opened the chat from another app.
- **Payload**:
  - `message` - Object containing information about the message.
    - `messageId` - ID of the message.
    - `senderId` - ID of the message sender.
    - `receiverId` - ID of the message receiver.
    - `text` - The content of the message.
    - `isFromMe` - boolean to know if the message from me or not.
    - `time` - The time of the message.
    - `senderUsername` - username of the sender.
- **Action**: Emits the message text to the receiver's socket.

## `msg-receive` Event

- `Listen`
- **Purpose**: Sends a chat message to the receiver's socket.
- **Payload**:
  - `message` - Object containing information about the message.
    - `messageId` - ID of the message.
    - `senderId` - ID of the message sender.
    - `receiverId` - ID of the message receiver.
    - `text` - The content of the message.
    - `isFromMe` - boolean to know if the message from me or not.
    - `time` - The time of the message.
    - `senderUsername` - username of the sender.
- **Action**: Emits the message text to the receiver's socket.

## `chat-opened` Event

- `Emit`
- **Purpose**: Updates the status of notifications and messages when a chat is opened.
- **Payload**:
  - `data` - Object containing information about the chat.
    - `contactId` - ID of the contact in the conversation.
    - `conversationId` - ID of the conversation.
- **Action**:
  - Updates notifications with `isFromChat` as `true` and `isSeen` as `true` for the specified user.
  - Updates messages with `isSeen` as `true` for the specified conversation and user.
  - Emits a `status-of-contact` event.

## `chat-closed` Event

- `Emit`
- **Purpose**: Emits it when a chat with a user is closed.
- **Payload**:
  - `data` - Object containing information about the chat.
    - `conversationId` - ID of the conversation.
    - `contactId` - ID of the contact in the conversation.
- **Action**:
  - Emits a `status-of-contact` event.

## `status-of-contact` Event

- `Listen`
- **Purpose**: Sends the status of the other contact in a conversation.
- **Payload**:
  - `status` - Object containing `conversationId`, `isLeaved` and `inConversation`.
- **Action**: Emits the status of the other contact.

## `notification-receive` Event

- `Listen`
- **Purpose**: Notifies the receiver about a new chat message.
- **Payload**:
  - `notification` - Object containing information about the notification.
    - `notificationId` - ID of the notification.
    - `content` - Content of the notification.
    - `timestamp` - timestamp for the notification.
    - `isSeen` - Indicates whether the notification is seen.
    - `senderImgUrl` - Image url for the user who sent the message or triggered the notification.
- **Action**: Emits the notification to the receiver's socket.

## `mark-notifications-as-seen` Event

- **Purpose**: Marks all notifications as seen. When the user goes out of the notifications page or unmounts it, this event should be emitted to mark the notifications as seen.
- **Action**: Updates the `isSeen` status of all notifications from `false` to `true` in the database.

## `disconnect` Event

- **Purpose**: Handles the disconnection of a client (user).
- **Action**:
  - Updates the user's `socketId` to `null` and sets `isOnline` to `false` in the database.
  - Logs a message indicating the disconnection.

### Important Notes

- The `emitNotification` method is responsible for emitting chat notifications to users.
- The `initializeSocket` method sets up the Socket.IO server and defines event listeners for various socket events.
- The code assumes a certain structure for your User, Message, and Notification models, but the exact details are not provided.

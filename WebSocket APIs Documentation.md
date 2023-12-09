# SocketService Documentation

## `connection` Event

- **Purpose**: Initializes when a new client (user) connects to the server. This event should be emited when a user enters the website or when he should be marked as online.
- **Action**: Sets up event listeners for the connected socket, including `add-user`, `send-msg`, `mark-notifications-as-seen`, and `disconnect`.

## `add-user` Event

- **Purpose**: Adds a user to the online user list and updates their socket ID and online status.
- **Payload**: `userData` - Object containing user information, specifically `userId`.
- **Action**:
  - Updates the user's `socketId` and sets `isOnline` to `true` in the database.
  - Retrieves a list of online users and emits it to the newly connected user.
- **Emits**: `getOnlineUsers` - Sends a list of online users to the connected user.

## `msg-send` Event

- **Purpose**: Sends a message from one user to another.
- **Payload**: `message` - Object containing information about the message, including `conversationId`, `senderId`, `receiverId`, `isSeen`, and `text`.
- **Action**:
  - Inserts the new message into the database.
  - Sends a chat notification to the receiver.
  - Emits the message to the receiver's socket.
- **Emits**:
  - `chat-notification-receive` - Sends a chat notification to the receiver.
  - `msg-receive` - Sends the message text to the receiver's socket.

## `msg-receive` Event

- **Purpose**: Sends a chat message to the receiver's socket.
- **Payload**: `message` - Object containing information about the message, including `conversationId`, `senderId`, `receiverId`, and `text`.
- **Action**: Emits the message text to the receiver's socket.

## `chat-opened` Event

- **Purpose**: Updates the status of notifications and messages when a chat is opened.
- **Payload**: `data` - Object containing information about the chat, including you id (the id of the current emiter user that opened the chat :) as `userId`, id of the person you are chating `contactId` and also `conversationId`.
- **Action**:
  - Updates notifications with `isFromChat` as `true` and `isSeen` as `true` for the specified user.
  - Updates messages with `isSeen` as `true` for the specified conversation and user.
  - emits a `status-of-contact` event.

## `chat-closed` Event

- **Purpose**: emit it when a chat with a user is closed.
- **Payload**: `data` - Object containing information about the chat, including the `conversationId` and `contactId`.
- **Action**:
  - emits a `status-of-contact` event.

## `status-of-contact` Event

- **Purpose**: Sends the status of the another contact in a conversation.
- **Payload**: `status` - Object containing `conversationId` and `inConversation`.
- **Action**: Emits the status of the another contact.

## `mark-notifications-as-seen` Event

- **Purpose**: Marks all notifications as seen. When the user go out of the notifications page or unmoun it, this event should be emited to mark the notifications as seened.
- **Payload**: `data` - Object containing information about the notifications, including you id (the id of the current emiter user that opened the chat :) as `userId`.
- **Action**: Updates the `isSeen` status of all notifications from `false` to `true` in the database.

## `getOnlineUsers` Event

- **Purpose**: Retrieves the list of online users.
- **Action**: Queries the database for users with `isOnline` set to `true` and emits the list to the connected user.

## `chat-notification-receive` Event

- **Purpose**: Notifies the receiver about a new chat message.
- **Payload**: `notification` - Object containing information about the notification. `notificationId`, `content`, `userId` and `isSeen`.
- **Action**: Emits the notification to the receiver's socket.

## `disconnect` Event

- **Purpose**: Handles the disconnection of a client (user).
- **Action**:
  - Updates the user's `socketId` to `null` and sets `isOnline` to `false` in the database.
  - Logs a message indicating the disconnection.

### Important Notes

- The `emitNotification` method is responsible for emitting chat notifications to users.
- The `initializeSocket` method sets up the Socket.IO server and defines event listeners for various socket events.
- The code assumes a certain structure for your User, Message, and Notification models, but the exact details are not provided.

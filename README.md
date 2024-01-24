<div align="center">
<img src="https://www.linearity.io/blog/content/images/2023/09/Twitter-Template-cover---new-X.png" alt="Artboard-1-transparent-1" border="0" >
<h1/>
</div>

<div align="center">
    <h1 align='center'>⚡️<i>Twitter Clone</i>⚡️</h1>
    <p>Amazing Twitter clone - It's a microblogging site that enables users to share brief messages and engage in real-time conversations.</p>
</div>

<div align="center">

[![GitHub contributors](https://img.shields.io/github/contributors/Twitter-Clone-Project/Twitter-Clone-BackEnd)](https://github.com/Twitter-Clone-Project/Twitter-Clone-BackEnd/contributors)
[![GitHub issues](https://img.shields.io/github/issues/Twitter-Clone-Project/Twitter-Clone-BackEnd)](https://github.com/Twitter-Clone-Project/Twitter-Clone-BackEnd/issues)
[![GitHub forks](https://img.shields.io/github/forks/Twitter-Clone-Project/Twitter-Clone-BackEnd)](https://github.com/Twitter-Clone-Project/Backend/network)
[![GitHub stars](https://img.shields.io/github/stars/Twitter-Clone-Project/Twitter-Clone-BackEnd)](https://github.com/Twitter-Clone-Project/Backend/stargazers)

</div>

<details open="open">
<summary>
<h2 style="display:inline">📝 Table of Contents</h2>
</summary>

- [🚀 OverView](#-overview)
- [⛏️ Tech Stack](#tech-stack)
- [🔥 Getting started](#-get-started)
- [📄 API Documentation](#-API-Documentation)
- [📷 Features](#-features)
- [👨‍💻 Authors](#-authors)
  
</details>

<hr>

## 🚀 Overview
> This website was implemented for the Software Engineering Course @ Cairo University Faculty of Engineering.

> It is developed using Node.js for the backend, PostgreSQL for the database, React for the frontend, and AWS for deployment.
  
> The Twitter Clone project aims to replicate the core features and functionalities of the popular social media platform, Twitter. This web application provides users with a platform to share short messages, engage with other users through likes, retweets, and comments, and stay updated on the latest trends and activities.
<hr>

## ⛏️ Tech Stack

![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=ffffff)

![Nodejs](https://img.shields.io/badge/-Nodejs-339933?style=flat&logo=Node.js&logoColor=ffffff)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB)

![TypeORM](https://img.shields.io/badge/-TypeORM-E83524?style=flat&logo=typeorm&logoColor=ffffff)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?style=flat&logo=postgresql)

![Docker](https://img.shields.io/badge/-Docker-black?style=flat&logo=docker)
![Jenkins](https://img.shields.io/badge/-Jenkins-D24939?style=flat&logo=jenkins&logoColor=ffffff)

![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?style=flat&logo=socket.io&logoColor=ffffff)
![Event-Driven Programming](https://img.shields.io/badge/Event--Driven%20Programming-FF69B4?style=flat&logo=eventbrite&logoColor=white)

![Jest](https://img.shields.io/badge/-jest-%23C21325?style=flat&logo=jest&logoColor=white)
![SuperTest](https://img.shields.io/badge/SuperTest-3178C6?style=flat&logo=node.js&logoColor=white)

 ![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON%20web%20tokens)
 ![Google reCAPTCHA](https://img.shields.io/badge/Google%20reCAPTCHA-4285F4?style=flat&logoColor=white)
 ![OAuth](https://img.shields.io/badge/OAuth-2.0-4A90E2?style=flat&logo=oauth&logoColor=white)
 ![AWS](https://img.shields.io/badge/-Amazon%20Web%20Services-232F3E?style=flat&logo=amazon-aws&logoColor=ffffff)

<hr>

## 🔥 Get Started

1. Clone the project

```bash
  https://github.com/Twitter-Clone-Project/Back-End.git
```

2. Install dependencies. hint: `cd to the project folder that has the package.json file in it.`

```bash
  npm install
```

3. Set environment variables

```
 Copy file .env.template then Create file .env and set your environment variables in it.
```

4. Start the server in development env

```bash
  npm run start:dev
```

5. Start the server in production env

```bash
  npm run start:prod
```

<hr>

## 📄 API Documentation

> File API-Documentation.yaml in the repo, this is a yaml coded-documentation. Untill we upload the documentation on swaagerHub($$), you can see the GUI by opening [swagger editor](https://editor-next.swagger.io/) online, then paste the code in it.

> You can also see postman documentation with test exambles [here](https://documenter.getpostman.com/view/23936176/2s9YXe8jiV)

> Here is the Socket.io events [documentaion](https://github.com/Twitter-Clone-Project/Twitter-Clone-BackEnd/blob/main/WebSocket%20APIs%20Documentation.md)
<hr>

## 📸 Features 
<details>
<summary>
<h4 style="display:inline">
<strong><em>🔒 User Authentication</em></strong></h4>
</summary>
 
1. **Sign Up:**
   - Allows users to create a new account in the application.

2. **Sign In:**
   - Enables users to sign in to their accounts.

3. **Sign In/Up with Google:**
   - Provides the option to sign in or sign up using Google credentials.

4. **Get Me:**
   - Retrieves information about the authenticated user.

5. **Sign Out:**
   - Logs the user out from the application.

6. **Resend Confirmation Email:**
   - Resends the confirmation email to the user for account verification.

7. **Verify Email:**
   - Confirms the email of the user after receiving the verification email.

8. **Update Password:**
   - Allows users to update their password.

9. **Forget Password:**
   - Initiates the process of resetting the password by sending an email.

10. **Reset Password:**
    - Completes the password reset process.

11. **Check Username Availability:**
    - Determines if a given username is already registered.

12. **Check Email Availability:**
    - Checks if a given email is already registered.
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>🙍‍♂️ User Profile</em></strong></h4>
</summary>

1. **Update Username:**
   - Allows users to change their username.

2. **Update Email:**
   - Permits users to update their email address.

3. **Update Banner:**
   - Adds a banner to the user's profile.

4. **Delete Banner:**
   - Removes the banner picture from the user's profile.

5. **Update Profile Picture:**
   - Updates the user's profile picture.

6. **Delete Profile Picture:**
   - Deletes the user's profile picture.

7. **Update Profile:**
   - Updates various aspects of the user's profile.

8. **Get User Profile:**
   - Retrieves the profile information of a specific user.
   
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>👨‍💻 User Interactions</em></strong></h4>
</summary>

1. **Get Followers:**
   - Retrieves a list of followers for a specific user.

2. **Get Followings:**
   - Retrieves a list of users followed by a specific user.

3. **Follow User:**
   - Allows a user to follow another user.

4. **Unfollow User:**
   - Allows a user to unfollow another user.

5. **Mute User:**
   - Mutes a specific user.

6. **Unmute User:**
   - Unmutes a previously muted user.

7. **Get Muted Users:**
   - Retrieves a list of users muted by the authenticated user.

8. **Block User:**
   - Blocks a specific user.

9. **Unblock User:**
   - Unblocks a previously blocked user.

10. **Get Blocked Users:**
    - Retrieves a list of users blocked by the authenticated user.

 
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>📤 Tweets</em></strong></h4>
</summary>

1. **Add Tweet:**
   - Allows users to post a new tweet.

2. **Delete Tweet:**
   - Deletes a tweet based on its tweetId.

3. **Get Tweet Info:**
   - Retrieves information about a specific tweet.

4. **Get Replies to Tweet:**
   - Retrieves replies to a specific tweet.

5. **Add Reply to Tweet:**
   - Allows users to add a reply to a tweet.

6. **Delete Reply from Tweet:**
   - Deletes a reply from a tweet.

7. **Add Retweet:**
   - Allows users to retweet a tweet.

8. **Delete Retweet:**
   - Deletes a retweet.

9. **Like Tweet:**
   - Allows users to like a tweet.

10. **Unlike Tweet:**
    - Removes a like from a tweet.

11. **Get Retweeters:**
    - Retrieves a list of users who retweeted a specific tweet.

12. **Get Likers:**
    - Retrieves a list of users who liked a specific tweet.

13. **Add Media to Tweet:**
    - Allows users to add media (e.g., images) to a tweet.

14. **Get Media from Tweet:**
    - Retrieves media (e.g., images) associated with a tweet.
 
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>⏲️ Timeline</em></strong></h4>
</summary>

1. **Get Home Timeline:**
   - Retrieves a list of tweets on the home page of the user.

2. **Get User Tweets:**
   - Retrieves tweets posted by a specific user.

3. **Get Mentioned Tweets:**
   - Retrieves tweets where the user is mentioned.

4. **Get Liked Tweets:**
   - Retrieves tweets liked by a specific user.

## Trends
1. **Get Available Trends:**
   - Retrieves a list of available trends.

2. **Get Trend Tweets:**
   - Retrieves tweets associated with a specific trend.
 
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>🔎 Search</em></strong></h4>
</summary>

1. **Search Users:**
   - Searches for users based on their username or screen name.

2. **Search Tweets:**
   - Searches for tweets based on a provided string.
 
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>🗨️ Chats</em></strong></h4>
</summary>

1. **Real-Time Chat:**
   - Allows users to send and receive messages in real-time, ensuring instant communication.

2. **Synchronized Chat Across Devices:**
   - Ensures that the chat history and messages are synchronized seamlessly when a user accesses the application from multiple devices.

3. **Start Conversation:**
   - Users can initiate new conversations with other users.

4. **Leave Conversation:**
   - Provides the functionality for users to leave a conversation.

5. **Unseen Conversations Count:**
   - Retrieves the number of unseen conversations to notify users of new messages.

6. **View Messages in a Conversation:**
   - Users can view the messages within a specific conversation.

7. **Send Messages:**
   - Allows users to send messages to others within a conversation.

8. **Seen and Sent Feature:**
   - Indicates whether a message has been seen by the recipient and provides information about when a message was sent.

9. **Delete Messages:**
   - Users can delete their messages within a conversation.
 
</details>

<details>
<summary>
<h4 style="display:inline">
<strong><em>🔔 Notifications</em></strong></h4>
</summary>

1. **Real-Time Notifications:**
   - Users receive notifications in real-time for events such as new followers.

2. **Unseen Notifications Count:**
   - Provides the count of unseen notifications to inform users about new activities.

3. **View Notifications:**
   - Users can view a list of their notifications, including details about the activities that triggered them.

4. **Seen Feature:**
   - Tracks whether a user has seen a particular notification.
 
</details>
<hr>

## 📁 File Structure
<details>
<summary>
<h4 style="display:inline"> 📂 File Tree</h4>
</summary>

 ```plaintext
project-root
│
├── tests
│   ├── routes
│   │   ├── authRouter.test.js
│   │   ├── conversationsRouter.test.js
│   │   ├── interactions.test.js
│   │   ├── notificationsRouter.test.js
│   │   ├── profile.test.js
│   │   ├── searchRouter.test.js
│   │   ├── timelineRouter.test.js
│   │   └── tweetsRouter.test.js
│   ├── services
│   │   └── WebSocket.oldtest.js
├── controllers
│   ├── authController.js
│   ├── conversationsController.js
│   ├── errorController.js
│   ├── interactionsController.js
│   ├── notificationsController.js
│   ├── profileController.js
│   ├── searchController.js
│   ├── timelineController.js
│   ├── trendsController.js
│   └── tweetsController.js
├── middlewares
│   ├── validations
│   │   ├── conversation.js
│   │   ├── profile.js
│   │   ├── tweet.js
│   │   └── user.js
│   ├── catchAsync.js
│   └── validateRequest.js
├── models
│   ├── entities
│   │   ├── Conversation.js
│   │   ├── Media.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Reply.js
│   │   ├── Trend.js
│   │   ├── Tweet.js
│   │   └── User.js
│   ├── relations
│   │   ├── Block.js
│   │   ├── Follow.js
│   │   ├── Like.js
│   │   ├── LikeReply.js
│   │   ├── Mention.js
│   │   ├── Mute.js
│   │   ├── Repost.js
│   │   └── Support.js
├── routes
│   │   ├── authRouter.js
│   │   ├── conversationsRouter.js
│   │   ├── interactionsRouter.js
│   │   ├── notificationsRouter.js
│   │   ├── profileRoutes.js
│   │   ├── searchRouter.js
│   │   ├── timelineRouter.js
│   │   ├── trendsRouter.js
│   │   └── tweetsRouter.js
├── schemas
│   ├── entities
│   │   ├── conversationSchema.js
│   │   ├── mediaSchema.js
│   │   ├── messageSchema.js
│   │   ├── notificationSchema.js
│   │   ├── replySchema.js
│   │   ├── trendSchema.js
│   │   ├── tweetSchema.js
│   │   └── userSchema.js
│   ├── relations
│   │   ├── blockSchema.js
│   │   ├── followSchema.js
│   │   ├── likeReplySchema.js
│   │   ├── likeSchema.js
│   │   ├── mentionSchema.js
│   │   ├── muteSchema.js
│   │   ├── repostSchema.js
│   │   └── supportSchema.js
├── seeds
│   ├── blocks.json
│   ├── conversations.json
│   ├── follows.json
│   ├── likes.json
│   ├── media.json
│   ├── messages.json
│   ├── mutes.json
│   ├── notifications.json
│   ├── replies.json
│   ├── reposts.json
│   ├── seeds.js
│   ├── supports.json
│   ├── trends.json
│   ├── tweets.json
│   └── users.json
├── services
│   ├── AppError.js
│   ├── AuthService.js
│   ├── Email.js
│   ├── Password.js
│   └── WebSocket.js
├── test
│     └── setup.js
├── views/emails
│   ├── _style.pug
│   ├── baseEmail.pug
│   ├── confirmEmail.pug
│   └── updateEmail.pug
├── .env.template
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── API-Documentation.yaml
├── Dockerfile
├── README.md
├── WebSocket APIs Documentation.md
├── app.js
├── dataSource.js
├── dataSource2test.js
├── package-lock.json
├── package.json
└── server.js
```
 </details>

<hr>





## 👨‍💻 Authors

- Mahmoud Yahia [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/mahmoud-yahia-882144219/)
- Mohamed Yaser [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/mohamed-yasser-952280226/)
- Daniel Nabil [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/daniel-atallah01/)
- Mostafa Tarek [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat-square&logo=linkedin)]()

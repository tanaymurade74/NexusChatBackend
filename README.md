# Nexus Chat – Backend

A real-time chat API powering one-to-one messaging with JWT authentication, message status tracking, typing indicators, replies, edit/delete, and server-side profanity masking. Built with Express, Socket.IO, and MongoDB.

## Quick Start

```bash
git clone https://github.com/tanaymurade74/ChatAppBackend.git
cd ChatAppBackend
npm install
```

Create a `.env` file in the project root:

```env
MONGODB=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

Then start the server:

```bash
node index.js     # runs on http://localhost:5001
```

> No `start` script is defined yet. To use `npm start`, add `"start": "node index.js"` to `scripts` in `package.json` (and `nodemon` for auto-reload during development).

## Technologies

* Node.js
* Express 5
* Socket.IO
* MongoDB
* Mongoose 9
* JSON Web Token (jsonwebtoken)
* bcrypt
* obscenity (profanity filtering)
* CORS
* dotenv

## Features

**Authentication**

* User registration and login
* Passwords hashed with bcrypt
* JWT issued on registration

**Messaging**

* One-to-one messages stored in MongoDB
* Reply to a specific message (threaded references)
* Edit and soft-delete your own messages
* Unread message counts per conversation

**Real-time (Socket.IO)**

* Instant message delivery
* Delivery and read receipts (sent → delivered → read)
* Typing / stopped-typing indicators
* Online-presence handling (deliver queued messages when a user comes online)

**Moderation**

* Profanity is masked server-side before messages are saved

### Authentication

**`POST /auth/register`**
Register a new user. Body: `username`, `password`.
Sample response: `{ "token": "...", "username": "..." }`

**`POST /auth/login`**
Log in with `username` and `password`.
Sample response: `{ "Message": "Login successful" }`

### Messages & Users

**`GET /messages?sender=<a>&receiver=<b>`**
Fetch the full conversation between two users (both directions), oldest first.
Sample response: `[ { _id, sender, receiver, message, status, replyTo, createdAt } ]`

**`GET /users?currentUser=<username>`**
List all other users, each with an `unreadCount` for the current user.
Sample response: `[ { _id, username, unreadCount } ]`

**`PATCH /messages/:id`**
Edit one of your own messages. Body: `newMessage`, `username`.
Sample response: `{ _id, message, editedAt, ... }`

**`DELETE /messages/:id`**
Soft-delete one of your own messages (clears text, sets `deletedAt`). Body: `username`.
Sample response: `{ "ok": true }`

## Real-time Events (Socket.IO)

**Client → Server:** `send_message`, `message_delivered`, `mark_chat_read`, `mark_all_delivered`, `typing`, `stop_typing`

**Server → Client:** `message_saved`, `receive_message`, `status_updated_to_delivered`, `chat_read_by_user`, `user_came_online`, `user_typing`, `user_stopped_typing`, `message_edited`, `message_deleted`

## Data Models

* **User** — `username` (unique), `password` (bcrypt-hashed), `createdAt`
* **Message** — `sender`, `receiver`, `message`, `status` (sending/sent/delivered/read), `replyTo` (reference to another message), `editedAt`, `deletedAt`, timestamps

## Related Repositories

* **Frontend (React):** [https://github.com/tanaymurade74/ChatAppFrontend](https://github.com/tanaymurade74/ChatAppFrontend)

## Notes

* Messages are **soft-deleted** — the document is kept with `deletedAt` set and its text cleared, rather than removed.
* `/auth/login` currently validates credentials but does not issue a JWT (only `/auth/register` returns a token). Worth wiring up if you add token-protected routes.
* CORS is open to all origins.
* The server port defaults to `5001` (override with the `PORT` env variable).

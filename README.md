# Nexus Chat – Frontend

A real-time chat interface for one-to-one messaging. Register or log in, chat live with read receipts and typing indicators, reply to messages, edit or delete your own, and drop in emojis. Built with React, Socket.IO, and Bootstrap.

## Live Demo

[Live Demo](https://chat-app-frontend-three-umber.vercel.app)

## Quick Start

```bash
git clone https://github.com/tanaymurade74/ChatAppFrontend.git
cd ChatAppFrontend
npm install
```

Create a `.env` file in the project root, pointing at the backend:

```env
REACT_APP_API_URL=http://localhost:5001
```

> Replace with your deployed [backend](https://github.com/tanaymurade74/ChatAppBackend) URL in production. This single variable is used for both the REST calls and the Socket.IO connection.

Then start the app:

```bash
npm start
```

## Technologies

* React 19
* React Router DOM 7
* Bootstrap 5
* Axios
* Socket.IO Client
* emoji-picker-react
* Create React App (react-scripts)

## Features

**Authentication**

* Register a new account and log in
* Redirects unknown routes back to the entry page

**Chat**

* Real-time one-to-one messaging over Socket.IO
* List of users with unread message counts
* Reply to a specific message
* Edit and delete your own messages
* Emoji picker for composing messages

**Real-time UX**

* Read receipts (sent → delivered → read)
* Live typing indicators
* Messages and status updates appear instantly without refresh

## Routes

| Path                | Component | Description                          |
|---------------------|-----------|--------------------------------------|
| `/`                 | Register  | Create a new account (entry page)    |
| `/login`            | Login     | Log in with existing credentials     |
| `/chats/:username`  | Chat      | Main chat screen for the logged-in user |
| `*`                 | —         | Redirects to `/`                     |

## Project Structure

```
src/
├── components/
│   ├── Register.js     # Sign-up form
│   ├── Login.js        # Login form
│   ├── Chat.js         # Main chat screen + Socket.IO logic
│   └── MessageList.js  # Renders the message thread
├── App.js              # Routes and app shell
└── index.js            # Entry point
```

## Backend

This app consumes a separate Express + Socket.IO + MongoDB server.

* **Backend repository:** [https://github.com/tanaymurade74/ChatAppBackend](https://github.com/tanaymurade74/ChatAppBackend)

The frontend reads the API base URL from `REACT_APP_API_URL` and uses it for REST endpoints (`/auth/*`, `/messages`, `/users`) and the real-time Socket.IO connection.

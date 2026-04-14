const express = require("express");
const cors = require("cors");
// const dotenv = require("dotenv")
const mongoose = require("mongoose");
const authRoutes = require("./routes/Auth.js");
const { Server } = require("socket.io");
const http = require("http");
const Messages = require("./models/Messages.js");
const ChatAppUser = require("./models/ChatAppUser.js");

require("dotenv").config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log("Error while connecting to the database", err));

app.use("/auth", authRoutes);

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("send_message", async (data) => {
    const { sender, receiver, message, tempId } = data;
    try {
      const newMessage = new Messages({ sender, receiver, message, status: "sent" });
      await newMessage.save();
      
      socket.emit("message_saved", { tempId, realId: newMessage._id });

      socket.broadcast.emit("receive_message", newMessage);
    } catch (error) {
      console.error("Error while saving message in db", error);
    }
  });

  socket.on("message_delivered", async (data) => {
    try {
      await Messages.findByIdAndUpdate(data.messageId, { status: "delivered" });
      socket.broadcast.emit("status_updated_to_delivered", { messageId: data.messageId });
    } catch (error) {
      console.error("Error updating delivery status", error);
    }
  });

  socket.on("mark_chat_read", async (data) => {
    const { sender, receiver } = data;
    try {
      await Messages.updateMany(
        { sender: sender, receiver: receiver, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );
      socket.broadcast.emit("chat_read_by_user", { reader: receiver });
    } catch (error) {
      console.error("Error updating read status", error);
    }
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("user_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.broadcast.emit("user_stopped_typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;
  try {
    const messages = await Messages.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ Message: "Error fetching messages" });
  }
});

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const users = await ChatAppUser.find({ username: { $ne: currentUser } });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ Message: "Error while fetching users", Error: error });
  }
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

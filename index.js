const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/Auth.js");
const { Server } = require("socket.io");
const http = require("http");
const Messages = require("./models/Messages.js");
const ChatAppUser = require("./models/ChatAppUser.js");

const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');
const {Filter} = require("bad-words");



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

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

const censor = new TextCensor();

const filter = new Filter();

const maskAbuse = (text) => {
  if(!text || !text.trim()) return text;
  // const matches = matcher.getAllMatches(text);
  return filter.clean(text);
}

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("send_message", async (data) => {
    const { sender, receiver, message, tempId, replyTo } = data;
    try {
      const cleanMessage = maskAbuse(message);

      const newMessage = new Messages({ sender, receiver, message: cleanMessage, status: "sent", replyTo: replyTo || null });
      await newMessage.save();
      
      await newMessage.populate("replyTo", "sender message")

      socket.emit("message_saved", { tempId, realId: newMessage._id, message: cleanMessage });

      socket.broadcast.emit("receive_message", newMessage.toObject());
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
      socket.broadcast.emit("chat_read_by_user", { reader: receiver, chatWith: sender });
    } catch (error) {
      console.error("Error updating read status", error);
    }
  });

  socket.on("mark_all_delivered", async (username) => {
    try {
      await Messages.updateMany(
        { receiver: username, status: "sent" },
        { $set: { status: "delivered" } }
      );
      socket.broadcast.emit("user_came_online", username);
    } catch (error) {
      console.error("Error marking offline messages as delivered", error);
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
    }).populate("replyTo", "sender message").sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ Message: "Error fetching messages" });
  }
});

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const users = await ChatAppUser.find({ username: { $ne: currentUser } });

    const unreadMessages = await Messages.find({
        receiver: currentUser,
        status: {
            $ne: "read"
        }
    })

    const userWithCount = users.map(u => {
        const count = unreadMessages.filter(msg => msg.sender === u.username).length;
        return {...u.toObject(), unreadCount: count}
    }) 
    res.status(200).json(userWithCount);
  } catch (error) {
    res
      .status(500)
      .json({ Message: "Error while fetching users", Error: error });
  }
});

app.patch("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { newMessage, username } = req.body;

  if (!newMessage || !newMessage.trim()) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
    const msg = await Messages.findById(id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.sender !== username) return res.status(403).json({ error: "Not your message" });
    if (msg.deletedAt) return res.status(400).json({ error: "Message already deleted" });


    msg.message = maskAbuse(newMessage.trim());
    msg.editedAt = new Date();
    await msg.save();

    io.emit("message_edited", {
      _id: msg._id,
      message: msg.message,
      editedAt: msg.editedAt,
    });

    res.status(200).json(msg);
  } catch (error) {
    console.error("Error editing message", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  try {
    const msg = await Messages.findById(id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.sender !== username) return res.status(403).json({ error: "Not your message" });
    if (msg.deletedAt) return res.status(200).json({ ok: true }); 

    await Messages.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date(), message: "" } }
    );

    io.emit("message_deleted", { _id: id });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error deleting message", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
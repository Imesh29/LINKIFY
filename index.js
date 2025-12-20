require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const chatRoutes = require("./routes/chats");

const Chat = require("./models/chats");
const Message = require("./models/messages");

const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(process.env.DB)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => {
    logger.error("MongoDB Connection Failed", err);
    logger.on("finish", () => {
      process.exit(1);
    });
    logger.end();
  });


app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);

// Custom Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  //  log the error in file or in database
  logger.error(error.message, {
    method: req.method,
    path: req.originalUrl,
    stack: error.stack,
  });
  return res.status(500).json({ message: "Internal Server Error!" });
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error! Token required!"));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_KEY);
    socket.user = user;
    console.log("Socket User", socket.user);

    next();
  } catch (error) {
    return next(new Error("Authentication error! Token required!"));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("userData", socket.user);
  onlineUsers.set(socket.user._id,socket.id);
  console.log("Online users", onlineUsers);

  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room: ${chatId}`);
  });

  socket.on("sendMessage", async ({ content, chatId}) => {
    const userId = socket.user._id;
    if (!content) {
      socket.emit(
        "errorInSendMessage",
        "Content(message-text) is must required!"
      );
      return;
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      socket.emit("errorInSendMessage", "Access Denied");
      return;
    }

    /*const recipients = chat.participants.filter(
      (id) => id.toString() !== userId
    );

    let deliveryStatus;
    if (chat.isGroup) {
      deliveryStatus = recipients.map((user) => {
        const online = onlineUsers.has(user);
        return {
          user: user,
          status: online ? "delivered" : "sent",
          deliveredAt: online ? new Date() : null,
        };
      });
    }*/

    const newMessage = new Message({
      chatId: chat._id,
      sender: userId,
      content,
      
    });

    await newMessage.save();

    chat.lastMessage = newMessage._id;
    await chat.save();

    const populateMessage = await Message.findById(newMessage._id)
      .populate("sender", "_id username")
      //.populate("deliveryStatus.user", "_id username");
  
    //io.emit("getMessage",data);
    io.to(chatId).emit("getMessage", populateMessage);
  });

  socket.on("disconnect", () =>{
    onlineUsers.delete(socket.user._id);

    console.log("Online users", onlineUsers);
  })

  socket.on("typing", ({ chatId }) => {
    socket
      .to(chatId)
      .emit("showTyping", `${socket.user.username} is typing...`);
  });

  socket.on("stopTyping", ({ chatId}) => {
    socket.to(chatId).emit("hideTyping", socket.user.username);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const chatRoutes = require("./routes/chats");

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

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room: ${chatId}`);
  });
  socket.on("sendMessage", (data) =>{
    console.log("New message from frontend:", data);
  
    //io.emit("getMessage",data);
    io.to(data.chatId).emit("getMessage", data);
  });

  socket.on("typing", ({ chatId,username }) => {
    socket
      .to(chatId)
      .emit("showTyping", `${username} is typing...`);
  });

  socket.on("stopTyping", ({ chatId,username}) => {
    socket.to(chatId).emit("hideTyping", username);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));

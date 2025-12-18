const auth = require("../middleware/auth");
const Chat = require("../models/chats");
const Message = require("../models/messages");

const router = require("express").Router();

//Find current logged in user
router.get("/", auth, async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ participants: userId })
    .populate("participants", "_id username")
    .populate({
      path: "lastMessage",
      select: "sender content createdAt",
      populate: {
        path: "sender",
        select: "username",
      },
    })
    .sort({ updatedAt: -1 });

  res.json({ chats });
});


//Fetch messages from a specific chat  ----------------------------
router.get("/:chatId/messages", auth, async (req, res) => {
  const { chatId } = req.params;

  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const messages = await Message.find({ chatId })
    .populate("sender", "_id username")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const hasPreviousMessages = messages.length === limit ? true : false;

  res.json({ messages, hasPreviousMessages, page, limit });
});


// CREATE OR GET A PRIVATE CHAT  --------------------------------------------
router.post("/createChat", auth, async (req, res) => {
  const userId = req.user._id;           // This is the person who is starting the chat
  const receiverId = req.body.receiverId;
  if (!receiverId)
    return res.status(400).json({ message: "Receiver required!" });

  let chat = await Chat.findOne({            // Check if a private chat already exists between these two users
    participants: { $all: [userId, receiverId], $size: 2 },   // $all  → both userId and receiverId must be present
  });   // $size → ensures ONLY two participants (1-to-1 chat, not group)


  // 🆕 If chat does NOT exist, create a new one
  if (!chat) {
    chat = new Chat({
      participants: [userId, receiverId],   // Store both user IDs as chat participants
    });
    await chat.save();
  }

  res.status(201).json(chat);
});



// SEND MESSAGE TO A CHAT -------------------------
router.post("/sendMessages", auth, async (req, res) => {
  const userId = req.user._id;
  const { content, chatId } = req.body ;

  if (!content)
    return res
      .status(400)
      .json({ message: "Content(message-text) is must required!" });

  const chat = await Chat.findById(chatId);
// - Chat must exist
// - Logged-in user must be a participant of the chat
  if (!chat || !chat.participants.includes(userId)) {
    return res.status(403).json({ message: "Access denied!" });
  }
// 📨 Create a new message document
  const newMessage = new Message({
    chatId: chat._id,    // Reference to which chat this message belongs to
    sender: userId,     // Sender is the logged-in user
    content,     // Actual message text
  });

  await newMessage.save();
// This helps show last message preview in chat list
  chat.lastMessage = newMessage._id;
  await chat.save();

// 🔁 Populate sender details (username, _id)
// Makes frontend display easier
  const populateMessage = await Message.findById(newMessage._id).populate(
    "sender",
    "_id username"
  );

  res.status(201).json({ newMessage: populateMessage });
});


module.exports = router;
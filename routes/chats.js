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


//Fetch messages for a chat
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


module.exports = router;
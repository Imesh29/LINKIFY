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


module.exports = router;
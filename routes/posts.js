const express = require("express");
const auth = require("../middleware/auth");
const postUpload = require("../config/multer-upload");
const Post = require("../models/posts");
const router = express.Router();

//Create a post
router.post("/", auth, postUpload.array("media", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one media file is required!" });
  }

  const { caption, tags, location } = req.body;
  const media = req.files.map((file) => {
    return {
      name: file.filename,
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
    };
  });

  const newPost = new Post({
    user: req.user._id,
    caption,
    tags,
    location,
    media,
  });
  await newPost.save();

  return res
    .status(201)
    .json({ message: "Post uploaded successfully!", post: newPost });
});


router.get("/myposts", auth, async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const posts = await Post.find({ user: req.user._id })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  

  res.json(posts);
});

module.exports = router;
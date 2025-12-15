const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/users");

const generateToken = (data) => {
  return jwt.sign(data, process.env.JWT_KEY);
  };

// register a new user
router.post("/", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Missing required form fields!", success: false });
  }

  const user = await User.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (user) {
    return res.status(400).json({
      message:
        user.username === username
          ? "Username is already taken!"
          : "Email is already registered!",
      success: false,
    });
  }

  const hashedPass = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPass,
  });

  await newUser.save();

  
  
  const token = generateToken({
    _id: newUser._id,
    username: newUser.username,
  });

  

  res.status(201).json(token);
});

module.exports = router;
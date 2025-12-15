const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/users");
const auth = require("../middleware/auth");

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

//User login
router.post("/login",async (req,res) => {
    const { username,password } = req.body;

    //check the whether username and password entered
    if(!username || !password){
        return res.status(400).json({success:false,message: "Please provide the username and password!"});
    }

    //check whether the username and password are valid
    const user = await User.findOne({ username});
    if(!user){
        res.status(401).json({success:false,message: "Invalid credentials!" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if(!validPassword){
        return res.status(401).json({success:false, message: "Invalid credentilas!"});
    }

    //Generate the token
    const token = generateToken({
        _id: user._id,
        username: user.username,
    });

    res.json(token);
})

//Get current loged in users
router.get("/",auth, async (req,res) =>{
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
    return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.json(user);
});


module.exports = router;
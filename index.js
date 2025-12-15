require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.DB)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.log("MongoDB connection failed!", err));

app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));

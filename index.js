require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");

const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));

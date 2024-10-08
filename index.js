require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./routes/users");

const PORT = process.env.PORT || 3000;

const app = express();

// register middlewares
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to MegaMart backend!");
});

// register API routes
app.use("/api/v1/users", userRoutes);

async function startServer() {
  try {
    // connect DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`\n\nMegaMart HTTP Express server listening on ${PORT}!`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// start server process
startServer();

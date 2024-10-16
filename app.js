require("dotenv").config();

const nodeutils = require("util");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { validateEnv } = require("./utils/env-validator");

// API routes
const userRoutes = require("./routes/users");

// Redis setup
const redisService = require("./config/redis.config");

const PORT = process.env.PORT || 3000;

const app = express();

let server = null;

/**
 * Register Middlewares
 */

// convert request body to json
app.use(express.json());

// Initialize Redis and setup session middleware
async function setupSession() {
  try {
    await redisService.initialize();

    const SESSION_TTL = parseInt(process.env.SESSION_TTL);
    const SESSION_SECRET = process.env.SESSION_SECRET;

    const sessionRedisStore = new RedisStore({
      client: redisService.getClient(),
      prefix: "megamart:",
    });

    app.use(
      session({
        store: sessionRedisStore,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: true, // Enable session rolling to refresh cookie on each request
        name: "megamart.sid",
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * SESSION_TTL, // 2 minutes - change as per need
        },
      })
    );

    console.log("express-session middleware set");
  } catch (err) {
    console.error("Failed to initialize Redis and session middleware:", err);
    throw err;
  }
}

/**
 * APP BOOT PROCESS
 */
async function startApp() {
  try {
    // Validate environment variables
    console.log("Validating ENV_VARIABLES...");
    validateEnv(["SESSION_SECRET", "SESSION_TTL", "MONGODB_URI"]);

    // Setup Redis and session middleware
    await setupSession();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas Connected!");

    console.log("setting up ROUTES...");
    // Routes
    app.get("/", (req, res) => {
      res.send("Welcome to MegaMart backend!");
    });

    // Setup API routes
    app.use("/api/v1/users", userRoutes);

    // Start server
    server = app.listen(PORT, () => {
      console.log(`\n\nMegaMart HTTP Express server listening on ${PORT}!`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
}

// Graceful shutdown handling for SIGINT
let isShuttingDown = false;

async function handleShutdown() {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log("\n\nShutting down MegaMart App...");

  // Attempt to close the HTTP server
  try {
    if (server && typeof server.close === "function") {
      const closeServer = nodeutils.promisify(server.close).bind(server);
      await closeServer();
      console.debug("MegaMart HTTP Express server closed");
    }
  } catch (err) {
    console.error("Failed to close HTTP server:", err);
  }

  // Attempt to disconnect Redis
  try {
    if (redisService.isConnected) {
      // Check if Redis is connected
      await redisService.getClient().quit();
      console.log("Redis client disconnected");
    }
  } catch (err) {
    console.error("Error disconnecting Redis:", err);
  }

  // Attempt to disconnect MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      // Check if MongoDB is connected
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  } catch (err) {
    console.error("Error disconnecting MongoDB:", err);
  }

  // Exit the process
  setTimeout(() => {
    console.log("MegaMart App shut down SUCCESS...");
    process.exit(0); // Exit the process with success
  }, 100);
}

/**
 * Clean up events for node runtime
 */
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);
process.on("SIGUSR2", handleShutdown);

// Handle uncaught errors
process.on("unhandledRejection", (err) => {
  console.error("process Unhandled rejection:", err);
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

process.on("uncaughtException", (err) => {
  console.error("process Uncaught exception:", err);
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

// Start server process
startApp();

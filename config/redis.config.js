const { createClient } = require("redis");
const { validateEnv } = require("../utils/env-validator");

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initializes the Redis client.
   * If already initialized, returns the existing client.
   * @returns {Promise<RedisClient>} The Redis client instance.
   * @throws Will throw an error if the Redis connection fails.
   */
  async initialize() {
    if (this.client) return this.client;

    try {
      validateEnv("REDIS_URL");

      console.log("\nAttempting to connect to Redis: ", process.env.REDIS_URL);

      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: function (retries) {
            if (retries > 3) {
              console.error("Redis: Too many reconnection attempts");
              return false; // Stop reconnecting after 3 attempts
            }
            console.log(`Redis: Attempting to reconnect (#${retries})`);

            // delay is increased by a factor of retries each time
            // delay between retries (up to 3 seconds)
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Set up event listeners
      this.client.addListener("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.addListener("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.addListener("disconnect", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      return this.client;
    } catch (err) {
      console.error("Redis Connection Error:", err);
      throw new Error("Failed to connect to Redis");
    }
  }

  /**
   * Retrieves the Redis client instance if it's connected.
   * @returns {RedisClient} The Redis client instance.
   * @throws Will throw an error if the client is not initialized or not connected.
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not initialized or not connected");
    }
    return this.client;
  }
}

const redisService = new RedisService();
module.exports = redisService;

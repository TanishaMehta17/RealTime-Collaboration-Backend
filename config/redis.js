const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();
const redisPublisher = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  username: "default",
  maxRetriesPerRequest: null, // Disable max retries
  reconnectOnError: (err) => {
    console.error("Redis reconnecting due to error:", err);
    return true; // Reconnect on errors
  },
});
const redisSubscriber = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  username: "default",
  maxRetriesPerRequest: null, // Disable max retries
  reconnectOnError: (err) => {
    console.error("Redis reconnecting due to error:", err);
    return true; // Reconnect on errors
  },
});




redisSubscriber.on("connect", () => console.log("Redis subscriber connected"));
redisPublisher.on("connect", () => console.log("Redis publisher connected"));

module.exports = { redisPublisher, redisSubscriber };
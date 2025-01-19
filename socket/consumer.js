const { consumer } = require("../config/kafka"); // Import the Kafka consumer
const taskMessages = require("./taskMessages"); // Import the in-memory store

// Initialize Kafka Consumer
const initializeKafkaConsumer = async () => {
  try {
    // Subscribe to the topic
    await consumer.subscribe({ topic: "message-events", fromBeginning: true });

    // Run the consumer (process messages)
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const parsedMessage = JSON.parse(message.value.toString());
        console.log("Received message from Kafka:", parsedMessage);

        // Store messages in the in-memory map (task-based)
        const taskId = parsedMessage.taskId;
        if (!taskMessages[taskId]) taskMessages[taskId] = [];
        taskMessages[taskId].push(parsedMessage);
      },
    });

    console.log("Kafka consumer is ready and listening...");
  } catch (error) {
    console.error("Error initializing Kafka consumer:", error);
  }
};

module.exports = { initializeKafkaConsumer };

// const { Kafka } = require("kafkajs");
// const fs = require('fs');
// const path = require('path');
// const dotenv = require("dotenv");
// // const kafka = new Kafka({
// //     clientId: "task-manager",
// //     brokers: [process.env.KAFKA_BROKER], // e.g., "localhost:9092"
// //   });
// let sslConfig = {};
// const caPath = path.resolve(__dirname, "ca.pem");

// if (fs.existsSync(caPath)) {
//   sslConfig = {
//     ssl: {
//       ca: [fs.readFileSync(caPath, "utf-8")],
//     },
//   };
// } else {
//   console.warn("CA file not found, proceeding without SSL.");
// }
// dotenv.config();
// const kafka = new Kafka({
//     // ssl:{
//     //    ca: [fs.readFileSync(path.resolve("./ca.pem"), 'utf-8')],
//     // },
//     ...sslConfig,
//     clientId: "task-manager",
//      brokers: [process.env.KAFKA_BROKER],
//      sasl:{
//        username: 'avnadmin',
//        password: process.env.KAFKA_PASSWORD ,
//        mechanism: 'plain',
//      }
//    });
  
//   const producer = kafka.producer();
//   const consumer = kafka.consumer({ groupId: "task-group" });
  
//   const connectKafka = async () => {
//     try {
//       await producer.connect();
//       console.log("Kafka producer connected");
//       await consumer.connect();
//       console.log("Kafka consumer connected");
//     } catch (error) {
//       console.error("Error connecting to Kafka:", error);
//     }
//   };
  
//   module.exports = { producer, consumer, connectKafka };
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "task-manager",
 // brokers: ["localhost:9092"], // Use local Kafka broker
 brokers: ["kafka:9092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "task-group" });

const connectKafka = async () => {
  try {
    await producer.connect();
    console.log("Kafka producer connected");
    await consumer.connect();
    console.log("Kafka consumer connected");
  } catch (error) {
    console.error("Error connecting to Kafka:", error);
  }
};

module.exports = { producer, consumer, connectKafka };

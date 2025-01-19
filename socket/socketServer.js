const socketIo = require("socket.io");
const setupSocketEvents = require("./event");

const initializeSocketServer = (server) => {
  const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  setupSocketEvents(io);
  return io;
};

module.exports = initializeSocketServer;

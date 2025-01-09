const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");


// Import routes
const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();

// Initialize Prisma Client
const prisma = require('./config/db')

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Create HTTP server and attach Socket.IO
const server = require("http").createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins; change to your frontend URL for production
    methods: ["GET", "POST"],
  },
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("A user connected");

  // Fetch all messages for a task
  socket.on("getmessages", async (taskId) => {
    try {
      const messages = await prisma.message.findMany({
        where: { taskId },
        orderBy: { timestamp: "asc" }, // Order messages by timestamp
      });
      socket.emit("messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", "Failed to fetch messages.");
    }
  });

  socket.on("createmessage", async (data) => {
    const { taskId, userId, content } = data;

    try {
      const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
      if (!taskExists) {
        socket.emit("error", `Task with ID ${taskId} does not exist.`);
        return;
      }

      const newMessage = await prisma.message.create({
        data: { taskId, userId, message: content },
      });

      io.to(taskId).emit("messageCreated", newMessage);
      console.log("Message created successfully:", newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      socket.emit("error", "Failed to create message.");
    }
  });

  socket.on("joinTask", (taskId) => {
    console.log(`User joined task room: ${taskId}`);
    socket.join(taskId);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

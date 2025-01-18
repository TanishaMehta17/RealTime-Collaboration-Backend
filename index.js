// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");

// // Import routes
// const authRoutes = require("./routes/authRoutes");
// const teamRoutes = require("./routes/teamRoutes");
// const taskRoutes = require("./routes/taskRoutes");

// dotenv.config();

// // Initialize Prisma Client
// const prisma = require('./config/db')

// // Initialize Express app
// const app = express();
// app.use(express.json());
// app.use(cors());

// // Create HTTP server and attach Socket.IO
// const server = require("http").createServer(app);
// const socketIo = require("socket.io");
// const io = socketIo(server, {
//   cors: {
//     origin: "*", // Allow all origins; change to your frontend URL for production
//     methods: ["GET", "POST"],
//   },
// });

// // Socket.IO events
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   // Fetch all messages for a task
//   socket.on("getmessages", async (taskId) => {
//     try {
//       const messages = await prisma.message.findMany({
//         where: { taskId },
//         orderBy: { timestamp: "asc" }, // Order messages by timestamp
//       });
//       socket.emit("messages", messages);
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       socket.emit("error", "Failed to fetch messages.");
//     }
//   });

//   socket.on("createmessage", async (data) => {
//     const { taskId, userId, message, username, timestamp } = data;

//     try {
//       const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
//       if (!taskExists) {
//         socket.emit("error", `Task with ID ${taskId} does not exist.`);
//         return;
//       }

//       const newMessage = await prisma.message.create({
//         data: { taskId, userId, message, username, timestamp:new Date(timestamp) },
//       });

//       io.to(taskId).emit("messageCreated", newMessage);
//       console.log("Message created successfully:", newMessage);
//     } catch (error) {
//       console.error("Error creating message:", error);
//       socket.emit("error", "Failed to create message.");
//     }
//   });

//   // Fetch all  tasks
//   socket.on("getTask", async (teamId) => {
//     try {
//       const tasks = await prisma.task.findMany({
//         where: { teamId },
//       });
//       socket.emit("tasks", tasks);
//     } catch (error) {
//       console.error("Error fetching tasks:", error);
//       socket.emit("error", "Failed to fetch tasks.");
//     }
//   });

//   //create Task
//   socket.on("createTask", async (data) => {
//     const { teamId, title, description, description1, type,status,membersName, date } = data;

//     try {
//       const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
//       if (!teamExists) {
//         socket.emit("error", `Team with ID ${teamId} does not exist.`);
//         return;
//       }

//       const newTask = await prisma.task.create({
//         data: {  title, description, description1, type, status, membersName, teamId,date},
//       });

//       io.to(teamId).emit("taskCreated", newTask);
//       console.log("Task created successfully:", newTask);
//     } catch (error) {
//       console.error("Error creating task:", error);
//       socket.emit("error", "Failed to create task.");
//     }
//   });

// // Update task status using Socket.IO
// socket.on("updateStatus", async (data) => {
//   const { taskId, newStatus } = data;

//   try {
//     // Validate input
//     if (!taskId || !newStatus) {
//       socket.emit("error", { error: "Task ID and new status are required." });
//       return;
//     }

//     // Update the task's status in the database
//     const updatedTask = await prisma.task.update({
//       where: { id: taskId },
//       data: { status: newStatus },
//     });

//     // Emit the updated task to all clients
//     io.emit("taskStatusUpdated", updatedTask);

//     console.log("Task status updated successfully:", updatedTask);
//   } catch (error) {
//     console.error("Error updating task status:", error);
//     socket.emit("error", { error: "Failed to update task status." });
//   }
// });

// //Update task
// socket.on("updateTask", async (data) => {
//   const { taskId, title, description,description1,type,membersName,date, status } = data;

//   try {
//     // Validate input
//     if (!taskId ) {
//       socket.emit("error", { error: "Task ID and new status are required." });
//       return;
//     }

//     // Update the task's status in the database
//     const updatedTask = await prisma.task.update({
//       where: { id: taskId },
//       data: { status: status,
//       title:title,
//       description:description,
//       description1:description1,
//       type:type,
//       membersName:membersName,
//       date:date
//        },
//     });

//     // Emit the updated task to all clients
//     io.emit("taskUpdated", updatedTask);

//     console.log("Task  updated successfully:", updatedTask);
//   } catch (error) {
//     console.error("Error updating task :", error);
//     socket.emit("error", { error: "Failed to update task ." });
//   }
// });

//   socket.on("joinTask", (taskId) => {
//     console.log(`User joined task room: ${taskId}`);
//     socket.join(taskId);
//   });
//   socket.on("joinTeam", (teamId) => {
//     console.log(`User joined task room: ${teamId}`);
//     socket.join(teamId);
//   });
//   socket.on('leaveTeam', (teamId, userId) => {
//     const userid = userId; // or however you store user info
//     // Remove the user from the team-related room
//     socket.leave(teamId);

//     // Optionally, you can broadcast this event to other team members if needed
//     socket.to(teamId).emit('userLeft', { userid: userId });
//   });

//   socket.on("disconnect", () => {
//     console.log("A userteam disconnected");
//   });
// });

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/teams", teamRoutes);
// app.use("/api/tasks", taskRoutes);

// // Start server
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const Redis = require("ioredis");

// Import routes
const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();

// Initialize Prisma Client
const prisma = require("./config/db");

// Initialize Redis publisher and subscriber
console.log(process.env.REDIS_HOST);
console.log(process.env.REDIS_PORT);
console.log(process.env.REDIS_PASSWORD);
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
redisSubscriber.on("message", (channel, message) => {
  const [type, id] = channel.split(":"); // Extract type and ID (e.g., "task:123")
  const parsedMessage = JSON.parse(message);
  console.log("Message received from Redis:", parsedMessage);
  console.log("Type:", type);
  console.log("ID:", id);
  if (type === "task") {
    io.to(id).emit("messageCreated", parsedMessage); // Emit task messages to the task room
    console.log(`Message broadcasted to task room ${id}:`, parsedMessage);
  } else if (type === "team") {
    io.to(id).emit("taskCreated", parsedMessage); // Emit new tasks to the team room
    console.log(`Task broadcasted to team room ${id}:`, parsedMessage);
  }
});
// Socket.IO events
io.on("connection", (socket) => {
  console.log("A user connected");

 // Ensure this is only called once during server setup


  // Fetch all messages for a task
  socket.on("getmessages", async (taskId) => {
    try {
      const messages = await prisma.message.findMany({
        where: { taskId },
        orderBy: { timestamp: "asc" },
      });
      socket.emit("messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", "Failed to fetch messages.");
    }
  });

  // Create a new message
  socket.on("createmessage", async (data) => {
    const { taskId, userId, message, username, timestamp } = data;

    try {
      const taskExists = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!taskExists) {
        socket.emit("error", `Task with ID ${taskId} does not exist.`);
        return;
      }

      const newMessage = await prisma.message.create({
        data: {
          taskId,
          userId,
          message,
          username,
          timestamp: new Date(timestamp),
        },
      });

      // Publish the message to Redis
      redisPublisher.publish(`task:${taskId}`, JSON.stringify(newMessage));
      console.log("Message created and published to Redis:", newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      socket.emit("error", "Failed to create message.");
    }
  });

  // Fetch all tasks for a team
  socket.on("getTask", async (teamId) => {
    try {
      const tasks = await prisma.task.findMany({
        where: { teamId },
      });
      socket.emit("tasks", tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      socket.emit("error", "Failed to fetch tasks.");
    }
  });

  // Create a new task
  socket.on("createTask", async (data) => {
    const {
      teamId,
      title,
      description,
      description1,
      type,
      status,
      membersName,
      date,
    } = data;

    try {
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
      });
      if (!teamExists) {
        socket.emit("error", `Team with ID ${teamId} does not exist.`);
        return;
      }

      const newTask = await prisma.task.create({
        data: {
          title,
          description,
          description1,
          type,
          status,
          membersName,
          teamId,
          date,
        },
      });
      redisSubscriber.subscribe(`task:${newTask.id}`); // Subscribe to the new task's channel
      // Publish the task to Redis
      redisPublisher.publish(`team:${teamId}`, JSON.stringify(newTask));
     
      console.log("Task created and published to Redis:", newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      socket.emit("error", "Failed to create task.");
    }
  });

  // Update task status
  socket.on("updateStatus", async (data) => {
    const { taskId, newStatus } = data;

    try {
      if (!taskId || !newStatus) {
        socket.emit("error", { error: "Task ID and new status are required." });
        return;
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
      });

      io.emit("taskStatusUpdated", updatedTask);
      console.log("Task status updated successfully:", updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      socket.emit("error", { error: "Failed to update task status." });
    }
  });

  // Update a task
  socket.on("updateTask", async (data) => {
    const {
      taskId,
      title,
      description,
      description1,
      type,
      membersName,
      date,
      status,
    } = data;

    try {
      if (!taskId) {
        socket.emit("error", { error: "Task ID is required." });
        return;
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          title,
          description,
          description1,
          type,
          membersName,
          date,
        },
      });

      io.emit("taskUpdated", updatedTask);
      console.log("Task updated successfully:", updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      socket.emit("error", { error: "Failed to update task." });
    }
  });

  // Join a task room
  socket.on("joinTask", (taskId) => {
    console.log(`User joined task room: ${taskId}`);
    socket.join(taskId);
    redisSubscriber.subscribe(`task:${taskId}`);
  });

  // Join a team room
  socket.on("joinTeam", (teamId) => {
    console.log(`User joined team room: ${teamId}`);
    socket.join(teamId);
    redisSubscriber.subscribe(`team:${teamId}`);
  });

  // Leave a team room
  socket.on("leaveTeam", (teamId, userId) => {
    console.log(`User ${userId} left team room: ${teamId}`);
    socket.leave(teamId);
    redisSubscriber.unsubscribe(`team:${teamId}`);
    socket.to(teamId).emit("userLeft", { userId });
  });
//CHANGES
  socket.on("leaveTask", (taskId, userId) => {
    console.log(`User ${userId} left task room: ${taskId}`);
    socket.leave(taskId);
    redisSubscriber.unsubscribe(`task:${taskId}`);
    socket.to(taskId).emit("userLeft", { taskId });
  });

  // Handle disconnect
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

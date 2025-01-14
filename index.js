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
    const { taskId, userId, content, username, timestamp } = data;

    try {
      const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
      if (!taskExists) {
        socket.emit("error", `Task with ID ${taskId} does not exist.`);
        return;
      }

      const newMessage = await prisma.message.create({
        data: { taskId, userId, message: content, username, timestamp:new Date(timestamp) },
      });

      io.to(taskId).emit("messageCreated", newMessage);
      console.log("Message created successfully:", newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      socket.emit("error", "Failed to create message.");
    }
  });

  // Fetch all  tasks
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

  //create Task
  socket.on("createTask", async (data) => {
    const { teamId, title, description, description1, type,status,membersName, date } = data;

    try {
      const teamExists = await prisma.team.findUnique({ where: { id: teamId } });
      if (!teamExists) {
        socket.emit("error", `Team with ID ${teamId} does not exist.`);
        return;
      }

      const newTask = await prisma.task.create({
        data: {  title, description, description1, type, status, membersName, teamId,date},
      });

      io.to(teamId).emit("taskCreated", newTask);
      console.log("Task created successfully:", newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      socket.emit("error", "Failed to create task.");
    }
  });



// Update task status using Socket.IO
socket.on("updateStatus", async (data) => {
  const { taskId, newStatus } = data;

  try {
    // Validate input
    if (!taskId || !newStatus) {
      socket.emit("error", { error: "Task ID and new status are required." });
      return;
    }

    // Update the task's status in the database
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    // Emit the updated task to all clients
    io.emit("taskStatusUpdated", updatedTask);

    console.log("Task status updated successfully:", updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    socket.emit("error", { error: "Failed to update task status." });
  }
});


//Update task
socket.on("updateTask", async (data) => {
  const { taskId, title, description,description1,type,membersName,date, status } = data;

  try {
    // Validate input
    if (!taskId ) {
      socket.emit("error", { error: "Task ID and new status are required." });
      return;
    }

    // Update the task's status in the database
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: status,
      title:title,
      description:description,
      description1:description1,
      type:type,
      membersName:membersName,
      date:date
       },
    });

    // Emit the updated task to all clients
    io.emit("taskUpdated", updatedTask);

    console.log("Task  updated successfully:", updatedTask);
  } catch (error) {
    console.error("Error updating task :", error);
    socket.emit("error", { error: "Failed to update task ." });
  }
});



  socket.on("joinTask", (taskId) => {
    console.log(`User joined task room: ${taskId}`);
    socket.join(taskId);
  });
  socket.on("joinTeam", (teamId) => {
    console.log(`User joined task room: ${teamId}`);
    socket.join(teamId);
  });
  socket.on('leaveTeam', (teamId, userId) => {
    const userid = userId; // or however you store user info
    // Remove the user from the team-related room
    socket.leave(teamId);
  
    // Optionally, you can broadcast this event to other team members if needed
    socket.to(teamId).emit('userLeft', { userid: userId });
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

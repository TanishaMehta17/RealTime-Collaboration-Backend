const { redisPublisher, redisSubscriber } = require("../config/redis");
const { producer ,consumer} = require("../config/kafka");
const prisma = require("../config/db");
// const taskService = require("../services/taskService");
// const messageService = require("../services/messageService");
const taskMessages = require("./taskMessages");
const setupSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected");
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

    // Handle creating a new task
    // Fetch all messages for a task
  socket.on("getmessages", async (taskId) => {
    try {
    //   const messages = await prisma.message.findMany({
    //     where: { taskId },
    //     orderBy: { timestamp: "asc" },
    //   });
    //   socket.emit("messages", messages);
    //   // Publish an event to Kafka for tracking the retrieval
    //  await producer.send({
    //     topic: "message-fetch-events",
    //     messages: [
    //       {
    //         key: String(taskId),
    //         value: JSON.stringify({
    //           eventType: "getMessages",
    //           taskId,
    //           timestamp: new Date().toISOString(),
    //         }),
    //       },
    //     ],
    //   });
    const messages = taskMessages[taskId] || [];
    console.log("Messages fetched from in-memory store:", messages);
    // Kafka consumer to fetch messages from the "message-events" topic
    // await consumer.subscribe({ topic: "message-events", fromBeginning: true });

    // Consume messages from the Kafka topic
    // await consumer.run({
    //   eachMessage: async ({ topic, partition, message }) => {
    //     try {
    //       const parsedMessage = JSON.parse(message.value.toString());
          
    //       // Check if the taskId matches the requested one
    //       if (parsedMessage.taskId === taskId) {
    //         messages.push(parsedMessage);
    //       }
    //     } catch (err) {
    //       console.error("Error parsing Kafka message:", err);
    //     }
    //   },
    // });

    // Once the messages are fetched, emit them back to the client
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
      // Publish the message to Kafka
        await producer.send({
          topic: "message-events",
          messages: [{ key: String(taskId), value: JSON.stringify(newMessage) }],
        });
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

        // // Publish to Kafka
        // await producer.send({
        //   topic: "task-events",
        //   messages: [{ key: String(task.id), value: JSON.stringify(task) }],
        // });

        console.log("Task created and published to Redis:", newTask);
      } catch (error) {
        console.error("Error creating task:", error);
        socket.emit("error", "Failed to create task.");
      }
    });

    // Handle task status update
    // Update task status
    socket.on("updateStatus", async (data) => {
      const { taskId, newStatus } = data;

      try {
        if (!taskId || !newStatus) {
          socket.emit("error", {
            error: "Task ID and new status are required.",
          });
          return;
        }

        const updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: { status: newStatus },
        });

        io.emit("taskStatusUpdated", updatedTask);
        // Publish to Kafka
        // await producer.send({
        //   topic: "task-events",
        //   messages: [
        //     { key: String(taskId), value: JSON.stringify(updatedTask) },
        //   ],
        // });
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
        // Publish to Kafka
        // await producer.send({
        //   topic: "task-events",
        //   messages: [
        //     { key: String(taskId), value: JSON.stringify(updatedTask) },
        //   ],
        // });
        console.log("Task updated successfully:", updatedTask);
      } catch (error) {
        console.error("Error updating task:", error);
        socket.emit("error", { error: "Failed to update task." });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  // Redis Subscriber - Listen for task updates
  redisSubscriber.on("message", (channel, message) => {
    const [type, id] = channel.split(":"); // Extract type and ID (e.g., "task:123")
    const parsedMessage = JSON.parse(message);
    console.log("Message received from Redis:", parsedMessage);
    console.log("Type:", type);
    console.log("ID:", id);
    if (type === "task") {
      io.to(id).emit("messageCreated", parsedMessage); // Emit task messages to the task room
      console.log(`Message broadcasted to task room ${id}:`, parsedMessage);
    } 
    else if (type === "team") {
      io.to(id).emit("taskCreated", parsedMessage); // Emit new tasks to the team room
      console.log(`Task broadcasted to team room ${id}:`, parsedMessage);
    }
  });

  redisSubscriber.subscribe("team:*");
  redisSubscriber.subscribe("task:*");
};

module.exports = setupSocketEvents;

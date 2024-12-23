const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET;

const createTask = async (req, res) => {
  const { title, description, status, type, membersName } = req.body;
  console.log(req.body);
  try {
    // Check if task already exists
    const existingTask = await prisma.task.findUnique({
      where: { title: req.body.title, description: req.body.description },
    });
    if (existingTask) {
      return res.status(400).json({ message: "Task already exists" });
    }

    const newTask = await prisma.task.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        type: req.body.type,
        membersName: req.body.membersName,
      },
    });

    res
      .status(200)
      .json({ isSuccess: true, message: "Task created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ isSuccess: false, message: "Error creating task", error });
  }
};

module.exports = { createTask };

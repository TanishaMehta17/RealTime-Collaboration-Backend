const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET;

const createTeam = async (req, res) => {
  const { managerid, name, password } = req.body;
  console.log(req.body);
  try {
    // Check if team already exists
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingTeam = await prisma.team.findUnique({
      where: { name: req.body.name, password: hashedPassword },
    });
    if (existingTeam) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const newTeam = await prisma.team.create({
      data: {
        name: req.body.name,
        manager: req.body.managerid,
        password: hashedPassword,
      },
    });

    res
      .status(200)
      .json({ isSuccess: true, message: "Team created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ isSuccess: false, message: "Error creating team", error });
  }
};

const joinTeam = async (req, res) => {
  const { password } = req.body;
  console.log(req.body);
  try {
    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name: req.body.name },
    });
    if (!existingTeam) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Team does not exist" });
    }
    const isMatch = await bcrypt.compare(password, existingTeam.password);
    if (!isMatch) {
      return res.status(400).json({
        isSuccess: false,
        message: "Invalid credentials",
      });
    }
    const token = req.header("token");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded);
    const userId = decoded.userId;
    console.log(userId);

    await prisma.team.update({
        where: { id: existingTeam.id },
        data: {
            members: {
                push: userId
            },
        },
    });

    res
      .status(200)
      .json({ isSuccess: true, message: "Team joined successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ isSuccess: false, message: "Error joining team", error });
  }
};

const getTeamMenbers = async (req, res) => {
  const { name } = req.body;
  console.log(req.body);
  try {
    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name: req.body.name },
    });
    if (!existingTeam) {
      return res
        .status(400)
        .json({ isSuccess: false, message: "Team does not exist" });
    }
    const memberIds = existingTeam.members;
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { username: true },
    });
    const usernames = members.map(member => member.username);
    res
      .status(200)
      .json({
        isSuccess: true,
        message: "Team members fetched successfully",
        members: usernames,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        isSuccess: false,
        message: "Error fetching team members",
        error,
      });
  }
};

module.exports = { createTeam, joinTeam , getTeamMenbers};
const { createTeam, joinTeam ,getTeamMenbers } =  require("../controllers/teamControllers");
const express =  require("express");
const TeamRouter = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

TeamRouter.post("/create",authMiddleware, createTeam);
TeamRouter.post("/join",authMiddleware, joinTeam);
TeamRouter.get("/getTeamMenbers",authMiddleware, getTeamMenbers);

module.exports = TeamRouter;
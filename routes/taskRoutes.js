const express =  require("express");
const router = express.Router();

const { createTask } = require('../controllers/taskControllers');
const { authMiddleware } = require("../middleware/authMiddleware");

router.post('/create', authMiddleware, createTask);




module.exports = router;
const express =  require("express");
const router = express.Router();

const { createTask  ,getTask} = require('../controllers/taskControllers');
const { authMiddleware } = require("../middleware/authMiddleware");

router.post('/create', authMiddleware, createTask);
router.post('/getTask', authMiddleware, getTask);




module.exports = router;
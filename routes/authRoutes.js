const express = require('express');
const router = express.Router();
const { signup, login, profile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Signup route
router.post('/signup', signup);

// Login route
router.post('/login', login);

// Profile route (protected)
router.get('/profile', authMiddleware, profile);

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma =  require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET;

const signup = async (req, res) => {
  const { username , email, password , confirmpas } = req.body;
  console.log(req.body);
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email : req.body.email },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }


    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        confirmpas : hashedPassword
      },
    });

    res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user is not found, return a generic error
    if (!user) {
      return res.status(400).json({
        isSuccess: false,
        message: 'Invalid credentials',
      });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        isSuccess: false,
        message: 'Invalid credentials',
      });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Send the token and success response
    res.status(200).json({
      isSuccess: true,
      message: 'Login successful',
      token , ...user._doc,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      isSuccess: false,
      message: 'An error occurred while logging in',
      error: error.message,
    });
  }
};


const profile = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ email: user.email, createdAt: user.createdAt });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

module.exports = { signup, login, profile };

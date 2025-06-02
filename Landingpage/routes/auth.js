// In routes/auth.js
const express = require('express');
const router = express.Router();
const { User } = require('../models'); // Assuming models/index.js exports User
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  try {
    const { employee_id, name, email, password, role, manager_id } = req.body;

    if (typeof password !== 'string' || password.length === 0) {
      console.error("Server: Password is not a string or is empty:", password);
      return res.status(400).json({
        error: 'Password must be a non-empty string.',
        passwordReceived: password
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      employee_id,
      name,
      email,
      password: hashedPassword,
      role,
      manager_id: manager_id || null // Ensures manager_id is null if empty/not provided
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Detailed error in /api/auth/register:", error); // This logs to your server console

    // Send detailed error to the client for debugging
    res.status(500).json({
      error: 'Failed to register user. See details in console.', // More specific message for alert
      messageFromServer: error.message, // Sequelize or other error message
      errorName: error.name,         // e.g., SequelizeValidationError
      errorFields: error.fields,     // Fields involved in unique/validation error
      errorDetails: error.errors    // Array of individual validation errors
      // stack: error.stack, // Optional: for very detailed client-side debugging, but be cautious
    });
  }
});

module.exports = router;
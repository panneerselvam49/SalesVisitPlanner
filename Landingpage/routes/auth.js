const express = require('express');
const router = express.Router();
const { User } = require('../models');
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
      manager_id: manager_id || null 
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Detailed error in /api/auth/register:", error); 
    res.status(500).json({
      error: 'Failed to register user. See details in console.',
      messageFromServer: error.message, 
      errorName: error.name,        
      errorFields: error.fields,   
      errorDetails: error.errors  
    });
  }
});
module.exports = router;
const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { employee_id, name, email, password, role, manager_id } = req.body;

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
    console.error(error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

module.exports = router;

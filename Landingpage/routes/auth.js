const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');

// NEW: Route to get the currently logged-in user's data from the session
router.get('/current-user', async (req, res) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId, {
        attributes: ['employee_id', 'name', 'role'] // Only send necessary, non-sensitive data
      });
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: 'User from session not found in database.' });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: 'Failed to fetch user data.' });
    }
  } else {
    // This case handles when the user is not logged in or the session has expired
    res.status(401).json({ error: 'Unauthorized. No active session.' });
  }
});


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

    if (req.session) {
        req.session.userId = newUser.employee_id; 
        req.session.role = newUser.role; 
        console.log('Session created for userId:', req.session.userId);
    } else {
        console.error("Session middleware not properly configured or req.session is undefined.");
    }

    res.status(201).json({
        message: "User registered successfully and logged in.",
        user: { 
            employee_id: newUser.employee_id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });
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

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        if (req.session) {
            req.session.userId = user.employee_id;
            req.session.role = user.role;
            console.log('Session created for userId (login):', req.session.userId);
            res.status(200).json({
                message: "Logged in successfully.",
                user: {
                    employee_id: user.employee_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
             console.error("Session middleware not properly configured or req.session is undefined during login.");
             return res.status(500).json({ error: "Login succeeded but session could not be established." });
        }

    } catch (error) {
        console.error("Error in /api/auth/login:", error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Could not log out, please try again.' });
            }
            res.clearCookie('connect.sid'); 
            return res.status(200).json({ message: 'Logged out successfully.' });
        });
    } else {
        return res.status(200).json({ message: 'No session to destroy.' });
    }
});
module.exports = router;
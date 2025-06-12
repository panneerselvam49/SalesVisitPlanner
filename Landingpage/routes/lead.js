const express = require('express');
const router = express.Router();
// Import only the refactored Lead model
const { Lead } = require('../models');

// GET all leads
router.get('/', async (req, res) => {
  try {
    // The structure is flat now, no need for complex includes
    const leads = await Lead.findAll({
        order: [['name', 'ASC']]
    });
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST a new lead
router.post('/', async (req, res) => {
  try {
    // Destructure the new combined fields
    const { name, location, person_name, contact_details, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'A name is required for a lead' });
    }

    const newLead = await Lead.create({
      name,
      location,
      person_name,
      contact_details,
      status: status || 'Active',
    });

    res.status(201).json(newLead);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A lead with this name already exists.' });
    }
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

module.exports = router;

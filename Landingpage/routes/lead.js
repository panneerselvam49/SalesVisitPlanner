const express = require('express');
const router = express.Router();
const { Lead } = require('../models');
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.findAll();
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});
router.post('/', async (req, res) => {
  try {
    const { company_name, location } = req.body;

    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required for a lead' });
    }

    const newLead = await Lead.create({
      company_name,
      location,
    });

    res.status(201).json(newLead);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A lead with this company name already exists.' });
    }
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

module.exports = router;
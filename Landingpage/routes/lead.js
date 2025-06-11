const express = require('express');
const router = express.Router();
// Import both Lead and LeadContact models
const { Lead, LeadContact } = require('../models');

// This route gets all leads (already exists)
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.findAll();
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// This is the NEW route that needs to be loaded by the server
router.get('/:leadId/contacts', async (req, res) => {
    try {
        const leadId = req.params.leadId;
        const contacts = await LeadContact.findAll({
            where: { lead_id: leadId },
            order: [['contact_name', 'ASC']]
        });
        res.status(200).json(contacts);
    } catch (error) {
        console.error(`Error fetching contacts for lead ID ${req.params.leadId}:`, error);
        res.status(500).json({ error: 'Failed to fetch lead contacts' });
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
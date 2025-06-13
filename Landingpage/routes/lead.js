/**
 * API routes for managing Leads.
 * Creating a lead now also ensures a corresponding entry exists in the CustomerMaster table.
 */
const express = require('express');
const router = express.Router();
const { Lead, CustomerMaster, Location, sequelize } = require('../models');

// GET all leads, including their master company name.
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.findAll({
        include: [{
            model: CustomerMaster,
            as: 'CustomerMaster',
            attributes: ['name']
        }],
        order: [[CustomerMaster, 'name', 'ASC']]
    });
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST a new lead.
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // The request now contains the company's name and location.
    const { customerMasterName, locationName, person_name, contact_details, status } = req.body;

    if (!customerMasterName) {
      return res.status(400).json({ error: 'A customer master name is required for a lead' });
    }

    // Step 1: Find or create the Location.
    const [location] = await Location.findOrCreate({
        where: { name: locationName || 'Unknown' },
        transaction: t
    });

    // Step 2: Find or create the entry in CustomerMaster.
    const [customerMaster] = await CustomerMaster.findOrCreate({
      where: { name: customerMasterName },
      defaults: { locationId: location.id },
      transaction: t
    });

    // Step 3: Create the new lead record, linking it to the master record.
    const newLead = await Lead.create({
      customerMasterId: customerMaster.id,
      person_name,
      contact_details,
      status: status || 'Active',
    }, { transaction: t });

    await t.commit();
    res.status(201).json(newLead);
  } catch (error) {
    await t.rollback();
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

module.exports = router;

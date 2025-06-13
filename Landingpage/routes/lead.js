/**
 * API routes for managing Leads.
 * Creating a lead now also ensures a corresponding entry exists in the CustomerMaster table.
 */
const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
// Import only the refactored Lead model
const { Lead } = require('../models');

// GET all leads
router.get('/', async (req, res) => {
  try {
    // The structure is flat now, no need for complex includes
    const leads = await Lead.findAll({
        order: [['name', 'ASC']]
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    });
    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

<<<<<<< HEAD
// POST a new lead.
=======
// POST a new lead
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
<<<<<<< HEAD
    // The request now contains the company's name and location.
    const { customerMasterName, locationName, person_name, contact_details, status } = req.body;

    if (!customerMasterName) {
      return res.status(400).json({ error: 'A customer master name is required for a lead' });
    }

    // Step 1: Find or create the Location.
    const [location] = await Location.findOrCreate({
        where: { name: locationName || 'Unknown' },
        transaction: t
=======
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
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
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
<<<<<<< HEAD
    await t.rollback();
=======
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A lead with this name already exists.' });
    }
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
// Import the refactored Customer and new Location models
const { Customer, Location, sequelize } = require('../models');

// GET all customers, including their location details
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{
        model: Location,
        as: 'Location', // This alias must match the one in the Customer model
        attributes: ['name', 'lat', 'lng'],
      }],
      order: [['name', 'ASC'], ['person_name', 'ASC']],
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST a new customer (handles creating a location if it doesn't exist)
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Destructure the new combined fields from the request body
    const { name, locationName, person_name, contact_details } = req.body;

    if (!name || !person_name || !locationName) {
      return res.status(400).json({ error: 'Company name, person name, and location name are required.' });
    }

    // Find or create the location entry first
    const [location] = await Location.findOrCreate({
      where: { name: locationName },
      defaults: { name: locationName },
      transaction: t
    });

    // Create the new customer and associate it with the location's ID
    const newCustomer = await Customer.create({
      name,
      person_name,
      contact_details,
      locationId: location.id,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(newCustomer);
  } catch (error) {
    await t.rollback();
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

module.exports = router;

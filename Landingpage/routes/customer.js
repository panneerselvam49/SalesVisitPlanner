
const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { Customer, CustomerMaster, Location } = require('../models');

// GET all customer contacts, including their master company and location information.
=======
// Import the refactored Customer and new Location models
const { Customer, Location, sequelize } = require('../models');

// GET all customers, including their location details
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{
<<<<<<< HEAD
        model: CustomerMaster,
        as: 'CustomerMaster',
        attributes: ['id', 'name'], 
        include: [{
            model: Location,
            as: 'Location',
            attributes: ['name']
        }]
      }],
      order: [
        [{ model: CustomerMaster, as: 'CustomerMaster' }, 'name', 'ASC'],
        ['person_name', 'ASC']
      ],
=======
        model: Location,
        as: 'Location', // This alias must match the one in the Customer model
        attributes: ['name', 'lat', 'lng'],
      }],
      order: [['name', 'ASC'], ['person_name', 'ASC']],
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customer contacts:', error);
    res.status(500).json({ error: 'Failed to fetch customer contacts' });
  }
});
<<<<<<< HEAD
router.post('/', async (req, res) => {
  try {
    const { customerMasterId, person_name, contact_details } = req.body;

    if (!customerMasterId || !person_name) {
      return res.status(400).json({ error: 'A master customer ID and a person\'s name are required.' });
    }
    const masterCustomer = await CustomerMaster.findByPk(customerMasterId);
    if (!masterCustomer) {
        return res.status(404).json({ error: 'The specified CustomerMaster was not found.' });
    }
    const newCustomerContact = await Customer.create({
      customerMasterId,
      person_name,
      contact_details,
    });

    res.status(201).json(newCustomerContact);
  } catch (error) {
    console.error('Error creating customer contact:', error);
    res.status(500).json({ error: 'Failed to create customer contact' });
  }
});
=======

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

>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
module.exports = router;

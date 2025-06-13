
const express = require('express');
const router = express.Router();
const { Customer, CustomerMaster, Location } = require('../models');

// GET all customer contacts, including their master company and location information.
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{
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
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customer contacts:', error);
    res.status(500).json({ error: 'Failed to fetch customer contacts' });
  }
});
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
module.exports = router;

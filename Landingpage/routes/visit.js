const express = require('express');
const router = express.Router();
const { Visit, Customer, User, Company } = require('../models');

router.get('/', async (req, res) => {
    try {
        const visits = await Visit.findAll({
            include: [
                {
                    model: User,
                    as: 'Employee', 
                    attributes: ['name', 'employee_id']
                },
                {
                    model: Customer,
                    as: 'Customer', 
                    attributes: ['customer_name', 'customer_id'] 
                }
            ],
            order: [['date', 'ASC'], ['start_time', 'ASC']] 
        });
        res.json(visits);
    } catch (error) {
        console.error("Error fetching visits:", error);
        res.status(500).json({ error: "Failed to retrieve visits", details: error.message });
    }
});


router.post('/', async (req, res) => {
  try {
    const { employee_id, customer_id, date, start_time, end_time, location, purpose, notes, status } = req.body;

    if (!employee_id || !customer_id || !date || !start_time || !end_time || !location) {
      return res.status(400).json({ error: 'Missing required visit details.' });
    }

    const customerExists = await Customer.findByPk(customer_id);
    if (!customerExists) {
      return res.status(404).json({ error: `Customer with ID ${customer_id} not found.` });
    }

    const newVisit = await Visit.create({
      employee_id,
      customer_id,
      date,
      start_time,
      end_time,
      location,
      purpose,
      notes,
      status: status || 'Planned' 
    });

    const detailedVisit = await Visit.findByPk(newVisit.visit_id, {
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer,
          as: 'Customer',
          attributes: ['customer_name', 'customer_id'],
          include: [{ model: Company, as: 'Company', attributes: ['company_name'] }]
        }
      ]
    });

    res.status(201).json(detailedVisit);
  } catch (error) {
    console.error('Error saving visit:', error);
    res.status(500).json({ error: 'Failed to save visit', details: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { Customer, Company } = require('../models'); 
router.post('/', async (req, res) => {
  try {
    const { customer_id, customer_name, contact, department, company_id } = req.body;

    if (!customer_name || !company_id) {
      return res.status(400).json({ error: 'Customer name and company_id are required' });
    }
    const companyExists = await Company.findByPk(company_id);
    if (!companyExists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const newCustomer = await Customer.create({
      customer_name,
      contact,
      company_id,
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({ include: [{ model: Company, as: 'Company' }] });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});
module.exports = router;
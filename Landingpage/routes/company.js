const express = require('express');
  const router = express.Router();
  // IMPORTANT: Make sure to import the Customer model here
  const { Company, Customer } = require('../models'); 

  router.post('/', async (req, res) => {
    try {
      const { company_name, location } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      const newCompany = await Company.create({
        company_name,
        location,
      });

      res.status(201).json(newCompany);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Company name already exists.' });
      }
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const companies = await Company.findAll();
      res.status(200).json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  // THIS IS THE MISSING ROUTE THAT NEEDS TO BE ADDED
  router.get('/:companyName/customers', async (req, res) => {
    try {
      const companyName = req.params.companyName;
      const customers = await Customer.findAll({
        where: { companyName: companyName },
        order: [['customer_name', 'ASC']]
      });
      res.status(200).json(customers);
    } catch (error) {
      console.error(`Error fetching customers for ${req.params.companyName}:`, error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  module.exports = router;
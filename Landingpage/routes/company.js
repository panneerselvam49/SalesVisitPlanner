  const express = require('express');
  const router = express.Router();
  const { Company } = require('../models'); 
  router.post('/', async (req, res) => {
    try {
      const { company_name, location, companyid } = req.body;

      if (!company_name) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      const newCompany = await Company.create({
        companyid,
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

  module.exports = router;
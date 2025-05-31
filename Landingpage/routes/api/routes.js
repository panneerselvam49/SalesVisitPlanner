const express = require('express');
const router = express.Router();
const { Company, Customer, Visit, User } = require('../models');

// ------------------ COMPANY ------------------
router.post('/companies', async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/companies', async (req, res) => {
  const companies = await Company.findAll({ include: 'Customers' });
  res.json(companies);
});

// ------------------ CUSTOMER ------------------
router.post('/customers', async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/customers', async (req, res) => {
  const customers = await Customer.findAll({ include: ['Company', 'Visits'] });
  res.json(customers);
});

// ------------------ VISIT ------------------
router.post('/visits', async (req, res) => {
  try {
    const visit = await Visit.create(req.body);
    res.status(201).json(visit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/visits', async (req, res) => {
  const visits = await Visit.findAll({ include: ['Customer', 'Employee'] });
  res.json(visits);
});

// ------------------ USER (optional) ------------------
router.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

module.exports = router;

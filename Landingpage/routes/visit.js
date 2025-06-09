const express = require('express');
const router = express.Router();
const { Visit, Customer, User, Company, Lead, sequelize } = require('../models');

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.findAll({
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer,
          as: 'Customer',
          attributes: ['customer_name', 'customer_id', 'contact', 'companyName'],
          include: [{ model: Company, as: 'Company', attributes: ['company_name'] }]
        }
      ],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });
    res.status(200).json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// GET a single visit by ID
router.get('/:id', async (req, res) => {
    try {
        const visit = await Visit.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
                {
                    model: Customer,
                    as: 'Customer',
                    include: [{ model: Company, as: 'Company' }]
                }
            ]
        });
        if (visit) {
            res.status(200).json(visit);
        } else {
            res.status(404).json({ error: 'Visit not found' });
        }
    } catch (error) {
        console.error('Error fetching visit by ID:', error);
        res.status(500).json({ error: 'Failed to fetch visit' });
    }
});

// POST a new visit
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { employee_id, customer_id, lead_company_name, date, start_time, end_time, location, purpose, notes, status, person_name, contact_details } = req.body;
        let final_customer_id = customer_id;
        if (lead_company_name) {
            const lead = await Lead.findOne({ where: { company_name: lead_company_name }, transaction: t });
            if (!lead) { await t.rollback(); return res.status(404).json({ error: `Lead with name "${lead_company_name}" not found.` }); }
            const [company] = await Company.findOrCreate({ where: { company_name: lead.company_name }, defaults: { location: lead.location || 'N/A' }, transaction: t });
            const newCustomer = await Customer.create({ customer_name: lead.company_name, companyName: company.company_name, contact: `Name: ${person_name || 'N/A'}, Info: ${contact_details || 'N/A'}`}, { transaction: t });
            final_customer_id = newCustomer.customer_id;
            lead.status = 'Converted';
            await lead.save({ transaction: t });
        }
        if (!employee_id || !final_customer_id || !date || !start_time || !end_time || !location) { await t.rollback(); return res.status(400).json({ error: 'Missing required visit details.' }); }
        const newVisit = await Visit.create({ employee_id, customer_id: final_customer_id, date, start_time, end_time, location, purpose, notes, status: status || 'Planned' }, { transaction: t });
        await t.commit();
        const detailedVisit = await Visit.findByPk(newVisit.visit_id, { include: [ { model: User, as: 'Employee', attributes: ['name', 'employee_id'] }, { model: Customer, as: 'Customer', attributes: ['customer_name', 'customer_id', 'contact', 'companyName'], include: [{ model: Company, as: 'Company', attributes: ['company_name'] }] } ] });
        res.status(201).json(detailedVisit);
    } catch (error) {
        await t.rollback();
        console.error('Error in visit creation transaction:', error);
        res.status(500).json({ error: 'Failed to create visit', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
  // Use a transaction to ensure data integrity across tables
  const t = await sequelize.transaction();
  try {
    // Separate customer contact fields from the rest of the visit data
    const { person_name, contact_details, ...visitData } = req.body;
    
    const visit = await Visit.findByPk(req.params.id, { transaction: t });

    if (!visit) {
      await t.rollback();
      return res.status(404).json({ error: 'Visit not found' });
    }

    // 1. Update the Visit model with its specific data (status, notes, time, etc.)
    await visit.update(visitData, { transaction: t });

    // 2. If person_name or contact_details were provided, update the associated Customer
    // This is the key part that was missing.
    if (person_name || contact_details) {
      const customer = await Customer.findByPk(visit.customer_id, { transaction: t });
      if (customer) {
        // Reconstruct the contact string, just like in your POST route
        const newContactInfo = `Name: ${person_name || 'N/A'}, Info: ${contact_details || 'N/A'}`;
        await customer.update({ contact: newContactInfo }, { transaction: t });
      }
    }
    
    // If everything was successful, commit the transaction
    await t.commit();

    // Fetch the fully updated visit data with associations to send back
    const detailedVisit = await Visit.findByPk(visit.visit_id, {
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer,
          as: 'Customer',
          include: [{ model: Company, as: 'Company' }]
        }
      ]
    });

    res.status(200).json(detailedVisit);

  } catch (error) {
    // If any step failed, roll back the entire transaction
    await t.rollback();
    console.error('Error updating visit:', error);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    await visit.destroy();
    res.status(200).json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Failed to delete visit', details: error.message });
  }
});


module.exports = router;
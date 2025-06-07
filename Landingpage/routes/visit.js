const express = require('express');
const router = express.Router();
const { Visit, Customer, User, Company, Lead, sequelize } = require('../models');

router.get('/', async (req, res) => { /* ... your existing code ... */ });


router.get('/:id', async (req, res) => { /* ... your existing code ... */ });

router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      employee_id,
      customer_id, 
      lead_company_name,
      date,
      start_time,
      end_time,
      location,
      purpose,
      notes,
      status,
      person_name,
      contact_details
    } = req.body;

    let final_customer_id = customer_id;
    if (lead_company_name) {
      
        const lead = await Lead.findOne({ where: { company_name: lead_company_name }, transaction: t });
        if (!lead) {
            await t.rollback();
            return res.status(404).json({ error: `Lead with name "${lead_company_name}" not found.` });
        }

        const [company] = await Company.findOrCreate({
            where: { company_name: lead.company_name },
            defaults: { location: lead.location || 'N/A' },
            transaction: t
        });
        const newCustomer = await Customer.create({
            customer_name: lead.company_name,
            companyName: company.company_name,
            contact: `Name: ${person_name || 'N/A'}, Info: ${contact_details || 'N/A'}`
        }, { transaction: t });
      
        final_customer_id = newCustomer.customer_id; 

        lead.status = 'Converted';
        await lead.save({ transaction: t });
    }
    
    if (!employee_id || !final_customer_id || !date || !start_time || !end_time || !location) {
      await t.rollback();
      return res.status(400).json({ error: 'Missing required visit details.' });
    }

    const newVisit = await Visit.create({
      employee_id,
      customer_id: final_customer_id,
      date,
      start_time,
      end_time,
      location,
      purpose,
      notes,
      status: status || 'Planned',
    }, { transaction: t });

    await t.commit();
    const detailedVisit = await Visit.findByPk(newVisit.visit_id, {
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer,
          as: 'Customer',
          attributes: ['customer_name', 'customer_id', 'contact', 'companyName'],
          include: [{ model: Company, as: 'Company', attributes: ['company_name'] }]
        }
      ]
    });

    res.status(201).json(detailedVisit);

  } catch (error) {
    await t.rollback();
    console.error('Error in visit creation transaction:', error);
    res.status(500).json({ error: 'Failed to create visit', details: error.message });
  }
});


router.put('/:id', async (req, res) => { /* ... your existing code ... */ });

router.delete('/:id', async (req, res) => { /* ... your existing code ... */ });


module.exports = router;
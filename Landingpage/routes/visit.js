const express = require('express');
const router = express.Router();
const { Visit, Customer, User, Lead, sequelize } = require('../models');

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.findAll({
      include: [
        { model: User, as: 'Employee' },
        { model: Customer, as: 'Customer', required: false },
        { model: Lead, as: 'Lead', required: false }
      ],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });
    res.status(200).json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// POST a new visit
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { employee_id, company_name, lead_company_name, person_name, contact_details, ...visitDetails } = req.body;
        
        let visitData = { ...visitDetails, employee_id };

        if (lead_company_name) {
            const lead = await Lead.findOne({ where: { company_name: lead_company_name }, transaction: t });
            if (!lead) { await t.rollback(); return res.status(404).json({ error: 'Lead not found.' }); }
            visitData.lead_id = lead.lead_id;
            visitData.visit_source = 'LEAD';
            lead.status = 'Scheduled';
            await lead.save({ transaction: t });

        } else if (company_name) {
            if (!person_name) {
                await t.rollback();
                return res.status(400).json({ error: 'Person Name is required.' });
            }
            
            // FIX: Use 'companyName' (camelCase) to match the model definition
            const [customer] = await Customer.findOrCreate({
                where: { customer_name: person_name, companyName: company_name },
                defaults: {
                    customer_name: person_name,
                    contact_details: contact_details,
                    companyName: company_name 
                },
                transaction: t
            });
            
            visitData.customer_id = customer.customer_id;
            visitData.visit_source = 'CUSTOMER';
        } else {
            await t.rollback();
            return res.status(400).json({ error: 'You must select a Company or a Lead.' });
        }

        const newVisit = await Visit.create(visitData, { transaction: t });
        await t.commit();
        
        const detailedVisit = await Visit.findByPk(newVisit.visit_id, {
             include: [
                { model: User, as: 'Employee' },
                { model: Customer, as: 'Customer', required: false },
                { model: Lead, as: 'Lead', required: false }
            ]
        });
        res.status(201).json(detailedVisit);

    } catch (error) {
        await t.rollback();
        console.error('Error in visit creation:', error);
        res.status(500).json({ error: 'Failed to create visit', details: error.message });
    }
});

// Other routes (PUT, DELETE) are kept for completeness
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { person_name, contact_details, ...visitData } = req.body;
    const visit = await Visit.findByPk(req.params.id, { transaction: t });
    if (!visit) { await t.rollback(); return res.status(404).json({ error: 'Visit not found' }); }
    await visit.update(visitData, { transaction: t });
    if (person_name && visit.customer_id) {
      const customer = await Customer.findByPk(visit.customer_id, { transaction: t });
      if (customer) {
        await customer.update({ customer_name: person_name, contact_details: contact_details }, { transaction: t });
      }
    }
    await t.commit();
    const detailedVisit = await Visit.findByPk(visit.visit_id, { include: [ { model: User, as: 'Employee' }, { model: Customer, as: 'Customer', required: false }, { model: Lead, as: 'Lead', required: false } ] });
    res.status(200).json(detailedVisit);
  } catch (error) {
    await t.rollback();
    console.error('Error updating visit:', error);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

router.delete('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(req.params.id, { transaction: t });
    if (!visit) { await t.rollback(); return res.status(404).json({ error: 'Visit not found' }); }
    await visit.destroy({ transaction: t });
    await t.commit();
    res.status(200).json({ message: 'Visit deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

module.exports = router;
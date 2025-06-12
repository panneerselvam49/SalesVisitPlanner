const express = require('express');
const router = express.Router();
const { Visit, Customer, User, Lead, Location, sequelize } = require('../models');

// GET all visits with updated includes
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.findAll({
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer,
          as: 'Customer',
          required: false,
          include: [{ model: Location, as: 'Location', attributes: ['name'] }]
        },
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

// POST a new visit (handles new Customer/Lead logic)
router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // 'companyName' now maps to customer.name, 'lead_company_name' maps to lead.name
        const { employee_id, companyName, lead_company_name, person_name, contact_details, ...visitDetails } = req.body;

        let visitData = { ...visitDetails, employee_id };

        if (companyName) { // This is a visit for a Customer
            if (!person_name) {
                await t.rollback();
                return res.status(400).json({ error: 'A contact person name is required for a customer visit.' });
            }
            // Find an existing customer record based on the company name and person name
            const customer = await Customer.findOne({
                where: { name: companyName, person_name: person_name },
                transaction: t
            });

            if (!customer) {
                await t.rollback();
                // We now expect the customer to exist. Creation should be a separate step.
                return res.status(404).json({ error: `Customer '${person_name}' at company '${companyName}' not found. Please create the customer first.` });
            }
            visitData.customer_id = customer.id;
            visitData.visit_source = 'CUSTOMER';

        } else if (lead_company_name) { // This is a visit for a Lead
            const lead = await Lead.findOne({ where: { name: lead_company_name }, transaction: t });
            if (!lead) {
                await t.rollback();
                return res.status(404).json({ error: 'Lead not found.' });
            }
            visitData.lead_id = lead.id;
            visitData.visit_source = 'LEAD';
        } else {
            await t.rollback();
            return res.status(400).json({ error: 'Visit must be associated with either a customer or a lead.' });
        }

        const newVisit = await Visit.create(visitData, { transaction: t });
        await t.commit();
        res.status(201).json(newVisit);

    } catch (error) {
        await t.rollback();
        console.error('Detailed error in visit creation:', error);
        res.status(500).json({ error: 'Failed to create visit.', details: error.message });
    }
});


// PUT (Update) a visit
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { person_name, contact_details, ...visitData } = req.body;
    const visit = await Visit.findByPk(req.params.id, { transaction: t });

    if (!visit) {
      await t.rollback();
      return res.status(404).json({ error: 'Visit not found' });
    }

    await visit.update(visitData, { transaction: t });

    // If the person_name or contact_details are being updated for a customer visit
    if (visit.customer_id && (person_name || contact_details)) {
      const customer = await Customer.findByPk(visit.customer_id, { transaction: t });
      if (customer) {
        let customerUpdateData = {};
        if (person_name) customerUpdateData.person_name = person_name;
        if (contact_details) customerUpdateData.contact_details = contact_details;
        await customer.update(customerUpdateData, { transaction: t });
      }
    }

    await t.commit();
    const detailedVisit = await Visit.findByPk(visit.visit_id, {
        include: [
            { model: User, as: 'Employee' },
            { model: Customer, as: 'Customer', required: false, include: [{ model: Location, as: 'Location' }] },
            { model: Lead, as: 'Lead', required: false }
        ]
    });
    res.status(200).json(detailedVisit);
  } catch (error) {
    await t.rollback();
    console.error('Error updating visit:', error);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

// DELETE a visit
router.delete('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(req.params.id, { transaction: t });
    if (!visit) {
      await t.rollback();
      return res.status(404).json({ error: 'Visit not found' });
    }
    await visit.destroy({ transaction: t });
    await t.commit();
    res.status(204).send(); // 204 No Content is appropriate for a successful deletion
  } catch (error) {
    await t.rollback();
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});


module.exports = router;

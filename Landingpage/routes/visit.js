const express = require('express');
const router = express.Router();
const { Visit, Customer, CustomerMaster, User, Lead, Location, sequelize } = require('../models');

router.get('/', async (req, res) => {
  try {
    const visits = await Visit.findAll({
      include: [
        { model: User, as: 'Employee', attributes: ['name', 'employee_id'] },
        {
          model: Customer, // This is the Contact Person
          as: 'Customer',
          required: false,
          attributes: ['id', 'person_name', 'contact_details'],
          include: [{
            model: CustomerMaster, // This is the Master Company
            as: 'CustomerMaster',
            attributes: ['id', 'name'],
            include: [{ model: Location, as: 'Location', attributes: ['name'] }]
          }]
        },
        // You can add a similar nested structure for Leads if needed
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

router.post('/', async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            employee_id,
            customerMasterName, 
            locationName,      
            person_name,      
            contact_details,    
            ...visitDetails     
        } = req.body;

        if (!customerMasterName || !person_name) {
            return res.status(400).json({ error: "Customer name and contact person's name are required." });
        }

        // Step 1: Find or create the Location.
        const [location] = await Location.findOrCreate({
            where: { name: locationName || 'Unknown' },
            transaction: t
        });
        const [customerMaster] = await CustomerMaster.findOrCreate({
            where: { name: customerMasterName },
            defaults: { locationId: location.id },
            transaction: t
        });
        const [customerContact] = await Customer.findOrCreate({
            where: {
                customerMasterId: customerMaster.id,
                person_name: person_name
            },
            defaults: { contact_details: contact_details },
            transaction: t
        });
        const newVisit = await Visit.create({
            ...visitDetails,
            employee_id,
            customer_id: customerContact.id,
            location: locationName || customerMaster.name,
        }, { transaction: t });

        await t.commit();
        res.status(201).json(newVisit);

    } catch (error) {
        await t.rollback();
        console.error("Error creating visit:", error);
        res.status(500).json({ error: 'Failed to create visit.' });
    }
});
router.put('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(req.params.id, { transaction: t });
    if (!visit) {
      await t.rollback();
      return res.status(404).json({ error: 'Visit not found' });
    }

    const {
        customerMasterName,
        locationName,
        person_name,
        contact_details,
        ...visitDetails
    } = req.body;

    let customerContactId = visit.customer_id; 

    if (customerMasterName && person_name) {
        const [location] = await Location.findOrCreate({ where: { name: locationName || 'Unknown' }, transaction: t });
        const [customerMaster] = await CustomerMaster.findOrCreate({ where: { name: customerMasterName }, defaults: { locationId: location.id }, transaction: t });
        const [customerContact] = await Customer.findOrCreate({ where: { customerMasterId: customerMaster.id, person_name: person_name }, defaults: { contact_details: contact_details }, transaction: t });
        customerContactId = customerContact.id;
    }

    await visit.update({
        ...visitDetails,
        customer_id: customerContactId,
    }, { transaction: t });

    await t.commit();
    res.status(200).json(visit);
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
    if (!visit) {
      await t.rollback();
      return res.status(404).json({ error: 'Visit not found' });
    }
    await visit.destroy({ transaction: t });
    await t.commit();
    res.status(204).send();
  } catch (error) {
    await t.rollback();
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});


module.exports = router;

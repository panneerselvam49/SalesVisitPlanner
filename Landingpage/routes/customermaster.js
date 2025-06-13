const express = require('express');
const router = express.Router();
const { CustomerMaster, Location, sequelize } = require('../models');
router.get('/', async (req, res) => {
  try {
    const customers = await CustomerMaster.findAll({
      include: [{ model: Location, as: 'Location', attributes: ['name'] }],
      order: [['name', 'ASC']],
    });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customer masters:', error);
    res.status(500).json({ error: 'Failed to fetch customer masters' });
  }
});
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, locationName } = req.body;
    if (!name || !locationName) {
      return res.status(400).json({ error: 'Customer name and location are required.' });
    }
    const [location] = await Location.findOrCreate({
      where: { name: locationName },
      transaction: t
    });
    const newCustomerMaster = await CustomerMaster.create({
      name: name,
      locationId: location.id,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(newCustomerMaster);
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A customer with this name already exists.' });
    }
    console.error('Error creating customer master:', error);
    res.status(500).json({ error: 'Failed to create customer master' });
  }
});

module.exports = router;

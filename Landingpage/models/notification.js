const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipient_id: req.session.userId },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to the 50 newest notifications
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});
router.put('/mark-read', isAuthenticated, async (req, res) => {
    const { ids } = req.body; // Expect an array of notification IDs
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Notification IDs must be a non-empty array.' });
    }
  try {
    const [updateCount] = await Notification.update(
        { is_read: true },
        {
            where: {
                id: ids,
                recipient_id: req.session.userId // Security check
            }
        }
    );
    res.status(200).json({ message: `${updateCount} notifications marked as read.` });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
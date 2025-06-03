const db = require('./models'); 
db.sequelize.sync({ alter: true })
  .then(() => console.log('All models synced to DB'))
  .catch(err => console.error('Sync error:', err));

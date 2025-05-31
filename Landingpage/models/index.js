const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize('salesvisitplanner', 'postgres', 'Paneer@123', {
  host: '127.0.0.1',
  dialect: 'postgres',
  logging: false,
});

const db = {};
const basename = path.basename(__filename);

// Read all model files from current folder (except index.js)
fs.readdirSync(__dirname)
  .filter(file => file !== basename && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Setup associations (if any)
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

const express = require('express');
const path = require('path');
const cors = require('cors'); // Import cors
const db = require('./models');
const authtrout = require('./routes/auth');
const company = require('./routes/company');
const customer = require('./routes/customer');
const visit = require('./routes/visit');

const app = express();

app.use(cors()); // <-- Use CORS middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authtrout); 
app.use('/api/company', company);
app.use('/api/customer', customer); 
app.use('/api/visit', visit); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reworkedform.html')); //
});

app.get('/landing',(req,res)=>{
 res.sendFile(path.join(__dirname, 'public', 'landing.html')); //
});

// Start the server
db.sequelize.sync().then(() => { //
  console.log('Database synced'); //
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000'); //
  });
});
const express = require('express');
const path = require('path');
const db = require('./models'); // Sequelize models
const authRoutes = require('./routes/auth'); // <-- Important

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);

// Serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reworkedform.html'));
});

app.get('/landing',(req,res)=>{
  res.sendFile(path.join(__dirname),'public','landing.html')
});

// Start the server
db.sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});

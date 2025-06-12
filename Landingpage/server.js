const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./models');
const authtrout = require('./routes/auth');
const customer = require('./routes/customer');
const visit = require('./routes/visit');
const session = require('express-session');
const lead=require('./routes/lead')
const app = express();
app.use(session({
    secret: 'your-very-secure-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).redirect('/');
  }
app.get('/landing.html', isAuthenticated, (req, res) => {
  res.redirect('/landing');
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authtrout);
app.use('/api/customer', isAuthenticated, customer);
app.use('/api/visit', isAuthenticated, visit);
app.use('/api/lead', isAuthenticated, lead)
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/landing');
  }
  res.sendFile(path.join(__dirname, 'public', 'reworkedform.html'));
});

app.get('/landing', isAuthenticated, (req, res) => {
 res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

db.sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
});
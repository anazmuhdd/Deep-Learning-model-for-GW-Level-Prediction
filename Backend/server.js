const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// ✅ Serve static files (CSS, JS, etc.) from Public folder
app.use('/Public', express.static(path.join(__dirname, '../Public')));

// ✅ Serve HTML files from root directory (like index2.html, admin.html)
app.use(express.static(path.join(__dirname, '..')));

// ✅ API routes
const predictionRoutes = require('./routes/predictionRoutes');
app.use('/api/predictions', predictionRoutes);

// ✅ Route for admin dashboard page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../administrator.html'));
});

// ✅ Route for main index/home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index2.html'));
});
app.get('/prediction', (req, res) => {
  res.sendFile(path.join(__dirname, '../prediction.html'));
});
// ✅ Handle 404 for any missing resources
app.use((req, res) => {
  res.status(404).send('Resource not found');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

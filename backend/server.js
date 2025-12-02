const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import our database connection
const db = require('./db');

const app = express();

// Middleware
app.use(cors()); // Allows requests from other origins (like your frontend)
app.use(express.json()); // Allows server to read JSON from request bodies

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// A test route to check database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const data = await db.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful!',
      time: data.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Database connection failed!',
      error: err.message,
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// PUBLIC: Get all movies (for landing page, no login required)
app.get('/api/public/movies', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM movies ORDER BY movie_id DESC');
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching public movies:', err);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Test DB route
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

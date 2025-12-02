const router = require('express').Router();
const eventController = require('../controllers/event.controller');
const admin = require('../middleware/admin.middleware');

// Import your new authentication middleware
const auth = require('../middleware/auth.middleware');

// @route   GET /api/events/movies
// @desc    Get all movies
// @access  Private
// We add 'auth' as the second argument. This means
// auth.middleware.js will run BEFORE eventController.getMovies.
router.get('/movies', auth, eventController.getMovies);

// @route   GET /api/events/showtimes/:movieId
// @desc    Get showtimes for a specific movie
// @access  Private
router.get('/showtimes/:movieId', auth, eventController.getShowtimes);

// @route   GET /api/events/seats/:showtimeId
// @desc    Get all seats and their availability for a showtime
// @access  Private
router.get('/seats/:showtimeId', auth, eventController.getSeatsForShowtime);

// @route   POST /api/events/book
// @desc    Book one or more tickets
// @access  Private
router.post('/book', auth, eventController.bookTickets);

// @route   GET /api/events/my-bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/my-bookings', auth, eventController.getUserBookings);

// @route   POST /api/events/movies
// @desc    Add a new movie (Admin only)
// @access  Private/Admin
router.post('/movies', auth, admin, async (req, res) => {
  try {
    const { title, description, duration_mins, genre, image_url } = req.body;
    
    const db = require('../db'); // Quick import for this inline function
    
    const newMovie = await db.query(
      'INSERT INTO movies (title, description, duration_mins, genre, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, duration_mins, genre, image_url]
    );
    
    res.json(newMovie.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/bookings/:bookingId', auth, eventController.cancelBooking);

module.exports = router;
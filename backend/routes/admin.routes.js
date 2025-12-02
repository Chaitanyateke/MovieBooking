const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// User Management
router.get('/users', auth, admin, adminController.getAllUsers);
router.delete('/users/:id', auth, admin, adminController.deleteUser);
router.get('/users/:id', auth, admin, adminController.getUserDetails); 

// Booking Management
router.delete('/bookings/:id', auth, admin, adminController.deleteBooking);

// Movie Management
router.post('/movies', auth, admin, adminController.addMovie);
router.delete('/movies/:id', auth, admin, adminController.deleteMovie);

// Showtime Management
router.get('/showtimes', auth, admin, adminController.getAllShowtimes);
router.post('/showtimes', auth, admin, adminController.addShowtime);
router.delete('/showtimes/:id', auth, admin, adminController.deleteShowtime);

// Payment Management
router.get('/payments', auth, admin, adminController.getAllPayments);

// Notifications (NEW)
router.get('/notifications', auth, admin, adminController.getNotifications);
router.put('/notifications/read', auth, admin, adminController.markNotificationsRead);

module.exports = router;
const router = require('express').Router();
const authController = require('../controllers/auth.controller');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
router.post('/login', authController.login);
const auth = require('../middleware/auth.middleware');

// @route   PUT /api/auth/profile
// @desc    Update a user's profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);
// @route   PUT /api/auth/change-password
// @desc    Change a user's password
// @access  Private
router.put('/change-password', auth, authController.changePassword);

router.post('/verify-otp', authController.verifyOTP);
router.post('/send-login-otp', authController.sendLoginOTP); 

module.exports = router;
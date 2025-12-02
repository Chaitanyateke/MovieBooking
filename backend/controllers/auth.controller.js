const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notification.service');
require('dotenv').config();

// 1. REGISTER (Updated to check Mobile Number uniqueness)
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    // CHECK: Does user with this Email OR Mobile already exist?
    const userCheck = await db.query(
      'SELECT * FROM users WHERE user_email = $1 OR mobile_number = $2', 
      [email, mobile]
    );
    
    if (userCheck.rows.length > 0) {
      // Give a specific error depending on what matched
      const existingUser = userCheck.rows[0];
      if (existingUser.user_email === email) {
        return res.status(401).json({ message: 'User with this email already exists' });
      } else {
        return res.status(401).json({ message: 'User with this mobile number already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);

    await db.query(
      `INSERT INTO users (user_name, user_email, mobile_number, user_password, otp_code, otp_expiry, is_verified, role) 
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, 'user')`,
      [name, email, mobile, hashedPassword, otp, otpExpiry]
    );
     await db.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'user')", 
      [`New user registered: ${name} (${email})`]
    );

    await notificationService.sendOTP(email, mobile, otp);

    res.json({ message: 'OTP sent successfully. Please verify to complete registration.', email: email });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 2. VERIFY OTP 
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await db.query('SELECT * FROM users WHERE user_email = $1', [email]);
    
    if (user.rows.length === 0) return res.status(400).json({ message: 'User not found' });
    const dbUser = user.rows[0];

    if (dbUser.otp_code !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(dbUser.otp_expiry)) return res.status(400).json({ message: 'OTP Expired' });

    await db.query('UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE user_id = $1', [dbUser.user_id]);

    const payload = { user: { id: dbUser.user_id, role: dbUser.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: dbUser });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 3. LOGIN (back to your original login – no single-browser restriction)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const isEmail = identifier.includes('@');
    let user;

    // SELECT query now explicitly includes mobile_number
    if (isEmail) {
        user = await db.query('SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE user_email = $1', [identifier]);
    } else {
        user = await db.query('SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE mobile_number = $1', [identifier]);
    }

    if (user.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.rows[0].is_verified) return res.status(403).json({ message: 'Account not verified. Please complete registration.' });

    const isMatch = await bcrypt.compare(password, user.rows[0].user_password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.rows[0].user_id, role: user.rows[0].role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      // We return the full user row (which now has mobile_number)
      res.json({ token, user: user.rows[0] });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

// 4. SEND LOGIN OTP (Admin login)
exports.sendLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await db.query('SELECT * FROM users WHERE user_email = $1', [email]);
        if (user.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        // Strict check: Only Admins can use this OTP login flow
        if (user.rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied. This login is for Admins only.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000);

        await db.query('UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE user_id = $3', [otp, otpExpiry, user.rows[0].user_id]);
        
        await notificationService.sendOTP(email, user.rows[0].mobile_number, otp);

        res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateProfile = async (req, res) => { 
  try {
    const { name, avatar_url } = req.body;
    const userId = req.user.id;
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    const updatedUser = await db.query(
      `UPDATE users 
       SET user_name = $1, avatar_url = $2 
       WHERE user_id = $3 
       RETURNING user_id, user_name, user_email, avatar_url, role`,
      [name, avatar_url || null, userId]
    );
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Provide both passwords.' });

    const userQuery = await db.query('SELECT user_password FROM users WHERE user_id = $1', [userId]);
    const isMatch = await bcrypt.compare(oldPassword, userQuery.rows[0].user_password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password.' });

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET user_password = $1 WHERE user_id = $2', [newHashedPassword, userId]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) { 
    console.error(err.message);
    res.status(500).send('Server Error'); 
  }
};

// Optional: simple logout handler (does not enforce single session)
exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notification.service');
require('dotenv').config();

/* =========================================================
   1. REGISTER  (NO OTP – DIRECT SIGNUP + LOGIN)
========================================================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user already exists with same email OR mobile
    const userCheck = await db.query(
      'SELECT * FROM users WHERE user_email = $1 OR mobile_number = $2',
      [email, mobile]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      if (existingUser.user_email === email) {
        return res
          .status(401)
          .json({ message: 'User with this email already exists' });
      } else {
        return res
          .status(401)
          .json({ message: 'User with this mobile number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user as verified (no OTP flow)
    const insertRes = await db.query(
      `INSERT INTO users 
        (user_name, user_email, mobile_number, user_password, is_verified, role)
       VALUES ($1, $2, $3, $4, TRUE, 'user')
       RETURNING user_id, user_name, user_email, mobile_number, role, avatar_url, is_verified`,
      [name, email, mobile, hashedPassword]
    );

    const newUser = insertRes.rows[0];

    // Admin notification
    await db.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'user')",
      [`New user registered: ${name} (${email})`]
    );

    // Create JWT and log user in immediately
    const payload = {
      user: {
        id: newUser.user_id,
        role: newUser.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ token, user: newUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* =========================================================
   2. VERIFY OTP  (DISABLED FOR REGISTRATION)
========================================================= */
exports.verifyOTP = async (req, res) => {
  // Old OTP-based registration is now disabled
  return res
    .status(400)
    .json({ message: 'OTP verification is disabled for registration.' });
};

/* =========================================================
   3. LOGIN (Email or Mobile)
========================================================= */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const isEmail = identifier.includes('@');
    let user;

    if (isEmail) {
      user = await db.query(
        'SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE user_email = $1',
        [identifier]
      );
    } else {
      user = await db.query(
        'SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE mobile_number = $1',
        [identifier]
      );
    }

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const dbUser = user.rows[0];

    // You can remove this check if you want to ignore is_verified completely
    if (!dbUser.is_verified) {
      return res.status(403).json({
        message: 'Account not verified. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, dbUser.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: dbUser.user_id,
        role: dbUser.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ token, user: dbUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* =========================================================
   4. SEND LOGIN OTP (Admin only – KEEPING THIS)
========================================================= */
exports.sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.query(
      'SELECT * FROM users WHERE user_email = $1',
      [email]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admins can use this OTP flow
    if (user.rows[0].role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Access Denied. This login is for Admins only.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000);

    await db.query(
      'UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE user_id = $3',
      [otp, otpExpiry, user.rows[0].user_id]
    );

    await notificationService.sendOTP(
      email,
      user.rows[0].mobile_number,
      otp
    );

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* =========================================================
   5. UPDATE PROFILE
========================================================= */
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

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

/* =========================================================
   6. CHANGE PASSWORD
========================================================= */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Provide both old and new passwords.' });
    }

    const userQuery = await db.query(
      'SELECT user_password FROM users WHERE user_id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(
      oldPassword,
      userQuery.rows[0].user_password
    );
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET user_password = $1 WHERE user_id = $2',
      [newHashedPassword, userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* =========================================================
   7. LOGOUT (simple)
========================================================= */
exports.logout = async (req, res) => {
  try {
    // Token is handled client-side, just respond OK
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

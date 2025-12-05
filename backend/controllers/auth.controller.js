const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notification.service');
require('dotenv').config();

/* ============================================================
   1. REGISTER  (NO OTP – DIRECT ACCOUNT CREATION)
   - Checks unique email + mobile
   - Hashes password
   - Marks is_verified = TRUE
   - Returns JWT + user object
============================================================ */
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email or mobile already exists
    const existing = await db.query(
      'SELECT user_email, mobile_number FROM users WHERE user_email = $1 OR mobile_number = $2',
      [email, mobile]
    );

    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      if (u.user_email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (u.mobile_number === mobile) {
        return res.status(400).json({ message: 'User with this mobile number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user (is_verified = TRUE, no OTP fields)
    const insertQuery = `
      INSERT INTO users (user_name, user_email, mobile_number, user_password, is_verified, role)
      VALUES ($1, $2, $3, $4, TRUE, 'user')
      RETURNING user_id, user_name, user_email, mobile_number, role, avatar_url, is_verified
    `;
    const result = await db.query(insertQuery, [
      name,
      email,
      mobile,
      hashedPassword
    ]);

    const user = result.rows[0];

    // Optional: admin notification about new user
    await db.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'user')",
      [`New user registered: ${name} (${email})`]
    );

    // Generate JWT
    const payload = { user: { id: user.user_id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};

/* ============================================================
   2. LOGIN  (EMAIL or MOBILE + PASSWORD)
============================================================ */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Mobile and password are required.' });
    }

    const isEmail = identifier.includes('@');

    let userQuery;
    if (isEmail) {
      userQuery = await db.query(
        'SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE user_email = $1',
        [identifier]
      );
    } else {
      userQuery = await db.query(
        'SELECT user_id, user_name, user_email, mobile_number, user_password, role, is_verified, avatar_url FROM users WHERE mobile_number = $1',
        [identifier]
      );
    }

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    // (is_verified will always be TRUE for newly created users,
    // but keep the check so old data still works)
    if (!user.is_verified) {
      return res.status(403).json({ message: 'Account not verified.' });
    }

    const isMatch = await bcrypt.compare(password, user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.user_id, role: user.role } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};

/* ============================================================
   3. UPDATE PROFILE (Name + Avatar URL)
============================================================ */
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const updateQuery = `
      UPDATE users
      SET user_name = $1, avatar_url = $2
      WHERE user_id = $3
      RETURNING user_id, user_name, user_email, avatar_url, role, mobile_number
    `;

    const result = await db.query(updateQuery, [name, avatar_url || null, userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};

/* ============================================================
   4. CHANGE PASSWORD
============================================================ */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Provide both old and new passwords.' });
    }

    const userResult = await db.query(
      'SELECT user_password FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, userResult.rows[0].user_password);
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
    console.error('CHANGE PASSWORD ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};

/* ============================================================
   5. LOGOUT (stateless – just a message)
============================================================ */
exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('LOGOUT ERROR:', err.message);
    res.status(500).send('Server Error');
  }
};
  
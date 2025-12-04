const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 1. REGISTER (NO OTP)
 * - Checks email & mobile uniqueness
 * - Hashes password into user_password
 * - Sets is_verified = TRUE directly
 * - Returns token + user (auto-login on sign up)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if user exists by email or mobile
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

    // Insert user directly as verified (no OTP)
    const insertRes = await db.query(
      `INSERT INTO users 
        (user_name, user_email, mobile_number, user_password, is_verified, role)
       VALUES ($1, $2, $3, $4, TRUE, 'user')
       RETURNING user_id, user_name, user_email, mobile_number, role, avatar_url, is_verified`,
      [name, email, mobile, hashedPassword]
    );

    const newUser = insertRes.rows[0];

    // Optional: admin notification
    await db.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'user')",
      [`New user registered: ${name} (${email})`]
    );

    // Create JWT & return
    const payload = { user: { id: newUser.user_id, role: newUser.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        return res.json({
          message: 'Registration successful.',
          token,
          user: newUser,
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * 2. LOGIN (Email or Mobile)
 */
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide credentials.' });
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

    if (user.rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.rows[0].is_verified) {
      return res.status(403).json({
        message:
          'Account not verified. Please contact support or register again.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].user_password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user.rows[0].user_id, role: user.rows[0].role } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: user.rows[0] });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * 3. UPDATE PROFILE
 */
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

/**
 * 4. CHANGE PASSWORD
 */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Provide both passwords.' });
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
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect old password.' });

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET user_password = $1 WHERE user_id = $2', [
      newHashedPassword,
      userId,
    ]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * 5. LOGOUT (stateless – just a confirmation)
 */
exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

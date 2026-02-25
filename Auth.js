// routes/auth.js
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me          (requires token)

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db/connection');
const auth     = require('../middleware/auth');

const router = express.Router();

// ── helper: issue a JWT ──
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Body: { firstName, lastName, email, password, role, phone }
// ────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, email and password are required.' });
  }

  try {
    // Check if email already registered
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
    );
    if (exists.rows.length) {
      return res.status(409).json({ message: 'That email is already registered. Please sign in.' });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name, last_name, email, role, phone, created_at`,
      [firstName, lastName, email.toLowerCase(), hash, role || 'parent', phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        role:      user.role,
        phone:     user.phone,
      },
    });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Body: { email, password }
// ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase()]
    );
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // ── Track login ──
    await pool.query(
      `UPDATE users SET login_count = login_count + 1, last_login_at = NOW() WHERE id = $1`,
      [user.id]
    );
    await pool.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES ($1, $2, $3)`,
      [user.id, req.ip, req.headers['user-agent'] || null]
    );

    const token = signToken(user);

    res.json({
      token,
      user: {
        id:        user.id,
        firstName: user.first_name,
        lastName:  user.last_name,
        email:     user.email,
        role:      user.role,
        phone:     user.phone,
        loginCount: user.login_count + 1,
      },
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/auth/me   — get current user's profile
// ────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone,
              login_count, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const u = result.rows[0];
    res.json({
      id:          u.id,
      firstName:   u.first_name,
      lastName:    u.last_name,
      email:       u.email,
      role:        u.role,
      phone:       u.phone,
      loginCount:  u.login_count,
      lastLogin:   u.last_login_at,
      memberSince: u.created_at,
    });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;

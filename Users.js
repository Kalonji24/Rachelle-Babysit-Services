// routes/users.js
// GET  /api/users/profile          — current user's profile
// PATCH /api/users/profile         — update profile
// GET  /api/users/my-bookings      — all bookings for current user
// GET  /api/users/stats            — admin: site statistics

const express = require('express');
const pool    = require('../db/connection');
const auth    = require('../middleware/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────
//  GET /api/users/profile
// ────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, phone,
              login_count, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });
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
    console.error('[profile]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/users/profile
//  Body: { firstName, lastName, phone }
// ────────────────────────────────────────────────────────────
router.patch('/profile', auth, async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           phone      = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, first_name, last_name, email, role, phone`,
      [firstName || null, lastName || null, phone || null, req.user.id]
    );
    const u = result.rows[0];
    res.json({ id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, phone: u.phone });
  } catch (err) {
    console.error('[update profile]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/users/my-bookings
//  Returns current user's bookings with status
// ────────────────────────────────────────────────────────────
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, service, parent_role, num_children,
              start_date, end_date, start_time, end_time,
              estimated_cost, status, notes, address, created_at
       FROM bookings
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[my-bookings]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/users/stats   — admin dashboard stats
//  Returns: total users, logins, bookings broken down by status,
//           top 10 users by login count, bookings in last 30 days
// ────────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorised.' });
  }

  try {
    const [
      totalUsers,
      totalLogins,
      bookingStats,
      topUsers,
      recentBookings,
      bookingsByDay,
      roleBreakdown,
    ] = await Promise.all([

      // Count of all registered users
      pool.query('SELECT COUNT(*)::INT AS count FROM users'),

      // Total login events across all time
      pool.query('SELECT COUNT(*)::INT AS count FROM login_logs'),

      // Booking counts per status
      pool.query(`
        SELECT status, COUNT(*)::INT AS count
        FROM bookings
        GROUP BY status
        ORDER BY count DESC
      `),

      // Top 10 most active users (by login count)
      pool.query(`
        SELECT id, first_name || ' ' || last_name AS full_name,
               email, role, phone, login_count, last_login_at, created_at
        FROM users
        ORDER BY login_count DESC
        LIMIT 10
      `),

      // Last 20 bookings
      pool.query(`
        SELECT b.id, b.parent_name, b.parent_role, b.email, b.whatsapp,
               b.service, b.start_date, b.status, b.estimated_cost, b.created_at,
               u.first_name || ' ' || u.last_name AS registered_as
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
        LIMIT 20
      `),

      // Bookings per day over the last 30 days
      pool.query(`
        SELECT DATE(created_at) AS day, COUNT(*)::INT AS count
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day
      `),

      // User breakdown by role
      pool.query(`
        SELECT role, COUNT(*)::INT AS count
        FROM users
        GROUP BY role
        ORDER BY count DESC
      `),
    ]);

    res.json({
      summary: {
        totalUsers:    totalUsers.rows[0].count,
        totalLogins:   totalLogins.rows[0].count,
        totalBookings: bookingStats.rows.reduce((a, r) => a + r.count, 0),
      },
      bookingsByStatus: bookingStats.rows,
      topUsers:         topUsers.rows,
      recentBookings:   recentBookings.rows,
      bookingsByDay:    bookingsByDay.rows,
      usersByRole:      roleBreakdown.rows,
    });

  } catch (err) {
    console.error('[stats]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;


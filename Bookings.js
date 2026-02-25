// routes/bookings.js
// POST /api/bookings          — create booking + send confirmation email
// GET  /api/bookings          — get bookings for logged-in user
// GET  /api/bookings/all      — get ALL bookings (Nomsa / admin only)
// PATCH /api/bookings/:id     — update booking status

const express    = require('express');
const pool       = require('../db/connection');
const auth       = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// ── Email transporter (Gmail) ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // App Password — see .env.example
  },
});

// ── Email helper ──
async function sendConfirmationEmail({ to, parentName, service, startDate, startTime, endTime, numChildren, estimatedCost, notes }) {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: `"Nomsa's Babysitting" <${process.env.GMAIL_USER}>`,
      to,
      subject: '🍼 Booking Request Received — Nomsa\'s Care',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;color:#1A2420">
          <div style="background:#C8694A;padding:24px 32px;border-radius:16px 16px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:1.5rem">🍼 Nomsa's Babysitting</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #EAE2D8;border-top:none;border-radius:0 0 16px 16px">
            <h2 style="color:#C8694A;margin-bottom:8px">Booking Request Received!</h2>
            <p style="color:#4A5E58;line-height:1.7">Hi <strong>${parentName}</strong>,<br>Thank you for reaching out! I've received your booking request and will confirm via WhatsApp or email within the hour.</p>
            <table style="width:100%;border-collapse:collapse;margin:24px 0">
              <tr style="background:#FDF6EE"><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98;width:40%;border-radius:8px 0 0 8px">SERVICE</td><td style="padding:10px 14px;font-weight:600">${service}</td></tr>
              <tr><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98">DATE</td><td style="padding:10px 14px;font-weight:600">${startDate}</td></tr>
              <tr style="background:#FDF6EE"><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98">TIME</td><td style="padding:10px 14px;font-weight:600">${startTime || 'TBD'} – ${endTime || 'TBD'}</td></tr>
              <tr><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98">CHILDREN</td><td style="padding:10px 14px;font-weight:600">${numChildren || '1 child'}</td></tr>
              ${estimatedCost && estimatedCost !== 'R—' ? `<tr style="background:#FDF6EE"><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98">EST. COST</td><td style="padding:10px 14px;font-weight:700;color:#C8694A;font-size:1.1rem">${estimatedCost}</td></tr>` : ''}
              ${notes ? `<tr><td style="padding:10px 14px;font-weight:700;font-size:.875rem;color:#8A9E98">NOTES</td><td style="padding:10px 14px">${notes}</td></tr>` : ''}
            </table>
            <div style="background:#FDF6EE;border-radius:12px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:.875rem;color:#4A5E58">💬 <strong>Need to reach me faster?</strong> WhatsApp me on <strong>+27 71 234 5678</strong> — I usually reply within minutes!</p>
            </div>
            <p style="color:#8A9E98;font-size:.8rem;margin-bottom:0">© 2024 Nomsa's Babysitting · Cape Town</p>
          </div>
        </div>
      `,
    });
    console.log(`📧 Confirmation email sent to ${to}`);
  } catch (err) {
    // Email failing shouldn't break the booking
    console.error('[email send error]', err.message);
  }
}

// ────────────────────────────────────────────────────────────
//  POST /api/bookings
//  Creates a booking. Also sends a confirmation email.
//  Auth is OPTIONAL — guests can book too.
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    name, role, whatsapp, email, service,
    children, startDate, endDate,
    startTime, endTime, notes, address, total,
  } = req.body;

  if (!name || !startDate || !service) {
    return res.status(400).json({ message: 'Name, start date and service are required.' });
  }

  // Get user_id if they're logged in
  let userId = null;
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      userId = decoded.id;
    } catch { /* guest booking — that's fine */ }
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings
         (user_id, parent_name, parent_role, whatsapp, email, service,
          num_children, start_date, end_date, start_time, end_time,
          address, notes, estimated_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        userId, name, role || null, whatsapp || null, email || null, service,
        children || '1 child', startDate, endDate || null,
        startTime || null, endTime || null,
        address || null, notes || null, total || null,
      ]
    );

    const booking = result.rows[0];

    // Send email confirmation (non-blocking)
    sendConfirmationEmail({
      to: email,
      parentName: name,
      service,
      startDate,
      startTime,
      endTime,
      numChildren: children,
      estimatedCost: total,
      notes,
    });

    res.status(201).json({
      message: 'Booking saved! Confirmation email sent.',
      booking: {
        id:        booking.id,
        service:   booking.service,
        startDate: booking.start_date,
        status:    booking.status,
        createdAt: booking.created_at,
      },
    });
  } catch (err) {
    console.error('[create booking]', err.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/bookings   — user's own bookings
// ────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, service, parent_role, num_children, start_date, end_date,
              start_time, end_time, estimated_cost, status, notes, created_at
       FROM bookings
       WHERE user_id = $1
       ORDER BY start_date DESC, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[get bookings]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/bookings/all   — ALL bookings (Nomsa's admin view)
//  Protected: only for users with role = 'admin'
// ────────────────────────────────────────────────────────────
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorised.' });
  }
  try {
    const result = await pool.query(
      `SELECT b.*,
              u.first_name || ' ' || u.last_name AS registered_user,
              u.phone AS registered_phone
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.start_date DESC, b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[all bookings]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/bookings/:id   — update status
//  Body: { status: 'confirmed' | 'cancelled' | 'completed' }
// ────────────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Booking not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[update booking]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;



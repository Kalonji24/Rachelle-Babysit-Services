// routes/chat.js
// POST /api/chat/save   — save a chat message from the website bot
// GET  /api/chat/all    — admin: see all saved chat sessions

const express = require('express');
const pool    = require('../db/connection');
const auth    = require('../middleware/auth');

const router = express.Router();

// ────────────────────────────────────────────────────────────
//  POST /api/chat/save
//  Body: { sessionId, sender, message }
//  Called from frontend whenever user or bot sends a message.
//  This is optional — the chat works fine without it.
// ────────────────────────────────────────────────────────────
router.post('/save', async (req, res) => {
  const { sessionId, sender, message } = req.body;
  if (!message) return res.status(400).json({ message: 'message is required' });

  try {
    await pool.query(
      `INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, $2, $3)`,
      [sessionId || 'unknown', sender || 'user', message]
    );
    res.json({ saved: true });
  } catch (err) {
    // Don't let this break the user experience
    console.error('[chat save]', err.message);
    res.json({ saved: false });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/chat/all   — admin only
// ────────────────────────────────────────────────────────────
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorised.' });
  }
  try {
    const result = await pool.query(
      `SELECT session_id, sender, message, created_at
       FROM chat_messages
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[chat all]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;



// server.js — Nomsa's Babysitting Backend
// Start with:  npm run dev

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ──
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',  // React dev server
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Log every request in development ──
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString().substring(11,19)}  ${req.method.padEnd(6)} ${req.path}`);
    next();
  });
}

// ── API Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/chat',     require('./routes/chat'));

// ── Health check ──
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ── 404 ──
app.use((_req, res) =>
  res.status(404).json({ message: 'Route not found.' })
);

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

// ── Start ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('  🍼  Rachelle\'s Care — Backend is running!');
  console.log(`  🔗  http://localhost:${PORT}`);
  console.log(`  🌍  ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('  Routes available:');
  console.log('  POST  /api/auth/register');
  console.log('  POST  /api/auth/login');
  console.log('  GET   /api/auth/me');
  console.log('  POST  /api/bookings');
  console.log('  GET   /api/bookings');
  console.log('  GET   /api/bookings/all    (admin)');
  console.log('  PATCH /api/bookings/:id');
  console.log('  GET   /api/users/profile');
  console.log('  PATCH /api/users/profile');
  console.log('  GET   /api/users/my-bookings');
  console.log('  GET   /api/users/stats     (admin)');
  console.log('  POST  /api/chat/save');
  console.log('  GET   /api/chat/all        (admin)');
  console.log('');
});
// db/setup.js
// Run this once to create all tables:  node db/setup.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SCHEMA = `
-- ─────────────────────────────────────
--  Nomsa's Care — Database Schema
-- ─────────────────────────────────────

-- Users: parents, guardians, aunties, uncles etc who register on the site
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                  -- NULL for social login users
  role          VARCHAR(60)  DEFAULT 'parent', -- mother/father/aunt/uncle/guardian
  phone         VARCHAR(25),                   -- WhatsApp number
  is_verified   BOOLEAN      DEFAULT FALSE,
  login_count   INT          DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Login audit log (tracks every sign-in for analytics)
CREATE TABLE IF NOT EXISTS login_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  ip_address  VARCHAR(60),
  user_agent  TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings: requests made through the website
CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL PRIMARY KEY,
  user_id       INT REFERENCES users(id) ON DELETE SET NULL, -- NULL if they booked without an account
  parent_name   VARCHAR(200) NOT NULL,
  parent_role   VARCHAR(60),          -- mother / father / aunt / uncle …
  whatsapp      VARCHAR(25),
  email         VARCHAR(255),
  service       VARCHAR(120) NOT NULL,
  num_children  VARCHAR(50),
  start_date    DATE         NOT NULL,
  end_date      DATE,
  start_time    TIME,
  end_time      TIME,
  address       TEXT,
  notes         TEXT,
  estimated_cost VARCHAR(30),
  status        VARCHAR(30)  DEFAULT 'pending', -- pending / confirmed / cancelled / completed
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Chat messages: saved from the chatbot (optional, for Nomsa to review)
CREATE TABLE IF NOT EXISTS chat_messages (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR(80),   -- random ID generated in browser
  sender      VARCHAR(10),   -- 'user' or 'bot'
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_bookings_user    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date    ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_login_logs_user  ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
`;

async function setup() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await pool.query(SCHEMA);
    console.log('✅ All tables created successfully!');
    console.log('\nYour database is ready. Start the server with:');
    console.log('  npm run dev\n');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    console.error('\nMake sure PostgreSQL is running and DATABASE_URL in .env is correct.');
  } finally {
    await pool.end();
  }
}

setup();



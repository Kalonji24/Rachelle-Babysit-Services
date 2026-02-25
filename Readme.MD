# 🍼 Nomsa's Babysitting Website — Setup Guide

## Project Structure
```
babysitter/
├── frontend/
│   └── index.html          ← The full website (open in browser or deploy)
│
└── backend/
    ├── server.js            ← Express entry point
    ├── package.json
    ├── .env.example         ← Copy this to .env and fill in your values
    ├── db/
    │   ├── connection.js    ← PostgreSQL pool
    │   └── setup.js         ← Creates all tables (run once)
    ├── middleware/
    │   └── auth.js          ← JWT verification
    └── routes/
        ├── auth.js          ← Register, login, profile
        ├── bookings.js      ← Create & manage bookings + email confirmation
        ├── users.js         ← Profile, my bookings, admin stats
        └── chat.js          ← Optional: save chatbot messages
```

---

## ⚡ Quick Start (5 steps)

### Step 1 — Install PostgreSQL
Download and install from https://www.postgresql.org/download/

Then create the database:
```bash
psql -U postgres
CREATE DATABASE nomsas_care;
\q
```

### Step 2 — Install Node dependencies
```bash
cd backend
npm install
```

### Step 3 — Set up your .env file
```bash
cp .env.example .env
```
Then open `.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any long random string (e.g. 40+ characters)
- `GMAIL_USER` — Nomsa's Gmail address
- `GMAIL_PASS` — Gmail App Password (NOT her real password!)

**How to get a Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification (if not already on)
3. Search for "App passwords"
4. Create one for "Mail" — copy the 16-char code into `.env`

### Step 4 — Create database tables
```bash
node db/setup.js
```
You should see: ✅ All tables created successfully!

### Step 5 — Start the backend
```bash
npm run dev
```
You should see: 🍼 Nomsa's Care — Backend is running on http://localhost:5000

---

## 🌐 Running the Frontend
Just open `frontend/index.html` in your browser. The easiest way:
- Use VS Code's **Live Server** extension (right-click → Open with Live Server)
- Or double-click the file to open it directly

The frontend already calls `http://localhost:5000/api/...` — if the backend isn't running, it gracefully falls back to demo mode (WhatsApp/Gmail still work!).

---

## 🔌 REST API Reference

### Authentication
| Method | Route | Body | Auth | Description |
|--------|-------|------|------|-------------|
| POST | `/api/auth/register` | `{firstName, lastName, email, password, role, phone}` | None | Create account |
| POST | `/api/auth/login` | `{email, password}` | None | Sign in, get JWT |
| GET | `/api/auth/me` | — | ✅ Token | Get current user |

**Login response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "firstName": "Thandi", "email": "...", "role": "mother", "loginCount": 3 }
}
```
Store the token: `localStorage.setItem('nt', data.token)`
Send it in future requests: `Authorization: Bearer <token>`

---

### Bookings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/bookings` | Optional | Create booking + send email |
| GET | `/api/bookings` | ✅ Token | My bookings |
| GET | `/api/bookings/all` | ✅ Admin | All bookings |
| PATCH | `/api/bookings/:id` | ✅ Token | Update status |

**Create booking body:**
```json
{
  "name": "Thandi Nkosi",
  "role": "Mother",
  "whatsapp": "+27712345678",
  "email": "thandi@gmail.com",
  "service": "Baby Care (newborn–1yr) — R80/hr",
  "children": "2 children (+R15/hr)",
  "startDate": "2024-12-20",
  "endDate": null,
  "startTime": "08:00",
  "endTime": "14:00",
  "address": "123 Main Rd, Claremont",
  "notes": "Baby is 6 months, allergic to dairy",
  "total": "R285.00"
}
```

---

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users/profile` | ✅ Token | Get my profile |
| PATCH | `/api/users/profile` | ✅ Token | Update name/phone |
| GET | `/api/users/my-bookings` | ✅ Token | All my bookings |
| GET | `/api/users/stats` | ✅ Admin | Dashboard analytics |

**Stats response (admin only):**
```json
{
  "summary": {
    "totalUsers": 47,
    "totalLogins": 183,
    "totalBookings": 62
  },
  "bookingsByStatus": [
    { "status": "confirmed", "count": 28 },
    { "status": "pending", "count": 15 }
  ],
  "topUsers": [...],
  "recentBookings": [...],
  "bookingsByDay": [...],
  "usersByRole": [
    { "role": "mother", "count": 20 },
    { "role": "father", "count": 12 }
  ]
}
```

---

### Chat (optional)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat/save` | None | Save a chatbot message |
| GET | `/api/chat/all` | ✅ Admin | View all conversations |

---

## 🗄️ Database Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| first_name | VARCHAR | |
| last_name | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | NULL for social login |
| role | VARCHAR | mother/father/aunt/uncle/guardian |
| phone | VARCHAR | WhatsApp number |
| login_count | INT | increments on every login |
| last_login_at | TIMESTAMPTZ | |

### `login_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | FK → users | |
| ip_address | VARCHAR | |
| logged_in_at | TIMESTAMPTZ | |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | FK → users | NULL for guest bookings |
| parent_name | VARCHAR | |
| parent_role | VARCHAR | mother/father/etc |
| whatsapp | VARCHAR | |
| email | VARCHAR | gets confirmation email |
| service | VARCHAR | |
| num_children | VARCHAR | |
| start_date | DATE | |
| start_time / end_time | TIME | |
| address | TEXT | |
| notes | TEXT | |
| estimated_cost | VARCHAR | |
| status | VARCHAR | pending/confirmed/cancelled/completed |

### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| session_id | VARCHAR | random ID from browser |
| sender | VARCHAR | 'user' or 'bot' |
| message | TEXT | |

---

## 🚀 Deploying to Production

**Backend:** Deploy to [Railway](https://railway.app) (free tier available)
1. Push backend folder to GitHub
2. Connect to Railway → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables in Railway dashboard
5. Your API will be live at `https://your-app.up.railway.app`

**Frontend:** Update the API URL in `index.html`:
```js
// Change this line in every fetch() call:
'http://localhost:5000/api/...'
// To your live backend URL:
'https://your-app.up.railway.app/api/...'
```
Then deploy frontend to [Netlify](https://netlify.com) — just drag and drop the `frontend` folder!

---

## 💬 WhatsApp Integration
The website uses **WhatsApp deep links** (free, no API needed):
```
https://wa.me/27712345678?text=Pre-filled+message+here
```
This opens WhatsApp with Nomsa's number pre-loaded and the booking details already typed.

To send WhatsApp programmatically (e.g. from the backend), you'd need [Twilio's WhatsApp API](https://www.twilio.com/whatsapp) — but the deep link approach works great for a personal babysitting site!

---

Made with ❤️ for Nomsa and the families who trust her.
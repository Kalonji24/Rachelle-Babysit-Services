
# Rachelle's Babysitting Services

A full-stack personal babysitting website built for someone with hands-on childcare 
experience looking to connect with families in need of trusted, reliable care.

## About This Project

This website was built for Nomsa — an experienced babysitter based in Cape Town — 
to help her reach families (mothers, fathers, aunties, uncles, grandparents and 
guardians) who need someone they can trust with their children. It is not an agency 
platform. It is a personal services site with a warm, approachable design that 
reflects who Nomsa is.

##  Features

- **AI-style Chatbot** — answers questions about prices, availability and 
  services, and connects visitors directly to WhatsApp when it can't help
- **Interactive Availability Calendar** — shows booked vs open days, 
  clicking a date auto-fills the booking form
- **Booking Form** — collects all session details with an estimated cost 
  calculator that works out the price based on hours and number of children
- **WhatsApp Integration** — sends a pre-filled booking message directly 
  to Nomsa's WhatsApp with one click
- **Gmail Integration** — opens a pre-filled Gmail compose window with 
  full booking details
- **User Authentication** — register and sign in with email/password or 
  social login (Google, Facebook), powered by JWT tokens
- **Responsive Burger Menu** — fully mobile-friendly with a smooth 
  slide-in navigation drawer
- **Admin Analytics** — tracks total users, login counts, bookings by 
  status, and user breakdown by role (stored in PostgreSQL)

## Tech Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts (Fraunces + Plus Jakarta Sans)
- No frameworks — pure hand-written code

**Backend**
- Node.js + Express.js
- PostgreSQL (via `pg` library)
- JWT Authentication (`jsonwebtoken` + `bcryptjs`)
- Nodemailer (Gmail confirmation emails)
- REST API

## Project Structure

\`\`\`
babysitter/
├── frontend/
│   └── index.html          # Full website — single file
└── backend/
    ├── server.js            # Express entry point
    ├── package.json
    ├── .env.example         # Environment variable template
    ├── db/
    │   ├── connection.js    # PostgreSQL pool
    │   └── setup.js         # Creates all database tables
    ├── middleware/
    │   └── auth.js          # JWT verification middleware
    └── routes/
        ├── auth.js          # Register, login, get profile
        ├── bookings.js      # Create bookings + send confirmation email
        ├── users.js         # Profile, my bookings, admin stats
        └── chat.js          # Save chatbot conversations
\`\`\`

## Getting Started

### 1. Clone the repo
\`\`\`bash
git clone https://github.com/YOUR-USERNAME/nomsas-babysitting.git
cd nomsas-babysitting
\`\`\`

### 2. Set up the backend
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Fill in your PostgreSQL URL, JWT secret, and Gmail app password
\`\`\`

### 3. Create the database tables
\`\`\`bash
node db/setup.js
\`\`\`

### 4. Start the server
\`\`\`bash
npm run dev
# API runs on http://localhost:5000
\`\`\`

### 5. Open the frontend
Open `frontend/index.html` in your browser using VS Code Live Server 
or any static file server.

> **Note:** The frontend works in demo mode even without the backend running. 
> WhatsApp and Gmail links will still open correctly.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Sign in and receive a JWT token |
| GET | `/api/auth/me` | Get current logged-in user |
| POST | `/api/bookings` | Submit a booking request |
| GET | `/api/bookings` | Get your own bookings |
| GET | `/api/bookings/all` | Get all bookings (admin only) |
| PATCH | `/api/bookings/:id` | Update booking status |
| GET | `/api/users/profile` | View your profile |
| PATCH | `/api/users/profile` | Update your profile |
| GET | `/api/users/stats` | Admin dashboard analytics |
| POST | `/api/chat/save` | Save a chatbot message |

## Deployment

- **Backend:** Deploy to [Railway](https://railway.app) or [Render](https://render.com)
- **Frontend:** Deploy to [Netlify](https://netlify.com) — just drag and drop the `frontend` folder
- **Database:** PostgreSQL on Railway (free tier available)

##  License

This project was built for personal use. Feel free to fork and adapt it 
for your own services website.

---

Built with ❤️ for families who need a helping hand.
```

---

**GitHub repository topics/tags to add** (under the repo name, click the ⚙️ gear next to "About"):
```
babysitting  nodejs  expressjs  postgresql  javascript  whatsapp  rest-api  fullstack  html-css  responsive

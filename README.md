# 🧠 Smriti-NER — AI Dementia Cognitive Care Platform

**SIH26003 | Smart India Hackathon 2026**

Smriti-NER (स्मृति NER) is a full-stack AI-enabled cognitive care platform addressing dementia and memory decline across the **North Eastern Region (NER) of India**. It runs as a Progressive Web App with offline-first edge synchronization — designed specifically for elderly patients in remote, low-connectivity areas like rural Assam, Manipur, and Meghalaya.

> **Live Demo (Local):** `http://localhost:3000`  
> **GitHub:** [https://github.com/Yogesh-OT/health_care](https://github.com/Yogesh-OT/health_care)

---

## 📸 Key Features

| Feature | Description |
|---|---|
| 🎮 **12 Cognitive Mini-Games** | Memory, Attention, Routine, Pattern Recognition — culturally contextualized for NER elders |
| 🤖 **AI Adaptive Difficulty Engine** | Auto-scales game difficulty based on real-time latency, accuracy, and motor stability |
| 🗣️ **Multilingual Voice Assistant** | English, Hindi, Assamese, Bengali, Bodo, Manipuri, Khasi with BCP-47 voice synthesis |
| 💊 **Smart Daily Living Reminders** | Medication, Hydration, Routine, and Appointment reminders per patient with SQLite persistence |
| 🩺 **Doctor Clinical Dashboard** | Real-time telemetry, MoCA proxy score, Cognitive Domain Performance Index, hesitation alerts |
| 📴 **Offline Edge Sync** | Batched telemetry queue with automatic sync when network restores |
| 🔐 **Gmail Authentication** | Patient account creation with Gmail + Password; Doctor access with secure PIN |
| ♿ **Elderly Ergonomics** | ≥64px hit targets, high-contrast mode, >36pt font support, voice readout of all content |

---

## 🏗️ Architecture Overview

```
sihsoftware/
├── backend/                 # Node.js + Express REST API
│   ├── server.js            # Main Express server (entry point)
│   ├── db/
│   │   └── database.js      # SQLite schema, seed data & async wrappers
│   ├── routes/
│   │   ├── authRoutes.js    # POST /api/auth/login|register, GET /me, POST /logout
│   │   ├── patientsRoutes.js # GET /api/patients, /api/patients/:id
│   │   ├── telemetryRoutes.js # GET|POST|DELETE /api/telemetry
│   │   ├── remindersRoutes.js # GET|PUT|POST /api/reminders/:patient_id
│   │   ├── messagesRoutes.js  # GET|POST /api/messages/:patient_id
│   │   └── syncRoutes.js    # POST /api/sync/edge (offline queue flush)
│   └── data/
│       └── smriti.db        # SQLite persistent database (auto-created)
│
├── frontend/                # Vanilla HTML + CSS + JavaScript SPA
│   ├── index.html           # Single-page application shell
│   ├── styles.css           # All styles (glassmorphism, dark mode, responsive)
│   └── app.js               # Full application logic (~4500 lines)
│
├── package.json             # Root project config (Vercel entry point)
├── vercel.json              # Vercel deployment routing configuration
├── .gitignore
├── test_fullstack.js        # Fullstack API integration test suite (20 tests)
└── test_verification.js     # SIH26003 platform specification test suite
```

### Backend Architecture

The backend is a **Node.js + Express 5** REST API server that:
- Serves the frontend as **static files** from `frontend/`
- Exposes a **REST API** at `/api/*`
- Persists data in **SQLite 3** (via `sqlite3` npm package)
- Uses async/await Promise wrappers (`db.runAsync`, `db.getAsync`, `db.allAsync`)
- Auto-initializes schema and seeds demo patients/doctor/telemetry/reminders on first run

```
Request → Express Router → Route Handler → SQLite DB → JSON Response
                         ↓
               Static Middleware → frontend/index.html (SPA fallback)
```

### Frontend Architecture

The frontend is a **Vanilla HTML + CSS + JavaScript** Single-Page Application (SPA):

```
index.html          → DOM shell, all views (auth, patient hub, doctor dashboard)
styles.css          → Design system, glassmorphism, dark mode, animations
app.js              → Application engine:
  ├── SMRITI_STATE  → Centralized in-memory reactive state
  ├── ApiClient     → REST API client (fetch, auth headers, offline detection)
  ├── AudioEngine   → WebAudio API synthesizer + SpeechSynthesis TTS
  ├── VoiceAssistant → SpeechRecognition NLP command interpreter
  ├── TelemetryEngine → Game telemetry, reminders, dashboard updates
  └── AuthController → Login, signup, session management
```

### Database Schema (SQLite)

```sql
users               -- Patients and Doctors (id, role, name, email, pin/password, ...)
sessions            -- Auth tokens (token, user_id, role, expires_at)
activities_telemetry -- Cognitive game logs (patient_id, game_id, accuracy_pct, latency_seconds, ...)
reminders           -- Daily living reminders (patient_id, type, title, is_completed, ...)
messages            -- Doctor-Patient messaging (patient_id, doctor_id, sender_role, message_text, ...)
edge_sync_log       -- Offline sync audit log (patient_id, records_synced, status)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Patient or Doctor login (Gmail/PIN + password) |
| `POST` | `/api/auth/register` | Register new patient or doctor (Gmail required) |
| `GET` | `/api/auth/me` | Verify session token, return profile |
| `POST` | `/api/auth/logout` | Invalidate session token |
| `GET` | `/api/patients` | List all registered patients |
| `GET` | `/api/patients/:id` | Patient details + telemetry summary stats |
| `GET` | `/api/telemetry?patient_id=&limit=` | Telemetry logs + MoCA proxy metrics |
| `POST` | `/api/telemetry` | Record new cognitive game session |
| `DELETE` | `/api/telemetry` | Reset telemetry records |
| `GET` | `/api/reminders/:patient_id` | Patient daily reminders map |
| `PUT` | `/api/reminders/:patient_id/:type` | Update reminder (mark taken, add water, etc.) |
| `POST` | `/api/reminders/:patient_id` | Create custom reminder (doctor prescription) |
| `GET` | `/api/messages/:patient_id` | Doctor-patient message history |
| `POST` | `/api/messages` | Send clinical note or patient reply |
| `POST` | `/api/sync/edge` | Flush offline telemetry queue to server |
| `GET` | `/api/health` | Health check endpoint |

---

## 🚀 Quick Start (Local)

### Prerequisites
- **Node.js** ≥ 18.0.0
- **npm** ≥ 8.x

### Installation

```bash
# Clone the repository
git clone https://github.com/Yogesh-OT/health_care.git
cd health_care

# Install dependencies
npm install

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

### Demo Credentials

| Role | Identifier | Password |
|------|-----------|----------|
| 👴 Patient (Bhaben Baruah) | `bhaben.baruah@gmail.com` or click ⚡ Instant Demo | `1234` |
| 👵 Patient (Hemaprabha Devi) | `hemaprabha.devi@gmail.com` | `1234` |
| 🩺 Doctor (Dr. Anamika Deka) | Click ⚡ Instant 1-Click Doctor Login | PIN: `1234` |

---

## ☁️ Deploy to Vercel

This project is fully configured for one-click Vercel deployment.

### Method 1: Vercel Dashboard (Recommended)

1. Push your code to GitHub: `https://github.com/Yogesh-OT/health_care`
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import from GitHub
3. Select the `health_care` repository
4. Vercel auto-detects `vercel.json` — no manual configuration needed
5. Click **Deploy**

### Method 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Important: SQLite on Vercel

> ⚠️ Vercel uses **ephemeral serverless functions** — the SQLite database on disk will **reset on each cold start**. For persistent data across requests, consider:
> - **Better SQLite3** with Vercel Edge Config for small datasets
> - **PlanetScale MySQL** or **Neon PostgreSQL** (free tiers available) for production persistence
> - **Railway** or **Render** hosting (supports persistent file storage and long-running servers) for a simpler migration

For SIH demo purposes, the database re-seeds with demo patients and telemetry on every cold start, so the demo always works.

### Environment Variables (Optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Set to `production` for Vercel |
| `PORT` | `3000` | Server port |
| `ALLOWED_ORIGINS` | `localhost:3000` | Comma-separated allowed CORS origins |

---

## 🧪 Testing

```bash
# Run fullstack API integration tests (20 tests)
npm test

# Run complete platform specification verification
node test_verification.js

# Run both
npm run test:all

# Test new authentication features (Gmail + password)
node C:\Users\syoge\.gemini\antigravity-ide\brain\...\scratch\test_new_features.js
```

### Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| `test_fullstack.js` | 20 / 20 | Server health, auth, Gmail validation, telemetry isolation, messaging, edge sync |
| `test_verification.js` | 100% | All SIH26003 specs: multilingual, voice, games, AI, reminders, doctor dashboard |

---

## 🎮 Cognitive Games Reference

| # | Game | Domain | Clinical Target |
|---|------|--------|----------------|
| 1 | Reminiscence Recall | Memory Improvement | Episodic recall, card matching |
| 2 | Morning Tea Sequencer | Daily Routine Recall | Procedural memory, sequencing |
| 3 | Weekly Market Explorer | Short-Term Recall | Working memory, 3-item basket |
| 4 | The Weaver's Shuttle | Pattern Recognition | Visuospatial tracing, motor |
| 5 | Sounds of the Hills | Acoustic Perception | Auditory discrimination |
| 6 | Classic Folk Sayings | Language Completion | Semantic memory, language |
| 7 | Two Leaves and a Bud | Attention & Focus | Selective attention, inhibition |
| 8 | Village Market Counter | Functional Numeracy | Numeric cognition, currency |
| 9 | Harvest Granary Sort | Executive Function | Categorical sorting |
| 10 | The Path Home | Spatial Navigation | Wayfinding, landmark memory |
| 11 | Kinship & Faces | Facial Recognition | Prosopagnosia screening |
| 12 | Natural Dye Shade Matching | Visual Discrimination | Color contrast, fine perception |

---

## 🌐 Language Support

| Language | Code | Voice BCP-47 |
|----------|------|-------------|
| English (NER Standard) | `en` | `en-IN` |
| Hindi (हिन्दी) | `hi` | `hi-IN` |
| Assamese (অসমীয়া) | `as` | `as-IN` |
| Bengali (বাংলা) | `bn` | `bn-IN` |
| Bodo (बड़ो) | `brx` | `brx-IN` |
| Manipuri (মৈতৈলোন্) | `mni` | `mni-IN` |
| Khasi | `kha` | `kha-IN` |

---

## 🩺 Cognitive Domain Performance Index

The Doctor Dashboard calculates 5 domain scores dynamically from actual patient telemetry:

| Domain | Games Used | Clinical Measure |
|--------|-----------|-----------------|
| Memory Improvement | Reminiscence, Market Explorer, Kinship | Episodic & semantic recall |
| Daily Routine Recall | Tea Sequencer, Granary Sort | Procedural memory, executive function |
| Pattern & Object Recognition | Weaver's Shuttle, Path Home | Visuospatial processing |
| Attention & Concentration | Two Leaves, Hill Sounds, Dye Matching | Selective & sustained attention |
| Functional Numeracy | Village Market Counter | Numeric cognition |

Scores update dynamically per-patient when the doctor switches between patient tabs.

---

## 📋 MoCA Proxy Score Formula

```
baseMoCA = (avgAccuracy / 100) × 28
penalty  = min(6, (totalHesitations / sessions) × 1.5)
MoCA     = clamp(round(baseMoCA - penalty + 2), 12, 30)
```

- 26–30: Normal
- 18–25: Mild Cognitive Impairment (MCI)
- 10–17: Moderate Dementia
- <10: Severe Dementia

---

## 🔒 Security Notes

- Passwords stored as plain text for demo purposes — replace with `bcrypt` hashing before production
- Sessions are JWT-free (`crypto.randomBytes(32)` tokens stored in SQLite with expiry)
- Gmail-only registration enforced for patients and doctors
- CORS configured to allow `.vercel.app` subdomains + configured origins

---

## 🤝 Team & Submission

- **Problem Statement:** SIH26003 — AI/ML Platform for Dementia Cognitive Care (NER)
- **Category:** MedTech / Cognitive Health
- **Target Users:** Elderly patients (65+), Neurologists, Caregivers in NER
- **Tech Stack:** Node.js 18, Express 5, SQLite 3, Vanilla JS, Web Audio API, SpeechSynthesis API

---

## 📜 License

MIT License © 2026 Smriti-NER Team

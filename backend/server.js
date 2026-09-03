const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { initDatabase } = require('./db/database');

const authRoutes = require('./routes/authRoutes');
const patientsRoutes = require('./routes/patientsRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const remindersRoutes = require('./routes/remindersRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const isProduction = process.env.NODE_ENV === 'production';

// CORS - allow same origin and configured origins for Vercel deployments
const corsOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (same-origin, Postman, curl)
    if (!origin) return cb(null, true);
    if (corsOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return cb(null, true);
    }
    return cb(null, true); // Permissive for SIH demo; tighten in production
  },
  credentials: true
}));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// HTTP Request Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Serve static frontend assets
app.use(express.static(FRONTEND_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/sync', syncRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smriti-NER Fullstack Engine (Modular Architecture)',
    database: 'SQLite 3 Persistent',
    frontend: 'Separated in /frontend',
    backend: 'Separated in /backend',
    timestamp: new Date().toISOString()
  });
});

// SPA Fallback for any non-API routes (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Start Server after database initialization
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[Smriti-NER] Backend Server listening at http://localhost:${PORT}`);
      console.log(`[Smriti-NER] Serving Frontend from: ${FRONTEND_DIR}`);
      console.log(`[Smriti-NER] Database initialized at backend/data/smriti.db`);
    });
  } catch (err) {
    console.error('[SERVER STARTUP ERROR]', err);
    process.exit(1);
  }
}

start();

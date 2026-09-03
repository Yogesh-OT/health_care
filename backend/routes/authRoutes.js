const express = require('express');
const crypto = require('crypto');
const { db } = require('../db/database');

const router = express.Router();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { role, identifier, pin } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required (patient or doctor).' });
    }

    if (role === 'doctor') {
      if (!identifier || !pin) {
        return res.status(400).json({ error: 'Email and 4-digit PIN are required for Doctor access.' });
      }

      // Check doctor credentials (or default demo credentials)
      let doc = await db.getAsync(
        'SELECT * FROM users WHERE role = "doctor" AND (email = ? OR id = ? OR phone = ?)',
        [identifier.trim().toLowerCase(), identifier.trim(), identifier.trim()]
      );

      // If demo doctor requested with pin 1234
      if (!doc && (identifier.includes('anamika') || identifier === 'doc_anamika' || identifier === 'doctor')) {
        doc = await db.getAsync('SELECT * FROM users WHERE id = "doc_anamika"');
      }

      if (!doc) {
        return res.status(401).json({ error: 'Doctor account not found with this email / ID.' });
      }

      if (doc.pin && doc.pin !== pin.trim()) {
        return res.status(401).json({ error: 'Invalid 4-digit security PIN.' });
      }

      // Create session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.runAsync(
        'INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)',
        [token, doc.id, 'doctor', expiresAt]
      );
      await db.runAsync('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [doc.id]);

      const { pin: _p, ...userProfile } = doc;
      return res.json({
        success: true,
        token,
        user: userProfile
      });

    } else {
      // Patient Login (via Gmail/Username & Password, or 1-tap quick demo)
      const queryId = identifier ? identifier.trim() : '';
      const inputPass = (req.body.password || req.body.pin || '').toString().trim();
      const isDemoAccess = req.body.isQuickDemo === true || (queryId === 'p1' && !inputPass);

      if (!queryId) {
        return res.status(400).json({ error: 'Please enter your Gmail address or Patient Name.' });
      }

      let patient = await db.getAsync(
        'SELECT * FROM users WHERE role = "patient" AND (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?) OR id = ? OR phone = ?)',
        [queryId, queryId, queryId, queryId]
      );

      // Fallback search if exact match not found
      if (!patient) {
        patient = await db.getAsync(
          'SELECT * FROM users WHERE role = "patient" AND (name LIKE ? OR email LIKE ?)',
          [`%${queryId}%`, `%${queryId}%`]
        );
      }

      if (!patient) {
        return res.status(404).json({ error: 'Patient account not found. Please check your Gmail or create an account.' });
      }

      // Verify password if provided or required
      if (inputPass) {
        if (patient.pin && patient.pin !== inputPass) {
          return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }
      } else if (!isDemoAccess && patient.pin && patient.id !== 'p1' && queryId.includes('@')) {
        return res.status(400).json({ error: 'Please enter your account password.' });
      }

      // Create session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await db.runAsync(
        'INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)',
        [token, patient.id, 'patient', expiresAt]
      );
      await db.runAsync('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [patient.id]);

      const { pin: _p, ...userProfile } = patient;
      return res.json({
        success: true,
        token,
        user: userProfile
      });
    }

  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

function isValidGmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  return regex.test(email.trim());
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      role, name, phone, email, pin, age, location, avatar, protocol,
      specialty, reg_no, clinic, caretaker_name, caretaker_phone, caregiver_phone
    } = req.body;

    if (!role || !name) {
      return res.status(400).json({ error: 'Role and Full Name are required.' });
    }

    const id = (role === 'doctor' ? 'doc_' : 'pat_') + Date.now();

    if (role === 'doctor') {
      if (!email || !pin) {
        return res.status(400).json({ error: 'Email and 4-digit security PIN are required for Doctor registration.' });
      }

      if (!isValidGmail(email)) {
        return res.status(400).json({ error: 'Doctor registration requires a valid Gmail address ending in @gmail.com' });
      }

      // Check email uniqueness
      const existing = await db.getAsync('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      await db.runAsync(`
        INSERT INTO users (id, role, name, email, phone, pin, specialty, reg_no, clinic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        'doctor',
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        pin.trim(),
        specialty ? specialty.trim() : 'Geriatric Neurologist',
        reg_no ? reg_no.trim() : 'REG-' + Math.floor(10000 + Math.random() * 90000),
        clinic ? clinic.trim() : 'District Hospital'
      ]);

    } else {
      // Patient Registration - Enforce Gmail validation & duplicate email check
      if (!email || !isValidGmail(email)) {
        return res.status(400).json({ error: 'Patient / Caregiver registration requires a valid Gmail address ending in @gmail.com' });
      }

      const existingPatient = await db.getAsync('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
      if (existingPatient) {
        return res.status(409).json({ error: 'An account with this Gmail address already exists. Please Sign In.' });
      }

      const userPassword = (req.body.password || req.body.pin || '').toString().trim();
      const ctPhone = (caretaker_phone || caregiver_phone || phone || '').toString().trim();
      const ctName = (caretaker_name || 'Family Caregiver').toString().trim();

      await db.runAsync(`
        INSERT INTO users (id, role, name, email, phone, pin, age, location, avatar, protocol, caretaker_name, caretaker_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        'patient',
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        userPassword || null,
        age ? parseInt(age, 10) : 70,
        location ? location.trim() : 'Assam, NER',
        avatar || '👴',
        protocol ? protocol.trim() : 'Reminiscence & Mild Memory Stimulation',
        ctName,
        ctPhone || '+91 98640 55443'
      ]);

      // Seed default smart reminders for newly registered patient
      await db.runAsync(`
        INSERT INTO reminders (patient_id, reminder_type, title, sub_info, target_count, current_count, is_completed, scheduled_time)
        VALUES
          (?, 'medication', 'Daily Prescription Booster', 'Take 1 tablet with fresh water after breakfast', 1, 0, 0, '09:00 AM'),
          (?, 'hydration', 'Drink Warm Spring Water', 'Target 8 glasses of pure natural water daily', 8, 0, 0, 'Throughout Day'),
          (?, 'routine', 'Morning Sunlight Walk (15 Mins)', 'Gentle breathing in fresh air to stimulate motor vitality', 1, 0, 0, '07:30 AM'),
          (?, 'appointment', 'Clinical Assessment Visit', 'Monthly cognitive review with doctor', 1, 0, 0, 'Friday 10:30 AM')
      `, [id, id, id, id]);
    }

    const newUser = await db.getAsync('SELECT * FROM users WHERE id = ?', [id]);
    const { pin: _p, ...userProfile } = newUser;

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.runAsync(
      'INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)',
      [token, id, role, expiresAt]
    );

    res.status(201).json({
      success: true,
      token,
      user: userProfile
    });

  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    res.status(500).json({ error: 'Internal server error creating account.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : req.query.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required.' });
    }

    const session = await db.getAsync(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP',
      [token]
    );

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [session.user_id]);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { pin: _p, ...userProfile } = user;
    res.json({
      success: true,
      user: userProfile
    });

  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    res.status(500).json({ error: 'Failed to verify session.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '').trim() : req.body.token;

    if (token) {
      await db.runAsync('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log out.' });
  }
});

module.exports = router;

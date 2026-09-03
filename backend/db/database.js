const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'smriti.db');
const db = new sqlite3.Database(DB_PATH);

// Promise wrappers for async/await
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema and seed data
async function initDatabase() {
  // 1. Users Table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'caregiver')),
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      pin TEXT,
      age INTEGER,
      location TEXT,
      avatar TEXT,
      protocol TEXT,
      specialty TEXT,
      reg_no TEXT,
      clinic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `);

  // 2. Sessions Table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 3. Cognitive Activities Telemetry Table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS activities_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      game_name TEXT NOT NULL,
      cognitive_domain TEXT NOT NULL,
      score INTEGER NOT NULL,
      latency_seconds REAL NOT NULL,
      accuracy_pct INTEGER NOT NULL,
      hesitation_count INTEGER DEFAULT 0,
      hints_used INTEGER DEFAULT 0,
      ai_tier INTEGER NOT NULL,
      clinical_flag TEXT DEFAULT 'Optimal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. Reminders Table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('medication', 'hydration', 'routine', 'appointment')),
      title TEXT NOT NULL,
      sub_info TEXT,
      target_count INTEGER DEFAULT 1,
      current_count INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      scheduled_time TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 5. Messages Table (Doctor <-> Patient communication)
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('doctor', 'patient')),
      sender_name TEXT NOT NULL,
      message_text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 6. Edge Sync Log Table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS edge_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      records_synced INTEGER NOT NULL,
      status TEXT DEFAULT 'SUCCESS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default users if empty
  const userCount = await db.getAsync('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('[DB] Seeding default clinical users and telemetry...');

    // Patient 1
    await db.runAsync(`
      INSERT INTO users (id, role, name, email, phone, pin, age, location, avatar, protocol)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['p1', 'patient', 'Bhaben Baruah', 'bhaben.baruah@gmail.com', '+91 98640 11223', '1234', 72, 'Guwahati, Kamrup', '👴', 'Reminiscence & Mild Memory Stimulation']);

    // Patient 2
    await db.runAsync(`
      INSERT INTO users (id, role, name, email, phone, pin, age, location, avatar, protocol)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['p2', 'patient', 'Hemaprabha Devi', 'hemaprabha.devi@gmail.com', '+91 94350 44556', '1234', 68, 'Tezpur, Sonitpur', '👵', 'Daily Procedural Routine & Music Focus']);

    // Doctor 1
    await db.runAsync(`
      INSERT INTO users (id, role, name, email, phone, pin, specialty, reg_no, clinic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'doc_anamika',
      'doctor',
      'Dr. Anamika Deka',
      'anamika.deka@sih.gov.in',
      '+91 98641 99887',
      '1234',
      'Neuro-Geriatric Medicine',
      'NMC-NER-48291',
      'Guwahati Neurological Care Centre'
    ]);

    // Seed default reminders for Patient 1
    await db.runAsync(`
      INSERT INTO reminders (patient_id, reminder_type, title, sub_info, target_count, current_count, is_completed, scheduled_time)
      VALUES
        ('p1', 'medication', 'Morning Cognitive Booster (Donepezil 5mg)', 'Take 1 tablet with fresh water after breakfast', 1, 0, 0, '09:00 AM'),
        ('p1', 'hydration', 'Drink Warm Spring Water', 'Target 8 glasses of pure natural water daily', 8, 3, 0, 'Throughout Day'),
        ('p1', 'routine', 'Morning Garden Walk (15 Mins)', 'Gentle breathing in fresh air to stimulate motor vitality', 1, 0, 0, '07:30 AM'),
        ('p1', 'appointment', 'Dr. Anamika Deka (Friday, 10:30 AM)', 'Monthly cognitive review & telemetry assessment', 1, 0, 0, 'Friday 10:30 AM')
    `);

    // Seed default reminders for Patient 2
    await db.runAsync(`
      INSERT INTO reminders (patient_id, reminder_type, title, sub_info, target_count, current_count, is_completed, scheduled_time)
      VALUES
        ('p2', 'medication', 'Evening Memantine (10mg)', 'Take with evening tea or warm milk', 1, 0, 0, '06:00 PM'),
        ('p2', 'hydration', 'Drink Warm Spring Water', 'Target 8 glasses of pure natural water daily', 8, 4, 0, 'Throughout Day'),
        ('p2', 'routine', 'Evening Folk Music Therapy', 'Listen to calming flute or Bihu melodies', 1, 1, 1, '05:00 PM'),
        ('p2', 'appointment', 'District Clinic Follow-up', 'Cognitive telemetry checkup at Tezpur Medical College', 1, 0, 0, 'Next Monday')
    `);

    // Seed historical telemetry for Patient 1
    const initialTelemetry = [
      ['p1', 'reminiscence', '1. Reminiscence Recall', 'Memory Improvement', 100, 3.8, 92, 1, 0, 1, 'Optimal'],
      ['p1', 'tea_sequencer', '2. Morning Tea Sequencer', 'Daily Routine Recall', 85, 4.4, 88, 2, 1, 1, 'Optimal'],
      ['p1', 'haat_explorer', '3. Weekly Market Explorer', 'Short-Term Recall', 90, 5.1, 85, 2, 0, 1, 'Optimal'],
      ['p1', 'hill_sounds', '5. Echoes of the Living Hills', 'Acoustic Perception', 95, 2.9, 95, 0, 0, 2, 'Optimal'],
      ['p1', 'weaver_shuttle', "4. The Weaver's Shuttle", 'Pattern Recognition', 80, 6.2, 80, 3, 1, 1, 'High Latency']
    ];

    for (const t of initialTelemetry) {
      await db.runAsync(`
        INSERT INTO activities_telemetry 
        (patient_id, game_id, game_name, cognitive_domain, score, latency_seconds, accuracy_pct, hesitation_count, hints_used, ai_tier, clinical_flag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, t);
    }

    // Seed initial message
    await db.runAsync(`
      INSERT INTO messages (patient_id, doctor_id, sender_role, sender_name, message_text)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'p1',
      'doc_anamika',
      'doctor',
      'Dr. Anamika Deka',
      'Bhaben-da, your focus on the morning recall activities was excellent yesterday. Please make sure to drink at least 6 glasses of warm water and enjoy your morning garden stroll.'
    ]);

    console.log('[DB] Database successfully initialized and seeded!');
  }

  // Ensure existing p1 and p2 have default email and pin set
  try {
    await db.runAsync(`
      UPDATE users SET 
        email = COALESCE(email, 'bhaben.baruah@gmail.com'),
        pin = COALESCE(pin, '1234')
      WHERE id = 'p1'
    `);
    await db.runAsync(`
      UPDATE users SET 
        email = COALESCE(email, 'hemaprabha.devi@gmail.com'),
        pin = COALESCE(pin, '1234')
      WHERE id = 'p2'
    `);
  } catch (e) {
    console.warn('[DB] User migration notice:', e.message);
  }
}

module.exports = {
  db,
  initDatabase
};

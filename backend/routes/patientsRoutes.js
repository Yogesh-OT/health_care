const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// GET /api/patients - List all registered patients
router.get('/', async (req, res) => {
  try {
    const patients = await db.allAsync(`
      SELECT id, name, phone, age, location, avatar, protocol, created_at, last_login_at
      FROM users
      WHERE role = 'patient'
      ORDER BY name ASC
    `);
    res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    console.error('[PATIENTS LIST ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve patients list.' });
  }
});

// GET /api/patients/:id - Get specific patient details with summary stats
router.get('/:id', async (req, res) => {
  try {
    const patient = await db.getAsync(
      'SELECT id, name, phone, age, location, avatar, protocol, created_at, last_login_at FROM users WHERE id = ? AND role = "patient"',
      [req.params.id]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Telemetry summary
    const telemetryStats = await db.getAsync(`
      SELECT 
        COUNT(*) as total_activities,
        AVG(score) as avg_score,
        AVG(latency_seconds) as avg_latency,
        AVG(accuracy_pct) as avg_accuracy,
        SUM(hesitation_count) as total_hesitations
      FROM activities_telemetry
      WHERE patient_id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      data: {
        ...patient,
        stats: {
          total_activities: telemetryStats.total_activities || 0,
          avg_score: Math.round(telemetryStats.avg_score || 0),
          avg_latency: (telemetryStats.avg_latency || 0).toFixed(1),
          avg_accuracy: Math.round(telemetryStats.avg_accuracy || 0),
          total_hesitations: telemetryStats.total_hesitations || 0
        }
      }
    });

  } catch (err) {
    console.error('[PATIENT DETAIL ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch patient details.' });
  }
});

module.exports = router;

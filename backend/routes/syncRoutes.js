const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// POST /api/sync/edge - Batch sync telemetry & reminders from local edge storage
router.post('/edge', async (req, res) => {
  try {
    const { patient_id, telemetry_records = [], reminders_state = null } = req.body;

    let syncedCount = 0;

    if (Array.isArray(telemetry_records) && telemetry_records.length > 0) {
      for (const rec of telemetry_records) {
        if (!rec.game_id) continue;
        await db.runAsync(`
          INSERT INTO activities_telemetry 
          (patient_id, game_id, game_name, cognitive_domain, score, latency_seconds, accuracy_pct, hesitation_count, hints_used, ai_tier, clinical_flag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patient_id || rec.patient_id || 'p1',
          rec.game_id,
          rec.game_name || rec.game_id,
          rec.cognitive_domain || 'Memory Improvement',
          parseInt(rec.score, 10) || 100,
          parseFloat(rec.latency_seconds) || 3.5,
          parseInt(rec.accuracy_pct, 10) || 90,
          parseInt(rec.hesitation_count, 10) || 0,
          parseInt(rec.hints_used, 10) || 0,
          parseInt(rec.ai_tier, 10) || 1,
          rec.clinical_flag || 'Synced from Edge'
        ]);
        syncedCount++;
      }
    }

    // Log edge sync event
    await db.runAsync(`
      INSERT INTO edge_sync_log (patient_id, records_synced, status)
      VALUES (?, ?, 'SUCCESS')
    `, [patient_id || 'p1', syncedCount]);

    res.json({
      success: true,
      records_synced: syncedCount,
      timestamp: new Date().toISOString(),
      district_emr_status: 'SYNCHRONIZED',
      message: `Successfully flushed and synchronized ${syncedCount} offline record(s) to Central Health Database.`
    });

  } catch (err) {
    console.error('[EDGE SYNC ERROR]', err);
    res.status(500).json({ error: 'Failed to synchronize edge telemetry.' });
  }
});

module.exports = router;

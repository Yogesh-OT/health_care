const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// GET /api/telemetry - Retrieve telemetry logs (optionally filtered by patient_id)
router.get('/', async (req, res) => {
  try {
    const { patient_id, limit = 50 } = req.query;

    let query = `
      SELECT t.*, u.name as patient_name
      FROM activities_telemetry t
      LEFT JOIN users u ON t.patient_id = u.id
    `;
    const params = [];

    if (patient_id) {
      query += ' WHERE t.patient_id = ?';
      params.push(patient_id);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const records = await db.allAsync(query, params);

    // Compute Clinical Summary & MoCA Proxy
    let mocaProxy = 26; // baseline default
    let hesitationIndex = 'Low (Normal)';
    let avgLatency = 3.5;
    let avgAccuracy = 88;

    if (records.length > 0) {
      const totalAcc = records.reduce((acc, r) => acc + r.accuracy_pct, 0);
      const totalLat = records.reduce((acc, r) => acc + r.latency_seconds, 0);
      const totalHes = records.reduce((acc, r) => acc + (r.hesitation_count || 0), 0);

      avgAccuracy = Math.round(totalAcc / records.length);
      avgLatency = parseFloat((totalLat / records.length).toFixed(1));

      // MoCA Proxy formula: scales based on accuracy, domain diversity, and hesitation penalties
      // MoCA is scored out of 30
      const baseMoca = (avgAccuracy / 100) * 28;
      const penalty = Math.min(6, (totalHes / records.length) * 1.5);
      mocaProxy = Math.min(30, Math.max(12, Math.round(baseMoca - penalty + 2)));

      if (avgLatency > 7.0 || totalHes > records.length * 2) {
        hesitationIndex = 'High (Disorientation Alert)';
      } else if (avgLatency > 4.5 || totalHes > records.length) {
        hesitationIndex = 'Moderate';
      } else {
        hesitationIndex = 'Low (Normal)';
      }
    }

    res.json({
      success: true,
      count: records.length,
      metrics: {
        moca_proxy: mocaProxy,
        hesitation_index: hesitationIndex,
        avg_latency: avgLatency,
        avg_accuracy: avgAccuracy,
        total_sessions: records.length
      },
      data: records
    });

  } catch (err) {
    console.error('[TELEMETRY GET ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve telemetry records.' });
  }
});

// POST /api/telemetry - Record gameplay telemetry from patient
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      game_id,
      game_name,
      cognitive_domain,
      score,
      latency_seconds,
      accuracy_pct,
      hesitation_count = 0,
      hints_used = 0,
      ai_tier = 1,
      clinical_flag
    } = req.body;

    if (!patient_id || !game_id) {
      return res.status(400).json({ error: 'patient_id and game_id are required.' });
    }

    // Determine clinical flag
    let flag = clinical_flag;
    if (!flag) {
      if (latency_seconds > 8.0 || hesitation_count >= 3) {
        flag = 'Attention Lapses / Hesitation';
      } else if (accuracy_pct < 60) {
        flag = 'Mild Recall Difficulty';
      } else {
        flag = 'Optimal Stability';
      }
    }

    const result = await db.runAsync(`
      INSERT INTO activities_telemetry 
      (patient_id, game_id, game_name, cognitive_domain, score, latency_seconds, accuracy_pct, hesitation_count, hints_used, ai_tier, clinical_flag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      patient_id,
      game_id,
      game_name || game_id,
      cognitive_domain || 'Memory Improvement',
      parseInt(score, 10) || 100,
      parseFloat(latency_seconds) || 3.2,
      parseInt(accuracy_pct, 10) || 90,
      parseInt(hesitation_count, 10) || 0,
      parseInt(hints_used, 10) || 0,
      parseInt(ai_tier, 10) || 1,
      flag
    ]);

    const createdRecord = await db.getAsync('SELECT * FROM activities_telemetry WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      data: createdRecord
    });

  } catch (err) {
    console.error('[TELEMETRY POST ERROR]', err);
    res.status(500).json({ error: 'Failed to record telemetry session.' });
  }
});

// DELETE /api/telemetry - Reset/clear telemetry for a patient or all
router.delete('/', async (req, res) => {
  try {
    const { patient_id } = req.query;
    if (patient_id) {
      await db.runAsync('DELETE FROM activities_telemetry WHERE patient_id = ?', [patient_id]);
    } else {
      await db.runAsync('DELETE FROM activities_telemetry');
    }
    res.json({ success: true, message: 'Telemetry records reset successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset telemetry records.' });
  }
});

module.exports = router;

const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// GET /api/messages/:patient_id - Get all messages for patient
router.get('/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const messages = await db.allAsync(
      'SELECT * FROM messages WHERE patient_id = ? ORDER BY created_at ASC',
      [patient_id]
    );

    // Get latest doctor guidance message
    const latestDoctorMsg = await db.getAsync(
      'SELECT * FROM messages WHERE patient_id = ? AND sender_role = "doctor" ORDER BY created_at DESC LIMIT 1',
      [patient_id]
    );

    res.json({
      success: true,
      patient_id,
      count: messages.length,
      latestDoctorAdvice: latestDoctorMsg ? latestDoctorMsg.message_text : null,
      data: messages
    });

  } catch (err) {
    console.error('[MESSAGES GET ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// POST /api/messages - Send clinical advice (Doctor) or quick reply (Patient)
router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, sender_role, sender_name, message_text } = req.body;

    if (!patient_id || !sender_role || !message_text) {
      return res.status(400).json({ error: 'patient_id, sender_role, and message_text are required.' });
    }

    const role = sender_role === 'doctor' ? 'doctor' : 'patient';
    let name = sender_name;

    if (!name) {
      if (role === 'doctor') {
        const doc = await db.getAsync('SELECT name FROM users WHERE id = ?', [doctor_id || 'doc_anamika']);
        name = doc ? doc.name : 'Dr. Anamika Deka';
      } else {
        const pat = await db.getAsync('SELECT name FROM users WHERE id = ?', [patient_id]);
        name = pat ? pat.name : 'Patient';
      }
    }

    const result = await db.runAsync(`
      INSERT INTO messages (patient_id, doctor_id, sender_role, sender_name, message_text)
      VALUES (?, ?, ?, ?, ?)
    `, [
      patient_id,
      doctor_id || (role === 'doctor' ? 'doc_anamika' : null),
      role,
      name,
      message_text.trim()
    ]);

    const created = await db.getAsync('SELECT * FROM messages WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      data: created
    });

  } catch (err) {
    console.error('[MESSAGES POST ERROR]', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;

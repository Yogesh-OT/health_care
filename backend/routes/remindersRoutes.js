const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// GET /api/reminders/:patient_id - Get all reminders for patient
router.get('/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    let reminders = await db.allAsync(
      'SELECT * FROM reminders WHERE patient_id = ? ORDER BY id ASC',
      [patient_id]
    );

    // If no reminders found, seed default for this patient
    if (reminders.length === 0) {
      await db.runAsync(`
        INSERT INTO reminders (patient_id, reminder_type, title, sub_info, target_count, current_count, is_completed, scheduled_time)
        VALUES
          (?, 'medication', 'Morning Cognitive Booster (Donepezil 5mg)', 'Take 1 tablet with fresh water after breakfast', 1, 0, 0, '09:00 AM'),
          (?, 'hydration', 'Drink Warm Spring Water', 'Target 8 glasses of pure natural water daily', 8, 2, 0, 'Throughout Day'),
          (?, 'routine', 'Morning Garden Walk (15 Mins)', 'Gentle breathing in fresh air to stimulate motor vitality', 1, 0, 0, '07:30 AM'),
          (?, 'appointment', 'Dr. Anamika Deka (Friday, 10:30 AM)', 'Monthly cognitive review & telemetry assessment', 1, 0, 0, 'Friday 10:30 AM')
      `, [patient_id, patient_id, patient_id, patient_id]);

      reminders = await db.allAsync(
        'SELECT * FROM reminders WHERE patient_id = ? ORDER BY id ASC',
        [patient_id]
      );
    }

    // Structure into convenient key-value map for frontend
    const map = {};
    reminders.forEach(r => {
      map[r.reminder_type] = {
        id: r.id,
        title: r.title,
        sub: r.sub_info,
        target: r.target_count,
        current: r.current_count,
        isCompleted: Boolean(r.is_completed),
        scheduledTime: r.scheduled_time,
        updatedAt: r.updated_at
      };
    });

    res.json({
      success: true,
      patient_id,
      data: map,
      raw: reminders
    });

  } catch (err) {
    console.error('[REMINDERS GET ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch patient reminders.' });
  }
});

// PUT /api/reminders/:patient_id/:type - Update reminder state (e.g. taken, +1 water)
router.put('/:patient_id/:type', async (req, res) => {
  try {
    const { patient_id, type } = req.params;
    const { is_completed, current_count, action } = req.body;

    const reminder = await db.getAsync(
      'SELECT * FROM reminders WHERE patient_id = ? AND reminder_type = ?',
      [patient_id, type]
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found for this patient and type.' });
    }

    let updatedCompleted = reminder.is_completed;
    let updatedCount = reminder.current_count;

    if (action === 'add_water') {
      updatedCount = Math.min(reminder.target_count || 8, (reminder.current_count || 0) + 1);
      if (updatedCount >= reminder.target_count) {
        updatedCompleted = 1;
      }
    } else if (action === 'mark_taken' || is_completed === true || is_completed === 1) {
      updatedCompleted = 1;
      updatedCount = reminder.target_count;
    } else if (is_completed === false || is_completed === 0) {
      updatedCompleted = 0;
    }

    if (typeof current_count === 'number') {
      updatedCount = current_count;
    }

    await db.runAsync(`
      UPDATE reminders 
      SET is_completed = ?, current_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [updatedCompleted, updatedCount, reminder.id]);

    const updated = await db.getAsync('SELECT * FROM reminders WHERE id = ?', [reminder.id]);

    res.json({
      success: true,
      data: {
        id: updated.id,
        reminder_type: updated.reminder_type,
        title: updated.title,
        sub: updated.sub_info,
        target: updated.target_count,
        current: updated.current_count,
        isCompleted: Boolean(updated.is_completed),
        scheduledTime: updated.scheduled_time
      }
    });

  } catch (err) {
    console.error('[REMINDER UPDATE ERROR]', err);
    res.status(500).json({ error: 'Failed to update reminder.' });
  }
});

// POST /api/reminders/:patient_id - Doctor sets custom reminders
router.post('/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { reminder_type, title, sub_info, target_count, scheduled_time } = req.body;

    if (!reminder_type || !title) {
      return res.status(400).json({ error: 'reminder_type and title are required.' });
    }

    await db.runAsync(`
      INSERT INTO reminders (patient_id, reminder_type, title, sub_info, target_count, scheduled_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      patient_id,
      reminder_type,
      title.trim(),
      sub_info ? sub_info.trim() : '',
      parseInt(target_count, 10) || 1,
      scheduled_time ? scheduled_time.trim() : '09:00 AM'
    ]);

    res.status(201).json({ success: true, message: 'Custom reminder created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reminder.' });
  }
});

module.exports = router;

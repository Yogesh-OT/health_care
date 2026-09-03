const express = require('express');
const https = require('https');
const { db } = require('../db/database');

const router = express.Router();

/**
 * Clean phone number to digits only, adding 91 prefix if 10-digit Indian mobile
 */
function formatIndianPhone(rawPhone) {
  if (!rawPhone) return '919864055443';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits || '919864055443';
}

/**
 * Optional MSG91 Dispatcher (only triggers if MSG91_AUTH_KEY env var is present)
 */
function sendMsg91Sms(authKey, senderId, mobile, message) {
  return new Promise((resolve) => {
    if (!authKey) return resolve({ skipped: true, reason: 'No MSG91_AUTH_KEY provided' });

    try {
      const payload = JSON.stringify({
        sender: senderId || 'SMRITI',
        route: '4',
        country: '91',
        sms: [
          {
            message: message,
            to: [mobile.replace(/^91/, '')]
          }
        ]
      });

      const options = {
        hostname: 'api.msg91.com',
        path: '/api/v2/sendsms',
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, response: data });
        });
      });

      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
      req.write(payload);
      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

// POST /api/emergency/send - Trigger an emergency alert to registered caretaker
router.post('/send', async (req, res) => {
  try {
    const { patient_id, emergency_note } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }

    // Fetch patient details
    const patient = await db.getAsync(
      'SELECT id, name, age, location, caretaker_name, caretaker_phone, phone FROM users WHERE id = ?',
      [patient_id]
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patientName = patient.name || 'Elderly Patient';
    const caretakerName = patient.caretaker_name || 'Primary Caregiver';
    const rawPhone = patient.caretaker_phone || patient.phone || '+91 98640 55443';
    const intlPhone = formatIndianPhone(rawPhone);
    const localPhone = rawPhone;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const messageText = `🚨 SMRITI URGENT HEALTH ALERT: Patient ${patientName} (${patient.age || 70} yrs, ${patient.location || 'Assam'}) needs assistance! Caregiver: ${caretakerName}. Note: ${emergency_note || 'Emergency SOS triggered on cognitive care tablet'}. Time: ${timeStr}, ${dateStr}. Please attend or call immediately.`;

    // 1. Persist alert in database for clinical audit & doctor dashboard
    const insertResult = await db.runAsync(`
      INSERT INTO emergency_alerts (patient_id, patient_name, caretaker_name, caretaker_phone, alert_type, message, status)
      VALUES (?, ?, ?, ?, 'EMERGENCY_SOS', ?, 'DISPATCHED')
    `, [patient.id, patientName, caretakerName, localPhone, messageText]);

    // 2. Generate direct WhatsApp and SMS deep-links for immediate 1-tap real dispatch
    const encodedMsg = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${intlPhone}?text=${encodedMsg}`;
    const smsUrl = `sms:${intlPhone}?body=${encodedMsg}`;
    const callUrl = `tel:${localPhone.replace(/\s+/g, '')}`;

    // 3. Optional background MSG91 SMS dispatch (if user has set key)
    const msg91Key = process.env.MSG91_AUTH_KEY;
    const msg91Sender = process.env.MSG91_SENDER_ID || 'SMRITI';
    let msg91Result = { skipped: true };
    if (msg91Key) {
      msg91Result = await sendMsg91Sms(msg91Key, msg91Sender, intlPhone, messageText);
    }

    res.json({
      success: true,
      alert_id: insertResult.lastID,
      patient_id: patient.id,
      patient_name: patientName,
      caretaker_name: caretakerName,
      caretaker_phone: localPhone,
      intl_phone: intlPhone,
      message: messageText,
      whatsapp_url: whatsappUrl,
      sms_url: smsUrl,
      call_url: callUrl,
      msg91_dispatched: msg91Result.ok === true,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[EMERGENCY SEND ERROR]', err);
    res.status(500).json({ error: 'Failed to dispatch emergency alert' });
  }
});

// GET /api/emergency/log - Doctor view: all recent emergency alerts
router.get('/log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const alerts = await db.allAsync(`
      SELECT e.*, u.location, u.avatar
      FROM emergency_alerts e
      LEFT JOIN users u ON e.patient_id = u.id
      ORDER BY e.created_at DESC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    console.error('[EMERGENCY LOG ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve emergency logs' });
  }
});

// GET /api/emergency/patient/:patient_id - Patient's own alerts history
router.get('/patient/:patient_id', async (req, res) => {
  try {
    const alerts = await db.allAsync(`
      SELECT * FROM emergency_alerts
      WHERE patient_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [req.params.patient_id]);

    res.json({
      success: true,
      data: alerts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve patient alerts' });
  }
});

// POST /api/emergency/acknowledge/:id - Mark alert as acknowledged/resolved
router.post('/acknowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.runAsync(
      "UPDATE emergency_alerts SET status = 'ACKNOWLEDGED' WHERE id = ?",
      [id]
    );
    res.json({ success: true, message: 'Emergency alert acknowledged.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

module.exports = router;

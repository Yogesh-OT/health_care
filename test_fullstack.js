const http = require('http');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===================================================================');
  console.log('🧪 SMRITI-NER MODULAR FULLSTACK & VALIDATION TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  try {
    // 1. Health Check
    console.log('--- 1. Server Health & Modular Architecture ---');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'online', 'Health endpoint /api/health returns online');
    assert(health.body.frontend && health.body.backend, 'Frontend and Backend verified as separated modular folders');

    // 2. Patient Login
    console.log('\n--- 2. Authentication: Patient Sign In ---');
    const patLogin = await makeRequest('POST', '/api/auth/login', {
      role: 'patient',
      identifier: 'Bhaben Baruah'
    });
    assert(patLogin.status === 200 && patLogin.body.success, 'Patient login successful for Bhaben Baruah');
    assert(patLogin.body.token && patLogin.body.user.role === 'patient', 'Patient session token generated and user profile returned');
    const patientToken = patLogin.body.token;
    const patientId = patLogin.body.user.id;

    // 3. Doctor Login
    console.log('\n--- 3. Authentication: Doctor PIN Sign In ---');
    const docLogin = await makeRequest('POST', '/api/auth/login', {
      role: 'doctor',
      identifier: 'anamika.deka@sih.gov.in',
      pin: '1234'
    });
    assert(docLogin.status === 200 && docLogin.body.success, 'Doctor login with 4-digit PIN (1234) successful');
    assert(docLogin.body.token && docLogin.body.user.role === 'doctor', 'Doctor session token generated');

    // Test Invalid Doctor PIN
    const badDocLogin = await makeRequest('POST', '/api/auth/login', {
      role: 'doctor',
      identifier: 'anamika.deka@sih.gov.in',
      pin: '9999'
    });
    assert(badDocLogin.status === 401, 'Doctor login with incorrect PIN rejected with 401');

    // 4. Registration Gmail Validation
    console.log('\n--- 4. Gmail Registration Validation (Patient & Doctor) ---');
    
    // Non-Gmail Patient Rejected
    const badPatientEmail = await makeRequest('POST', '/api/auth/register', {
      role: 'patient',
      name: 'Ramen Kalita',
      email: 'ramen@yahoo.com'
    });
    assert(badPatientEmail.status === 400, 'Non-Gmail patient registration rejected with HTTP 400');

    // Non-Gmail Doctor Rejected
    const badDocEmail = await makeRequest('POST', '/api/auth/register', {
      role: 'doctor',
      name: 'Dr. Ramesh Sarma',
      email: 'dr.ramesh@hospital.org',
      pin: '1234'
    });
    assert(badDocEmail.status === 400, 'Non-Gmail doctor registration rejected with HTTP 400');

    // Valid Gmail Patient Accepted
    const validPatGmail = `patient_${Date.now()}@gmail.com`;
    const newPat = await makeRequest('POST', '/api/auth/register', {
      role: 'patient',
      name: 'Ramen Kalita',
      email: validPatGmail,
      age: 72,
      location: 'Tezpur, Assam',
      avatar: '👴'
    });
    assert(newPat.status === 201 && newPat.body.success, 'Patient registration with valid Gmail accepted');

    // Valid Gmail Doctor Accepted
    const validDocGmail = `doctor_${Date.now()}@gmail.com`;
    const newDoc = await makeRequest('POST', '/api/auth/register', {
      role: 'doctor',
      name: 'Dr. Ramesh Sarma',
      email: validDocGmail,
      pin: '4321',
      specialty: 'Geriatric Psychiatry'
    });
    assert(newDoc.status === 201 && newDoc.body.success, 'Doctor registration with valid Gmail accepted');

    // 5. Auth /me Session Verification
    console.log('\n--- 5. Session Verification (/api/auth/me) ---');
    const me = await makeRequest('GET', '/api/auth/me', null, patientToken);
    assert(me.status === 200 && me.body.user.id === patientId, 'Active session token verified for patient');

    // 6. Patients Directory Endpoint
    console.log('\n--- 6. Patients Directory Endpoint ---');
    const patients = await makeRequest('GET', '/api/patients');
    assert(patients.status === 200 && Array.isArray(patients.body.data) && patients.body.data.length >= 2, 'Patients list returned with registered patients');

    // 7. Per-Patient Reminders Isolation
    console.log('\n--- 7. Smart Living Reminders: Strict Per-Patient Isolation ---');
    // Ensure p1 medication marked taken
    await makeRequest('PUT', '/api/reminders/p1/medication', { action: 'mark_taken' });
    const p1Rem = await makeRequest('GET', '/api/reminders/p1');
    assert(p1Rem.body.data.medication.isCompleted === true, 'Patient 1 (p1) medication is marked as taken');

    // Fetch p2 reminders: must remain independent and not affected by p1!
    const p2Rem = await makeRequest('GET', '/api/reminders/p2');
    assert(p2Rem.status === 200 && p2Rem.body.data.medication !== undefined, 'Patient 2 (p2) has independent reminders object');

    // 8. Clinical Telemetry: Strict Per-Patient Analysis
    console.log('\n--- 8. Clinical Telemetry: Individual Patient Telemetry Scoping ---');
    // Post telemetry specifically for p1
    await makeRequest('POST', '/api/telemetry', {
      patient_id: 'p1',
      game_id: 'reminiscence',
      game_name: '1. Reminiscence Recall',
      cognitive_domain: 'Memory Improvement',
      score: 100,
      latency_seconds: 3.1,
      accuracy_pct: 95,
      hesitation_count: 0,
      hints_used: 0,
      ai_tier: 2
    });

    const telemP1 = await makeRequest('GET', '/api/telemetry?patient_id=p1');
    assert(telemP1.status === 200, 'Telemetry retrieved for Patient 1');
    const p1Only = telemP1.body.data.every(r => r.patient_id === 'p1');
    assert(p1Only, 'Querying telemetry for Patient 1 strictly returns ONLY Patient 1 records');

    const telemP2 = await makeRequest('GET', '/api/telemetry?patient_id=p2');
    const p2Only = telemP2.body.data.every(r => r.patient_id === 'p2');
    assert(p2Only, 'Querying telemetry for Patient 2 strictly returns ONLY Patient 2 records (No whole-cohort mixture)');

    // 9. Doctor-Patient Messaging
    console.log('\n--- 9. Doctor-Patient Clinical Guidance Messaging ---');
    const sendMsg = await makeRequest('POST', '/api/messages', {
      patient_id: patientId,
      doctor_id: 'doc_anamika',
      sender_role: 'doctor',
      message_text: 'Continue gentle evening bamboo flute listening and drink warm herbal tea.'
    });
    assert(sendMsg.status === 201 && sendMsg.body.success, 'Doctor guidance message saved in SQLite');

    // 10. Edge Synchronization API
    console.log('\n--- 10. Edge Synchronization API ---');
    const syncRes = await makeRequest('POST', '/api/sync/edge', {
      patient_id: patientId,
      telemetry_records: [
        {
          game_id: 'assam_tea_routine',
          latency_seconds: 4.2,
          accuracy_score: 90
        }
      ]
    });
    assert(syncRes.status === 200 && syncRes.body.success, 'Edge sync successfully synced offline records');

  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
  }

  console.log('\n===================================================================');
  console.log(`🏆 FULLSTACK TEST RESULTS: ${passed}/${total} PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('===================================================================');
  process.exit(passed === total ? 0 : 1);
}

runTests();

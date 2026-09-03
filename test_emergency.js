const http = require('http');

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, raw: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET'
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, raw: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚨 TESTING EMERGENCY CARETAKER ALERT SYSTEM');
  console.log('====================================================');

  // Test 1: Trigger Emergency Alert for p1
  console.log('\n--- 1. Send Emergency Alert for Patient p1 ---');
  const res1 = await post('/api/emergency/send', {
    patient_id: 'p1',
    emergency_note: 'Feeling dizzy and heart rate elevated'
  });
  console.log('Status:', res1.status);
  console.log('Alert ID:', res1.data.alert_id);
  console.log('Target Caretaker:', res1.data.caretaker_name, 'at', res1.data.caretaker_phone);
  console.log('WhatsApp Link:', res1.data.whatsapp_url);
  console.log('SMS Link:', res1.data.sms_url);
  console.log('Call Link:', res1.data.call_url);

  if (res1.status === 200 && res1.data.success && res1.data.whatsapp_url && res1.data.sms_url) {
    console.log('✅ PASS: Emergency alert generated with working WhatsApp and SMS links!');
  } else {
    console.error('❌ FAIL:', res1);
    process.exit(1);
  }

  // Test 2: Fetch Doctor Emergency Log
  console.log('\n--- 2. Fetch Doctor Emergency Audit Log ---');
  const res2 = await get('/api/emergency/log');
  console.log('Log count:', res2.data.count);
  const latestAlert = res2.data.data[0];
  console.log('Latest alert patient:', latestAlert.patient_name, 'Status:', latestAlert.status);

  if (res2.status === 200 && res2.data.count > 0 && latestAlert.patient_name === 'Bhaben Baruah') {
    console.log('✅ PASS: Doctor clinical emergency log captures real-time alert!');
  } else {
    console.error('❌ FAIL:', res2);
    process.exit(1);
  }

  // Test 3: Patient Registration with custom Caretaker info
  console.log('\n--- 3. Register New Patient with Custom Caregiver ---');
  const regEmail = `test.elder.${Date.now()}@gmail.com`;
  const regRes = await post('/api/auth/register', {
    role: 'patient',
    name: 'Anjali Sharma',
    email: regEmail,
    password: 'password123',
    age: 74,
    location: 'Silchar, Assam',
    caretaker_name: 'Priyanka Sharma (Daughter)',
    caretaker_phone: '+91 94351 99000'
  });
  console.log('Register status:', regRes.status, 'User ID:', regRes.data.user.id);
  console.log('Registered Caretaker:', regRes.data.user.caretaker_name, regRes.data.user.caretaker_phone);

  if (regRes.status === 201 && regRes.data.user.caretaker_name === 'Priyanka Sharma (Daughter)') {
    console.log('✅ PASS: Registration successfully saved custom Caregiver details!');
  } else {
    console.error('❌ FAIL:', regRes);
    process.exit(1);
  }

  // Test 4: Trigger Emergency Alert for the new Patient
  console.log('\n--- 4. Send Emergency Alert for Newly Registered Patient ---');
  const res4 = await post('/api/emergency/send', {
    patient_id: regRes.data.user.id,
    emergency_note: 'Assistance required at home'
  });
  console.log('Status:', res4.status);
  console.log('Target Caretaker:', res4.data.caretaker_name, 'at', res4.data.caretaker_phone);
  console.log('WhatsApp URL includes daughter number:', res4.data.whatsapp_url.includes('919435199000'));

  if (res4.status === 200 && res4.data.caretaker_name === 'Priyanka Sharma (Daughter)' && res4.data.whatsapp_url.includes('919435199000')) {
    console.log('✅ PASS: New patient emergency alert targets the exact registered caregiver!');
  } else {
    console.error('❌ FAIL:', res4);
    process.exit(1);
  }

  // Test 5: Doctor Acknowledges Alert
  console.log('\n--- 5. Acknowledge Alert ---');
  const ackRes = await post(`/api/emergency/acknowledge/${res1.data.alert_id}`, {});
  console.log('Ack status:', ackRes.status, ackRes.data);

  if (ackRes.status === 200 && ackRes.data.success) {
    console.log('✅ PASS: Doctor can acknowledge and resolve emergency alerts!');
  } else {
    console.error('❌ FAIL:', ackRes);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 5 EMERGENCY CARETAKER ALERT TESTS PASSED 100%!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

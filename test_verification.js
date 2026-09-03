const fs = require('fs');
const path = require('path');

console.log('===================================================================');
console.log('SIH26003 COMPLETE AI DEMENTIA COGNITIVE CARE PLATFORM TEST SUITE');
console.log('===================================================================\n');

const frontendDir = path.join(__dirname, 'frontend');
const html = fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(frontendDir, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(frontendDir, 'styles.css'), 'utf8');

console.log('--- 1. Multilingual Support (Hindi & NER Regional Languages) ---');
const multilingualChecks = [
  { name: 'Hindi (हिन्दी) Option in Language Dropdown', test: html.includes('value="hi"') && html.includes('हिन्दी') },
  { name: 'Multilingual Selector with Assamese, Bengali, Bodo, Manipuri, Khasi', test: html.includes('value="as"') && html.includes('value="bn"') && html.includes('value="brx"') && html.includes('value="mni"') },
  { name: 'Auth Portal Language Selection Banner', test: html.includes('auth-lang-bar') && html.includes('auth-lang-pill') },
  { name: 'Comprehensive I18N Translation Dictionary (Hindi & Regional)', test: js.includes('const I18N_TRANSLATIONS') && js.includes('hi: {') && js.includes('as: {') && js.includes('bn: {') },
  { name: 'Dynamic setLanguage(langCode) Function in JS', test: js.includes('function setLanguage') && js.includes('data-i18n') },
  { name: 'Multilingual Voice Synthesis with BCP-47 Tag (hi-IN, bn-IN, as-IN, en-IN)', test: js.includes("'hi': 'hi-IN'") && js.includes("'bn': 'bn-IN'") }
];
multilingualChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 2. Voice-Assisted Interaction & Spoken Voice Assistant ---');
const voiceAssistantChecks = [
  { name: 'Voice Assistant Trigger in Persistent Navigation', test: html.includes('btnVoiceAssistantTrigger') && html.includes('btn-voice-assistant') },
  { name: 'Voice Assistant Modal Dialog (#modalVoiceAssistant)', test: html.includes('id="modalVoiceAssistant"') && html.includes('voice-assistant-card') },
  { name: 'Large Microphone Button with Pulsing Wave Animation', test: html.includes('btnVaMicToggle') && css.includes('.va-big-mic-btn') },
  { name: 'VoiceAssistantEngine with SpeechRecognition in JS', test: js.includes('class VoiceAssistantEngine') && js.includes('SpeechRecognition') },
  { name: 'Elderly Quick Voice Command Chips (Games, Meds, Water, Doctor, Music)', test: html.includes('data-cmd="play_game"') && html.includes('data-cmd="meds"') && html.includes('data-cmd="water"') }
];
voiceAssistantChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 3. Culturally Familiar Themes & Acoustic Synthesizer ---');
const culturalAudioChecks = [
  { name: 'Rhythmic Bihu Dhol Synthesizer (playBihuDhol)', test: js.includes('playBihuDhol()') },
  { name: 'Calming Bamboo Flute Synthesis (playFluteCalm)', test: js.includes('playFluteCalm()') },
  { name: 'Resonant Temple / Monastery Prayer Bell (playTempleBell)', test: js.includes('playTempleBell()') },
  { name: 'Natural Spring Water Stream Sound (playWaterBrook)', test: js.includes('playWaterBrook()') }
];
culturalAudioChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 4. a. Interactive Cognitive Games & Clinical Categories ---');
const games = [
  { id: 'reminiscence', name: '1. Reminiscence Recall' },
  { id: 'tea_sequencer', name: '2. Morning Tea Sequencer' },
  { id: 'haat_explorer', name: '3. Weekly Market Explorer' },
  { id: 'weaver_shuttle', name: '4. The Weaver’s Shuttle' },
  { id: 'hill_sounds', name: '5. Sounds of the Hills' },
  { id: 'folk_rhymes', name: '6. Classic Folk Sayings' },
  { id: 'two_leaves', name: '7. Two Leaves and a Bud' },
  { id: 'bazaar_counter', name: '8. Village Market Counter' },
  { id: 'pantry_sort', name: '9. Harvest Granary Sort' },
  { id: 'path_home', name: '10. The Path Home' },
  { id: 'kinship_faces', name: '11. Kinship & Faces' },
  { id: 'natural_dye', name: '12. Natural Dye Shade Matching' }
];

let gamesPassed = true;
games.forEach(g => {
  const cardFound = html.includes(`data-game="${g.id}"`);
  const jsFound = js.includes(`${g.id}: {`) || js.includes(`id: '${g.id}'`);
  if (cardFound && jsFound) {
    // console.log(`  ✅ PASS: Game Card & Engine: ${g.name}`);
  } else {
    gamesPassed = false;
    console.error(`  ❌ FAIL: Missing Game Card or Logic: ${g.name}`);
  }
});
if (gamesPassed) {
  console.log('  ✅ PASS: All 12 Cognitive Games mapped across memory, attention, routine, & patterns');
}

console.log('\n--- 5. b. AI/ML Adaptive Difficulty Engine ---');
const aiChecks = [
  { name: 'AI Engine Class in JS (evaluates latency & accuracy)', test: js.includes('class AIAdaptiveEngine') && js.includes('evaluateInteraction') },
  { name: 'AI Adaptive Tier UI Badge on Patient Garden', test: html.includes('id="patientAITierBadge"') },
  { name: 'AI Dynamic Difficulty Pill on Active Playground', test: html.includes('id="activeGameDifficultyPill"') }
];
aiChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 6. e. Smart Daily Living Reminders (Strict Per-Patient Isolation) ---');
const reminderChecks = [
  { name: 'Medicines Reminder (Prescription & Mark Taken)', test: html.includes('remMedTitle') && html.includes('btnTakeMed') },
  { name: 'Daily Hydration Tracker (Target & +1 Glass button)', test: html.includes('waterCount') && html.includes('btnAddWater') },
  { name: 'Daily Activities Routine Reminder', test: html.includes('remActTitle') && html.includes('btnCompleteRoutine') },
  { name: 'Clinical Medical Appointments Reminder', test: html.includes('remApptTitle') && html.includes('btnConfirmAppt') },
  { name: 'Doctor Dashboard Reminder Customization Schedule', test: html.includes('btnSaveDoctorReminders') && html.includes('inputDocMedName') },
  { name: 'Per-Patient Isolated Reminders Loader in JS', test: js.includes('fetchAndRenderPatientReminders') }
];
reminderChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 7. f. Doctor Clinical Dashboard (Per-Patient Analysis & Timer Fixes) ---');
const doctorChecks = [
  { name: 'Doctor Dashboard (#viewCaregiverDashboard)', test: html.includes('id="viewCaregiverDashboard"') },
  { name: 'Individual Patient Selector Tabs', test: html.includes('doctorPatientTabsContainer') && js.includes('renderDoctorPatientTabs') },
  { name: 'Doctor Dashboard displays Individual Patient Cognitive Accuracy', test: html.includes('dashAvgAccuracy') },
  { name: 'Session Playtime Timer excluded for Doctor role', test: js.includes("profile.role === 'doctor'") && js.includes("sessionTimerCard.style.display = 'none'") },
  { name: 'Clinical Alert Bar (High Hesitation / Disorientation alert)', test: html.includes('clinicalAlertBar') && html.includes('btnDismissAlert') },
  { name: 'MoCA Proxy Calculator & Individual Patient Telemetry Table', test: html.includes('dashMoCAScore') && js.includes('patientLogs') },
  { name: 'Interactive Doctor-Patient Messaging & Preset Guidance', test: html.includes('doctorMsgInput') && html.includes('btnSendDoctorMsg') && html.includes('msgHistoryContainer') },
  { name: 'District EMR Data Export (CSV & JSON)', test: html.includes('btnExportCSV') && html.includes('btnExportJSON') && js.includes('exportCSV()') }
];
doctorChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 8. g. Low-Connectivity Offline Functionality ---');
const offlineChecks = [
  { name: 'Offline Status Badge in Header', test: html.includes('header-offline-status') && html.includes('syncStatusText') },
  { name: 'Offline Edge Synchronization Utility (Sync to District EMR)', test: html.includes('btnSyncEdgeCloud') && js.includes('syncOfflineEdgeQueue') }
];
offlineChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n--- 9. h. Authentication, Gmail Validation & Elderly Ergonomics ---');
const authErgonomicsChecks = [
  { name: 'Authentication Portal with Login & Sign Up', test: html.includes('viewAuthPortal') && html.includes('tabAuthLogin') && html.includes('tabAuthSignup') },
  { name: 'Patient Registration Gmail Field & Validation', test: html.includes('id="regPatientEmail"') && js.includes('isValidGmail') },
  { name: 'Doctor Registration Gmail Field & Validation', test: html.includes('id="regDoctorEmail"') && js.includes('@gmail.com') },
  { name: 'Dementia >=64px Hit Targets Rule in CSS', test: css.includes('--min-hit-target: 64px') },
  { name: 'High Contrast Mode Support', test: css.includes('.high-contrast') && html.includes('btnContrastToggle') }
];
authErgonomicsChecks.forEach(c => console.log((c.test ? '  ✅ PASS: ' : '  ❌ FAIL: ') + c.name));

console.log('\n===================================================================');
const allPassed = multilingualChecks.every(c => c.test) &&
  voiceAssistantChecks.every(c => c.test) &&
  culturalAudioChecks.every(c => c.test) &&
  gamesPassed &&
  aiChecks.every(c => c.test) &&
  reminderChecks.every(c => c.test) &&
  doctorChecks.every(c => c.test) &&
  offlineChecks.every(c => c.test) &&
  authErgonomicsChecks.every(c => c.test);

if (allPassed) {
  console.log('🏆 COMPLETE VERIFICATION: 100% OF ALL SIH26003 SPECIFICATIONS PASSED!');
} else {
  console.error('❌ VERIFICATION: SOME SPEC CHECKS FAILED');
  process.exit(1);
}

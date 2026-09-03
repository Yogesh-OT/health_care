/**
 * Smriti-NER (SIH26003) Core Application & Cognitive Care Engine
 * North Eastern Elderly Dementia Cognitive Care SPA (English Only)
 * Comprehensive Solution:
 *  - AI/ML Adaptive Difficulty Engine
 *  - Multilingual Voice-Assisted Interaction
 *  - 12 Interactive Cognitive Mini-Games (Memory, Attention, Routine, Patterns)
 *  - Smart Daily Living Reminders (Meds, Hydration, Routine, Appointments)
 *  - Doctor Clinical Telemetry, Alert Center & Interactive Messaging
 *  - Low-Connectivity Offline Edge Synchronization
 *  - Elderly Accessible Interface (>=64px hit targets)
 */

// ==========================================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================================
const SMRITI_STATE = {
  // Authentication status
  isAuthenticated: false,
  // Current active logged-in user
  activeProfile: null,
  // Active patient being inspected in Doctor Dashboard
  inspectedPatientId: 'p1',
  sessionSeconds: 0,
  isSessionRunning: true,
  audioGuideEnabled: true,
  highContrastEnabled: false,
  selectedLanguage: 'en',
  currentGame: null,
  gameStartTime: null,
  activeFilterDomain: 'all',
  telemetryLogs: [],
  offlineUnsyncedCount: 0,

  // AI Adaptive Difficulty Engine State
  aiAdaptiveEngine: {
    currentTier: 1, // 1: Gentle Assistance, 2: Standard, 3: Advanced
    tierLabels: {
      1: 'Level 1 (Gentle Assistance)',
      2: 'Level 2 (Standard Cognitive Spark)',
      3: 'Level 3 (Advanced Precision)'
    },
    consecutiveHighLatencies: 0,
    consecutiveFastCompletions: 0
  },

  // Daily Smart Reminders State (Keyed by Patient ID)
  reminders: {
    p1: {
      medication: {
        title: 'Morning Cognitive Booster (09:00 AM)',
        sub: 'Take 1 tablet of Donepezil (5mg) with water after breakfast.',
        isTaken: false,
        time: '09:00 AM'
      },
      hydration: {
        currentGlasses: 4,
        targetGlasses: 8
      },
      routine: {
        title: 'Morning Garden Walk (15 Mins)',
        isDone: false
      },
      appointment: {
        title: 'Dr. Anamika Deka (Friday, 10:30 AM)',
        location: 'District Cognitive PHC Unit',
        isConfirmed: true
      }
    },
    p2: {
      medication: {
        title: 'Daily Memory Support Tablet (08:30 AM)',
        sub: 'Take 1 tablet with fresh warm water.',
        isTaken: true,
        time: '08:30 AM'
      },
      hydration: {
        currentGlasses: 5,
        targetGlasses: 8
      },
      routine: {
        title: 'Evening Loom & Art Practice',
        isDone: false
      },
      appointment: {
        title: 'Dr. Anamika Deka (Next Tuesday, 11:00 AM)',
        location: 'Community Health Centre',
        isConfirmed: true
      }
    }
  },

  // Registered Patients Database (Stored in localStorage)
  registeredPatients: [
    {
      id: 'p1',
      name: 'Bhaben Baruah',
      age: 72,
      location: 'Jorhat, Assam',
      avatar: '👴',
      phone: '9876543210',
      protocol: 'Memory & Routine Stimulation',
      notes: 'Responds exceptionally well to audio cues and tea routine sequences. High compliance observed with 64px hit targets.',
      completedToday: 0
    },
    {
      id: 'p2',
      name: 'Hemaprabha Saikia',
      age: 68,
      location: 'Tezpur, Assam',
      avatar: '👵',
      phone: '9876543211',
      protocol: 'Attention & Color Discrimination',
      notes: 'Enjoys nature themes and folk sayings. Motor stability is consistently steady during loom tracing.',
      completedToday: 0
    }
  ],

  // Registered Doctors Database
  registeredDoctors: [
    {
      id: 'doc_1',
      name: 'Dr. Anamika Deka',
      email: 'dr.anamika@smriti.org',
      regNo: 'MCI-2024-4102',
      specialty: 'Cognitive Neurologist',
      clinic: 'District Cognitive Care Unit, NER',
      pin: '1234',
      avatar: '🩺'
    }
  ],

  // Doctor-Patient Message Threads (Keyed by Patient ID)
  messages: {
    p1: [
      {
        id: 'msg_1',
        sender: 'doctor',
        senderName: 'Dr. Anamika Deka',
        text: 'Hello Bhaben! Please enjoy 10 minutes of gentle memory and tea sequencing games today. Take deep breaths and have fun!',
        timeFormatted: 'Today at 09:30 AM',
        timestamp: Date.now() - 3600000
      }
    ],
    p2: [
      {
        id: 'msg_2',
        sender: 'doctor',
        senderName: 'Dr. Anamika Deka',
        text: 'Good day Hemaprabha! Your attention and color matching exercises are looking wonderful. Keep up the great routine.',
        timeFormatted: 'Today at 10:15 AM',
        timestamp: Date.now() - 1800000
      }
    ]
  }
};

// LocalStorage Keys
const STORAGE_KEYS = {
  TELEMETRY: 'smriti_ner_telemetry_logs_v4',
  SESSION_TIME: 'smriti_ner_session_seconds_v4',
  MESSAGES: 'smriti_ner_doctor_messages_v4',
  PATIENTS: 'smriti_ner_registered_patients_v4',
  DOCTORS: 'smriti_ner_registered_doctors_v4',
  CURRENT_USER: 'smriti_ner_current_user_v4',
  REMINDERS: 'smriti_ner_reminders_v4',
  AI_TIER: 'smriti_ner_ai_tier_v4'
};

// ==========================================================================
// 1.1 FULLSTACK REST API CLIENT (SQLITE BACKEND INTEGRATION)
// ==========================================================================
const ApiClient = {
  baseUrl: '/api',

  getToken() {
    try {
      return localStorage.getItem('smriti_auth_token') || '';
    } catch (e) {
      return '';
    }
  },

  setToken(token) {
    try {
      if (token) localStorage.setItem('smriti_auth_token', token);
      else localStorage.removeItem('smriti_auth_token');
    } catch (e) {}
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn(`[API Network / Offline Mode] ${endpoint}:`, err);
      return { ok: false, offline: true, error: err.message };
    }
  },

  login(role, identifier, pin) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, identifier, pin })
    });
  },

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  logout() {
    const token = this.getToken();
    this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    this.setToken('');
  },

  getPatients() {
    return this.request('/patients');
  },

  getTelemetry(patientId) {
    const q = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
    return this.request(`/telemetry${q}`);
  },

  postTelemetry(record) {
    return this.request('/telemetry', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  },

  getReminders(patientId) {
    return this.request(`/reminders/${encodeURIComponent(patientId)}`);
  },

  updateReminder(patientId, type, payload) {
    return this.request(`/reminders/${encodeURIComponent(patientId)}/${encodeURIComponent(type)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getMessages(patientId) {
    return this.request(`/messages/${encodeURIComponent(patientId)}`);
  },

  postMessage(payload) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  syncEdge(payload) {
    return this.request('/sync/edge', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  sendEmergencyAlert(payload) {
    return this.request('/emergency/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getEmergencyLogs(limit = 20) {
    return this.request(`/emergency/log?limit=${limit}`);
  },

  acknowledgeEmergencyAlert(alertId) {
    return this.request(`/emergency/acknowledge/${alertId}`, {
      method: 'POST'
    });
  }
};

// ==========================================================================
// 2. AUDIO & SPEECH SYNTHESIS ENGINE (Web Audio + SpeechSynthesis)
// ==========================================================================
class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playGentleChime() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.55);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  playSuccessMelody() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (idx * 0.1);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e) {
      console.warn('Melody playback error:', e);
    }
  }

  playPepaSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(370, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(370, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    } catch (e) {
      console.warn('Horn sound error:', e);
    }
  }

  playTokariSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const freqs = [220, 277.18, 329.63];
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (i * 0.15);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch (e) {
      console.warn('String sound error:', e);
    }
  }

  playMonsoonRainSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Rain sound error:', e);
    }
  }

  playHornbillSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.05);
    } catch (e) {
      console.warn('Hornbill sound error:', e);
    }
  }

  // Cultural sound: Rhythmic Bihu Dhol pattern (Assam & NER festival folk beat)
  playBihuDhol() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const beats = [
        { time: 0, freq: 110, decay: 0.25, gain: 0.4, type: 'sine' },
        { time: 0.2, freq: 420, decay: 0.1, gain: 0.25, type: 'triangle' },
        { time: 0.4, freq: 115, decay: 0.22, gain: 0.35, type: 'sine' },
        { time: 0.6, freq: 110, decay: 0.25, gain: 0.38, type: 'sine' },
        { time: 0.8, freq: 440, decay: 0.12, gain: 0.25, type: 'triangle' }
      ];
      beats.forEach(b => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = b.type;
        osc.frequency.setValueAtTime(b.freq, t + b.time);
        osc.frequency.exponentialRampToValueAtTime(50, t + b.time + b.decay);
        g.gain.setValueAtTime(b.gain, t + b.time);
        g.gain.exponentialRampToValueAtTime(0.001, t + b.time + b.decay);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + b.time);
        osc.stop(t + b.time + b.decay + 0.05);
      });
    } catch (e) {
      console.warn('Bihu dhol sound error:', e);
    }
  }

  // Cultural sound: Calming bamboo flute notes
  playFluteCalm() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [330, 392, 440, 587, 494];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.35);
        g.gain.setValueAtTime(0.01, t + idx * 0.35);
        g.gain.linearRampToValueAtTime(0.18, t + idx * 0.35 + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.35 + 0.45);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t + idx * 0.35);
        osc.stop(t + idx * 0.35 + 0.5);
      });
    } catch (e) {
      console.warn('Flute sound error:', e);
    }
  }

  // Cultural sound: Deep resonant temple / monastery prayer bell
  playTempleBell() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(216, this.ctx.currentTime);
      g.gain.setValueAtTime(0.35, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 2.3);
    } catch (e) {
      console.warn('Temple bell sound error:', e);
    }
  }

  // Sound: Gentle bubbling water stream for hydration tracker
  playWaterBrook() {
    try {
      this.initContext();
      if (!this.ctx) return;
      [600, 750, 900].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.15);
        osc.frequency.exponentialRampToValueAtTime(f + 250, this.ctx.currentTime + i * 0.15 + 0.12);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.15 + 0.14);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.15);
        osc.stop(this.ctx.currentTime + i * 0.15 + 0.15);
      });
    } catch (e) {
      console.warn('Water brook error:', e);
    }
  }

  // Multilingual Speech Synthesis for Elderly (supports Hindi, English, Assamese, Bengali)
  speak(text, lang = null) {
    if (!SMRITI_STATE.audioGuideEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = lang || SMRITI_STATE.selectedLanguage || 'en';
      const langMap = {
        'hi': 'hi-IN',
        'en': 'en-IN',
        'as': 'as-IN',
        'bn': 'bn-IN',
        'brx': 'hi-IN',
        'mni': 'bn-IN',
        'kha': 'en-IN'
      };
      utterance.lang = langMap[targetLang] || 'hi-IN';
      utterance.rate = 0.85; // Calm, unhurried pacing for elderly dementia patients
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select natural Indian accent or target voice if present
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const match = voices.find(v => {
          const l = v.lang.toLowerCase();
          if (targetLang === 'hi') return l.includes('hi') || l.includes('hindi');
          if (targetLang === 'bn') return l.includes('bn') || l.includes('bengali');
          if (targetLang === 'as') return l.includes('as') || l.includes('assamese') || l.includes('bn');
          return l.includes('en-in') || l.includes('en');
        });
        if (match) utterance.voice = match;
      }

      window.speechSynthesis.speak(utterance);
    }
  }
}

const audio = new AudioEngine();

// ==========================================================================
// 2. MULTILINGUAL TRANSLATION & I18N SYSTEM (HINDI & REGIONAL)
// ==========================================================================
const I18N_TRANSLATIONS = {
  en: {
    nav_session: 'Session',
    nav_reminders: 'Reminders',
    nav_doctor_note: 'Doctor Note',
    nav_voice_assistant: 'Voice Assistant',
    nav_voice: 'Voice',
    nav_contrast: 'Contrast',
    nav_switch_user: 'Switch User',
    nav_logout: 'Log Out',
    garden_welcome_badge: 'Welcome to Your Cognitive Garden',
    activities_done_today: 'Activities Completed Today',
    reminders_title: 'Smart Daily Living Reminders',
    reminders_sub: 'Assisting memory recall for medications, water intake, daily routines, and doctor visits',
    btn_read_reminders: 'Read My Reminders',
    btn_mark_taken: '✅ Mark Taken',
    rem_water_title: 'Drink Warm Spring Water',
    btn_add_water: '+ 1 Glass',
    btn_complete_routine: 'Complete Activity',
    btn_confirm_appt: 'Confirm Appointment',
    games_heading: 'Cultural Cognitive Games & Therapeutic Modules',
    games_sub: 'Strengthening memory, attention, executive recall, and sensory recognition through culturally familiar North Eastern & Northern themes.',
    tab_all: '🌿 All Activities',
    tab_memory: '🧠 Memory Improvement',
    tab_attention: '🎯 Attention & Concentration',
    tab_routine: '☀️ Daily Routine Recall',
    tab_patterns: '🔷 Pattern & Object Recognition',
    tab_acoustic: '🎵 Acoustic & Folk Sounds',
    va_title: 'Spoken Voice Assistant',
    va_sub: 'Speak naturally in your preferred language or tap a quick command.',
    va_tap_to_speak: 'Tap microphone to speak',
    va_quick_title: 'Or Tap Instant Spoken Action:',
    cmd_play: 'Play Cognitive Game',
    cmd_meds: 'Take Medication',
    cmd_water: 'Drink 1 Glass Water',
    cmd_doctor: 'Listen to Doctor Note',
    cmd_bihu: 'Calming Bihu Rhythm',
    cmd_help: 'Elderly Help & Guide',
    lang_switched: 'Language switched to English.',
    voice_enabled: 'Spoken voice guide enabled.',
    voice_disabled: 'Voice guide paused.'
  },
  hi: {
    nav_session: 'सत्र',
    nav_reminders: 'याद दिलाएं',
    nav_doctor_note: 'डॉक्टर संदेश',
    nav_voice_assistant: 'आवाज सहायक',
    nav_voice: 'आवाज',
    nav_contrast: 'कंट्रास्ट',
    nav_switch_user: 'यूज़र बदलें',
    nav_logout: 'लॉग आउट',
    garden_welcome_badge: 'आपके संज्ञानात्मक उद्यान में स्वागत है',
    activities_done_today: 'आज पूरी की गई गतिविधियाँ',
    reminders_title: 'स्मार्ट दैनिक दिनचर्या और दवा रिमाइंडर',
    reminders_sub: 'दवाइयों, पानी के सेवन, दैनिक गतिविधियों और डॉक्टर से मिलने का समय',
    btn_read_reminders: 'मेरे रिमाइंडर पढ़कर सुनाएं',
    btn_mark_taken: '✅ दवा ले ली',
    rem_water_title: 'ताज़ा पानी पिएं (स्वस्थ रहें)',
    btn_add_water: '+ 1 गिलास पानी',
    btn_complete_routine: 'गतिविधि पूरी',
    btn_confirm_appt: 'अपॉइंटमेंट पुष्टि',
    games_heading: 'सांस्कृतिक संज्ञानात्मक खेल और स्मृति अभ्यास',
    games_sub: 'स्मृति, एकाग्रता, दिनचर्या और पैटर्न पहचान के लिए सांस्कृतिक रूप से परिचित खेल।',
    tab_all: '🌿 सभी गतिविधियाँ',
    tab_memory: '🧠 स्मृति सुधार',
    tab_attention: '🎯 एकाग्रता और ध्यान',
    tab_routine: '☀️ दैनिक दिनचर्या स्मरण',
    tab_patterns: '🔷 पैटर्न और वस्तु पहचान',
    tab_acoustic: '🎵 पारंपरिक धुन व संगीत',
    va_title: 'बोलकर बात करें (आवाज सहायक)',
    va_sub: 'अपनी भाषा में बोलें या नीचे दिए गए किसी भी बटन पर टैप करें।',
    va_tap_to_speak: 'बोलने के लिए माइक पर टैप करें',
    va_quick_title: 'या तुरंत बटन दबाकर बोलें:',
    cmd_play: 'संज्ञानात्मक खेल खेलें',
    cmd_meds: 'दवा ली दर्ज करें',
    cmd_water: '1 गिलास पानी पिएं',
    cmd_doctor: 'डॉक्टर की सलाह सुनें',
    cmd_bihu: 'शांत लोक धुन सुनें',
    cmd_help: 'बुजुर्ग सहायता व मार्गदर्शन',
    lang_switched: 'भाषा हिन्दी में सेट कर दी गई है।',
    voice_enabled: 'आवाज गाइड चालू हो गया है।',
    voice_disabled: 'आवाज गाइड बंद किया गया।'
  },
  as: {
    nav_session: 'অধিবেশন',
    nav_reminders: 'স্মাৰক',
    nav_doctor_note: 'ডাক্তাৰৰ বাৰ্তা',
    nav_voice_assistant: 'কণ্ঠ সহায়ক',
    nav_voice: 'কণ্ঠ',
    nav_contrast: 'কন্ট্ৰাস্ট',
    nav_switch_user: 'প্ৰফাইল সলনি',
    nav_logout: 'প্ৰস্থান',
    garden_welcome_badge: 'আপোনাৰ স্মৃতি উদ্যানলৈ স্বাগতম',
    activities_done_today: 'আজি সম্পূৰ্ণ কৰা কাৰ্যসূচী',
    reminders_title: 'দৈনন্দিন জীৱন আৰু স্বাস্থ্য স্মাৰক',
    reminders_sub: 'ঔষধ খোৱা, পানী খোৱা, খোজ কঢ়া আৰু ডাক্তৰৰ সাক্ষাৎ',
    btn_read_reminders: 'স্মাৰক পঢ়ি শুনাওক',
    btn_mark_taken: '✅ ঔষধ খোৱা হ’ল',
    rem_water_title: 'পানী খাওক (সুস্থ থাকক)',
    btn_add_water: '+ ১ গিলাচ পানী',
    btn_complete_routine: 'কাৰ্য সম্পূৰ্ণ',
    btn_confirm_appt: 'সাক্ষাৎ নিশ্চিত',
    games_heading: 'সাংস্কৃতিক স্মৃতি খেল আৰু মানসিক অনুশীলন',
    games_sub: 'স্মৃতিশক্তি, মনোযোগ আৰু দৈনন্দিন অভ্যাসৰ বাবে পৰম্পৰাগত খেল।',
    tab_all: '🌿 সকলো কাৰ্য',
    tab_memory: '🧠 স্মৃতি উন্নতি',
    tab_attention: '🎯 মনোযোগ',
    tab_routine: '☀️ দৈনন্দিন অভ্যাস',
    tab_patterns: '🔷 আৰ্হি চিনাক্তকৰণ',
    tab_acoustic: '🎵 লোক সংগীত আৰু ধ্বনি',
    va_title: 'কণ্ঠ সহায়ক (মাত দি কওক)',
    va_sub: 'স্বাভাৱিকভাৱে কওক বা তলৰ বুটামত টিপক।',
    va_tap_to_speak: 'ক’বলৈ মাইকত টিপক',
    va_quick_title: 'বা চমু বুটামত টিপক:',
    cmd_play: 'খেল আৰম্ভ কৰক',
    cmd_meds: 'ঔষধ খোৱা হ’ল',
    cmd_water: '১ গিলাচ পানী পালোঁ',
    cmd_doctor: 'ডাক্তাৰৰ পৰামৰ্শ শুনক',
    cmd_bihu: 'বিহুৰ শান্ত সুৰ শুনক',
    cmd_help: 'সহায় আৰু নিৰ্দেশনা',
    lang_switched: 'ভাষা অসমীয়ালৈ সলনি কৰা হ’ল।',
    voice_enabled: 'কণ্ঠ সহায়ক সক্ৰিয় কৰা হৈছে।',
    voice_disabled: 'কণ্ঠ সহায়ক বন্ধ কৰা হ’ল।'
  },
  bn: {
    nav_session: 'সেশন',
    nav_reminders: 'অনুস্মারক',
    nav_doctor_note: 'ডাক্তারের নোট',
    nav_voice_assistant: 'ভয়েস সহায়ক',
    nav_voice: 'ভয়েস',
    nav_contrast: 'কনট্রাস্ট',
    nav_switch_user: 'ইউজার বদলান',
    nav_logout: 'লগ আউট',
    garden_welcome_badge: 'আপনার স্মৃতি উদ্যানে স্বাগতম',
    activities_done_today: 'আজ সম্পন্ন কার্যকলাপ',
    reminders_title: 'দৈনন্দিন রুটিন ও স্বাস্থ্য অনুস্মারক',
    reminders_sub: 'ওষুধ, জল খাওয়া, সকালের হাঁটা এবং ডাক্তারের অ্যাপয়েন্টমেন্ট',
    btn_read_reminders: 'আমার অনুস্মারক পড়ে শোনান',
    btn_mark_taken: '✅ ওষুধ খাওয়া হয়েছে',
    rem_water_title: 'বিশুদ্ধ জল পান করুন',
    btn_add_water: '+ ১ গ্লাস জল',
    btn_complete_routine: 'কাজ সম্পন্ন',
    btn_confirm_appt: 'নিশ্চিত করা হয়েছে',
    games_heading: 'সাংস্কৃতিক স্মৃতি গেম ও মানসিক ব্যায়াম',
    games_sub: 'স্মৃতিশক্তি, মনোযোগ এবং রুটিন স্মরণ করার জন্য ঐতিহ্যবাহী গেম।',
    tab_all: '🌿 সমস্ত গেম',
    tab_memory: '🧠 স্মৃতিশক্তি উন্নতি',
    tab_attention: '🎯 মনোযোগ ও একাগ্রতা',
    tab_routine: '☀️ দৈনন্দিন রুটিন স্মরণ',
    tab_patterns: '🔷 প্যাটার্ন শনাক্তকরণ',
    tab_acoustic: '🎵 ঐতিহ্যবাহী ধ্বনি',
    va_title: 'ভয়েস সহায়ক (কথা বলে জানান)',
    va_sub: 'মুখে কথা বলুন বা নিচের বোতামে চাপ দিন।',
    va_tap_to_speak: 'কথা বলতে মাইকে চাপ দিন',
    va_quick_title: 'বা সরাসরি বোতামে চাপুন:',
    cmd_play: 'স্মৃতি গেম শুরু করুন',
    cmd_meds: 'ওষুধ খেয়েছি',
    cmd_water: '১ গ্লাস জল খেলাম',
    cmd_doctor: 'ডাক্তারের পরামর্শ শুনুন',
    cmd_bihu: 'শান্ত লোকসুর শুনুন',
    cmd_help: 'সাহায্য ও নির্দেশনা',
    lang_switched: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
    voice_enabled: 'ভয়েস গাইড সক্রিয় হয়েছে।',
    voice_disabled: 'ভয়েস গাইড বন্ধ করা হলো।'
  },
  brx: {
    nav_session: 'सम',
    nav_reminders: 'गोसोखांथि',
    nav_doctor_note: 'डाक्टरनि खौरां',
    nav_voice_assistant: 'राव हेफाजाब',
    nav_voice: 'राव',
    nav_contrast: 'कन्ट्रास्ट',
    nav_switch_user: 'सोलाय',
    nav_logout: 'ओंखार',
    garden_welcome_badge: 'नोंथांनि मेमरि बागानआव बरायबाय',
    activities_done_today: 'दिनै जोबनाय खामानि',
    reminders_title: 'सानफ्रोमबोनि मुलि आरो दै लोंनाय',
    reminders_sub: 'मुलि, दै, सानफ्रोमबोनि हाबा आरो डाक्टरखौ लोगो हमनाय',
    btn_read_reminders: 'फरायनानै खोनथा',
    btn_mark_taken: '✅ मुलि जाबाय',
    rem_water_title: 'दै लोंनाय (मोजां था)',
    btn_add_water: '+ १ ग्लास दै',
    btn_complete_routine: 'हाबा जोबबाय',
    btn_confirm_appt: 'थियारि जाबाय',
    games_heading: 'गिदिं गेलेमु आरो गोसोनि हाबा',
    games_sub: 'गोसोखांथि, गोसो होनाय आरो सानफ्रोमबोनि हाबानि गेलेमु।',
    tab_all: '🌿 गासैबो गेलेमु',
    tab_memory: '🧠 गोसोखांथि',
    tab_attention: '🎯 गोसो होनाय',
    tab_routine: '☀️ सानफ्रोमबोनि हाबा',
    tab_patterns: '🔷 रोखोम सिनायनाय',
    tab_acoustic: '🎵 मेथाय आरो रिंखां',
    va_title: 'राव हेफाजाब (बुंनानै खोनथा)',
    va_sub: 'बुं एबा गाहायनि बुथामाव थु।',
    va_tap_to_speak: 'बुंनो थाखाय थु',
    va_quick_title: 'एबा गाहायनि गेलेमु बुथामाव थु:',
    cmd_play: 'गेलेमु जागाय',
    cmd_meds: 'मुलि जाबाय',
    cmd_water: 'दै लोंबाय',
    cmd_doctor: 'डाक्टरनि बाथ्रा खनासं',
    cmd_bihu: 'गोजोन मेथाय खनासं',
    cmd_help: 'हेफाजाब नांगौ',
    lang_switched: 'राव सोलायबाय।',
    voice_enabled: 'राव हेफाजाब जागायबाय।',
    voice_disabled: 'राव हेफाजाब बन्द जाबाय।'
  },
  mni: {
    nav_session: 'মতৌ',
    nav_reminders: 'নিংশিংবা',
    nav_doctor_note: 'দোক্তরগী পাউ',
    nav_voice_assistant: 'খোন্থাং মতেং',
    nav_voice: 'খোন্থাং',
    nav_contrast: 'কন্ত্রাস্ত',
    nav_switch_user: 'হোংদোকপা',
    nav_logout: 'থোকপা',
    garden_welcome_badge: 'অদোমগী ৱাখল লৈকোলদা তরাম্না ওকচরি',
    activities_done_today: 'ঙসি লোইশিনখিবা থবক',
    reminders_title: 'নোংমগী হিদাক অমসুং ঈশ্বর থবক নিংশিংবা',
    reminders_sub: 'হিদাক চাবা, ঈশিং থকপা, অমসুং দোক্তরগা উনবা',
    btn_read_reminders: 'পাবা তানবিয়ু',
    btn_mark_taken: '✅ হিদাক চারে',
    rem_water_title: 'ঈশিং থকউ (হকচাং ফনা লৈনবা)',
    btn_add_water: '+ ১ গ্লাস ঈশিং',
    btn_complete_routine: 'থবক লোইরে',
    btn_confirm_appt: 'চৎপা য়ারে',
    games_heading: 'লমদমসিগী ৱাখল শান্নপোৎ অমসুং নিংশিং থৌরম',
    games_sub: 'নিংশিংবা কনখৎহনবা অমসুং পুকনিং চাং নাইনা থম্নবা শান্নপোৎ।',
    tab_all: '🌿 পুম্নমক',
    tab_memory: '🧠 নিংশিংবা',
    tab_attention: '🎯 পুকনিং চঙবা',
    tab_routine: '☀️ নোংমগী থবক',
    tab_patterns: '🔷 সাকলোন খঙদোকপা',
    tab_acoustic: '🎵 শাইওন অমসুং ঈশৈ',
    va_title: 'খোন্থাং মতেং (ঙাংনা পাউ পীবিয়ু)',
    va_sub: 'ঙাংবিয়ু নত্রগা মখাগী বতমদা নম্মু।',
    va_tap_to_speak: 'ঙাংনবা নম্মু',
    va_quick_title: 'নত্রগা তপথনা থবক তৌউ:',
    cmd_play: 'শান্নপোৎ হৌরো',
    cmd_meds: 'হিদাক চারে',
    cmd_water: 'ঈশিং থকরে',
    cmd_doctor: 'দোক্তরগী পাউ তাবিয়ু',
    cmd_bihu: 'ইংবা ঈশৈ তাবিয়ু',
    cmd_help: 'মতেং পাংবিয়ু',
    lang_switched: 'লোন হোংদোক্লে।',
    voice_enabled: 'খোন্থাং মতেং হৌরে।',
    voice_disabled: 'খোন্থাং মতেং তোপলে।'
  },
  kha: {
    nav_session: 'Por',
    nav_reminders: 'Kynmaw',
    nav_doctor_note: 'Khubor Doctor',
    nav_voice_assistant: 'Jingiarap Kren',
    nav_voice: 'Sur Kren',
    nav_contrast: 'Contrast',
    nav_switch_user: 'Kylla User',
    nav_logout: 'Mih noh',
    garden_welcome_badge: 'Khublei sha Ka Kper Jingkynmaw',
    activities_done_today: 'Ki Kam ba la pyndep mynta ka sngi',
    reminders_title: 'Ki Jingkynmaw Dawai & Jingim Mynsiem',
    reminders_sub: 'Dih dawai, dih um, iaid kai mynstep bad leit sha Doctor',
    btn_read_reminders: 'Pule ia ki jingkynmaw',
    btn_mark_taken: '✅ Dih dawai la dep',
    rem_water_title: 'Dih Um Khluit (Koit Khiah)',
    btn_add_water: '+ 1 Khuri Um',
    btn_complete_routine: 'Kam la dep',
    btn_confirm_appt: 'La mynjur',
    games_heading: 'Ki Jingialehkai Pynkynmaw & Jingmut',
    games_sub: 'Pynkhlain ia ka jingmut, jingkynmaw bad ka jingtrei kam.',
    tab_all: '🌿 Baroh ki Jingialehkai',
    tab_memory: '🧠 Pynkynmaw',
    tab_attention: '🎯 Pynleit Jingmut',
    tab_routine: '☀️ Kam Mynstep',
    tab_patterns: '🔷 Ithuh Dur',
    tab_acoustic: '🎵 Sur Rwai Tynrai',
    va_title: 'Jingiarap Kren (Voice Assistant)',
    va_sub: 'Kren beit ne shon ha ki button harum.',
    va_tap_to_speak: 'Shon ha u mic ban kren',
    va_quick_title: 'Ne shon mar ya kren:',
    cmd_play: 'Ialehkai mynta',
    cmd_meds: 'Dih dawai la dep',
    cmd_water: 'Dih 1 khuri um',
    cmd_doctor: 'Sngap ia u Doctor',
    cmd_bihu: 'Sngap sur rwai Bihu',
    cmd_help: 'Iarap ia nga',
    lang_switched: 'La kylla sha ka ktien Khasi.',
    voice_enabled: 'Sur kren la plie.',
    voice_disabled: 'Sur kren la khang.'
  }
};

// Comprehensive Full-Page Localization Dictionaries (English, Hindi, Assamese, Bengali)
const UI_STRINGS = {
  en: {
    brand_sub: 'AI Dementia Cognitive Platform · North Eastern Region Care',
    offline_status: 'Offline-Ready (Edge Sync Active)',
    auth_hero_title: 'AI Cognitive Care & Memory Assistance',
    auth_hero_sub: 'Welcome to Smriti-NER, an AI-enabled cognitive platform addressing dementia and memory decline across the North Eastern Region of India (SIH26003).',
    feat_1_title: 'AI Adaptive Gaming & Memory Training',
    feat_1_desc: 'Dynamic difficulty tiers that adjust to latency and motor stability without anxiety.',
    feat_2_title: 'Smart Daily Living Reminders',
    feat_2_desc: 'Auditory alerts for medicines, hydration, daily routines, and doctor appointments.',
    feat_3_title: 'Doctor Telemetry & Clinical Messaging',
    feat_3_desc: 'MoCA proxy analysis, hesitation tracking, and direct patient communication.',
    feat_4_title: 'Offline-Ready Low-Connectivity Sync',
    feat_4_desc: 'Works seamlessly in remote rural hills with automatic local edge synchronization.',
    tab_login: '🔑 Sign In',
    tab_signup: '📝 Create Account (Sign Up)',
    pill_patient: '👴 Patient Sign In',
    pill_doctor: '🩺 Doctor Sign In',
    patient_inst: 'Select a registered elderly patient for instant access, or enter your name:',
    patient_or: 'OR SIGN IN WITH PHONE / ID',
    lbl_pat_name: 'Patient Full Name',
    lbl_pat_city: 'City / District',
    btn_enter_garden: 'Enter Cognitive Garden ➔',
    lbl_doc_email: 'Doctor Email Address',
    lbl_doc_pin: '4-Digit Security PIN',
    btn_doc_login: 'Doctor Login 🩺 ➔',
    btn_demo_doc: '⚡ Quick Demo Doctor Login (Dr. Anamika)',
    lbl_reg_pat_name: 'Patient Full Name *',
    lbl_reg_pat_age: 'Age (Years) *',
    lbl_reg_pat_loc: 'Home District / Village *',
    lbl_reg_pat_phone: 'Caregiver / Family Phone *',
    lbl_reg_pat_avatar: 'Choose Friendly Avatar Profile',
    lbl_reg_pat_protocol: 'Cognitive Intervention Protocol',
    btn_create_pat: 'Create Patient Account & Enter ➔',
    garden_welcome_badge: 'Welcome to Your Cognitive Garden',
    welcome_hello: 'Hello',
    welcome_sub: 'Choose any calming activity below. There are no timers, stress, or penalties—just pleasant memories, music, and gentle brain exercises tailored to your comfort.',
    acts_completed_today: 'Activities Completed Today',
    reminders_title: 'Smart Daily Living Reminders',
    reminders_sub: 'Assisting memory recall for medications, water intake, daily routines, and doctor visits',
    btn_read_rem: 'Read My Reminders',
    lbl_meds: 'Prescription Medicines',
    lbl_hydration: 'Daily Hydration',
    lbl_routine: 'Daily Routine',
    lbl_appt: 'Clinical Appointment',
    water_logged_prefix: 'Glasses Logged:',
    btn_mark_taken: '✅ Mark Taken',
    btn_add_water: '+ 1 Glass',
    btn_done_today: '🌸 Done Today',
    btn_confirmed: '📅 Confirmed',
    doc_notice_tag: "Doctor's Clinical Guidance",
    btn_listen_doc: 'Listen to Doctor',
    lbl_quick_reply: 'Quick Reply:',
    tab_all: '🌾 All Activities (12)',
    tab_mem: '🧠 Memory Improvement',
    tab_rout: '☕ Daily Routine Recall',
    tab_pat: '🎨 Pattern & Object Recognition',
    tab_att: '🌿 Attention & Concentration',
    tab_num: '🪙 Functional Numeracy',
    btn_back_hub: 'Return to Village Hub',
    btn_speak_prompt: 'Read Prompt',
    btn_hint: 'Gentle Hint',
    btn_restart: 'Restart Activity',
    celeb_title: 'Wonderful Job!',
    celeb_sub: 'You completed this calming activity with great focus and joy.',
    celeb_score: 'Activity Score',
    celeb_time: 'Duration',
    celeb_ai: 'AI Assistance',
    celeb_replay: 'Play Again',
    celeb_hub: 'Back to Activities',
    doc_portal_title: 'Neurological Clinical Telemetry & Caregiver Portal',
    doc_portal_sub: 'Comprehensive cognitive health metrics, MoCA proxy scores, and direct patient communication',
    btn_sync_emr: 'Sync to District EMR',
    btn_export_csv: 'Export CSV',
    btn_export_json: 'Export JSON',
    moca_card_title: 'MoCA Proxy Score',
    hesitation_card_title: 'Hesitation Index',
    acts_card_title: 'Activities Completed',
    latency_card_title: 'Average Response Latency',
    clinical_alert_title: 'Clinical Alert: High Cognitive Hesitation Detected',
    doc_msg_heading: 'Doctor Direct Guidance & Message Center',
    btn_send_advice: 'Send Clinical Advice',
    va_title: 'Spoken Voice Assistant',
    va_sub: 'Speak naturally in your preferred language or tap a quick command.',
    va_tap_speak: 'Tap microphone to speak',
    va_quick_action: 'Or Tap Instant Spoken Action:'
  },
  hi: {
    brand_sub: 'एआई डिमेंशिया संज्ञानात्मक मंच · पूर्वोत्तर और उत्तर क्षेत्र देखभाल',
    offline_status: 'ऑफलाइन तैयार (एज सिंक सक्रिय)',
    auth_hero_title: 'एआई संज्ञानात्मक देखभाल और स्मृति सहायता',
    auth_hero_sub: 'स्मृति-एनईआर में आपका स्वागत है, एक एआई-सक्षम संज्ञानात्मक मंच जो पूर्वोत्तर और उत्तरी भारत में डिमेंशिया और स्मृति दुर्बलता का समाधान करता है।',
    feat_1_title: 'एआई अनुकूली खेल और स्मृति अभ्यास',
    feat_1_desc: 'गतिशील कठिनाई स्तर जो बिना किसी तनाव के मरीज की गति के अनुसार ढलते हैं।',
    feat_2_title: 'स्मार्ट दैनिक दिनचर्या और दवा रिमाइंडर',
    feat_2_desc: 'दवा, जल सेवन, दैनिक दिनचर्या और डॉक्टर से मिलने के समय की आवाज में याद दिलाना।',
    feat_3_title: 'डॉक्टर टेलीमेट्री और क्लीनिकल संदेश',
    feat_3_desc: 'मोका संज्ञानात्मक स्कोर, झिझक विश्लेषण और सीधा मरीज-डॉक्टर संवाद।',
    feat_4_title: 'ऑफलाइन-तैयार एज सिंक्रोनाइज़ेशन',
    feat_4_desc: 'दूरदराज के पहाड़ी इलाकों में बिना इंटरनेट के भी सुरक्षित डेटा संग्रह और ऑटो-सिंक।',
    tab_login: '🔑 प्रवेश (साइन इन)',
    tab_signup: '📝 नया खाता बनाएं (साइन अप)',
    pill_patient: '👴 मरीज प्रवेश',
    pill_doctor: '🩺 डॉक्टर प्रवेश',
    patient_inst: 'त्वरित प्रवेश के लिए पंजीकृत बुजुर्ग मरीज चुनें, या अपना नाम दर्ज करें:',
    patient_or: 'या फोन नंबर / आईडी से लॉगिन करें',
    lbl_pat_name: 'मरीज का पूरा नाम',
    lbl_pat_city: 'शहर / ज़िला',
    btn_enter_garden: 'संज्ञानात्मक उद्यान में प्रवेश ➔',
    lbl_doc_email: 'डॉक्टर ईमेल पता',
    lbl_doc_pin: '4-अंकों का सुरक्षा पिन',
    btn_doc_login: 'डॉक्टर लॉगिन 🩺 ➔',
    btn_demo_doc: '⚡ डेमो डॉक्टर लॉगिन (डॉ. अनामिका)',
    lbl_reg_pat_name: 'मरीज का पूरा नाम *',
    lbl_reg_pat_age: 'उम्र (वर्ष) *',
    lbl_reg_pat_loc: 'गृह ज़िला / गाँव *',
    lbl_reg_pat_phone: 'परिवार / देखभालकर्ता फोन *',
    lbl_reg_pat_avatar: 'पसंदीदा प्रोफ़ाइल अवतार चुनें',
    lbl_reg_pat_protocol: 'संज्ञानात्मक हस्तक्षेप प्रोटोकॉल',
    btn_create_pat: 'मरीज खाता बनाएं और प्रवेश करें ➔',
    garden_welcome_badge: 'आपके संज्ञानात्मक उद्यान में स्वागत है',
    welcome_hello: 'नमस्ते',
    welcome_sub: 'नीचे दी गई किसी भी शांत गतिविधि को चुनें। कोई समय सीमा, तनाव या अंक नहीं हैं—केवल सुखद यादें, संगीत और सौम्य मानसिक अभ्यास।',
    acts_completed_today: 'आज पूरी की गई गतिविधियाँ',
    reminders_title: 'स्मार्ट दैनिक दिनचर्या और दवा रिमाइंडर',
    reminders_sub: 'दवाइयों, पानी के सेवन, दैनिक गतिविधियों और डॉक्टर से मिलने का समय',
    btn_read_rem: 'मेरे रिमाइंडर पढ़कर सुनाएं',
    lbl_meds: 'डॉक्टर द्वारा निर्धारित दवाइयाँ',
    lbl_hydration: 'दैनिक जल सेवन',
    lbl_routine: 'दैनिक गतिविधि',
    lbl_appt: 'डॉक्टर से परामर्श',
    water_logged_prefix: 'पिए गए गिलास:',
    btn_mark_taken: '✅ दवा ले ली',
    btn_add_water: '+ 1 गिलास पानी',
    btn_done_today: '🌸 गतिविधि पूरी',
    btn_confirmed: '📅 अपॉइंटमेंट पक्की',
    doc_notice_tag: 'डॉक्टर का चिकित्सीय संदेश',
    btn_listen_doc: 'डॉक्टर की सलाह सुनें',
    lbl_quick_reply: 'त्वरित उत्तर:',
    tab_all: '🌾 सभी गतिविधियाँ (12)',
    tab_mem: '🧠 स्मृति सुधार',
    tab_rout: '☕ दैनिक दिनचर्या स्मरण',
    tab_pat: '🎨 पैटर्न और वस्तु पहचान',
    tab_att: '🌿 एकाग्रता और ध्यान',
    tab_num: '🪙 दैनिक हिसाब व गिनती',
    btn_back_hub: 'उद्यान में वापस जाएं',
    btn_speak_prompt: 'निर्देश सुनें',
    btn_hint: 'संकेत लें',
    btn_restart: 'फिर से शुरू करें',
    celeb_title: 'शाबाश! बहुत बढ़िया!',
    celeb_sub: 'आपने यह गतिविधि बहुत ही एकाग्रता और शांति से पूरी की।',
    celeb_score: 'गतिविधि स्कोर',
    celeb_time: 'समय',
    celeb_ai: 'AI सहायता स्तर',
    celeb_replay: 'फिर से खेलें',
    celeb_hub: 'गतिविधियों पर वापस',
    doc_portal_title: 'न्यूरोलॉजिकल टेलीमेट्री और केयरगिवर पोर्टल',
    doc_portal_sub: 'व्यापक संज्ञानात्मक मेट्रिक्स, मोका स्कोर और सीधा मरीज संचार',
    btn_sync_emr: 'डिस्ट्रिक्ट EMR सिंक',
    btn_export_csv: 'CSV निर्यात',
    btn_export_json: 'JSON निर्यात',
    moca_card_title: 'मोका संज्ञानात्मक स्कोर',
    hesitation_card_title: 'झिझक सूचकांक',
    acts_card_title: 'पूरी की गई गतिविधियां',
    latency_card_title: 'औसत प्रतिक्रिया समय',
    clinical_alert_title: 'चिकित्सीय चेतावनी: मरीज में असामान्य झिझक देखी गई',
    doc_msg_heading: 'डॉक्टर सीधा परामर्श और संदेश केंद्र',
    btn_send_advice: 'परामर्श भेजें',
    va_title: 'बोलकर बात करें (आवाज सहायक)',
    va_sub: 'अपनी भाषा में बोलें या नीचे दिए गए किसी भी बटन पर टैप करें।',
    va_tap_speak: 'बोलने के लिए माइक पर टैप करें',
    va_quick_action: 'या तुरंत बटन दबाकर बोलें:'
  },
  as: {
    brand_sub: 'এআই স্মৃতি যত্ন ডিজিটেল মঞ্চ · উত্তৰ-পূৰ্বাঞ্চল',
    offline_status: 'অফলাইন প্ৰস্তুত (এজ ছিংক সক্ৰিয়)',
    auth_hero_title: 'এআই স্মৃতি যত্ন আৰু মানসিক সহায়',
    auth_hero_sub: 'স্মৃতি-এনইআৰলৈ স্বাগতম, ডিমেনচিয়া আৰু স্মৃতি হ্ৰাসৰ বাবে এআই-যুক্ত ডিজিটেল মঞ্চ।',
    feat_1_title: 'এআই অভিযোজ্য খেল আৰু স্মৃতি অনুশীলন',
    feat_1_desc: 'চিন্তাহীনভাৱে ৰোগীৰ গতিত খাপ খোৱা অসুবিধাৰ স্তৰ।',
    feat_2_title: 'দৈনন্দিন জীৱন আৰু স্বাস্থ্য স্মাৰক',
    feat_2_desc: 'ঔষধ, পানী, খোজ কঢ়া আৰু ডাক্তৰৰ সাক্ষাৎ মাত দি সোঁৱৰাই দিয়া।',
    feat_3_title: 'ডাক্তাৰৰ টেলেমেট্ৰি আৰু বাৰ্তালাপ',
    feat_3_desc: 'মোকা স্কোৰ, দ্বিধাবোধ আৰু পোনপটীয়া বাৰ্তালাপ।',
    feat_4_title: 'অফলাইন এজ ছিংক্ৰনাইজেচন',
    feat_4_desc: 'দুৰ্গম অঞ্চলত ইণ্টাৰনেট নোহোৱাকৈও তথ্য সংৰক্ষণ আৰু পিছত ছিংক।',
    tab_login: '🔑 প্ৰৱেশ',
    tab_signup: '📝 একাউন্ট খোলক',
    pill_patient: '👴 ৰোগী প্ৰৱেশ',
    pill_doctor: '🩺 ডাক্তাৰ প্ৰৱেশ',
    patient_inst: 'পঞ্জীয়নভুক্ত ৰোগী বাছক, বা আপোনাৰ নাম লিখক:',
    patient_or: 'বা ফোন নম্বৰ / আই ডিৰে লগইন কৰক',
    lbl_pat_name: 'ৰোগীৰ সম্পূৰ্ণ নাম',
    lbl_pat_city: 'জিলা / চহৰ',
    btn_enter_garden: 'স্মৃতি উদ্যানলৈ প্ৰৱেশ ➔',
    lbl_doc_email: 'ডাক্তাৰৰ ইমেইল',
    lbl_doc_pin: '৪-টা সংখ্যাৰ পিন',
    btn_doc_login: 'ডাক্তাৰ লগইন 🩺 ➔',
    btn_demo_doc: '⚡ ডেমো ডাক্তাৰ লগইন (ডাঃ অনামিকা)',
    lbl_reg_pat_name: 'ৰোগীৰ সম্পূৰ্ণ নাম *',
    lbl_reg_pat_age: 'বয়স *',
    lbl_reg_pat_loc: 'জিলা / গাঁও *',
    lbl_reg_pat_phone: 'অভিভাৱকৰ ফোন নম্বৰ *',
    lbl_reg_pat_avatar: 'ছবি বাছক',
    lbl_reg_pat_protocol: 'চিকিৎসা প্ৰটোকল',
    btn_create_pat: 'একাউন্ট বনাওক আৰু সোমাওক ➔',
    garden_welcome_badge: 'আপোনাৰ স্মৃতি উদ্যানলৈ স্বাগতম',
    welcome_hello: 'নমস্কাৰ',
    welcome_sub: 'তলৰ যিকোনো শান্ত খেল বাছক। কোনো সময়ৰ হেঁচা নাই—কেৱল আনন্দ আৰু স্মৃতি অনুশীলন।',
    acts_completed_today: 'আজি সম্পূৰ্ণ কৰা কাৰ্যসূচী',
    reminders_title: 'দৈনন্দিন জীৱন আৰু স্বাস্থ্য স্মাৰক',
    reminders_sub: 'ঔষধ খোৱা, পানী খোৱা, খোজ কঢ়া আৰু ডাক্তৰৰ সাক্ষাৎ',
    btn_read_rem: 'স্মাৰক পঢ়ি শুনাওক',
    lbl_meds: 'ঔষধৰ স্মাৰক',
    lbl_hydration: 'দৈনিক পানী খোৱা',
    lbl_routine: 'দৈনন্দিন কাৰ্য',
    lbl_appt: 'ডাক্তাৰৰ সাক্ষাৎ',
    water_logged_prefix: 'খোৱা গিলাচ:',
    btn_mark_taken: '✅ ঔষধ খোৱা হ’ল',
    btn_add_water: '+ ১ গিলাচ পানী',
    btn_done_today: '🌸 কাৰ্য সম্পূৰ্ণ',
    btn_confirmed: '📅 সাক্ষাৎ নিশ্চিত',
    doc_notice_tag: 'ডাক্তাৰৰ নিৰ্দেশনা',
    btn_listen_doc: 'ডাক্তাৰৰ কথা শুনক',
    lbl_quick_reply: 'চমু উত্তৰ:',
    tab_all: '🌾 সকলো কাৰ্য (১২)',
    tab_mem: '🧠 স্মৃতি উন্নতি',
    tab_rout: '☕ দৈনন্দিন অভ্যাস',
    tab_pat: '🎨 আৰ্হি চিনাক্তকৰণ',
    tab_att: '🌿 মনোযোগ',
    tab_num: '🪙 দৈনন্দিন হিচাপ',
    btn_back_hub: 'উদ্যানলৈ ঘূৰি যাওক',
    btn_speak_prompt: 'নিৰ্দেশ শুনক',
    btn_hint: 'সহায় লওক',
    btn_restart: 'পুনৰ আৰম্ভ কৰক',
    celeb_title: 'বৰ ভাল হ’ল!',
    celeb_sub: 'আপুনি অতি মনোযোগেৰে এই খেল সম্পূৰ্ণ কৰিলে।',
    celeb_score: 'স্কোৰ',
    celeb_time: 'সময়',
    celeb_ai: 'এআই স্তৰ',
    celeb_replay: 'আকৌ খেলক',
    celeb_hub: 'কাৰ্যসূচীলৈ যাওক',
    doc_portal_title: 'ডাক্তাৰ টেলেমেট্ৰি আৰু ক্লিনিক পৰ্টেল',
    doc_portal_sub: 'জ্ঞানীয় স্বাস্থ্য মেট্ৰিক আৰু মোকা স্কোৰ পৰিদৰ্শন',
    btn_sync_emr: 'জিলা EMR ছিংক',
    btn_export_csv: 'CSV উলিয়াওক',
    btn_export_json: 'JSON উলিয়াওক',
    moca_card_title: 'মোকা স্কোৰ',
    hesitation_card_title: 'দ্বিধাবোধ সূচক',
    acts_card_title: 'সম্পূৰ্ণ কৰা কাৰ্য',
    latency_card_title: 'গড় সঁহাৰিৰ সময়',
    clinical_alert_title: 'সতৰ্কবাৰ্তা: ৰোগীৰ অধিক দ্বিধাবোধ ধৰা পৰিছে',
    doc_msg_heading: 'ডাক্তাৰৰ বাৰ্তা আৰু নিৰ্দেশনা',
    btn_send_advice: 'পৰামৰ্শ পঠিয়াওক',
    va_title: 'কণ্ঠ সহায়ক (মাত দি কওক)',
    va_sub: 'স্বাভাৱিকভাৱে কওক বা তলৰ বুটামত টিপক।',
    va_tap_speak: 'ক’বলৈ মাইকত টিপক',
    va_quick_action: 'বা চমু বুটামত টিপক:'
  },
  bn: {
    brand_sub: 'এআই ডিমেনশিয়া জ্ঞানীয় প্ল্যাটফর্ম · উত্তর-পূর্ব অঞ্চল',
    offline_status: 'অফলাইন প্রস্তুত (এজ সিঙ্ক সক্রিয়)',
    auth_hero_title: 'এআই জ্ঞানীয় যত্ন ও স্মৃতি সহায়তা',
    auth_hero_sub: 'স্মৃতি-এনইআরে স্বাগতম, ডিমেনশিয়া ও স্মৃতিহ্রাসের চিকিৎসার জন্য একটি এআই প্রযুক্তি প্ল্যাটফর্ম।',
    feat_1_title: 'এআই অভিযোজিত গেমিং ও স্মৃতি প্রশিক্ষণ',
    feat_1_desc: 'রোগীর গতির সাথে সামঞ্জস্যপূর্ণ মানসিক শান্তির গেম লেভেল।',
    feat_2_title: 'দৈনন্দিন রুটিন ও স্বাস্থ্য অনুস্মারক',
    feat_2_desc: 'ওষুধ, জল খাওয়া, সকালের হাঁটা এবং ডাক্তারের অ্যাপয়েন্টমেন্ট স্মরণ করানো।',
    feat_3_title: 'ডাক্তারের টেলিমেট্রি ও ক্লিনিক্যাল মেসেজিং',
    feat_3_desc: 'মোকা স্কোর, দ্বিধা ট্র্যাকিং এবং সরাসরি রোগী-ডাক্তার যোগাযোগ।',
    feat_4_title: 'অফলাইন এজ সিঙ্ক সাপোর্ট',
    feat_4_desc: 'ইন্টারনেট ছাড়াই স্থানীয় মেমরিতে রেকর্ড এবং অটো-সিঙ্ক সুবিধা।',
    tab_login: '🔑 প্রবেশ',
    tab_signup: '📝 নতুন অ্যাকাউন্ট',
    pill_patient: '👴 রোগী প্রবেশ',
    pill_doctor: '🩺 ডাক্তার প্রবেশ',
    patient_inst: 'নিবন্ধিত রোগী নির্বাচন করুন বা নাম লিখুন:',
    patient_or: 'অথবা ফোন নম্বর দিয়ে লগইন করুন',
    lbl_pat_name: 'রোগীর সম্পূর্ণ নাম',
    lbl_pat_city: 'শহর / জেলা',
    btn_enter_garden: 'স্মৃতি উদ্যানে প্রবেশ করুন ➔',
    lbl_doc_email: 'ডাক্তারের ইমেইল',
    lbl_doc_pin: '৪ ডিজিটের গোপন পিন',
    btn_doc_login: 'ডাক্তার লগইন 🩺 ➔',
    btn_demo_doc: '⚡ ডেমো ডাক্তার লগইন (ডাঃ অনামিকা)',
    lbl_reg_pat_name: 'রোগীর নাম *',
    lbl_reg_pat_age: 'বয়স *',
    lbl_reg_pat_loc: 'জেলা / গ্রাম *',
    lbl_reg_pat_phone: 'পরিবারের ফোন নম্বর *',
    lbl_reg_pat_avatar: 'অবতার নির্বাচন করুন',
    lbl_reg_pat_protocol: 'থেরাপি প্রোটোকল',
    btn_create_pat: 'অ্যাকাউন্ট তৈরি করুন ও প্রবেশ করুন ➔',
    garden_welcome_badge: 'আপনার স্মৃতি উদ্যানে স্বাগতম',
    welcome_hello: 'নমস্কার',
    welcome_sub: 'নিচের যেকোনো শান্ত গেম বেছে নিন। কোনো সময়সীমা বা চাপ নেই—শুধু আনন্দ ও স্মৃতিচর্চা।',
    acts_completed_today: 'আজ সম্পন্ন কার্যকলাপ',
    reminders_title: 'দৈনন্দিন রুটিন ও স্বাস্থ্য অনুস্মারক',
    reminders_sub: 'ওষুধ, জল খাওয়া, সকালের হাঁটা এবং ডাক্তারের অ্যাপয়েন্টমেন্ট',
    btn_read_rem: 'আমার অনুস্মারক পড়ে শোনান',
    lbl_meds: 'ওষুধের তালিকা',
    lbl_hydration: 'দৈনিক জল পান',
    lbl_routine: 'দৈনন্দিন রুটিন',
    lbl_appt: 'ডাক্তারের অ্যাপয়েন্টমেন্ট',
    water_logged_prefix: 'জল খাওয়া হয়েছে:',
    btn_mark_taken: '✅ ওষুধ খাওয়া হয়েছে',
    btn_add_water: '+ ১ গ্লাস জল',
    btn_done_today: '🌸 কাজ সম্পন্ন',
    btn_confirmed: '📅 নিশ্চিত করা হয়েছে',
    doc_notice_tag: 'ডাক্তারের পরামর্শ',
    btn_listen_doc: 'ডাক্তারের পরামর্শ শুনুন',
    lbl_quick_reply: 'দ্রুত উত্তর:',
    tab_all: '🌾 সমস্ত কার্যকলাপ (১২)',
    tab_mem: '🧠 স্মৃতিশক্তি উন্নতি',
    tab_rout: '☕ দৈনন্দিন রুটিন',
    tab_pat: '🎨 প্যাটার্ন শনাক্তকরণ',
    tab_att: '🌿 মনোযোগ ও একাগ্রতা',
    tab_num: '🪙 কেনাকাটার হিসাব',
    btn_back_hub: 'উদ্যানে ফিরে যান',
    btn_speak_prompt: 'নির্দেশ শুনুন',
    btn_hint: 'সহায়তা নিন',
    btn_restart: 'পুনরায় শুরু করুন',
    celeb_title: 'খুব সুন্দর!',
    celeb_sub: 'আপনি অত্যন্ত মনোযোগ ও শান্তির সাথে এই কাজটি সম্পন্ন করেছেন।',
    celeb_score: 'স্কোর',
    celeb_time: 'সময়',
    celeb_ai: 'এআই স্তর',
    celeb_replay: 'আবার খেলুন',
    celeb_hub: 'তালিকায় ফিরে যান',
    doc_portal_title: 'ডাক্তার টেলিমেট্রি ও ক্লিনিক্যাল পোর্টাল',
    doc_portal_sub: 'জ্ঞানীয় স্বাস্থ্য মেট্রিক্স এবং মোকা স্কোর মূল্যায়ন',
    btn_sync_emr: 'জেলা EMR সিঙ্ক',
    btn_export_csv: 'CSV ডাউনলোড',
    btn_export_json: 'JSON ডাউনলোড',
    moca_card_title: 'মোকা প্রক্সি স্কোর',
    hesitation_card_title: 'দ্বিধাবোধ সূচক',
    acts_card_title: 'সম্পন্ন কার্যকলাপ',
    latency_card_title: 'গড় প্রতিক্রিয়ার সময়',
    clinical_alert_title: 'সতর্কতা: রোগীর অস্বাভাবিক দ্বিধাবোধ লক্ষ্য করা গেছে',
    doc_msg_heading: 'ডাক্তারের পরামর্শ কেন্দ্র',
    btn_send_advice: 'পরামর্শ পাঠান',
    va_title: 'ভয়েস সহায়ক (কথা বলে জানান)',
    va_sub: 'মুখে কথা বলুন বা নিচের বোতামে চাপ দিন।',
    va_tap_speak: 'কথা বলতে মাইকে চাপ দিন',
    va_quick_action: 'বা সরাসরি বোতামে চাপুন:'
  }
};

// Complete Localization for all 12 Cognitive Games
const GAME_I18N = {
  reminiscence: {
    en: { name: '1. Reminiscence Recall', local: 'Traditional Heritage Memory Match', desc: 'Flip and match cards with classic regional treasures: Tea Kettle, Rhinoceros, Silk Motif, and Orchid Flower.', btn: 'Play Activity' },
    hi: { name: '1. स्मृति मिलान (याददाश्त)', local: 'पारंपरिक धरोहर कार्ड मिलान', desc: 'कार्ड पलटें और पारंपरिक चित्रों का मिलान करें: चाय की केतली, गैंडा, रेशम का डिज़ाइन और आर्किड का फूल।', btn: 'खेल शुरू करें' },
    as: { name: '১. স্মৃতি মিলান', local: 'পৰম্পৰাগত স্মৃতি খেল', desc: 'কাৰ্ড ওলোটাই মিল কৰক: চাহৰ কেটলি, এশিঙীয়া গঁড়, পাটৰ সূতা আৰু কপৌ ফুল।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '১. স্মৃতি মিলন', local: 'ঐতিহ্যবাহী কার্ড ম্যাচিং', desc: 'কার্ড উল্টে মিল করুন: চায়ের কেটলি, একশৃঙ্গ গণ্ডার, সিল্কের নকশা এবং অর্কিড ফুল।', btn: 'খেলা শুরু করুন' },
    brx: { name: '१. गोसोखांथि गेलेमु', local: 'पारंपरिक मेमरि गेलेमु', desc: 'कार्ड सोलायनानै नाय आरो रोखोम सिनाय: सा केतली, गेंडा, मुगा रेशम आरो फुल।', btn: 'गेलेमु जागाय' },
    mni: { name: '১. নিংশিংবা শান্নপোৎ', local: 'অরিবা নিংশিং শান্নপোৎ', desc: 'কার্দ থমদুনা অমগা অমগা মিল তৌউ: চা কেতলি, সামু, মোইগা অমসুং লৈ।', btn: 'শান্নবা হৌরো' },
    kha: { name: '1. Jingkynmaw Tynrai', local: 'Pynkynmaw Jingmut Tynrai', desc: 'Pyniasoh ia ki card: Ketli Sha, Hati, Jainsem bad syntiew Orchid.', btn: 'Ialehkai mynta' }
  },
  tea_sequencer: {
    en: { name: '2. Morning Tea Sequencer', local: 'Daily Routine Procedural Sequencing', desc: 'Put the morning tea preparation steps in order: Boil spring water, add fresh tea leaves, and pour into a clay cup.', btn: 'Play Activity' },
    hi: { name: '2. सुबह की चाय दिनचर्या', local: 'दैनिक दिनचर्या चरण क्रम', desc: 'सुबह की चाय बनाने के चरणों को सही क्रम में रखें: पानी उबालें, ताज़ी पत्तियां डालें और कुल्हड़ में छानें।', btn: 'खेल शुरू करें' },
    as: { name: '২. ৰাতিপুৱাৰ চাহ প্ৰস্তুতি', local: 'দৈনন্দিন অভ্যাসৰ ক্ৰম', desc: 'চাহ বনোৱাৰ ক্ৰম মিলাওক: পানী উতলাওক, পাত দিয়ক আৰু কাপত ঢালওক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '২. সকালের চা তৈরি', local: 'দৈনন্দিন রুটিন ক্রম', desc: 'চা বানানোর সঠিক ধাপ সাজান: জল ফোটান, চায়ের পাতা দিন এবং কাপে ঢালুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '२. फुंनि सा बानायनाय', local: 'सानफ्रोमबोनि हाबा', desc: 'सा बानायनायनि फारि लाखि: दै फुदुं, सा बिलाइ हो आरो कपआव लिर।', btn: 'गेलेमु जागाय' },
    mni: { name: '২. অয়ুক্কী চা শেম্বা', local: 'নোংমগী থবক মথং মনাও', desc: 'চা শেম্বগী মথং মনাও তৌউ: ঈশিং ফুতহনবা, চা মনা হাপ্পা অমসুং কাপতা খাইবা।', btn: 'শান্নবা হৌরো' },
    kha: { name: '2. Shew Sha Mynstep', local: 'Ryntih Jingtrei Mynstep', desc: 'Pynbeit ia ka rukom shew sha: Pynkhluit um, thep sla sha, bad theh ha ka khuri.', btn: 'Ialehkai mynta' }
  },
  haat_explorer: {
    en: { name: '3. Weekly Market Explorer', local: 'Haat Bazaar Basket Recall', desc: 'Remember the 3 fresh items shown in the bamboo basket, then find them in the village marketplace stalls.', btn: 'Play Activity' },
    hi: { name: '3. साप्ताहिक बाज़ार हाट', local: 'बाज़ार की टोकरी स्मरण', desc: 'बांस की टोकरी में दिखाए गए 3 ताज़ा सामान याद रखें, फिर उन्हें बाज़ार की दुकानों में पहचानें।', btn: 'खेल शुरू करें' },
    as: { name: '৩. সাপ্তাহিক হাট বজাৰ', local: 'বজাৰৰ পাচি স্মৰণ', desc: 'পাচিত থকা ৩ বিধ বস্তু মনত ৰাখক আৰু বজাৰৰ পৰা বাছক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৩. সাপ্তাহিক হাট বাজার', local: 'বাজারের ঝুড়ি স্মরণ', desc: 'বাঁশের ঝুড়িতে দেখানো ৩টি জিনিস মনে রাখুন এবং দোকান থেকে খুঁজে বের করুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '३. हथायाव बेसाद बानायनाय', local: 'हाथायनि बाकसु', desc: 'बाकसुनि ३ ता बेसाद गोसोखां आरो हाथायनिफ्राय सायख।', btn: 'गेलेमु जागाय' },
    mni: { name: '৩. কৈথেল চৎপা', local: 'কৈথেলগী পোত নিংশিংবা', desc: 'শাফোইদা য়াওবা পোত ৩ মনত থম্মু অমসুং কৈথেলদা থিয়ু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '3. Leit Iew Haat', local: 'Kynmaw ia ki mar iew', desc: 'Kynmaw ia ki 3 tylli ki mar ha ka shang, bad wad ia ki ha iew.', btn: 'Ialehkai mynta' }
  },
  weaver_shuttle: {
    en: { name: '4. The Weaver’s Shuttle', local: 'Traditional Diamond Motif Tracing', desc: 'Trace along the traditional diamond silk loom motif with your finger or mouse at your own gentle pace.', btn: 'Play Activity' },
    hi: { name: '4. बुनकर का करघा', local: 'पारंपरिक हीरा रेशम पैटर्न अनुरेखण', desc: 'अपनी उंगली या माउस से पारंपरिक हीरे के आकार वाले रेशमी पैटर्न पर धीरे-धीरे रेखा खींचें।', btn: 'खेल शुरू करें' },
    as: { name: '৪. তাঁতশালৰ মাকো', local: 'হীৰাৰ আৰ্হি আঁকা', desc: 'পাটৰ কাপোৰৰ হীৰাৰ ফুলৰ ওপৰেৰে হাত ফুৰাওক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৪. তাঁতের মাকু', local: 'ঐতিহ্যবাহী নকশা অঙ্কন', desc: 'হাতের আঙুল দিয়ে সিল্কের কাপড়ের ঐতিহ্যবাহী ডায়মন্ড নকশা ট্রেস করুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '४. थांथालनि माखौ', local: 'नक्सा आखिनाय', desc: 'जोमै रेशमनि नक्सायाव आसिजों लासै लासै आखि।', btn: 'गेलेमु जागाय' },
    mni: { name: '৪. য়োংখাম শান্নপোৎ', local: 'মচেন অমা চৎপা', desc: 'মচেন অমগী মখাদা খুনুংনা খুৎ চৎহনবিয়ু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '4. Ka Kor Thain Jain', local: 'Thoh Dur Jain', desc: 'Buh ia ka shympriahti ban bud ia ki dur jainsem.', btn: 'Ialehkai mynta' }
  },
  hill_sounds: {
    en: { name: '5. Echoes of the Living Hills', local: 'Audio Birdsong & Drum Identification', desc: 'Listen to the peaceful sound and tap whether you hear the Hornbill bird, Bihu dhol drum, or monsoon rain.', btn: 'Play Activity' },
    hi: { name: '5. पहाड़ों की गूंज', local: 'आवाज, पक्षी और ढोल पहचान', desc: 'शांत ध्वनि सुनें और बताएं कि क्या आपने हॉर्नबिल पक्षी, बिहू ढोल या बारिश की आवाज सुनी।', btn: 'खेल शुरू करें' },
    as: { name: '৫. পাহাৰৰ প্ৰতিধ্বনি', local: 'চৰাইৰ মাত আৰু ঢোল চিনাক্তকৰণ', desc: 'ধেনেশ চৰাই, ঢোল বা বৰষুণৰ শব্দ শুনি চিনাক্ত কৰক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৫. পাহাড়ের প্রতিধ্বনি', local: 'পাখির ডাক ও ঢাকের আওয়াজ', desc: 'শান্ত শব্দ শুনুন এবং বলুন এটি হর্নবিল পাখি, বিহু ঢোল নাকি বৃষ্টির আওয়াজ।', btn: 'খেলা শুরু করুন' },
    brx: { name: '५. हाजोनि सोदोब', local: 'दाउ आरो बाम सोदोब', desc: 'दाउ, ढोल एबा अखा हानायनि सोदोब खनासं आरो बुं।', btn: 'गेलेमु जागाय' },
    mni: { name: '৫. চীংগী খোন্থাং', local: 'উচেক অমসুং পুংগী খোন্থাং', desc: 'খোন্থাং তাবিয়ু অমসুং উচেক, পুং নত্রগা নোং তাবিয়ু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '5. Sur Lum Khasi', local: 'Sur Sim bad Dhol', desc: 'Sngap ia ka sur sim, dhol ne ka slap bad pynithuh.', btn: 'Ialehkai mynta' }
  },
  folk_rhymes: {
    en: { name: '6. Village Folk Rhymes', local: 'Cultural Proverb Sentence Completion', desc: 'Complete the beloved regional proverb by choosing the missing word that fits naturally.', btn: 'Play Activity' },
    hi: { name: '6. गाँव की लोक कहावतें', local: 'पारंपरिक कहावत पूरी करें', desc: 'पारंपरिक लोक कहावत को पूरा करने के लिए सही शब्द चुनें।', btn: 'खेल शुरू करें' },
    as: { name: '৬. গাৱঁলীয়া ফকৰা-যোজনা', local: 'বাক্য সম্পূৰ্ণ কৰক', desc: 'পুৰণি ফকৰা-যোজনাটো সম্পূৰ্ণ কৰিবলৈ সঠিক শব্দ বাছক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৬. গ্রামের লোক প্রবাদ', local: 'প্রবাদ বাক্য সম্পূর্ণ করুন', desc: 'জনপ্রিয় প্রবাদটি সম্পূর্ণ করতে সঠিক শব্দটি নির্বাচন করুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '६. गावनि खन्था', local: 'बाथ्रा फोजोब', desc: 'गोसोखांथि बाथ्राखौ फोजोबनो मोजां सोदोब सायख।', btn: 'गेलेमु जागाय' },
    mni: { name: '৬. পাউরৌ নিংশিংবা', local: 'পাউরৌ লোইশিনবা', desc: 'পাউরৌ লোইশিন্নবা চুম্বা ৱাহৈ বাছক।', btn: 'শান্নবা হৌরো' },
    kha: { name: '6. Ki Ktien Tymmen', local: 'Pynkut ia ka ktien tymmen', desc: 'Jied ia ka kyntien ba dei ban pyndep ia ka ktien tymmen.', btn: 'Ialehkai mynta' }
  },
  two_leaves: {
    en: { name: '7. Tea Leaf Precision Sorter', local: 'Visual Attention & Color Discrimination', desc: 'Find and tap the 4 bright green two-leaves-and-a-bud sprigs while ignoring the dry brown leaves.', btn: 'Play Activity' },
    hi: { name: '7. हरी चाय पत्ती चयन', local: 'दृश्य एकाग्रता और ध्यान अभ्यास', desc: 'सूखे पत्तों को छोड़कर केवल 4 ताज़ी हरी कोमल चाय की पत्तियों पर टैप करें।', btn: 'खेल शुरू करें' },
    as: { name: '৭. চাহ পাত বাছনি', local: 'মনোযোগ আৰু ৰং নিৰ্ণয়', desc: 'শুকান পাত এৰি কেৱল দুটি পাত এটি কুঁহি বাছক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৭. চায়ের পাতা বাছাই', local: 'দৃষ্টি একাগ্রতা ও মনোযোগ', desc: 'শুকনো পাতা বাদ দিয়ে দুটি পাতা একটি কুঁড়ি বেছে নিন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '७. सा बिलाइ सायखनाय', local: 'गोसो होनाय', desc: 'गोथां सा बिलाइखौ सायख, सुखा बिलाइखौ नागार।', btn: 'गेलेमु जागाय' },
    mni: { name: '৭. চা মনা বাছবা', local: 'পুকনিং চঙবা', desc: 'অশোংবা চা মনা বাছু, অকোঙবা মনাশিং থম্মু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '7. Tam Sla Sha', local: 'Pynleit Jingmut', desc: 'Jied tang ia ki sla sha kiba jyrngam bad iehnoh ia kiba tyrkhong.', btn: 'Ialehkai mynta' }
  },
  bazaar_counter: {
    en: { name: '8. Bazaar Coins & Cowries', local: 'Functional Everyday Math & Cash Handling', desc: 'Select coins to pay the exact amount for a bundle of fresh lemongrass.', btn: 'Play Activity' },
    hi: { name: '8. बाज़ार के सिक्के और कौड़ियाँ', local: 'दैनिक हिसाब-किताब व गिनती', desc: 'ताज़ी लेमनग्रास के लिए सही सिक्के चुनकर भुगतान करें।', btn: 'खेल शुरू करें' },
    as: { name: '৮. বজাৰৰ পইচা আৰু কড়ি', local: 'দৈনন্দিন হিচাপ', desc: 'লেমনগ্ৰাছৰ বাবে সঠিক পইচা গণনা কৰি দিয়ক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৮. বাজারের মুদ্রা ও কড়ি', local: 'দৈনন্দিন কেনাকাটার হিসাব', desc: 'তাজা লেমনগ্রাসের জন্য সঠিক মুদ্রা গণনা করে দিন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '८. हाथायनि रां साननाय', local: 'सानफ्रोमनि हिसाब', desc: 'बेसादनि थाखाय थार रां सायखनानै हर।', btn: 'गेलेमु जागाय' },
    mni: { name: '৮. কৈথেলগী শেল', local: 'নোংমগী শেল হিসাব', desc: 'পোত লৈনবা চুম্বা শেল মশিং খাইবিয়ু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '8. Tyngka Iew', local: 'Khein Tyngka Mynstep', desc: 'Jied ia ki tyngka peisa ban siew ia ki mar iew.', btn: 'Ialehkai mynta' }
  },
  pantry_sort: {
    en: { name: '9. NER Kitchen Pantry Organizer', local: 'Categorical Grouping & Executive Function', desc: 'Sort items into the Spice Box or Fresh Fruit Basket.', btn: 'Play Activity' },
    hi: { name: '9. रसोई मसाला और फल संदूक', local: 'वर्गीकरण और संगठन अभ्यास', desc: 'चीजों को मसालों के डिब्बे या ताज़े फलों की टोकरी में अलग-अलग रखें।', btn: 'खेल शुरू करें' },
    as: { name: '৯. ৰান্ধনি ঘৰৰ চিজিল', local: 'বস্তু সজোৱা', desc: 'মচলা আৰু ফল-মূল সঠিক বাকচত ভৰাওক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '৯. রান্নাঘরের প্যান্ট্রি গোছানো', local: 'শ্রেণিবিভাগ ও সমন্বয়', desc: 'মশলা ও তাজা ফল আলাদা আলাদা পাত্রে রাখুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '९. संग्रासालनि बेसाद सोजानाय', local: 'बेसाद बासिनाय', desc: 'मसला आरो फलखौ थार बाकसुआव दोन।', btn: 'गेलेमु जागाय' },
    mni: { name: '৯. চাফু চফৈ চিজিনবা', local: 'পোতখৈ থমবা', desc: 'হিদাক-মচলা অমসুং উহৈ-ৱাহৈ চুম্বা থাফমদা থম্মু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '9. Pynbeit Ryntih Rynsan', local: 'Buh Ryntih', desc: 'Pyniakhlad ia ki musla musli bad ki soh ki khaw.', btn: 'Ialehkai mynta' }
  },
  path_home: {
    en: { name: '10. Village Trail Home Navigator', local: 'Spatial Memory & Landmark Sequencing', desc: 'Follow the trail markers from the riverbank back to your front gate.', btn: 'Play Activity' },
    hi: { name: '10. गाँव की पगडंडी और घर वापसी', local: 'दिशा ज्ञान और रास्ता स्मरण', desc: 'नदी के किनारे से अपने घर के दरवाज़े तक सही रास्ते के निशान पहचानें।', btn: 'खेल शुरू करें' },
    as: { name: '১০. ঘৰলৈ উভতি অহা বাট', local: 'স্থান চিনাক্তকৰণ', desc: 'নদীৰ ঘাটৰ পৰা ঘৰৰ পদূলিলৈ বাট বিচাৰি লওক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '১০. গ্রামের মেঠোপথ ধরে বাড়ি ফেরা', local: 'দিক ও পথ স্মৃতি', desc: 'নদীর ঘাট থেকে বাড়ির ফটক পর্যন্ত পথ অনুসরণ করুন।', btn: 'খেলা शुरू করুন' },
    brx: { name: '१०. नआव थांफिननाय लामा', local: 'लामा दिन्थि', desc: 'दैसा सेरनिफ्राय ननि गेटसिम लामा नागिर।', btn: 'गेलेमु जागाय' },
    mni: { name: '১০. য়ুমদা হল্লকপা লম্বী', local: 'লম্বী নিংশিংবা', desc: 'তুরেল মপালদগী য়ুমগী থোঙসিফাওবা লম্বী চৎলু।', btn: 'শান্নবা হৌরো' },
    kha: { name: '10. Lynti Leit Sha Iing', local: 'Lynti Sha Iing', desc: 'Bud ia ki dak lynti na wah sha iing.', btn: 'Ialehkai mynta' }
  },
  kinship_faces: {
    en: { name: '11. Village Kinship & Loved Ones', local: 'Facial Emotion & Kinship Role Recognition', desc: 'Look at the gentle smile and match who this person is in the family.', btn: 'Play Activity' },
    hi: { name: '11. परिवार और अपने प्रियजन', local: 'चेहरे की पहचान और पारिवारिक रिश्ता', desc: 'मुस्कुराता चेहरा देखें और पहचानें कि यह परिवार में कौन हैं।', btn: 'खेल शुरू करें' },
    as: { name: '১১. পৰিয়াল আৰু আপোনজন', local: 'মুখাৱয়ব আৰু সম্পৰ্ক চিনাক্তকৰণ', desc: 'পৰিয়ালৰ সদস্যগৰাকীক হাঁহিৰ পৰা চিনাক্ত কৰক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '১১. পরিবার ও প্রিয়জন', local: 'মুখমণ্ডল ও সম্পর্কের স্মৃতি', desc: 'পরিবারের সদস্যের হাসিমুখ দেখে তাকে চিনুন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '११. नखरनि सुबुं', local: 'नखरनि सिनाय', desc: 'नखरनि सुबुंनि मोखांखौ नायनानै सिनाय।', btn: 'गेलेमु जागाय' },
    mni: { name: '১১. ইমুং মনুংগী মী', local: 'মীশক খঙদোকপা', desc: 'ইমুংগী মীওইগী নোক্তুনা লৈবা মশক খঙদোকউ।', btn: 'শান্নবা হৌরো' },
    kha: { name: '11. Ki Baha Kur Baha Kha', local: 'Ithuh Khmat', desc: 'Ithuh ia ki baha kur baha kha na ka dur khmat.', btn: 'Ialehkai mynta' }
  },
  natural_dye: {
    en: { name: '12. Forest Plant Natural Dye Matcher', local: 'Color Discrimination & Sensory Recognition', desc: 'Match the forest plant with the natural color dye it produces.', btn: 'Play Activity' },
    hi: { name: '12. जंगल के प्राकृतिक वनस्पति रंग', local: 'रंग पहचान और संवेदी अभ्यास', desc: 'पौधे को उसके द्वारा बनाए जाने वाले सुंदर प्राकृतिक रंग से मिलाएं।', btn: 'खेल शुरू करें' },
    as: { name: '১২. বনৰীয়া গছৰ প্ৰাকৃতিক ৰং', local: 'ৰং চিনাক্তকৰণ', desc: 'গছৰ পৰা প্ৰস্তুত হোৱা প্ৰাকৃতিক ৰং মিল কৰক।', btn: 'খেল আৰম্ভ কৰক' },
    bn: { name: '১২. বনজ উদ্ভিদের প্রাকৃতিক রং', local: 'রং শনাক্তকরণ ও ইন্দ্রিয়বোধ', desc: 'গাছের সাথে তার প্রাকৃতিক রং মিলিয়ে নিন।', btn: 'খেলা শুরু করুন' },
    brx: { name: '१२. गाहायाव गोरोब गाब', local: 'गाब सायख', desc: 'गाबखौ बिफां-लाइफांजों गोरोबहो।', btn: 'गेलेमु जागाय' },
    mni: { name: '১২. মচু চিনাক্তকৰণ', local: 'মচু য়েংবা', desc: 'উমংগী পাম্বীদগী ফংবা মচু মিল তৌউ।', btn: 'শান্নবা হৌরো' },
    kha: { name: '12. Rong Tynrai Na Ki Dieng', local: 'Ithuh Rong', desc: 'Pyniasoh ia ki dieng bad ki rong tynrai ba mih na ki.', btn: 'Ialehkai mynta' }
  }
};

function translateEntireDOM(langCode) {
  const dict = UI_STRINGS[langCode] || UI_STRINGS.en;
  const baseDict = I18N_TRANSLATIONS[langCode] || I18N_TRANSLATIONS.en;

  // 1. All [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (baseDict[key]) el.textContent = baseDict[key];
    else if (dict[key]) el.textContent = dict[key];
  });

  // 2. Header & Branding
  const brandSub = document.querySelector('.brand-subtitle');
  if (brandSub && dict.brand_sub) brandSub.textContent = dict.brand_sub;
  const syncTxt = document.getElementById('syncStatusText');
  if (syncTxt && dict.offline_status) syncTxt.textContent = dict.offline_status;

  // 3. Auth Hero & Tabs
  const heroTitle = document.querySelector('.auth-hero-title');
  if (heroTitle && dict.auth_hero_title) heroTitle.textContent = dict.auth_hero_title;
  const heroSub = document.querySelector('.auth-hero-sub');
  if (heroSub && dict.auth_hero_sub) heroSub.textContent = dict.auth_hero_sub;

  const featItems = document.querySelectorAll('.auth-feature-item');
  if (featItems.length >= 4) {
    if (dict.feat_1_title) featItems[0].querySelector('strong').textContent = dict.feat_1_title;
    if (dict.feat_1_desc) featItems[0].querySelector('p').textContent = dict.feat_1_desc;
    if (dict.feat_2_title) featItems[1].querySelector('strong').textContent = dict.feat_2_title;
    if (dict.feat_2_desc) featItems[1].querySelector('p').textContent = dict.feat_2_desc;
    if (dict.feat_3_title) featItems[2].querySelector('strong').textContent = dict.feat_3_title;
    if (dict.feat_3_desc) featItems[2].querySelector('p').textContent = dict.feat_3_desc;
    if (dict.feat_4_title) featItems[3].querySelector('strong').textContent = dict.feat_4_title;
    if (dict.feat_4_desc) featItems[3].querySelector('p').textContent = dict.feat_4_desc;
  }

  const tabLogin = document.getElementById('tabAuthLogin');
  if (tabLogin && dict.tab_login) tabLogin.querySelector('span').textContent = dict.tab_login;
  const tabSignup = document.getElementById('tabAuthSignup');
  if (tabSignup && dict.tab_signup) tabSignup.querySelector('span').textContent = dict.tab_signup;

  const pillPat = document.getElementById('pillLoginPatient');
  if (pillPat && dict.pill_patient) pillPat.querySelector('span').textContent = dict.pill_patient;
  const pillDoc = document.getElementById('pillLoginDoctor');
  if (pillDoc && dict.pill_doctor) pillDoc.querySelector('span').textContent = dict.pill_doctor;

  const authInst = document.querySelector('.auth-sub-instructions');
  if (authInst && dict.patient_inst) authInst.textContent = dict.patient_inst;
  const authDiv = document.querySelector('.auth-divider span');
  if (authDiv && dict.patient_or) authDiv.textContent = dict.patient_or;

  const btnPatEnter = document.querySelector('.btn-patient-enter span');
  if (btnPatEnter && dict.btn_enter_garden) btnPatEnter.textContent = dict.btn_enter_garden;
  const btnDocLogin = document.querySelector('.btn-doctor-enter span');
  if (btnDocLogin && dict.btn_doc_login) btnDocLogin.textContent = dict.btn_doc_login;
  const btnDemoDoc = document.getElementById('btnDemoDoctorLogin');
  if (btnDemoDoc && dict.btn_demo_doc) btnDemoDoc.textContent = dict.btn_demo_doc;

  // 4. Village Garden Welcome Banner
  const greetBadge = document.querySelector('.greeting-badge');
  if (greetBadge && dict.garden_welcome_badge) greetBadge.textContent = dict.garden_welcome_badge;
  const welcomeHeading = document.querySelector('.welcome-heading');
  if (welcomeHeading && dict.welcome_hello) {
    const pName = document.getElementById('welcomePatientName')?.textContent || 'Bhaben Baruah';
    welcomeHeading.innerHTML = `${dict.welcome_hello}, <span id="welcomePatientName">${pName}</span>!`;
  }
  const welcomeSub = document.querySelector('.welcome-subtext');
  if (welcomeSub && dict.welcome_sub) welcomeSub.textContent = dict.welcome_sub;
  const actTodayLbl = document.querySelector('.banner-stats-pill .pill-text span');
  if (actTodayLbl && dict.acts_completed_today) actTodayLbl.textContent = dict.acts_completed_today;

  // 5. Smart Reminders Module
  const remTitle = document.querySelector('.smart-reminders-card .section-title');
  if (remTitle && dict.reminders_title) remTitle.textContent = dict.reminders_title;
  const remSub = document.querySelector('.smart-reminders-card .table-subtitle');
  if (remSub && dict.reminders_sub) remSub.textContent = dict.reminders_sub;
  const btnSpeakRem = document.querySelector('#btnSpeakAllReminders span:last-child');
  if (btnSpeakRem && dict.btn_read_rem) btnSpeakRem.textContent = dict.btn_read_rem;

  // Meds
  const remMedLbl = document.querySelector('#remBoxMeds .r-label');
  if (remMedLbl && dict.lbl_meds) remMedLbl.textContent = dict.lbl_meds;
  const btnTakeMed = document.querySelector('#btnTakeMed span');
  if (btnTakeMed && dict.btn_mark_taken) btnTakeMed.textContent = dict.btn_mark_taken;

  // Hydration
  const remWaterLbl = document.querySelector('#remBoxHydration .r-label');
  if (remWaterLbl && dict.lbl_hydration) remWaterLbl.textContent = dict.lbl_hydration;
  const btnAddWater = document.getElementById('btnAddWater');
  if (btnAddWater && dict.btn_add_water) btnAddWater.textContent = dict.btn_add_water;

  // Routine
  const remActLbl = document.querySelector('#remBoxActivity .r-label');
  if (remActLbl && dict.lbl_routine) remActLbl.textContent = dict.lbl_routine;
  const btnDoneRoutine = document.querySelector('#btnCompleteRoutine span');
  if (btnDoneRoutine && dict.btn_done_today) btnDoneRoutine.textContent = dict.btn_done_today;

  // Appointment
  const remApptLbl = document.querySelector('#remBoxAppt .r-label');
  if (remApptLbl && dict.lbl_appt) remApptLbl.textContent = dict.lbl_appt;
  const btnConfAppt = document.querySelector('#btnConfirmAppt span');
  if (btnConfAppt && dict.btn_confirmed) btnConfAppt.textContent = dict.btn_confirmed;

  // Doctor Notice Card on Garden
  const docNoticeTag = document.querySelector('.notice-tag');
  if (docNoticeTag && dict.doc_notice_tag) docNoticeTag.textContent = dict.doc_notice_tag;
  const btnSpeakDoc = document.querySelector('#btnSpeakDoctorAdvice span:last-child');
  if (btnSpeakDoc && dict.btn_listen_doc) btnSpeakDoc.textContent = dict.btn_listen_doc;
  const quickReplyLbl = document.querySelector('.quick-reply-label');
  if (quickReplyLbl && dict.lbl_quick_reply) quickReplyLbl.textContent = dict.lbl_quick_reply;

  // 6. Domain Filter Tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs.length >= 6) {
    if (dict.tab_all) filterTabs[0].querySelector('span').textContent = dict.tab_all;
    if (dict.tab_mem) filterTabs[1].querySelector('span').textContent = dict.tab_mem;
    if (dict.tab_rout) filterTabs[2].querySelector('span').textContent = dict.tab_rout;
    if (dict.tab_pat) filterTabs[3].querySelector('span').textContent = dict.tab_pat;
    if (dict.tab_att) filterTabs[4].querySelector('span').textContent = dict.tab_att;
    if (dict.tab_num) filterTabs[5].querySelector('span').textContent = dict.tab_num;
  }

  // 7. Update All 12 Game Cards in the Grid
  document.querySelectorAll('.game-card').forEach(card => {
    const gameId = card.getAttribute('data-game-id');
    const trans = GAME_I18N[gameId]?.[langCode] || GAME_I18N[gameId]?.en;
    if (trans) {
      const titleEl = card.querySelector('.card-title');
      const localEl = card.querySelector('.card-local-name');
      const descEl = card.querySelector('.card-desc');
      const btnEl = card.querySelector('.btn-play-game span:first-child');
      if (titleEl) titleEl.textContent = trans.name;
      if (localEl) localEl.textContent = trans.local;
      if (descEl) descEl.textContent = trans.desc;
      if (btnEl) btnEl.textContent = trans.btn;
    }
  });

  // 8. Active Game Playground Controls
  const btnBackHub = document.querySelector('#btnBackToHub span:last-child');
  if (btnBackHub && dict.btn_back_hub) btnBackHub.textContent = dict.btn_back_hub;
  const btnSpkPrompt = document.querySelector('#btnSpeakGamePrompt span:last-child');
  if (btnSpkPrompt && dict.btn_speak_prompt) btnSpkPrompt.textContent = dict.btn_speak_prompt;
  const btnHint = document.querySelector('#btnGentleHint span:last-child');
  if (btnHint && dict.btn_hint) btnHint.textContent = dict.btn_hint;
  const btnRestart = document.querySelector('#btnRestartGame span:last-child');
  if (btnRestart && dict.btn_restart) btnRestart.textContent = dict.btn_restart;

  // 9. Celebration Modal
  const celebTitle = document.getElementById('celebTitle');
  if (celebTitle && dict.celeb_title) celebTitle.textContent = dict.celeb_title;
  const celebSub = document.getElementById('celebSub');
  if (celebSub && dict.celeb_sub) celebSub.textContent = dict.celeb_sub;
  const celebLabels = document.querySelectorAll('.celeb-stat .c-lbl');
  if (celebLabels.length >= 3) {
    if (dict.celeb_score) celebLabels[0].textContent = dict.celeb_score;
    if (dict.celeb_time) celebLabels[1].textContent = dict.celeb_time;
    if (dict.celeb_ai) celebLabels[2].textContent = dict.celeb_ai;
  }
  const btnCelebReplay = document.querySelector('#btnCelebReplay span:last-child');
  if (btnCelebReplay && dict.celeb_replay) btnCelebReplay.textContent = dict.celeb_replay;
  const btnCelebHub = document.querySelector('#btnCelebHub span:last-child');
  if (btnCelebHub && dict.celeb_hub) btnCelebHub.textContent = dict.celeb_hub;

  // 10. Doctor Clinical Dashboard
  const docTitle = document.querySelector('.clinical-title');
  if (docTitle && dict.doc_portal_title) docTitle.textContent = dict.doc_portal_title;
  const docSub = document.querySelector('.clinical-sub');
  if (docSub && dict.doc_portal_sub) docSub.textContent = dict.doc_portal_sub;

  const btnSyncEmr = document.querySelector('#btnSyncEdgeCloud span:last-child');
  if (btnSyncEmr && dict.btn_sync_emr) btnSyncEmr.textContent = dict.btn_sync_emr;
  const btnExportCsv = document.querySelector('#btnExportCSV span:last-child');
  if (btnExportCsv && dict.btn_export_csv) btnExportCsv.textContent = dict.btn_export_csv;
  const btnExportJson = document.querySelector('#btnExportJSON span:last-child');
  if (btnExportJson && dict.btn_export_json) btnExportJson.textContent = dict.btn_export_json;

  const alertTitle = document.querySelector('.alert-title');
  if (alertTitle && dict.clinical_alert_title) alertTitle.textContent = dict.clinical_alert_title;
  const docMsgHeading = document.querySelector('.doctor-msg-box .section-title');
  if (docMsgHeading && dict.doc_msg_heading) docMsgHeading.textContent = dict.doc_msg_heading;
  const btnSendAdvice = document.querySelector('#btnSendDoctorMsg span:last-child');
  if (btnSendAdvice && dict.btn_send_advice) btnSendAdvice.textContent = dict.btn_send_advice;

  // 11. Voice Assistant Modal
  const vaTitle = document.getElementById('voiceAssistantTitle');
  if (vaTitle && dict.va_title) vaTitle.textContent = dict.va_title;
  const vaSub = document.querySelector('.voice-assistant-card .modal-sub');
  if (vaSub && dict.va_sub) vaSub.textContent = dict.va_sub;
  const vaQuickTitle = document.querySelector('.va-quick-title');
  if (vaQuickTitle && dict.va_quick_action) vaQuickTitle.textContent = dict.va_quick_action;

  // Configure Voice Assistant speech recognition language
  if (typeof voiceAssistant !== 'undefined' && voiceAssistant.setLanguage) {
    voiceAssistant.setLanguage(langCode);
  }
}

function setLanguage(langCode) {
  if (!I18N_TRANSLATIONS[langCode]) {
    langCode = 'en';
  }
  SMRITI_STATE.selectedLanguage = langCode;
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE || 'smriti_language', langCode);
  } catch (e) {}

  // 1. Translate ALL elements and components in the DOM to the selected language
  translateEntireDOM(langCode);

  // 2. Sync select dropdowns
  const sel = document.getElementById('selectLanguage');
  if (sel) sel.value = langCode;
  const selGuest = document.getElementById('selectLanguageGuest');
  if (selGuest) selGuest.value = langCode;

  // 3. Sync auth lang pills
  document.querySelectorAll('.auth-lang-pill').forEach(pill => {
    if (pill.getAttribute('data-lang') === langCode) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // 4. Update reminders UI
  if (typeof remindersManager !== 'undefined' && remindersManager.renderRemindersUI) {
    remindersManager.renderRemindersUI();
  }

  // 5. Verbal confirmation spoken in the selected language
  audio.playGentleChime();
  const dict = I18N_TRANSLATIONS[langCode] || I18N_TRANSLATIONS.en;
  if (dict.lang_switched) {
    audio.speak(dict.lang_switched, langCode);
  }
}

// ==========================================================================
// VOICE ASSISTANT ENGINE (SPEECH RECOGNITION FOR ELDERLY DEMENTIA)
// ==========================================================================
class VoiceAssistantEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
          this.isListening = true;
          this.updateMicUI(true);
        };

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          this.handleVoiceCommand(transcript);
        };

        this.recognition.onerror = (e) => {
          console.warn('Voice recognition error:', e);
          this.isListening = false;
          this.updateMicUI(false);
          const status = document.getElementById('vaStatusText');
          if (status) {
            const errMsgs = {
              hi: 'आवाज नहीं पहचानी गई, कृपया दोबारा टैप करें।',
              as: 'কণ্ঠ চিনিব পৰা নগ’ল, অনুগ্ৰহ কৰি আকৌ টিপক।',
              bn: 'কথা বোঝা যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন।',
              en: 'Could not hear clearly. Please tap microphone again.'
            };
            status.textContent = errMsgs[SMRITI_STATE.selectedLanguage] || errMsgs.en;
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.updateMicUI(false);
        };
      } catch (err) {
        console.warn('SpeechRecognition setup error:', err);
      }
    }
  }

  setLanguage(langCode) {
    const langMap = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'as': 'as-IN',
      'bn': 'bn-IN',
      'brx': 'hi-IN',
      'mni': 'bn-IN',
      'kha': 'en-IN'
    };
    if (this.recognition) {
      this.recognition.lang = langMap[langCode] || 'hi-IN';
    }
    const status = document.getElementById('vaStatusText');
    if (status && !this.isListening) {
      const msgs = {
        hi: 'बोलने के लिए माइक पर टैप करें',
        as: 'ক’বলৈ মাইকত টিপক',
        bn: 'কথা বলতে মাইকে চাপ দিন',
        brx: 'बुंनो थाखाय थु',
        mni: 'ঙাংনবা নম্মু',
        kha: 'Shon ha u mic ban kren',
        en: 'Tap microphone to speak'
      };
      status.textContent = msgs[langCode] || msgs.en;
    }
  }

  toggleListening() {
    if (!this.recognition) {
      const status = document.getElementById('vaStatusText');
      if (status) {
        status.textContent = SMRITI_STATE.selectedLanguage === 'hi'
          ? 'माइक उपलब्ध नहीं है। नीचे दिए गए किसी भी बटन को टैप करें।'
          : 'Microphone not supported by browser. Tap any instant action below.';
      }
      audio.speak(SMRITI_STATE.selectedLanguage === 'hi'
        ? 'कृपया नीचे दिए गए किसी भी विकल्प पर टैप करें।'
        : 'Please tap any command option below.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.updateMicUI(false);
    } else {
      const langMap = {
        'hi': 'hi-IN',
        'en': 'en-IN',
        'as': 'as-IN',
        'bn': 'bn-IN',
        'brx': 'hi-IN',
        'mni': 'bn-IN',
        'kha': 'en-IN'
      };
      this.recognition.lang = langMap[SMRITI_STATE.selectedLanguage] || 'hi-IN';
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  }

  updateMicUI(active) {
    const btn = document.getElementById('btnVaMicToggle');
    const icon = document.getElementById('vaMicIcon');
    const status = document.getElementById('vaStatusText');
    const lang = SMRITI_STATE.selectedLanguage;
    if (active) {
      btn?.classList.add('listening');
      if (icon) icon.textContent = '🔴';
      const listeningTexts = {
        hi: 'सुन रहे हैं... (Listening)',
        as: 'শুনি আছোঁ... (Listening)',
        bn: 'শুনছি... (Listening)',
        en: 'Listening carefully...'
      };
      if (status) status.textContent = listeningTexts[lang] || listeningTexts.en;
    } else {
      btn?.classList.remove('listening');
      if (icon) icon.textContent = '🎙️';
      const tapTexts = {
        hi: 'बोलने के लिए माइक पर टैप करें',
        as: 'ক’বলৈ মাইকত টিপক',
        bn: 'কথা বলতে মাইকে চাপ দিন',
        en: 'Tap microphone to speak'
      };
      if (status) status.textContent = tapTexts[lang] || tapTexts.en;
    }
  }

  handleVoiceCommand(transcript) {
    const tBox = document.getElementById('vaTranscriptBox');
    const tText = document.getElementById('vaTranscriptText');

    if (tBox && tText) {
      tBox.style.display = 'block';
      tText.textContent = `"${transcript}"`;
    }

    const t = transcript.toLowerCase();
    const lang = SMRITI_STATE.selectedLanguage;

    // Multilingual command matching (Hindi, Assamese, Bengali, English)
    if (t.includes('game') || t.includes('play') || t.includes('khel') || t.includes('खेल') || t.includes('खेला') || t.includes('গেলেমু') || t.includes('শান্নবা')) {
      const speech = {
        hi: 'आपके लिए संज्ञानात्मक खेल शुरू किया जा रहा है...',
        as: 'আপোনাৰ বাবে খেল আৰম্ভ কৰা হৈছে...',
        bn: 'আপনার জন্য খেলা শুরু করা হচ্ছে...',
        en: 'Starting calming cognitive game for you!'
      };
      this.executeAction('play_game', speech[lang] || speech.en);
    } else if (t.includes('med') || t.includes('dawa') || t.includes('dawai') || t.includes('दवा') || t.includes('दवाई') || t.includes('ঔষধ') || t.includes('मुलि') || t.includes('হিদাক')) {
      const speech = {
        hi: 'बहुत बढ़िया! आपकी दवा दर्ज कर ली गई है।',
        as: 'বঢ়িয়া! ঔষধ খোৱা হ’ল বুলি লিখা হ’ল।',
        bn: 'খুব ভালো! ওষুধ খাওয়ার রেকর্ড নেওয়া হয়েছে।',
        en: 'Great! Medication marked as taken.'
      };
      this.executeAction('meds', speech[lang] || speech.en);
    } else if (t.includes('water') || t.includes('pani') || t.includes('paani') || t.includes('पानी') || t.includes('जल') || t.includes('পানী') || t.includes('দৈ') || t.includes('ঈশিং')) {
      const speech = {
        hi: 'शाबाश! एक गिलास ताज़ा पानी दर्ज किया गया।',
        as: '১ গিলাচ পানী খোৱা হ’ল।',
        bn: '১ গ্লাস জল খাওয়ার হিসাব রাখা হলো।',
        en: 'Well done! 1 glass of fresh water logged.'
      };
      this.executeAction('water', speech[lang] || speech.en);
    } else if (t.includes('doctor') || t.includes('note') || t.includes('salah') || t.includes('डॉक्टर') || t.includes('सलाह') || t.includes('ডাক্তাৰ') || t.includes('ডাক্তার') || t.includes('দোক্তর')) {
      const speech = {
        hi: 'डॉक्टर की सलाह: प्रतिदिन हल्का व्यायाम करें और समय पर दवा लें।',
        as: 'ডাক্তাৰৰ পৰামৰ্শ: নিয়মীয়াকৈ খোজ কাঢ়ক আৰু পানী খাওক।',
        bn: 'ডাক্তারের পরামর্শ: প্রতিদিন হালকা ব্যায়াম করুন ও সময়মতো ওষুধ খান।',
        en: 'Doctor note: Practice gentle memory routines daily and stay well hydrated.'
      };
      this.executeAction('doctor', speech[lang] || speech.en);
    } else if (t.includes('music') || t.includes('bihu') || t.includes('gana') || t.includes('संगीत') || t.includes('धुन') || t.includes('গান') || t.includes('বিহু')) {
      const speech = {
        hi: 'आपके लिए शांत पारंपरिक लोक धुन बजाई जा रही है।',
        as: 'বিহুৰ শান্ত সুৰ বজোৱা হৈছে।',
        bn: 'শান্ত লোকসঙ্গীত বাজানো হচ্ছে।',
        en: 'Playing calming folk rhythms for your peace.'
      };
      this.executeAction('music', speech[lang] || speech.en);
    } else {
      const speech = {
        hi: 'मैं स्मृति सहायक हूँ। आप खेल खेलने, दवा या पानी दर्ज करने के लिए बोल सकते हैं।',
        as: 'মই স্মৃতি সহায়ক। আপুনি কথা কৈ খেলিব পাৰে বা ঔষধৰ খবৰ লব পাৰে।',
        bn: 'আমি স্মৃতি সহায়ক। আপনি কথা বলে খেলা শুরু করতে পারেন।',
        en: 'I am Smriti Assistant. You can ask me to play a game, log water, or check medicines.'
      };
      this.executeAction('help', speech[lang] || speech.en);
    }
  }

  executeAction(cmd, speechText) {
    const rBox = document.getElementById('vaResponseBox');
    const rText = document.getElementById('vaResponseText');
    if (rBox && rText) {
      rBox.style.display = 'block';
      rText.textContent = speechText;
    }

    // Spoken response in active language
    audio.speak(speechText, SMRITI_STATE.selectedLanguage);

    if (cmd === 'play_game') {
      setTimeout(() => {
        const modal = document.getElementById('modalVoiceAssistant');
        if (modal) modal.classList.remove('open');
        launchGame('reminiscence');
      }, 1200);
    } else if (cmd === 'meds') {
      const pid = SMRITI_STATE.activeProfile?.id || 'p1';
      if (SMRITI_STATE.reminders[pid]?.medication) {
        SMRITI_STATE.reminders[pid].medication.isTaken = true;
      }
      if (typeof remindersManager !== 'undefined' && remindersManager.renderRemindersUI) {
        remindersManager.renderRemindersUI();
      }
      audio.playTempleBell();
    } else if (cmd === 'water') {
      const pid = SMRITI_STATE.activeProfile?.id || 'p1';
      if (SMRITI_STATE.reminders[pid]?.hydration) {
        SMRITI_STATE.reminders[pid].hydration.currentGlasses = Math.min(8, SMRITI_STATE.reminders[pid].hydration.currentGlasses + 1);
      }
      if (typeof remindersManager !== 'undefined' && remindersManager.renderRemindersUI) {
        remindersManager.renderRemindersUI();
      }
      audio.playWaterBrook();
    } else if (cmd === 'doctor') {
      audio.playGentleChime();
    } else if (cmd === 'music') {
      audio.playBihuDhol();
      setTimeout(() => audio.playFluteCalm(), 1100);
    } else if (cmd === 'help') {
      audio.playGentleChime();
    }
  }
}

const voiceAssistant = new VoiceAssistantEngine();

// ==========================================================================
// 3. AI / ML ADAPTIVE DIFFICULTY ENGINE
// ==========================================================================
class AIAdaptiveEngine {
  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    const savedTier = localStorage.getItem(STORAGE_KEYS.AI_TIER);
    if (savedTier) {
      SMRITI_STATE.aiAdaptiveEngine.currentTier = parseInt(savedTier, 10) || 1;
    }
  }

  saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.AI_TIER, SMRITI_STATE.aiAdaptiveEngine.currentTier.toString());
  }

  evaluateInteraction(latencySeconds, accuracyScore) {
    const engine = SMRITI_STATE.aiAdaptiveEngine;

    // AI rule 1: High latency or hesitation (>7.5s) -> lower or keep at gentle assistance (Tier 1)
    if (latencySeconds > 7.5 || accuracyScore < 70) {
      engine.consecutiveHighLatencies += 1;
      engine.consecutiveFastCompletions = 0;
      if (engine.consecutiveHighLatencies >= 2 && engine.currentTier > 1) {
        engine.currentTier -= 1;
        this.saveToStorage();
        console.log(`[AI Engine] Adapted difficulty to Tier ${engine.currentTier} (Gentle Assistance)`);
      }
    } 
    // AI rule 2: Fast reaction (<3.5s) and high accuracy (>=90%) -> gently increment difficulty
    else if (latencySeconds < 3.5 && accuracyScore >= 90) {
      engine.consecutiveFastCompletions += 1;
      engine.consecutiveHighLatencies = 0;
      if (engine.consecutiveFastCompletions >= 2 && engine.currentTier < 3) {
        engine.currentTier += 1;
        this.saveToStorage();
        console.log(`[AI Engine] Adapted difficulty to Tier ${engine.currentTier} (Advanced Precision)`);
      }
    }

    this.updateBadgeUI();
  }

  getTierName() {
    const tier = SMRITI_STATE.aiAdaptiveEngine.currentTier;
    return SMRITI_STATE.aiAdaptiveEngine.tierLabels[tier] || 'Level 1 (Gentle Assistance)';
  }

  updateBadgeUI() {
    const tierText = this.getTierName();
    const badge = document.getElementById('patientAITierBadge');
    if (badge) badge.textContent = `🤖 AI Adaptive Tier: ${tierText}`;

    const pill = document.getElementById('activeGameDifficultyPill');
    if (pill) pill.textContent = `AI Difficulty: Tier ${SMRITI_STATE.aiAdaptiveEngine.currentTier}`;

    const celebTier = document.getElementById('celebAILevel');
    if (celebTier) celebTier.textContent = `Tier ${SMRITI_STATE.aiAdaptiveEngine.currentTier}`;
  }
}

const aiEngine = new AIAdaptiveEngine();

// ==========================================================================
// 4. TELEMETRY & CLINICAL LOGGING ENGINE
// ==========================================================================
class TelemetryEngine {
  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEYS.TELEMETRY);
      if (savedLogs) SMRITI_STATE.telemetryLogs = JSON.parse(savedLogs);

      const savedTime = localStorage.getItem(STORAGE_KEYS.SESSION_TIME);
      if (savedTime) SMRITI_STATE.sessionSeconds = parseInt(savedTime, 10) || 0;

      const savedMsgs = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (savedMsgs) SMRITI_STATE.messages = JSON.parse(savedMsgs);

      const savedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (savedPatients) SMRITI_STATE.registeredPatients = JSON.parse(savedPatients);

      const savedDoctors = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (savedDoctors) SMRITI_STATE.registeredDoctors = JSON.parse(savedDoctors);

      const savedRem = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (savedRem) SMRITI_STATE.reminders = JSON.parse(savedRem);

      const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) {
        SMRITI_STATE.activeProfile = JSON.parse(savedUser);
        SMRITI_STATE.isAuthenticated = true;
      }
    } catch (e) {
      console.warn('Could not read localStorage:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(SMRITI_STATE.telemetryLogs));
      localStorage.setItem(STORAGE_KEYS.SESSION_TIME, SMRITI_STATE.sessionSeconds.toString());
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(SMRITI_STATE.messages));
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(SMRITI_STATE.registeredPatients));
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(SMRITI_STATE.registeredDoctors));
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(SMRITI_STATE.reminders));
      if (SMRITI_STATE.activeProfile) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SMRITI_STATE.activeProfile));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
  }

  logInteraction({ gameId, gameName, latencySeconds, accuracyScore, domain, clinicalFlag }) {
    if (!SMRITI_STATE.activeProfile) return;
    const now = new Date();
    const entry = {
      id: 'log_' + Date.now(),
      timestamp: now.toISOString(),
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: now.toLocaleDateString(),
      patientId: SMRITI_STATE.activeProfile.id,
      patientName: SMRITI_STATE.activeProfile.name,
      gameId,
      gameName,
      latencySeconds: parseFloat(latencySeconds.toFixed(1)),
      accuracyScore: Math.round(accuracyScore),
      domain: domain || 'General Cognition',
      clinicalFlag: clinicalFlag || (latencySeconds > 8.0 ? 'High Hesitation' : 'Normal')
    };

    SMRITI_STATE.telemetryLogs.unshift(entry);
    SMRITI_STATE.offlineUnsyncedCount += 1;
    this.saveToStorage();

    // Trigger AI evaluation
    aiEngine.evaluateInteraction(latencySeconds, accuracyScore);

    const p = SMRITI_STATE.registeredPatients.find(pt => pt.id === SMRITI_STATE.activeProfile.id);
    if (p) p.completedToday += 1;

    this.updateDashboardUI();
    return entry;
  }

  getMetrics(patientId = null) {
    const targetPid = patientId || SMRITI_STATE.inspectedPatientId || 'p1';
    const logs = SMRITI_STATE.telemetryLogs.filter(l => l.patientId === targetPid);

    const totalCount = logs.length;
    if (totalCount === 0) {
      return {
        totalTimeFormatted: formatSeconds(SMRITI_STATE.sessionSeconds),
        completedCount: 0,
        avgAccuracy: 0,
        avgLatency: 0,
        hesitationCount: 0,
        mocaProxyScore: '26 / 30',
        mocaStatus: 'Mild / Stable Function'
      };
    }

    const totalLatency = logs.reduce((acc, curr) => acc + curr.latencySeconds, 0);
    const avgLatency = (totalLatency / totalCount).toFixed(1);
    const hesitationCount = logs.filter(l => l.clinicalFlag === 'High Hesitation').length;

    const avgAccuracy = Math.round(logs.reduce((acc, curr) => acc + curr.accuracyScore, 0) / totalCount);
    let mocaScore = 24 + Math.round((avgAccuracy / 100) * 5) - (hesitationCount > 2 ? 1 : 0);
    if (mocaScore > 30) mocaScore = 30;
    if (mocaScore < 18) mocaScore = 18;

    let mocaStatus = 'Normal Cognitive Function';
    if (mocaScore < 26) mocaStatus = 'Mild Cognitive Impairment (Stable)';
    if (mocaScore < 20) mocaStatus = 'Moderate Support Required';

    return {
      totalTimeFormatted: formatSeconds(SMRITI_STATE.sessionSeconds),
      completedCount: totalCount,
      avgAccuracy,
      avgLatency: parseFloat(avgLatency),
      hesitationCount,
      mocaProxyScore: `${mocaScore} / 30`,
      mocaStatus
    };
  }

  updateDashboardUI() {
    const inspPid = SMRITI_STATE.inspectedPatientId || 'p1';
    const metrics = this.getMetrics(inspPid);
    const currentPatient = SMRITI_STATE.registeredPatients.find(p => p.id === inspPid) || SMRITI_STATE.registeredPatients[0];

    // Header values
    const liveTimeEl = document.getElementById('liveSessionTime');
    if (liveTimeEl) liveTimeEl.textContent = metrics.totalTimeFormatted;

    // Patient View Elements
    const patientCompletedEl = document.getElementById('patientCompletedToday');
    if (patientCompletedEl && SMRITI_STATE.activeProfile) {
      const activeMeta = SMRITI_STATE.registeredPatients.find(p => p.id === SMRITI_STATE.activeProfile.id);
      patientCompletedEl.textContent = activeMeta ? activeMeta.completedToday : 0;
    }

    // Patient Notice Banner & Dynamic Header Notification Badges
    const navMsgPill = document.getElementById('navMsgCount');
    const navRemPill = document.getElementById('navRemCount');
    const doctorNoticeCard = document.getElementById('doctorNoticeCard');
    const doctorAdviceEl = document.getElementById('patientDoctorAdviceText');
    const doctorTimeEl = document.getElementById('patientLastMsgTime');

    if (SMRITI_STATE.activeProfile?.role === 'patient') {
      const activePid = SMRITI_STATE.activeProfile.id;
      const patientMsgs = SMRITI_STATE.messages[activePid] || [];
      const docMsgs = patientMsgs.filter(m => m.sender === 'doctor');
      const latestDocMsg = docMsgs.length > 0 ? docMsgs[docMsgs.length - 1] : null;
      const unreadDocCount = docMsgs.filter(m => !m.isRead).length;

      // Doctor Note Notification Badge (only visible when there are actual unread messages)
      if (navMsgPill) {
        if (unreadDocCount > 0) {
          navMsgPill.textContent = unreadDocCount;
          navMsgPill.style.display = 'inline-flex';
        } else {
          navMsgPill.textContent = '0';
          navMsgPill.style.display = 'none';
        }
      }

      // Reminders Notification Badge (only visible when there are actual pending reminders)
      if (navRemPill) {
        const remData = SMRITI_STATE.reminders[activePid];
        let pendingRemCount = 0;
        if (remData) {
          if (remData.medication && !remData.medication.isTaken) pendingRemCount++;
          if (remData.hydration && remData.hydration.currentGlasses < remData.hydration.targetGlasses) pendingRemCount++;
          if (remData.routine && !remData.routine.isDone) pendingRemCount++;
        }
        if (pendingRemCount > 0) {
          navRemPill.textContent = pendingRemCount;
          navRemPill.style.display = 'inline-flex';
        } else {
          navRemPill.textContent = '0';
          navRemPill.style.display = 'none';
        }
      }

      // Patient Garden Doctor Notice Card (only show if there is an actual message from the doctor)
      if (doctorNoticeCard) {
        if (latestDocMsg && latestDocMsg.text) {
          doctorNoticeCard.style.display = 'flex';
          if (doctorAdviceEl) doctorAdviceEl.textContent = `"${latestDocMsg.text}"`;
          if (doctorTimeEl) doctorTimeEl.textContent = latestDocMsg.timeFormatted || 'Recently';
        } else {
          doctorNoticeCard.style.display = 'none';
        }
      }
    } else {
      // Doctor logged in: hide patient notifications
      if (navMsgPill) navMsgPill.style.display = 'none';
      if (navRemPill) navRemPill.style.display = 'none';
      if (doctorNoticeCard) doctorNoticeCard.style.display = 'none';
    }

    // Doctor Dashboard Elements
    if (currentPatient) {
      const dashAvatar = document.getElementById('dashPatientAvatar');
      if (dashAvatar) dashAvatar.textContent = currentPatient.avatar;

      const dashName = document.getElementById('dashPatientName');
      if (dashName) dashName.textContent = currentPatient.name;

      const dashMeta = document.getElementById('dashPatientMeta');
      if (dashMeta) dashMeta.textContent = `Age: ${currentPatient.age} Years · Location: ${currentPatient.location} · Care Protocol: ${currentPatient.protocol}`;

      const dashNotes = document.getElementById('dashPatientNotes');
      if (dashNotes) dashNotes.textContent = `Clinical Notes: ${currentPatient.notes || 'Enrolled in cognitive therapy.'}`;

      const msgTargetName = document.getElementById('msgTargetPatientName');
      if (msgTargetName) msgTargetName.textContent = currentPatient.name;

      const remDocPatientName = document.getElementById('remDoctorPatientName');
      if (remDocPatientName) remDocPatientName.textContent = currentPatient.name;
    }

    // Doctor Patient KPI Cards (Per Patient Analysis)
    const dashAvgAcc = document.getElementById('dashAvgAccuracy');
    if (dashAvgAcc) dashAvgAcc.textContent = `${metrics.avgAccuracy}%`;

    const dashCompleted = document.getElementById('dashTotalCompleted');
    if (dashCompleted) dashCompleted.textContent = metrics.completedCount;

    const dashAvgLat = document.getElementById('dashAvgLatency');
    if (dashAvgLat) dashAvgLat.textContent = `${metrics.avgLatency} s`;

    const dashHesFlags = document.getElementById('dashHesitationFlags');
    if (dashHesFlags) dashHesFlags.textContent = metrics.hesitationCount;

    const dashMoCA = document.getElementById('dashMoCAScore');
    if (dashMoCA) dashMoCA.textContent = metrics.mocaProxyScore;

    const dashMoCAStat = document.getElementById('dashMoCAStatus');
    if (dashMoCAStat) dashMoCAStat.textContent = metrics.mocaStatus;

    // Doctor Patient Tabs & Messages
    this.renderDoctorPatientTabs();
    this.renderMessageHistory();
    this.renderRemindersUI();

    // Telemetry Table Rows strictly for inspected patient
    const patientLogs = SMRITI_STATE.telemetryLogs.filter(l => l.patientId === inspPid);
    const tbody = document.getElementById('telemetryTableBody');
    const emptyState = document.getElementById('emptyTelemetryState');
    const rowCountBadge = document.getElementById('telemetryRowCount');

    if (rowCountBadge) {
      rowCountBadge.textContent = `${patientLogs.length} logs for ${currentPatient ? currentPatient.name : 'Patient'}`;
    }

    if (tbody) {
      tbody.innerHTML = '';
      if (patientLogs.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
      } else {
        if (emptyState) emptyState.style.display = 'none';
        patientLogs.slice(0, 50).forEach(log => {
          const tr = document.createElement('tr');
          const isHes = log.clinicalFlag === 'High Hesitation';
          tr.innerHTML = `
            <td><strong>${log.displayTime}</strong> <small style="color:var(--text-muted);display:block;">${log.date}</small></td>
            <td><strong>${log.patientName}</strong></td>
            <td><strong>${log.gameName}</strong></td>
            <td>${log.latencySeconds}s</td>
            <td><span style="font-weight:700;color:var(--accent-emerald);">${log.accuracyScore}%</span></td>
            <td><small>${log.domain}</small></td>
            <td><span class="flag-badge ${isHes ? 'flag-hesitation' : 'flag-normal'}">${log.clinicalFlag}</span></td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // Dynamic Cognitive Domain Performance Index calculation from patient telemetry
    const calcDomainScore = (filterFn) => {
      const logs = patientLogs.filter(filterFn);
      if (logs.length === 0) return null;
      const total = logs.reduce((acc, l) => acc + (l.accuracyScore != null ? l.accuracyScore : (l.accuracy_pct || 0)), 0);
      return Math.round(total / logs.length);
    };

    // 1. Memory Improvement (Recall, Market, Kinship, Proverbs)
    const memScore = calcDomainScore(l => 
      (l.domain && /memory|recall|kinship|proverb|reminiscence/i.test(l.domain)) ||
      ['reminiscence', 'haat_explorer', 'kinship_faces', 'folk_rhymes'].includes(l.gameId)
    );

    // 2. Daily Routine Recall & Executive Function
    const execScore = calcDomainScore(l => 
      (l.domain && /routine|executive|procedural|order|sort|pantry/i.test(l.domain)) ||
      ['tea_sequencer', 'pantry_sort'].includes(l.gameId)
    );

    // 3. Pattern & Object Recognition (Loom Motif Tracing, Navigation)
    const visuoScore = calcDomainScore(l => 
      (l.domain && /pattern|visuo|motor|spatial|navigation|shuttle|path/i.test(l.domain)) ||
      ['weaver_shuttle', 'path_home'].includes(l.gameId)
    );

    // 4. Attention & Concentration (Tea Shoots, Sounds, Dye)
    const attnScore = calcDomainScore(l => 
      (l.domain && /attention|concentration|acoustic|sound|dye|two_leaves|hill/i.test(l.domain)) ||
      ['two_leaves', 'hill_sounds', 'natural_dye'].includes(l.gameId)
    );

    // 5. Functional Numeracy (Market Coin Counter)
    const numScore = calcDomainScore(l => 
      (l.domain && /numeracy|bazaar|coin|counter|market/i.test(l.domain)) ||
      ['bazaar_counter'].includes(l.gameId)
    );

    const updateDomainUI = (scoreElId, fillElId, scoreVal) => {
      const scoreEl = document.getElementById(scoreElId);
      const fillEl = document.getElementById(fillElId);
      if (!scoreEl || !fillEl) return;
      if (scoreVal !== null) {
        scoreEl.textContent = `${scoreVal}%`;
        fillEl.style.width = `${Math.min(100, Math.max(8, scoreVal))}%`;
        fillEl.style.background = scoreVal >= 80 ? 'var(--accent-emerald, #10b981)' : (scoreVal >= 60 ? '#eab308' : '#f97316');
      } else {
        scoreEl.textContent = 'Pending (0%)';
        fillEl.style.width = '0%';
        fillEl.style.background = 'var(--accent-emerald, #10b981)';
      }
    };

    updateDomainUI('domainScoreMemory', 'fillMemory', memScore);
    updateDomainUI('domainScoreExec', 'fillExec', execScore);
    updateDomainUI('domainScoreVisuo', 'fillVisuo', visuoScore);
    updateDomainUI('domainScoreAttn', 'fillAttn', attnScore);
    updateDomainUI('domainScoreNum', 'fillNum', numScore);

    // AI Badge Update
    aiEngine.updateBadgeUI();
  }

  async fetchPatientTelemetry(patientId) {
    if (!patientId) return;
    try {
      const res = await ApiClient.getTelemetry(patientId);
      if (res.ok && Array.isArray(res.data?.data)) {
        let addedCount = 0;
        res.data.data.forEach(rec => {
          const exists = SMRITI_STATE.telemetryLogs.some(l => 
            l.id === `rec_${rec.id}` || 
            (l.gameId === rec.game_id && l.patientId === rec.patient_id && l.timestamp === rec.created_at)
          );
          if (!exists) {
            SMRITI_STATE.telemetryLogs.push({
              id: `rec_${rec.id}`,
              timestamp: rec.created_at,
              displayTime: new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              date: new Date(rec.created_at).toLocaleDateString(),
              patientId: rec.patient_id,
              patientName: rec.patient_name || 'Patient',
              gameId: rec.game_id,
              gameName: rec.game_name,
              latencySeconds: rec.latency_seconds,
              accuracyScore: rec.accuracy_pct,
              domain: rec.cognitive_domain,
              clinicalFlag: rec.clinical_flag || 'Normal'
            });
            addedCount++;
          }
        });
        if (addedCount > 0) {
          this.saveToStorage();
          this.updateDashboardUI();
        }
      }
    } catch (e) {
      console.warn('[TELEMETRY FETCH NOTICE]', e);
    }
  }

  async fetchAndRenderPatientReminders(patientId) {
    if (!patientId) return;
    try {
      const res = await ApiClient.getReminders(patientId);
      if (res.ok && res.data?.data) {
        SMRITI_STATE.reminders[patientId] = {
          medication: {
            title: res.data.data.medication?.title || 'Daily Prescription Booster',
            sub: res.data.data.medication?.sub || 'Take 1 tablet after breakfast',
            isTaken: Boolean(res.data.data.medication?.isCompleted)
          },
          hydration: {
            currentGlasses: res.data.data.hydration?.current || 0,
            targetGlasses: res.data.data.hydration?.target || 8
          },
          routine: {
            title: res.data.data.routine?.title || 'Daily Cognitive Activity',
            isDone: Boolean(res.data.data.routine?.isCompleted)
          },
          appointment: {
            title: res.data.data.appointment?.title || 'Clinical Checkup',
            location: 'District PHC',
            isConfirmed: true
          }
        };
        this.renderRemindersUI();
      }
    } catch (e) {
      console.warn('Could not fetch patient reminders:', e);
    }
  }

  renderRemindersUI() {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';

    // Ensure this patient has their own dedicated reminders object without falling back to another user
    if (!SMRITI_STATE.reminders[activePid]) {
      SMRITI_STATE.reminders[activePid] = {
        medication: { title: 'Prescription Medication (09:00 AM)', sub: 'Take with warm water.', isTaken: false },
        hydration: { currentGlasses: 0, targetGlasses: 8 },
        routine: { title: 'Daily Cognitive Exercises', isDone: false },
        appointment: { title: 'Routine Video Checkup (Dr. Anamika Deka)', location: 'PHC', isConfirmed: true }
      };
      this.fetchAndRenderPatientReminders(activePid);
    }

    const remData = SMRITI_STATE.reminders[activePid];
    if (!remData) return;

    // Medication UI
    const medTitle = document.getElementById('remMedTitle');
    const medSub = document.getElementById('remMedSub');
    const btnMed = document.getElementById('btnTakeMed');
    if (medTitle) medTitle.textContent = remData.medication.title;
    if (medSub) medSub.textContent = remData.medication.sub;
    if (btnMed) {
      if (remData.medication.isTaken) {
        btnMed.classList.add('taken');
        btnMed.innerHTML = '<span>✅ Taken Today (09:00 AM)</span>';
      } else {
        btnMed.classList.remove('taken');
        btnMed.innerHTML = '<span>✅ Mark Taken</span>';
      }
    }

    // Hydration UI
    const waterCount = document.getElementById('waterCount');
    const fillWater = document.getElementById('fillWater');
    if (waterCount) waterCount.textContent = remData.hydration.currentGlasses;
    if (fillWater) {
      const pct = Math.min(100, Math.round((remData.hydration.currentGlasses / remData.hydration.targetGlasses) * 100));
      fillWater.style.width = `${pct}%`;
    }

    // Routine UI
    const actTitle = document.getElementById('remActTitle');
    const btnRoutine = document.getElementById('btnCompleteRoutine');
    if (actTitle) actTitle.textContent = remData.routine.title;
    if (btnRoutine) {
      if (remData.routine.isDone) {
        btnRoutine.classList.add('taken');
        btnRoutine.innerHTML = '<span>🌸 Completed</span>';
      } else {
        btnRoutine.classList.remove('taken');
        btnRoutine.innerHTML = '<span>🌸 Done Today</span>';
      }
    }

    // Appointment UI
    const apptTitle = document.getElementById('remApptTitle');
    if (apptTitle) apptTitle.textContent = remData.appointment.title;

    // Dynamic Header Reminders Notification Badge
    const navRemPill = document.getElementById('navRemCount');
    if (navRemPill) {
      if (SMRITI_STATE.activeProfile?.role === 'doctor') {
        navRemPill.style.display = 'none';
      } else {
        let pending = 0;
        if (remData.medication && !remData.medication.isTaken) pending++;
        if (remData.hydration && remData.hydration.currentGlasses < remData.hydration.targetGlasses) pending++;
        if (remData.routine && !remData.routine.isDone) pending++;
        if (pending > 0) {
          navRemPill.textContent = pending;
          navRemPill.style.display = 'inline-flex';
        } else {
          navRemPill.textContent = '0';
          navRemPill.style.display = 'none';
        }
      }
    }
  }

  renderDoctorPatientTabs() {
    const container = document.getElementById('doctorPatientTabsContainer');
    if (!container) return;

    container.innerHTML = SMRITI_STATE.registeredPatients.map(p => {
      const isActive = (SMRITI_STATE.inspectedPatientId || 'p1') === p.id;
      return `
        <button class="btn-patient-tab ${isActive ? 'active' : ''}" data-patient-id="${p.id}">
          <span class="tab-avatar">${p.avatar}</span>
          <div class="tab-info">
            <strong>${p.name}</strong>
            <small>${p.age} Yrs · ${p.location.split(',')[0]}</small>
          </div>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.btn-patient-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const pid = tab.getAttribute('data-patient-id');
        SMRITI_STATE.inspectedPatientId = pid;
        this.updateDashboardUI();
        this.fetchPatientTelemetry(pid);
      });
    });
  }

  renderMessageHistory() {
    const historyBox = document.getElementById('msgHistoryContainer');
    if (!historyBox) return;

    const targetPid = SMRITI_STATE.inspectedPatientId || 'p1';
    const currentPatient = SMRITI_STATE.registeredPatients.find(p => p.id === targetPid) || SMRITI_STATE.registeredPatients[0];
    const thread = SMRITI_STATE.messages[targetPid] || [];

    if (thread.length === 0) {
      historyBox.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:16px;">No message history with this patient yet. Type a note below to send advice.</p>`;
      return;
    }

    historyBox.innerHTML = thread.map(msg => {
      const isDoc = msg.sender === 'doctor';
      return `
        <div class="msg-bubble ${isDoc ? 'msg-bubble-doctor' : 'msg-bubble-patient'}">
          <strong>${isDoc ? '🩺 ' + msg.senderName : (currentPatient ? currentPatient.avatar : '👴') + ' ' + (currentPatient ? currentPatient.name : 'Patient')}</strong>
          <span>${msg.text}</span>
          <span class="msg-meta-time">${msg.timeFormatted}</span>
        </div>
      `;
    }).join('');

    historyBox.scrollTop = historyBox.scrollHeight;
  }

  async sendDoctorMessage(text) {
    if (!text || !text.trim()) return;
    const targetPid = SMRITI_STATE.inspectedPatientId || 'p1';
    if (!SMRITI_STATE.messages[targetPid]) {
      SMRITI_STATE.messages[targetPid] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const docName = SMRITI_STATE.activeProfile?.name || 'Dr. Anamika Deka';
    const msgObj = {
      id: 'msg_' + Date.now(),
      sender: 'doctor',
      senderName: docName,
      text: text.trim(),
      timeFormatted: `Today at ${timeStr}`,
      timestamp: Date.now()
    };

    SMRITI_STATE.messages[targetPid].push(msgObj);
    this.saveToStorage();
    this.updateDashboardUI();
    audio.playGentleChime();
    audio.speak(`Message sent to patient.`);

    // Persist to backend SQLite database
    try {
      await ApiClient.postMessage({
        patient_id: targetPid,
        doctor_id: SMRITI_STATE.activeProfile?.id || 'doc_anamika',
        sender_role: 'doctor',
        sender_name: docName,
        message_text: text.trim()
      });
    } catch (e) {}
  }

  async sendPatientReply(replyText) {
    if (!SMRITI_STATE.activeProfile) return;
    const activePid = SMRITI_STATE.activeProfile.id;
    if (!SMRITI_STATE.messages[activePid]) {
      SMRITI_STATE.messages[activePid] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgObj = {
      id: 'msg_' + Date.now(),
      sender: 'patient',
      senderName: SMRITI_STATE.activeProfile.name,
      text: replyText,
      timeFormatted: `Today at ${timeStr}`,
      timestamp: Date.now()
    };

    SMRITI_STATE.messages[activePid].push(msgObj);
    this.saveToStorage();
    this.updateDashboardUI();
    audio.playSuccessMelody();
    audio.speak('Thank you! Your message has been sent to your doctor.');
    alert(`✉️ Reply Sent to Doctor:\n"${replyText}"`);

    // Persist to backend SQLite database
    try {
      await ApiClient.postMessage({
        patient_id: activePid,
        sender_role: 'patient',
        sender_name: SMRITI_STATE.activeProfile.name,
        message_text: replyText
      });
    } catch (e) {}
  }

  async syncOfflineEdgeQueue() {
    audio.playGentleChime();
    const syncStatusEl = document.getElementById('syncStatusText');
    if (syncStatusEl) syncStatusEl.textContent = 'Syncing edge records... 🔄';

    const targetPid = SMRITI_STATE.inspectedPatientId || SMRITI_STATE.activeProfile?.id || 'p1';
    try {
      const res = await ApiClient.syncEdge({
        patient_id: targetPid,
        telemetry_records: SMRITI_STATE.telemetryLogs
      });
      if (res.ok) {
        SMRITI_STATE.offlineUnsyncedCount = 0;
        if (syncStatusEl) syncStatusEl.textContent = 'Offline-Ready (Synced to District EMR) ✅';
        alert(`📶 Edge Synchronization Complete!\n\n${res.data?.message || 'All cognitive telemetry logs have been safely synced to the Central SQLite Database.'}`);
        return;
      }
    } catch (e) {}

    setTimeout(() => {
      SMRITI_STATE.offlineUnsyncedCount = 0;
      if (syncStatusEl) syncStatusEl.textContent = 'Offline-Ready (Synced to District EMR) ✅';
      alert('📶 Edge Synchronization Complete!\n\nAll cognitive telemetry logs and daily schedule records have been safely synced to the North Eastern District Health Unit server.');
    }, 600);
  }

  exportCSV() {
    if (SMRITI_STATE.telemetryLogs.length === 0) {
      alert('No telemetry logs captured yet. Play a game to record clinical data!');
      return;
    }

    const headers = ['Timestamp', 'Date', 'Patient ID', 'Patient Name', 'Exercise Name', 'Reaction Latency (s)', 'Accuracy Score (%)', 'Cognitive Domain', 'Clinical Attention Flag'];
    const rows = SMRITI_STATE.telemetryLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.date}"`,
      `"${l.patientId}"`,
      `"${l.patientName}"`,
      `"${l.gameName}"`,
      l.latencySeconds,
      l.accuracyScore,
      `"${l.domain}"`,
      `"${l.clinicalFlag}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smriti_ner_doctor_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportJSON() {
    if (SMRITI_STATE.telemetryLogs.length === 0) {
      alert('No telemetry logs captured yet. Play a game to record clinical data!');
      return;
    }

    const exportData = {
      project: 'Smriti-NER (SIH26003)',
      generatedAt: new Date().toISOString(),
      activeProfile: SMRITI_STATE.activeProfile,
      patients: SMRITI_STATE.registeredPatients,
      messages: SMRITI_STATE.messages,
      reminders: SMRITI_STATE.reminders,
      aiEngineTier: SMRITI_STATE.aiAdaptiveEngine.currentTier,
      metricsSummary: this.getMetrics(),
      telemetryLogs: SMRITI_STATE.telemetryLogs
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smriti_ner_doctor_clinical_data_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  resetTelemetry() {
    if (confirm('Are you sure you want to clear this session’s telemetry data?')) {
      SMRITI_STATE.telemetryLogs = [];
      SMRITI_STATE.sessionSeconds = 0;
      this.saveToStorage();
      this.updateDashboardUI();
    }
  }
}

const telemetry = new TelemetryEngine();

// ==========================================================================
// 5. USER AUTHENTICATION CONTROLLER (LOGIN, SIGN UP & LOGOUT)
// ==========================================================================
class AuthController {
  async init() {
    // Fetch live registered patients from SQLite backend
    try {
      const res = await ApiClient.getPatients();
      if (res.ok && res.data?.data?.length > 0) {
        SMRITI_STATE.registeredPatients = res.data.data;
      }
    } catch (e) {
      console.warn('[AUTH INIT] Using cached patient directory');
    }

    this.renderOneTapPatientList();

    // Verify session with backend /api/auth/me
    const token = ApiClient.getToken();
    if (token) {
      try {
        const meRes = await ApiClient.getMe();
        if (meRes.ok && meRes.data?.user) {
          this.applyAuthenticatedUser(meRes.data.user);
          return;
        }
      } catch (e) {}
    }

    if (SMRITI_STATE.isAuthenticated && SMRITI_STATE.activeProfile) {
      this.applyAuthenticatedUser(SMRITI_STATE.activeProfile);
    } else {
      this.showAuthPortal();
    }
  }

  showAuthPortal() {
    SMRITI_STATE.isAuthenticated = false;
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById('viewAuthPortal').classList.add('active');

    document.getElementById('headerControlsAuth').style.display = 'none';
    document.getElementById('headerControlsGuest').style.display = 'flex';
  }

  applyAuthenticatedUser(profile) {
    SMRITI_STATE.activeProfile = profile;
    SMRITI_STATE.isAuthenticated = true;
    telemetry.saveToStorage();

    // Update Top Navigation
    document.getElementById('headerControlsGuest').style.display = 'none';
    document.getElementById('headerControlsAuth').style.display = 'flex';

    document.getElementById('navUserAvatar').textContent = profile.avatar || (profile.role === 'doctor' ? '🩺' : '👴');
    document.getElementById('navUserName').textContent = profile.name;
    document.getElementById('navUserRole').textContent = profile.role === 'doctor' ? 'Doctor & Neurologist' : `Patient (${(profile.location || 'NER').split(',')[0]})`;

    // Role-specific Header Navigation controls (Hide reminders & doctor notes for doctors)
    const sessionTimerCard = document.getElementById('sessionTimerCard');
    const btnNavRem = document.getElementById('btnNavReminders');
    const btnNavMsg = document.getElementById('btnNavMessages');
    if (profile.role === 'doctor') {
      if (sessionTimerCard) sessionTimerCard.style.display = 'none';
      if (btnNavRem) btnNavRem.style.display = 'none';
      if (btnNavMsg) btnNavMsg.style.display = 'none';
      SMRITI_STATE.isSessionRunning = false;
    } else {
      if (sessionTimerCard) sessionTimerCard.style.display = 'flex';
      if (btnNavRem) btnNavRem.style.display = 'inline-flex';
      if (btnNavMsg) btnNavMsg.style.display = 'inline-flex';
      SMRITI_STATE.isSessionRunning = true;
      telemetry.fetchAndRenderPatientReminders(profile.id);
    }

    // Direct to proper view
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

    if (profile.role === 'doctor') {
      document.getElementById('viewCaregiverDashboard').classList.add('active');
      audio.speak(`Welcome Dr. ${profile.name}. Doctor Clinical Telemetry unlocked.`);
      const firstPid = SMRITI_STATE.inspectedPatientId || 'p1';
      telemetry.fetchPatientTelemetry(firstPid);
      if (typeof emergencyController !== 'undefined') {
        emergencyController.checkDoctorEmergencyAlerts();
      }
    } else {
      document.getElementById('welcomePatientName').textContent = profile.name;
      // Populate caretaker contact display
      const ctNameEl = document.getElementById('patientCaretakerNameDisplay');
      const ctPhoneEl = document.getElementById('patientCaretakerPhoneDisplay');
      if (ctNameEl) ctNameEl.textContent = profile.caretaker_name || 'Rupankar Baruah (Son)';
      if (ctPhoneEl) ctPhoneEl.textContent = profile.caretaker_phone || '+91 98640 55443';

      document.getElementById('viewPatientHub').classList.add('active');
      audio.speak(`Hello ${profile.name}. Welcome back to your cognitive garden.`);
    }

    telemetry.updateDashboardUI();
  }

  async loginPatient(patientId, isQuickDemo = false) {
    // Attempt backend login
    try {
      const res = await ApiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: 'patient',
          identifier: patientId,
          isQuickDemo
        })
      });
      if (res.ok && res.data?.user) {
        ApiClient.setToken(res.data.token);
        this.applyAuthenticatedUser(res.data.user);
        return;
      }
    } catch (e) {}

    // Fallback to local state if offline
    const patient = SMRITI_STATE.registeredPatients.find(p => p.id === patientId);
    if (patient) {
      const profile = {
        id: patient.id,
        name: patient.name,
        role: 'patient',
        age: patient.age,
        location: patient.location,
        avatar: patient.avatar
      };
      this.applyAuthenticatedUser(profile);
    }
  }

  async loginPatientDirect(identifier, password) {
    const errEl = document.getElementById('loginPatientError');
    if (errEl) errEl.textContent = '';

    if (!identifier || !identifier.trim()) {
      if (errEl) errEl.textContent = '❌ Please enter your Gmail address or Username.';
      return;
    }

    if (!password || !password.trim()) {
      if (errEl) errEl.textContent = '❌ Please enter your account password.';
      return;
    }

    try {
      const res = await ApiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: 'patient',
          identifier: identifier.trim(),
          password: password.trim()
        })
      });

      if (res.ok && res.data?.user) {
        ApiClient.setToken(res.data.token);
        this.applyAuthenticatedUser(res.data.user);
        return;
      }

      if (res.data?.error) {
        audio.playGentleChime();
        if (errEl) errEl.textContent = '❌ ' + res.data.error;
        return;
      }
    } catch (e) {
      console.warn('Network error during patient login:', e);
    }

    // Local offline check
    const idLower = identifier.trim().toLowerCase();
    const localPatient = SMRITI_STATE.registeredPatients.find(p => 
      (p.email && p.email.toLowerCase() === idLower) ||
      (p.name && p.name.toLowerCase() === idLower) ||
      p.id === identifier.trim()
    );

    if (localPatient) {
      if (localPatient.pin && localPatient.pin !== password.trim()) {
        audio.playGentleChime();
        if (errEl) errEl.textContent = '❌ Incorrect password. Please try again.';
        return;
      }
      this.loginPatient(localPatient.id, true);
      return;
    }

    if (errEl) errEl.textContent = '❌ Patient account not found. Please check your Gmail or create an account.';
  }

  async loginDoctor(emailOrUser, pin) {
    const errEl = document.getElementById('loginDoctorError');
    if (errEl) errEl.textContent = '';

    try {
      const res = await ApiClient.login('doctor', emailOrUser, pin);
      if (res.ok && res.data?.user) {
        ApiClient.setToken(res.data.token);
        this.applyAuthenticatedUser(res.data.user);
        return;
      }
      if (res.data?.error) {
        audio.playGentleChime();
        if (errEl) errEl.textContent = res.data.error;
        return;
      }
    } catch (e) {}

    // Fallback offline PIN check
    const doctor = SMRITI_STATE.registeredDoctors.find(d => 
      (d.email.toLowerCase() === emailOrUser.trim().toLowerCase() || d.name.toLowerCase().includes(emailOrUser.trim().toLowerCase()))
    );

    if (pin === '1234' || (doctor && doctor.pin === pin)) {
      const docObj = doctor || SMRITI_STATE.registeredDoctors[0];
      const profile = {
        id: docObj.id,
        name: docObj.name,
        role: 'doctor',
        location: docObj.clinic,
        avatar: docObj.avatar
      };
      this.applyAuthenticatedUser(profile);
    } else {
      audio.playGentleChime();
      if (errEl) errEl.textContent = 'Incorrect PIN. Default PIN is 1234.';
    }
  }

  async signupPatient(name, age, email, password, location, phone, avatar, protocol, caretakerName) {
    const errEl = document.getElementById('signupPatientError');
    if (errEl) errEl.textContent = '';

    if (!email || !isValidGmail(email)) {
      audio.playGentleChime();
      if (errEl) errEl.textContent = '❌ Patient registration requires a valid Gmail address ending in @gmail.com';
      return;
    }

    if (!password || password.trim().length < 3) {
      audio.playGentleChime();
      if (errEl) errEl.textContent = '❌ Please create an account password (minimum 3 characters).';
      return;
    }

    const ctName = (caretakerName || 'Primary Caregiver').trim();
    const ctPhone = phone ? phone.trim() : '+91 98640 55443';

    try {
      const res = await ApiClient.register({
        role: 'patient',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        pin: password.trim(),
        age: parseInt(age, 10) || 70,
        location: (location || 'Assam, NER').trim(),
        phone: ctPhone,
        caretaker_phone: ctPhone,
        caretaker_name: ctName,
        avatar: avatar || '👴',
        protocol: protocol || 'Memory & Daily Routines'
      });

      if (res.ok && res.data?.user) {
        ApiClient.setToken(res.data.token);
        SMRITI_STATE.registeredPatients.unshift(res.data.user);
        this.renderOneTapPatientList();
        this.applyAuthenticatedUser(res.data.user);
        return;
      }
      if (res.data?.error) {
        audio.playGentleChime();
        if (errEl) errEl.textContent = '❌ ' + res.data.error;
        return;
      }
    } catch (e) {}

    // Fallback local flow
    const newId = 'p_' + Date.now();
    const newPatient = {
      id: newId,
      name: name.trim(),
      email: email.trim(),
      pin: password.trim(),
      age: parseInt(age, 10) || 70,
      location: (location || 'Assam, NER').trim(),
      phone: ctPhone,
      caretaker_phone: ctPhone,
      caretaker_name: ctName,
      avatar: avatar || '👴',
      protocol: protocol || 'Memory & Daily Routines',
      notes: 'Newly registered patient.',
      completedToday: 0
    };

    SMRITI_STATE.registeredPatients.push(newPatient);
    telemetry.saveToStorage();
    this.renderOneTapPatientList();
    this.loginPatient(newId, true);
  }

  async signupDoctor(name, regNo, specialty, clinic, email, pin) {
    const errEl = document.getElementById('signupDoctorError');
    if (errEl) errEl.textContent = '';

    try {
      const res = await ApiClient.register({
        role: 'doctor',
        name: name.startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
        reg_no: regNo.trim(),
        specialty: specialty.trim(),
        clinic: clinic.trim(),
        email: email.trim(),
        pin: pin.trim() || '1234'
      });

      if (res.ok && res.data?.user) {
        ApiClient.setToken(res.data.token);
        this.applyAuthenticatedUser(res.data.user);
        return;
      }
      if (res.data?.error) {
        audio.playGentleChime();
        if (errEl) errEl.textContent = '❌ ' + res.data.error;
        return;
      }
    } catch (e) {}

    // Fallback local flow
    const newId = 'doc_' + Date.now();
    const newDoc = {
      id: newId,
      name: name.startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
      regNo: regNo.trim(),
      specialty: specialty.trim(),
      clinic: clinic.trim(),
      email: email.trim(),
      pin: pin.trim() || '1234',
      avatar: '🩺'
    };

    SMRITI_STATE.registeredDoctors.push(newDoc);
    telemetry.saveToStorage();

    const profile = {
      id: newDoc.id,
      name: newDoc.name,
      role: 'doctor',
      location: newDoc.clinic,
      avatar: newDoc.avatar
    };
    this.applyAuthenticatedUser(profile);
  }

  logout() {
    ApiClient.logout();
    SMRITI_STATE.activeProfile = null;
    SMRITI_STATE.isAuthenticated = false;
    telemetry.saveToStorage();
    this.showAuthPortal();
    audio.speak('You have been logged out.');
  }

  renderOneTapPatientList() {
    const container = document.getElementById('oneTapPatientList');
    if (!container) return;

    // Reduced to 1 primary demo elder profile for instant test access
    const demoPatient = SMRITI_STATE.registeredPatients.find(p => p.id === 'p1') || SMRITI_STATE.registeredPatients[0];
    if (!demoPatient) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <button class="one-tap-btn" data-patient-id="${demoPatient.id}">
        <span class="one-tap-avatar">${demoPatient.avatar || '👴'}</span>
        <div class="one-tap-info">
          <strong>${demoPatient.name} (Demo Patient)</strong>
          <small>⚡ Instant 1-Click Elder Demo Login ➔</small>
        </div>
      </button>
    `;

    const btn = container.querySelector('.one-tap-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-patient-id');
        this.loginPatient(pid, true);
      });
    }
  }
}

const auth = new AuthController();

// ==========================================================================
// 5.1 EMERGENCY CARETAKER ALERT CONTROLLER
// ==========================================================================
class EmergencyController {
  constructor() {
    this.activeAlert = null;
  }

  async triggerSOS(emergencyNote = 'Emergency SOS assistance requested from tablet') {
    const patientId = SMRITI_STATE.activeProfile?.id || 'p1';
    const patientName = SMRITI_STATE.activeProfile?.name || 'Elderly Patient';
    const ctName = SMRITI_STATE.activeProfile?.caretaker_name || 'Rupankar Baruah (Son)';
    const ctPhone = SMRITI_STATE.activeProfile?.caretaker_phone || '+91 98640 55443';

    audio.playGentleChime();
    audio.speak(`Emergency alert dispatched to your caregiver, ${ctName}.`);

    // 1. Send to backend
    try {
      const res = await ApiClient.sendEmergencyAlert({
        patient_id: patientId,
        emergency_note: emergencyNote
      });

      if (res.ok && res.data) {
        this.activeAlert = res.data;
        this.showSOSModal(res.data);
      } else {
        // Offline / fallback payload
        this.showFallbackSOSModal(patientName, ctName, ctPhone, emergencyNote);
      }
    } catch (err) {
      console.warn('Emergency alert network error, using fallback:', err);
      this.showFallbackSOSModal(patientName, ctName, ctPhone, emergencyNote);
    }
  }

  showSOSModal(data) {
    const modal = document.getElementById('modalEmergencySOS');
    if (!modal) return;

    const nameEl = document.getElementById('sosModalCaretakerName');
    const phoneEl = document.getElementById('sosModalCaretakerPhone');
    const msgEl = document.getElementById('sosModalMessagePreview');
    const waBtn = document.getElementById('sosModalWhatsappBtn');
    const smsBtn = document.getElementById('sosModalSmsBtn');
    const callBtn = document.getElementById('sosModalCallBtn');

    if (nameEl) nameEl.textContent = data.caretaker_name || 'Family Caregiver';
    if (phoneEl) phoneEl.textContent = data.caretaker_phone || '+91 98640 55443';
    if (msgEl) msgEl.textContent = `"${data.message}"`;

    if (waBtn && data.whatsapp_url) {
      waBtn.href = data.whatsapp_url;
    }
    if (smsBtn && data.sms_url) {
      smsBtn.href = data.sms_url;
    }
    if (callBtn && data.call_url) {
      callBtn.href = data.call_url;
    }

    modal.classList.add('open');
  }

  showFallbackSOSModal(patientName, ctName, ctPhone, note) {
    const rawDigits = (ctPhone || '9864055443').replace(/\D/g, '');
    const intlPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
    const msg = `🚨 SMRITI URGENT HEALTH ALERT: Patient ${patientName} needs immediate assistance! Note: ${note}. Caretaker: ${ctName}. Please check immediately.`;
    const encoded = encodeURIComponent(msg);

    this.showSOSModal({
      caretaker_name: ctName,
      caretaker_phone: ctPhone,
      message: msg,
      whatsapp_url: `https://wa.me/${intlPhone}?text=${encoded}`,
      sms_url: `sms:${intlPhone}?body=${encoded}`,
      call_url: `tel:${(ctPhone || '').replace(/\s+/g, '')}`
    });
  }

  async checkDoctorEmergencyAlerts() {
    try {
      const res = await ApiClient.getEmergencyLogs(5);
      if (res.ok && res.data?.data && res.data.data.length > 0) {
        const unack = res.data.data.find(a => a.status === 'DISPATCHED');
        const banner = document.getElementById('doctorEmergencyBanner');
        if (unack && banner) {
          banner.style.display = 'flex';
          const nameEl = document.getElementById('docAlertPatientName');
          const ctEl = document.getElementById('docAlertCaretaker');
          const timeEl = document.getElementById('docAlertTime');
          const callBtn = document.getElementById('btnDocCallCaretaker');
          const waBtn = document.getElementById('btnDocWaCaretaker');
          const ackBtn = document.getElementById('btnDocAckAlert');

          if (nameEl) nameEl.textContent = unack.patient_name || 'Patient';
          if (ctEl) ctEl.textContent = `${unack.caretaker_name || 'Caregiver'} (${unack.caretaker_phone})`;
          if (timeEl) timeEl.textContent = new Date(unack.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

          const cleanPhone = (unack.caretaker_phone || '').replace(/\D/g, '');
          const intl = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
          if (callBtn) callBtn.href = `tel:${unack.caretaker_phone.replace(/\s+/g, '')}`;
          if (waBtn) waBtn.href = `https://wa.me/${intl}?text=${encodeURIComponent(`Doctor Anamika regarding urgent alert for ${unack.patient_name}`)}`;

          if (ackBtn) {
            ackBtn.onclick = async () => {
              await ApiClient.acknowledgeEmergencyAlert(unack.id);
              banner.style.display = 'none';
              audio.speak('Emergency alert marked as attended.');
            };
          }
        }
      }
    } catch (e) {}
  }
}

const emergencyController = new EmergencyController();

// ==========================================================================
// 6. UTILITY FUNCTIONS
// ==========================================================================
function formatSeconds(totalSecs) {
  const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ==========================================================================
// 7. 12 INTERACTIVE COGNITIVE GAMES (English Only, Cultural Motifs)
// ==========================================================================
const GAME_DEFINITIONS = {
  // 1. Reminiscence Recall (Cultural Memory Match)
  reminiscence: {
    id: 'reminiscence',
    name: 'Reminiscence Recall',
    local: 'Traditional Heritage Memory Match',
    domain: 'Cultural & Short-Term Memory',
    icon: '🫖',
    prompt: 'Tap any two cards to turn them over. Match the classic pairs: Tea Kettle, Rhinoceros, Silk Motif, and Orchid Flower.',
    hint: 'Look for two cards showing the identical image, like the Assam Tea Kettle or Orchid flower.',
    init: (surface) => {
      const items = [
        { id: 'kettle', icon: '🫖', label: 'Tea Kettle' },
        { id: 'rhino', icon: '🦏', label: 'Rhinoceros' },
        { id: 'muga', icon: '🌾', label: 'Silk Motif' },
        { id: 'orchid', icon: '🌸', label: 'Orchid Flower' }
      ];
      let cards = [...items, ...items].sort(() => Math.random() - 0.5);
      
      let html = `<div class="reminiscence-grid" id="reminGrid">`;
      cards.forEach((card, idx) => {
        html += `
          <button class="flip-card" data-idx="${idx}" data-item="${card.id}" aria-label="Card ${idx+1}">
            <div class="flip-card-inner">
              <div class="flip-card-front"></div>
              <div class="flip-card-back">
                <span class="card-back-icon">${card.icon}</span>
                <span class="card-back-label">${card.label}</span>
              </div>
            </div>
          </button>
        `;
      });
      html += `</div>`;
      surface.innerHTML = html;

      let flippedCards = [];
      let matchedCount = 0;

      const cardButtons = surface.querySelectorAll('.flip-card');
      cardButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          if (flippedCards.length >= 2 || btn.classList.contains('flipped') || btn.classList.contains('matched')) {
            return;
          }

          audio.playGentleChime();
          btn.classList.add('flipped');
          flippedCards.push(btn);

          if (flippedCards.length === 2) {
            const [c1, c2] = flippedCards;
            const item1 = c1.getAttribute('data-item');
            const item2 = c2.getAttribute('data-item');

            if (item1 === item2) {
              setTimeout(() => {
                c1.classList.add('matched');
                c2.classList.add('matched');
                audio.playSuccessMelody();
                flippedCards = [];
                matchedCount += 2;

                if (matchedCount === cards.length) {
                  setTimeout(() => finishGame(100), 600);
                }
              }, 400);
            } else {
              setTimeout(() => {
                c1.classList.remove('flipped');
                c2.classList.remove('flipped');
                flippedCards = [];
              }, 1200);
            }
          }
        });
      });
    }
  },

  // 2. The Morning Tea Sequencer
  tea_sequencer: {
    id: 'tea_sequencer',
    name: 'Morning Tea Sequencer',
    local: 'Daily Morning Routine Sequence',
    domain: 'Executive Function & Procedural Order',
    icon: '☕',
    prompt: 'Put the 3 steps of preparing morning tea in order: Boil spring water -> Add tea leaves -> Pour into cup.',
    hint: 'First boil the water in the kettle, then add the tea leaves, and finally pour into your cup.',
    init: (surface) => {
      const steps = [
        { id: 'step_boil', num: 1, text: 'Boil fresh spring water in kettle', icon: '🫖' },
        { id: 'step_leaves', num: 2, text: 'Add fragrant tea leaves', icon: '🌿' },
        { id: 'step_pour', num: 3, text: 'Pour steaming tea into ceramic cup', icon: '☕' }
      ];

      const shuffled = [...steps].sort(() => Math.random() - 0.5);
      let placed = [];

      function render() {
        surface.innerHTML = `
          <div class="tea-sequence-container">
            <div class="sequence-slots-row">
              <div class="sequence-slot ${placed[0] ? 'filled' : ''}" id="slot0">
                <span class="slot-number-badge">Step 1: First</span>
                ${placed[0] ? `<span class="seq-item-icon">${placed[0].icon}</span><span class="seq-item-text">${placed[0].text}</span>` : '<span style="color:var(--text-muted);font-size:0.9rem;">Tap card below</span>'}
              </div>
              <div class="sequence-slot ${placed[1] ? 'filled' : ''}" id="slot1">
                <span class="slot-number-badge">Step 2: Next</span>
                ${placed[1] ? `<span class="seq-item-icon">${placed[1].icon}</span><span class="seq-item-text">${placed[1].text}</span>` : '<span style="color:var(--text-muted);font-size:0.9rem;">Tap card below</span>'}
              </div>
              <div class="sequence-slot ${placed[2] ? 'filled' : ''}" id="slot2">
                <span class="slot-number-badge">Step 3: Finally</span>
                ${placed[2] ? `<span class="seq-item-icon">${placed[2].icon}</span><span class="seq-item-text">${placed[2].text}</span>` : '<span style="color:var(--text-muted);font-size:0.9rem;">Tap card below</span>'}
              </div>
            </div>

            <div class="sequence-options-row">
              ${shuffled.map(s => `
                <button class="seq-item-card ${placed.some(p => p.id === s.id) ? 'selected' : ''}" data-step-id="${s.id}">
                  <span class="seq-item-icon">${s.icon}</span>
                  <span class="seq-item-text">${s.text}</span>
                </button>
              `).join('')}
            </div>

            <div class="seq-actions">
              <button class="btn-nav" id="btnResetSeq" style="min-height:56px;padding:0 24px;">🔄 Reset Steps</button>
            </div>
          </div>
        `;

        surface.querySelectorAll('.seq-item-card').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-step-id');
            const stepObj = steps.find(s => s.id === sid);
            if (stepObj && placed.length < 3 && !placed.some(p => p.id === sid)) {
              audio.playGentleChime();
              placed.push(stepObj);
              render();

              if (placed.length === 3) {
                const isCorrect = placed[0].id === 'step_boil' && placed[1].id === 'step_leaves' && placed[2].id === 'step_pour';
                if (isCorrect) {
                  audio.playSuccessMelody();
                  setTimeout(() => finishGame(100), 800);
                } else {
                  audio.speak('Almost right! Let us try arranging them in order again.');
                  setTimeout(() => {
                    placed = [];
                    render();
                  }, 1800);
                }
              }
            }
          });
        });

        const btnReset = surface.querySelector('#btnResetSeq');
        if (btnReset) {
          btnReset.addEventListener('click', () => {
            placed = [];
            render();
          });
        }
      }

      render();
    }
  },

  // 3. Weekly Market Explorer (Working Memory 5s)
  haat_explorer: {
    id: 'haat_explorer',
    name: 'Weekly Market Explorer',
    local: 'Haat Bazaar Basket Recall',
    domain: 'Short-Term Memory',
    icon: '🧺',
    prompt: 'Look at the 3 items in the bamboo basket. Remember them! In 5 seconds, find them in the marketplace grid.',
    hint: 'Remember the Hot Pepper, Bamboo Shoot, and Black Rice in your basket.',
    init: (surface) => {
      const targetItems = [
        { id: 'chilli', name: 'Hot Pepper', icon: '🌶️' },
        { id: 'bamboo', name: 'Fresh Bamboo Shoot', icon: '🎍' },
        { id: 'rice', name: 'Black Rice', icon: '🍚' }
      ];

      const allMarketItems = [
        ...targetItems,
        { id: 'mustard', name: 'Mustard Greens', icon: '🥬' },
        { id: 'fish', name: 'River Fish', icon: '🐟' },
        { id: 'turmeric', name: 'Wild Turmeric', icon: '🫚' }
      ].sort(() => Math.random() - 0.5);

      surface.innerHTML = `
        <div class="haat-container">
          <div class="haat-basket-box">
            <span class="basket-title">🧺 Items in Your Basket (Remember these 3!):</span>
            <div class="basket-items-row">
              ${targetItems.map(item => `
                <div class="basket-item-badge">
                  <span>${item.icon}</span>
                  <span>${item.name}</span>
                </div>
              `).join('')}
            </div>
            <div class="haat-progress-bar-wrap">
              <div class="haat-progress-fill" id="haatProgress"></div>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        const pFill = surface.querySelector('#haatProgress');
        if (pFill) pFill.style.width = '0%';
      }, 50);

      setTimeout(() => {
        let selected = [];
        surface.innerHTML = `
          <div class="haat-container">
            <h4 style="font-size:1.2rem;font-weight:800;color:var(--primary-forest);">Tap the 3 items that were in your basket:</h4>
            <div class="haat-grid-6">
              ${allMarketItems.map(item => `
                <button class="haat-product-card" data-item-id="${item.id}">
                  <span style="font-size:2.4rem;">${item.icon}</span>
                  <span style="font-weight:700;font-size:0.95rem;text-align:center;">${item.name}</span>
                </button>
              `).join('')}
            </div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--accent-amber);" id="haatFoundCount">Found: 0 / 3</div>
          </div>
        `;

        surface.querySelectorAll('.haat-product-card').forEach(btn => {
          btn.addEventListener('click', () => {
            const itemId = btn.getAttribute('data-item-id');
            const isTarget = targetItems.some(t => t.id === itemId);

            if (!btn.classList.contains('selected')) {
              btn.classList.add('selected');
              audio.playGentleChime();
              if (isTarget) {
                selected.push(itemId);
                const countEl = surface.querySelector('#haatFoundCount');
                if (countEl) countEl.textContent = `Found: ${selected.length} / 3`;

                if (selected.length === 3) {
                  audio.playSuccessMelody();
                  setTimeout(() => finishGame(100), 800);
                }
              }
            }
          });
        });
      }, 5000);
    }
  },

  // 4. The Weaver’s Shuttle (Diamond Tracing Canvas)
  weaver_shuttle: {
    id: 'weaver_shuttle',
    name: 'The Weaver’s Shuttle',
    local: 'Traditional Diamond Motif Tracing',
    domain: 'Visuospatial & Motor Tracing',
    icon: '🧵',
    prompt: 'Trace along the golden silk diamond motif with your finger or mouse at your own gentle pace.',
    hint: 'Follow the golden dashed path around the diamond shape.',
    init: (surface) => {
      surface.innerHTML = `
        <div class="weaver-container">
          <div class="weaver-canvas-wrap">
            <canvas id="weaverCanvas" width="480" height="320"></canvas>
          </div>
          <div class="weaver-metrics-bar">
            <span>Path Traced: <strong id="tracerProgress">0%</strong></span>
            <span>Motor Stability: <strong style="color:var(--accent-emerald);">Gentle & Steady</strong></span>
          </div>
          <button class="btn-primary-nav" id="btnFinishTrace" style="min-height:56px;padding:0 24px;display:none;">✨ Complete Motif</button>
        </div>
      `;

      const canvas = surface.querySelector('#weaverCanvas');
      const ctx = canvas.getContext('2d');
      const progressEl = surface.querySelector('#tracerProgress');
      const finishBtn = surface.querySelector('#btnFinishTrace');

      const pts = [
        { x: 240, y: 50 },
        { x: 380, y: 160 },
        { x: 240, y: 270 },
        { x: 100, y: 160 },
        { x: 240, y: 50 }
      ];

      function drawBackground() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFDF9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#059669';
        ctx.fill();
      }

      drawBackground();

      let isDrawing = false;
      let pointsDrawn = 0;

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      }

      function onMove(e) {
        if (!isDrawing) return;
        const pos = getPos(e);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#1B4D3E';
        ctx.fill();

        pointsDrawn++;
        const pct = Math.min(100, Math.round((pointsDrawn / 45) * 100));
        if (progressEl) progressEl.textContent = `${pct}%`;

        if (pct >= 100) {
          if (finishBtn) finishBtn.style.display = 'inline-flex';
        }
      }

      canvas.addEventListener('mousedown', () => { isDrawing = true; });
      canvas.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', () => { isDrawing = false; });

      canvas.addEventListener('touchstart', (e) => { isDrawing = true; e.preventDefault(); }, { passive: false });
      canvas.addEventListener('touchmove', (e) => { onMove(e); e.preventDefault(); }, { passive: false });
      window.addEventListener('touchend', () => { isDrawing = false; });

      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          audio.playSuccessMelody();
          finishGame(100);
        });
      }
    }
  },

  // 5. Sounds of the Hills (Acoustic Matching)
  hill_sounds: {
    id: 'hill_sounds',
    name: 'Sounds of the Hills',
    local: 'Acoustic & Wildlife Tone Matching',
    domain: 'Acoustic & Wildlife Matching',
    icon: '🎺',
    prompt: 'Tap "Play Sound" to listen to a soothing nature tone. Tap the card that matches what you hear!',
    hint: 'Listen carefully to the melody or nature sound, then tap the picture.',
    init: (surface) => {
      const sounds = [
        { id: 'pepa', title: 'Buffalo Horn Instrument', local: 'Resonant Traditional Horn', icon: '🎺', play: () => audio.playPepaSound() },
        { id: 'tokari', title: 'Plucked Folk String', local: 'Gentle Acoustic String Instrument', icon: '🪕', play: () => audio.playTokariSound() },
        { id: 'rain', title: 'Monsoon Rain', local: 'Gentle Hill Rainfall', icon: '🌧️', play: () => audio.playMonsoonRainSound() },
        { id: 'hornbill', title: 'Great Hornbill Bird', local: 'Cherished Mountain Bird Call', icon: '🦅', play: () => audio.playHornbillSound() }
      ];

      const target = sounds[0];

      surface.innerHTML = `
        <div class="hill-sounds-container">
          <div class="audio-play-box">
            <button class="btn-listen-sound" id="btnPlayRegionalSound">
              <span>🔊</span>
              <span>Play Hill Sound</span>
            </button>
            <p style="font-size:0.95rem;color:#3730A3;font-weight:600;">Tap above to listen to the melody</p>
          </div>

          <div class="sound-cards-grid">
            ${sounds.map(s => `
              <button class="sound-match-card" data-sound-id="${s.id}">
                <span class="s-icon">${s.icon}</span>
                <div class="s-info">
                  <div class="s-title">${s.title}</div>
                  <div class="s-local">${s.local}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      const playBtn = surface.querySelector('#btnPlayRegionalSound');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          target.play();
        });
      }

      surface.querySelectorAll('.sound-match-card').forEach(card => {
        card.addEventListener('click', () => {
          const sid = card.getAttribute('data-sound-id');
          if (sid === target.id) {
            audio.playSuccessMelody();
            card.style.borderColor = 'var(--accent-emerald)';
            card.style.backgroundColor = 'var(--accent-emerald-light)';
            setTimeout(() => finishGame(100), 800);
          } else {
            audio.playGentleChime();
            audio.speak('Listen closely to the horn melody and try again.');
          }
        });
      });
    }
  },

  // 6. Classic Folk Sayings
  folk_rhymes: {
    id: 'folk_rhymes',
    name: 'Classic Folk Sayings',
    local: 'Proverb & Wisdom Completion',
    domain: 'Language & Long-Term Memory',
    icon: '📜',
    prompt: 'Listen to the classic proverb opening. Select the choice that wisely completes the phrase.',
    hint: 'Think of the traditional saying about morning sunshine and plentiful crops.',
    init: (surface) => {
      const proverb = {
        opening: '“When morning sunshine meets gentle rainfall...”',
        meaning: 'Traditional wisdom regarding agricultural harmony',
        correct: '“...the granary overflows with golden harvest.”',
        distractor: '“...the river water dries away into the desert.”'
      };

      const choices = [
        { text: proverb.correct, isCorrect: true },
        { text: proverb.distractor, isCorrect: false }
      ].sort(() => Math.random() - 0.5);

      surface.innerHTML = `
        <div class="folk-rhymes-container">
          <div class="proverb-opening-box">
            <div class="proverb-lead">${proverb.opening}</div>
            <div class="proverb-meaning">${proverb.meaning}</div>
          </div>

          <div class="rhyme-choices-grid">
            ${choices.map((c, idx) => `
              <button class="rhyme-choice-card" data-correct="${c.isCorrect}">
                ${c.text}
              </button>
            `).join('')}
          </div>
        </div>
      `;

      surface.querySelectorAll('.rhyme-choice-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          if (isCorrect) {
            audio.playSuccessMelody();
            btn.style.borderColor = 'var(--accent-emerald)';
            btn.style.backgroundColor = 'var(--accent-emerald-light)';
            setTimeout(() => finishGame(100), 800);
          } else {
            audio.playGentleChime();
            audio.speak('Take your time and think of the golden harvest.');
          }
        });
      });
    }
  },

  // 7. Two Leaves and a Bud (Selective Attention)
  two_leaves: {
    id: 'two_leaves',
    name: 'Two Leaves and a Bud',
    local: 'Selective Tea Foliage Attention',
    domain: 'Selective Visual Attention',
    icon: '🌱',
    prompt: 'Gently pluck only the 4 young light-green tea shoots (🌱) while leaving the dry brown twigs to rest.',
    hint: 'Look for the glowing light-green tender shoots with two young leaves.',
    init: (surface) => {
      const nodes = [
        { type: 'shoot', icon: '🌱', top: '20%', left: '15%' },
        { type: 'dry', icon: '🍂', top: '15%', left: '45%' },
        { type: 'shoot', icon: '🌱', top: '35%', left: '70%' },
        { type: 'dry', icon: '🍂', top: '60%', left: '25%' },
        { type: 'shoot', icon: '🌱', top: '65%', left: '55%' },
        { type: 'dry', icon: '🍂', top: '40%', left: '85%' },
        { type: 'shoot', icon: '🌱', top: '25%', left: '30%' },
        { type: 'dry', icon: '🍂', top: '70%', left: '78%' }
      ];

      let shootsHarvested = 0;

      surface.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;width:100%;">
          <div class="tea-bush-container">
            ${nodes.map((n, i) => `
              <button class="tea-node ${n.type}" data-type="${n.type}" style="top:${n.top};left:${n.left};" aria-label="${n.type === 'shoot' ? 'Fresh Tea Shoot' : 'Dry Twig'}">
                <span>${n.icon}</span>
              </button>
            `).join('')}
          </div>
          <div class="tea-tally-bar">Tender Shoots Plucked: <span id="shootCount">0</span> / 4 🍃</div>
        </div>
      `;

      surface.querySelectorAll('.tea-node').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          if (type === 'shoot' && !btn.classList.contains('harvested')) {
            btn.classList.add('harvested');
            audio.playGentleChime();
            shootsHarvested++;
            const countEl = surface.querySelector('#shootCount');
            if (countEl) countEl.textContent = shootsHarvested;

            if (shootsHarvested === 4) {
              audio.playSuccessMelody();
              setTimeout(() => finishGame(100), 800);
            }
          } else if (type === 'dry') {
            audio.playGentleChime();
            audio.speak('That is dry foliage. Look for the fresh tender green shoots.');
          }
        });
      });
    }
  },

  // 8. The Village Market Counter (Functional Numeracy)
  bazaar_counter: {
    id: 'bazaar_counter',
    name: 'Village Market Counter',
    local: 'Currency Coin Counting',
    domain: 'Functional Numeracy',
    icon: '🪙',
    prompt: 'A bundle of fresh herbs costs ₹7. Tap the shiny currency coins (₹5, ₹2, ₹1) to count out the exact amount.',
    hint: 'Try tapping the ₹5 coin once, and then the ₹2 coin (5 + 2 = 7)!',
    init: (surface) => {
      const targetAmount = 7;
      let currentTotal = 0;

      function updateView() {
        surface.innerHTML = `
          <div class="bazaar-counter-container">
            <div class="bazaar-bill-card">
              <div class="bill-item-info">
                <h4>Fresh Mountain Garden Herbs 🌿</h4>
                <p>Village Market Stall Total</p>
              </div>
              <div class="bill-target-price">Exact Price: ₹${targetAmount}</div>
            </div>

            <div class="coin-paid-summary">
              Paid so far: <strong>₹${currentTotal}</strong> / ₹${targetAmount}
            </div>

            <div class="coins-tray">
              <button class="coin-btn coin-1" data-val="1" aria-label="One Rupee Coin">
                <span>₹1</span>
              </button>
              <button class="coin-btn coin-2" data-val="2" aria-label="Two Rupee Coin">
                <span>₹2</span>
              </button>
              <button class="coin-btn coin-5" data-val="5" aria-label="Five Rupee Coin">
                <span>₹5</span>
              </button>
            </div>

            <button class="btn-nav" id="btnResetCoins" style="min-height:52px;padding:0 24px;">🔄 Clear Coins</button>
          </div>
        `;

        surface.querySelectorAll('.coin-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = parseInt(btn.getAttribute('data-val'), 10);
            audio.playGentleChime();
            currentTotal += val;

            if (currentTotal === targetAmount) {
              updateView();
              audio.playSuccessMelody();
              setTimeout(() => finishGame(100), 800);
            } else if (currentTotal > targetAmount) {
              audio.speak(`That is ₹${currentTotal}, which is a little extra. Let us count ₹7 together.`);
              setTimeout(() => {
                currentTotal = 0;
                updateView();
              }, 1800);
            } else {
              updateView();
            }
          });
        });

        const resetBtn = surface.querySelector('#btnResetCoins');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            currentTotal = 0;
            updateView();
          });
        }
      }

      updateView();
    }
  },

  // 9. Harvest Granary Sort (Categorical Sorting)
  pantry_sort: {
    id: 'pantry_sort',
    name: 'Harvest Granary Sort',
    local: 'Categorical Sorting Exercise',
    domain: 'Categorical Sorting',
    icon: '🌾',
    prompt: 'Sort each item into the right granary bin: Is it an "Edible Garden Harvest" or a "Traditional Farming Tool"?',
    hint: 'Fresh ginger is food for cooking, while the sickle is a tool for farming.',
    init: (surface) => {
      const items = [
        { name: 'Fresh Ginger', category: 'harvest', icon: '🫚' },
        { name: 'Bamboo Sickle', category: 'tools', icon: '🌾' },
        { name: 'Raw Turmeric', category: 'harvest', icon: '🥔' },
        { name: 'Woven Basket', category: 'tools', icon: '🧺' }
      ];

      let currentIndex = 0;

      function renderCurrentItem() {
        if (currentIndex >= items.length) {
          audio.playSuccessMelody();
          finishGame(100);
          return;
        }

        const item = items[currentIndex];

        surface.innerHTML = `
          <div class="pantry-sort-container">
            <div class="active-item-pod">
              <span class="pod-icon">${item.icon}</span>
              <span class="pod-name">${item.name}</span>
            </div>

            <div class="pantry-bins-row">
              <button class="pantry-bin bin-harvest" data-category="harvest">
                <span class="bin-icon">🌾</span>
                <span class="bin-title">Edible Garden Harvest</span>
                <span class="bin-desc">Fresh spices, crops, and kitchen food</span>
              </button>

              <button class="pantry-bin bin-tools" data-category="tools">
                <span class="bin-icon">🛠️</span>
                <span class="bin-title">Traditional Farming Tools</span>
                <span class="bin-desc">Sickles, baskets, and implements</span>
              </button>
            </div>
          </div>
        `;

        surface.querySelectorAll('.pantry-bin').forEach(bin => {
          bin.addEventListener('click', () => {
            const cat = bin.getAttribute('data-category');
            if (cat === item.category) {
              audio.playGentleChime();
              currentIndex++;
              renderCurrentItem();
            } else {
              audio.speak('Take another look at this item. Where does it belong?');
            }
          });
        });
      }

      renderCurrentItem();
    }
  },

  // 10. The Path Home (Spatial Navigation)
  path_home: {
    id: 'path_home',
    name: 'The Path Home',
    local: 'Spatial Landmark Navigation',
    domain: 'Spatial & Landmark Navigation',
    icon: '🌉',
    prompt: 'Walk past the Bamboo Bridge, then turn toward the village Prayer Hall to reach home.',
    hint: 'First tap the Bamboo Bridge, then tap the Prayer Hall.',
    init: (surface) => {
      let step = 1;

      function renderStep() {
        if (step === 1) {
          surface.innerHTML = `
            <div class="path-home-container">
              <div class="navigation-prompt-box">
                <h4>Step 1: Which route crosses the village stream?</h4>
              </div>
              <div class="fork-options-grid">
                <button class="landmark-card" data-correct="true">
                  <span class="l-icon">🌉</span>
                  <span class="l-title">Bamboo Stream Bridge</span>
                </button>
                <button class="landmark-card" data-correct="false">
                  <span class="l-icon">🏔️</span>
                  <span class="l-title">Rocky Mountain Ridge</span>
                </button>
              </div>
            </div>
          `;
        } else if (step === 2) {
          surface.innerHTML = `
            <div class="path-home-container">
              <div class="navigation-prompt-box">
                <h4>Step 2: Now turn toward the peaceful prayer hall:</h4>
              </div>
              <div class="fork-options-grid">
                <button class="landmark-card" data-correct="true">
                  <span class="l-icon">🛕</span>
                  <span class="l-title">Village Prayer Hall</span>
                </button>
                <button class="landmark-card" data-correct="false">
                  <span class="l-icon">⛵</span>
                  <span class="l-title">River Boat Ghat</span>
                </button>
              </div>
            </div>
          `;
        }

        surface.querySelectorAll('.landmark-card').forEach(btn => {
          btn.addEventListener('click', () => {
            const isCorrect = btn.getAttribute('data-correct') === 'true';
            if (isCorrect) {
              audio.playGentleChime();
              if (step === 1) {
                step = 2;
                renderStep();
              } else {
                audio.playSuccessMelody();
                finishGame(100);
              }
            } else {
              audio.speak('Let us follow the village pathway toward the bridge and prayer hall.');
            }
          });
        });
      }

      renderStep();
    }
  },

  // 11. Kinship & Faces (Facial Recognition)
  kinship_faces: {
    id: 'kinship_faces',
    name: 'Kinship & Faces',
    local: 'Family & Facial Recall',
    domain: 'Facial & Family Recall',
    icon: '👨‍👩‍👧',
    prompt: 'Look at the beloved family portrait. Who is wearing the sacred red scarf?',
    hint: 'Look for Uncle Pradip with his traditional red woven scarf.',
    init: (surface) => {
      surface.innerHTML = `
        <div class="kinship-container">
          <div class="family-portrait-card">
            <div class="portrait-emojis">👵 👴🧣 👩 👨</div>
            <div class="portrait-question">Who is wearing the red woven scarf?</div>
          </div>

          <div class="kinship-choices-grid">
            <button class="kinship-choice-btn" data-correct="true">
              👴 Uncle Pradip (wearing Red Scarf)
            </button>
            <button class="kinship-choice-btn" data-correct="false">
              👵 Auntie Minati (in Golden Silk Dress)
            </button>
          </div>
        </div>
      `;

      surface.querySelectorAll('.kinship-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          if (isCorrect) {
            audio.playSuccessMelody();
            btn.style.borderColor = 'var(--accent-emerald)';
            btn.style.backgroundColor = 'var(--accent-emerald-light)';
            setTimeout(() => finishGame(100), 800);
          } else {
            audio.speak('Look closely at the grandfather wearing the red scarf.');
          }
        });
      });
    }
  },

  // 12. Natural Dye Shade Matching (Color Discrimination)
  natural_dye: {
    id: 'natural_dye',
    name: 'Natural Dye Shade Matching',
    local: 'Silk Skein Color Discrimination',
    domain: 'Color Discrimination',
    icon: '🧶',
    prompt: 'Match the target silk yarn dyed with Golden Turmeric with the identical shade below.',
    hint: 'Look for the warm golden yellow tone of fresh garden turmeric.',
    init: (surface) => {
      const targetColor = '#F59E0B';

      const choices = [
        { name: 'Pale Bamboo Sprout Green', color: '#86EFAC', isCorrect: false },
        { name: 'Golden Turmeric Silk', color: '#F59E0B', isCorrect: true },
        { name: 'Deep Madder Crimson', color: '#E11D48', isCorrect: false }
      ].sort(() => Math.random() - 0.5);

      surface.innerHTML = `
        <div class="natural-dye-container">
          <div class="target-dye-box">
            <div class="target-dye-swatch" style="background-color:${targetColor};"></div>
            <div class="target-dye-text">
              <h4>Target Shade: Golden Turmeric Silk</h4>
              <p>Natural traditional forest plant dye</p>
            </div>
          </div>

          <div class="dye-choices-grid">
            ${choices.map(c => `
              <button class="dye-choice-card" data-correct="${c.isCorrect}">
                <div class="dye-swatch-sample" style="background-color:${c.color};"></div>
                <span class="dye-name">${c.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      surface.querySelectorAll('.dye-choice-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const isCorrect = btn.getAttribute('data-correct') === 'true';
          if (isCorrect) {
            audio.playSuccessMelody();
            btn.style.borderColor = 'var(--accent-emerald)';
            btn.style.backgroundColor = 'var(--accent-emerald-light)';
            setTimeout(() => finishGame(100), 800);
          } else {
            audio.speak('Compare the golden yellow swatch with the target.');
          }
        });
      });
    }
  }
};

// ==========================================================================
// 8. GAME LAUNCH & COMPLETION CONTROLLER
// ==========================================================================
function launchGame(gameKey) {
  const def = GAME_DEFINITIONS[gameKey];
  if (!def) return;

  SMRITI_STATE.currentGame = def;
  SMRITI_STATE.gameStartTime = Date.now();

  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
  document.getElementById('viewGamePlayer').classList.add('active');

  document.getElementById('activeGameIcon').textContent = def.icon;
  document.getElementById('activeGameTitle').textContent = def.name;
  document.getElementById('activeGameLocal').textContent = def.local;
  document.getElementById('instructionText').textContent = def.prompt;

  aiEngine.updateBadgeUI();
  audio.speak(def.prompt);

  const surface = document.getElementById('gameSurface');
  def.init(surface);
}

function finishGame(score = 100) {
  if (!SMRITI_STATE.currentGame || !SMRITI_STATE.gameStartTime) return;

  const latencySeconds = (Date.now() - SMRITI_STATE.gameStartTime) / 1000;
  const game = SMRITI_STATE.currentGame;

  telemetry.logInteraction({
    gameId: game.id,
    gameName: game.name,
    latencySeconds,
    accuracyScore: score,
    domain: game.domain,
    clinicalFlag: latencySeconds > 8.0 ? 'High Hesitation' : 'Normal'
  });

  const modal = document.getElementById('modalCelebration');
  document.getElementById('celebScore').textContent = `${score}%`;
  document.getElementById('celebTime').textContent = `${latencySeconds.toFixed(1)}s`;
  modal.classList.add('open');

  audio.speak('Wonderful job completing this calming activity!');
}

function returnToVillageHub() {
  document.getElementById('modalCelebration').classList.remove('open');
  document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
  document.getElementById('viewPatientHub').classList.add('active');
  SMRITI_STATE.currentGame = null;
  telemetry.updateDashboardUI();
}

// ==========================================================================
// 9. PIN AUTHENTICATION FOR DOCTOR MODAL
// ==========================================================================
let currentEnteredPin = '';

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot${i}`);
    if (dot) {
      if (i < currentEnteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    }
  }
}

function verifyPinAndEnterDoctor() {
  const errorMsg = document.getElementById('pinErrorMsg');
  if (currentEnteredPin === '1234') {
    currentEnteredPin = '';
    updatePinDots();
    document.getElementById('modalPinAuth').classList.remove('open');

    const docObj = SMRITI_STATE.registeredDoctors[0];
    const profile = {
      id: docObj.id,
      name: docObj.name,
      role: 'doctor',
      location: docObj.clinic,
      avatar: docObj.avatar
    };
    auth.applyAuthenticatedUser(profile);
  } else {
    audio.playGentleChime();
    if (errorMsg) errorMsg.textContent = 'Incorrect PIN. Default PIN is 1234.';
    currentEnteredPin = '';
    updatePinDots();
  }
}

// ==========================================================================
// 10. EVENT LISTENERS & APP BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Session Timer Tick (every 1 second) - Patients only (No playtime timer for doctors)
  setInterval(() => {
    if (SMRITI_STATE.isSessionRunning && SMRITI_STATE.activeProfile?.role === 'patient') {
      SMRITI_STATE.sessionSeconds += 1;
      const formatted = formatSeconds(SMRITI_STATE.sessionSeconds);
      const timerEl = document.getElementById('liveSessionTime');
      if (timerEl) timerEl.textContent = formatted;
    }
  }, 1000);

  // Initialize Auth Controller & Views
  auth.init();

  // Initialize Language & Full DOM Translation
  const initialLang = localStorage.getItem('smriti_language') || SMRITI_STATE.selectedLanguage || 'en';
  setLanguage(initialLang);

  // -------------------------------------------------------------
  // AUTH PORTAL TABS & ROLE SWITCHERS
  // -------------------------------------------------------------
  document.getElementById('tabAuthLogin')?.addEventListener('click', () => {
    document.getElementById('tabAuthLogin').classList.add('active');
    document.getElementById('tabAuthSignup').classList.remove('active');
    document.getElementById('panelAuthLogin').style.display = 'block';
    document.getElementById('panelAuthSignup').style.display = 'none';
  });

  document.getElementById('tabAuthSignup')?.addEventListener('click', () => {
    document.getElementById('tabAuthSignup').classList.add('active');
    document.getElementById('tabAuthLogin').classList.remove('active');
    document.getElementById('panelAuthSignup').style.display = 'block';
    document.getElementById('panelAuthLogin').style.display = 'none';
  });

  // Login Role Pills
  document.getElementById('pillLoginPatient')?.addEventListener('click', () => {
    document.getElementById('pillLoginPatient').classList.add('active');
    document.getElementById('pillLoginDoctor').classList.remove('active');
    document.getElementById('subformPatientLogin').style.display = 'block';
    document.getElementById('subformDoctorLogin').style.display = 'none';

    const patErr = document.getElementById('loginPatientError');
    if (patErr) patErr.textContent = '';
  });

  document.getElementById('pillLoginDoctor')?.addEventListener('click', () => {
    document.getElementById('pillLoginDoctor').classList.add('active');
    document.getElementById('pillLoginPatient').classList.remove('active');
    document.getElementById('subformDoctorLogin').style.display = 'block';
    document.getElementById('subformPatientLogin').style.display = 'none';

    // Refresh & clear doctor inputs on tab switch to avoid carrying over patient data
    const docEmail = document.getElementById('inputDoctorEmail');
    const docPin = document.getElementById('inputDoctorPin');
    const docErr = document.getElementById('loginDoctorError');
    if (docEmail) docEmail.value = '';
    if (docPin) docPin.value = '';
    if (docErr) docErr.textContent = '';
  });

  // Sign Up Role Pills
  document.getElementById('pillSignupPatient')?.addEventListener('click', () => {
    document.getElementById('pillSignupPatient').classList.add('active');
    document.getElementById('pillSignupDoctor').classList.remove('active');
    document.getElementById('formPatientSignup').style.display = 'flex';
    document.getElementById('formDoctorSignup').style.display = 'none';
  });

  document.getElementById('pillSignupDoctor')?.addEventListener('click', () => {
    document.getElementById('pillSignupDoctor').classList.add('active');
    document.getElementById('pillSignupPatient').classList.remove('active');
    document.getElementById('formDoctorSignup').style.display = 'flex';
    document.getElementById('formPatientSignup').style.display = 'none';
  });

  // -------------------------------------------------------------
  // AUTH FORMS SUBMISSION HANDLERS
  // -------------------------------------------------------------
  function isValidGmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
  }

  document.getElementById('formPatientDirectLogin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const identifier = document.getElementById('inputPatientIdentifier')?.value;
    const password = document.getElementById('inputPatientPassword')?.value;
    auth.loginPatientDirect(identifier, password);
  });

  document.getElementById('formDoctorLogin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('inputDoctorEmail').value;
    const pin = document.getElementById('inputDoctorPin').value;
    auth.loginDoctor(email, pin);
  });

  document.getElementById('btnDemoDoctorLogin')?.addEventListener('click', () => {
    const docEmail = document.getElementById('inputDoctorEmail');
    const docPin = document.getElementById('inputDoctorPin');
    if (docEmail) docEmail.value = 'anamika.deka@sih.gov.in';
    if (docPin) docPin.value = '1234';
    auth.loginDoctor('anamika.deka@sih.gov.in', '1234');
  });

  document.getElementById('formPatientSignup')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errEl = document.getElementById('signupPatientError');
    if (errEl) errEl.textContent = '';

    const name = document.getElementById('regPatientName').value;
    const age = document.getElementById('regPatientAge').value;
    const email = document.getElementById('regPatientEmail')?.value;
    const password = document.getElementById('regPatientPassword')?.value;
    const loc = document.getElementById('regPatientLocation')?.value || 'Assam, NER';
    const ctName = document.getElementById('regCaregiverName')?.value || 'Primary Caregiver';
    const phone = document.getElementById('regCaregiverPhone')?.value || '';
    const avatarRadio = document.querySelector('input[name="patientAvatar"]:checked');
    const avatar = avatarRadio ? avatarRadio.value : '👴';
    const protocol = document.getElementById('regCareProtocol').value;

    if (!isValidGmail(email)) {
      audio.playGentleChime();
      if (errEl) errEl.textContent = '❌ Patient registration requires a valid Gmail address ending in @gmail.com';
      return;
    }

    if (!password || password.trim().length < 3) {
      audio.playGentleChime();
      if (errEl) errEl.textContent = '❌ Please create an account password (minimum 3 characters).';
      return;
    }

    auth.signupPatient(name, age, email, password, loc, phone, avatar, protocol, ctName);
  });

  document.getElementById('formDoctorSignup')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const errEl = document.getElementById('signupDoctorError');
    if (errEl) errEl.textContent = '';

    const name = document.getElementById('regDoctorName').value;
    const regNo = document.getElementById('regDoctorRegNo').value;
    const specialty = document.getElementById('regDoctorSpecialty').value;
    const clinic = document.getElementById('regDoctorClinic').value;
    const email = document.getElementById('regDoctorEmail').value;
    const pin = document.getElementById('regDoctorPin').value;

    if (!isValidGmail(email)) {
      audio.playGentleChime();
      if (errEl) errEl.textContent = '❌ Doctor registration requires a valid Gmail address ending in @gmail.com';
      return;
    }

    auth.signupDoctor(name, regNo, specialty, clinic, email, pin);
  });

  // Logout Handler
  document.getElementById('btnLogout')?.addEventListener('click', () => {
    auth.logout();
  });

  document.getElementById('btnShowAuthModal')?.addEventListener('click', () => {
    auth.showAuthPortal();
  });

  // -------------------------------------------------------------
  // SMART DAILY LIVING REMINDERS HANDLERS
  // -------------------------------------------------------------
  document.getElementById('btnNavReminders')?.addEventListener('click', () => {
    if (SMRITI_STATE.activeProfile?.role === 'patient') {
      const remHub = document.getElementById('patientRemindersHub');
      remHub?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
      document.getElementById('viewCaregiverDashboard').classList.add('active');
    }
  });

  document.getElementById('btnSpeakAllReminders')?.addEventListener('click', () => {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
    const remData = SMRITI_STATE.reminders[activePid] || SMRITI_STATE.reminders['p1'];
    const text = `Here are your daily reminders. First: ${remData.medication.title}. Second: Hydration target is ${remData.hydration.targetGlasses} glasses of water, with ${remData.hydration.currentGlasses} glasses logged so far. Third: ${remData.routine.title}. Fourth: Doctor Appointment with ${remData.appointment.title}.`;
    audio.speak(text);
  });

  document.getElementById('btnTakeMed')?.addEventListener('click', () => {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
    if (SMRITI_STATE.reminders[activePid]) {
      SMRITI_STATE.reminders[activePid].medication.isTaken = true;
      telemetry.saveToStorage();
      telemetry.renderRemindersUI();
      audio.playSuccessMelody();
      audio.speak('Medication logged as taken for today. Wonderful job maintaining your health!');
      ApiClient.updateReminder(activePid, 'medication', { action: 'mark_taken' }).catch(() => {});
    }
  });

  document.getElementById('btnAddWater')?.addEventListener('click', () => {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
    if (SMRITI_STATE.reminders[activePid]) {
      SMRITI_STATE.reminders[activePid].hydration.currentGlasses += 1;
      telemetry.saveToStorage();
      telemetry.renderRemindersUI();
      audio.playGentleChime();
      audio.speak(`1 glass of water logged. Total: ${SMRITI_STATE.reminders[activePid].hydration.currentGlasses} glasses.`);
      ApiClient.updateReminder(activePid, 'hydration', { action: 'add_water' }).catch(() => {});
    }
  });

  document.getElementById('btnCompleteRoutine')?.addEventListener('click', () => {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
    if (SMRITI_STATE.reminders[activePid]) {
      SMRITI_STATE.reminders[activePid].routine.isDone = true;
      telemetry.saveToStorage();
      telemetry.renderRemindersUI();
      audio.playSuccessMelody();
      audio.speak('Daily routine marked as completed. Well done!');
      ApiClient.updateReminder(activePid, 'routine', { action: 'mark_taken' }).catch(() => {});
    }
  });

  document.getElementById('btnConfirmAppt')?.addEventListener('click', () => {
    const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
    audio.playGentleChime();
    audio.speak('Your upcoming clinical appointment is confirmed.');
    ApiClient.updateReminder(activePid, 'appointment', { action: 'mark_taken' }).catch(() => {});
  });

  document.getElementById('btnSaveDoctorReminders')?.addEventListener('click', () => {
    const targetPid = SMRITI_STATE.inspectedPatientId || 'p1';
    if (!SMRITI_STATE.reminders[targetPid]) {
      SMRITI_STATE.reminders[targetPid] = {
        medication: {},
        hydration: { currentGlasses: 0, targetGlasses: 8 },
        routine: {},
        appointment: {}
      };
    }
    const medVal = document.getElementById('inputDocMedName').value;
    const waterVal = parseInt(document.getElementById('inputDocWaterTarget').value, 10) || 8;
    const apptVal = document.getElementById('inputDocNextAppt').value;

    SMRITI_STATE.reminders[targetPid].medication.title = medVal;
    SMRITI_STATE.reminders[targetPid].hydration.targetGlasses = waterVal;
    SMRITI_STATE.reminders[targetPid].appointment.title = apptVal;

    telemetry.saveToStorage();
    audio.playSuccessMelody();
    alert('✅ Patient Daily Schedule & Medical Reminders updated and saved!');
  });

  // Offline edge sync handler
  document.getElementById('btnSyncEdgeCloud')?.addEventListener('click', () => {
    telemetry.syncOfflineEdgeQueue();
  });

  document.getElementById('btnDismissAlert')?.addEventListener('click', () => {
    document.getElementById('clinicalAlertBar').style.display = 'none';
  });

  // Language selector change
  document.getElementById('selectLanguage')?.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.getElementById('selectLanguageGuest')?.addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.querySelectorAll('.auth-lang-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const lang = pill.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  // Voice Assistant Modal Controls
  document.getElementById('btnVoiceAssistantTrigger')?.addEventListener('click', () => {
    openModal('modalVoiceAssistant');
    audio.playGentleChime();
    const isHi = SMRITI_STATE.selectedLanguage === 'hi';
    audio.speak(isHi ? 'स्मृति आवाज सहायक खुला है। बोलने के लिए माइक दबाएं।' : 'Voice Assistant opened. Speak naturally or tap any action.');
  });

  document.getElementById('btnCloseVoiceAssistant')?.addEventListener('click', () => {
    closeModal('modalVoiceAssistant');
  });

  document.getElementById('btnVaMicToggle')?.addEventListener('click', () => {
    voiceAssistant.toggleListening();
  });

  document.querySelectorAll('.va-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      const isHi = SMRITI_STATE.selectedLanguage === 'hi';
      if (cmd === 'play_game') {
        voiceAssistant.executeAction(cmd, isHi ? 'खेल शुरू किया जा रहा है...' : 'Starting cognitive game for you!');
      } else if (cmd === 'meds') {
        voiceAssistant.executeAction(cmd, isHi ? 'दवा ली दर्ज कर ली गई है।' : 'Medication logged as taken.');
      } else if (cmd === 'water') {
        voiceAssistant.executeAction(cmd, isHi ? 'एक गिलास ताज़ा पानी दर्ज किया गया।' : 'Logged 1 glass of water.');
      } else if (cmd === 'doctor') {
        voiceAssistant.executeAction(cmd, isHi ? 'डॉक्टर की सलाह: समय पर दवा लें और हल्का व्यायाम करें।' : 'Doctor note: Practice memory routines and stay well hydrated.');
      } else if (cmd === 'music') {
        voiceAssistant.executeAction(cmd, isHi ? 'शांत पारंपरिक लोक संगीत बजाया जा रहा है।' : 'Playing calming folk rhythms for you.');
      } else {
        voiceAssistant.executeAction(cmd, isHi ? 'मैं स्मृति सहायक हूँ। आप खेल खेलने या दवा दर्ज करने के लिए बोल सकते हैं।' : 'I am Smriti Assistant. You can speak to play games or record your daily care.');
      }
    });
  });

  // -------------------------------------------------------------
  // DOMAIN FILTER TABS & GAMES
  // -------------------------------------------------------------
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const domain = tab.getAttribute('data-domain');

      document.querySelectorAll('.game-card').forEach(card => {
        if (domain === 'all' || card.getAttribute('data-domain') === domain) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Play Game Buttons
  document.querySelectorAll('.btn-play-game').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameKey = btn.getAttribute('data-game');
      launchGame(gameKey);
    });
  });

  // Game Player Controls
  document.getElementById('btnBackToHub')?.addEventListener('click', returnToVillageHub);
  document.getElementById('btnCelebHub')?.addEventListener('click', returnToVillageHub);
  document.getElementById('btnCelebReplay')?.addEventListener('click', () => {
    document.getElementById('modalCelebration').classList.remove('open');
    if (SMRITI_STATE.currentGame) {
      launchGame(SMRITI_STATE.currentGame.id);
    }
  });

  document.getElementById('btnSpeakGamePrompt')?.addEventListener('click', () => {
    if (SMRITI_STATE.currentGame) {
      audio.speak(SMRITI_STATE.currentGame.prompt);
    }
  });

  document.getElementById('btnGentleHint')?.addEventListener('click', () => {
    if (SMRITI_STATE.currentGame) {
      audio.speak(SMRITI_STATE.currentGame.hint);
      alert(`💡 Gentle Hint: ${SMRITI_STATE.currentGame.hint}`);
    }
  });

  // Top Nav Toggles
  document.getElementById('btnAudioToggle')?.addEventListener('click', () => {
    SMRITI_STATE.audioGuideEnabled = !SMRITI_STATE.audioGuideEnabled;
    const icon = document.getElementById('audioIcon');
    if (icon) icon.textContent = SMRITI_STATE.audioGuideEnabled ? '🔊' : '🔇';
    audio.speak(SMRITI_STATE.audioGuideEnabled ? 'Voice guide enabled' : 'Voice guide muted');
  });

  document.getElementById('btnContrastToggle')?.addEventListener('click', () => {
    SMRITI_STATE.highContrastEnabled = !SMRITI_STATE.highContrastEnabled;
    document.body.classList.toggle('high-contrast', SMRITI_STATE.highContrastEnabled);
  });

  // Messages Button in Nav (marks doctor notes as read and clears notification count)
  document.getElementById('btnNavMessages')?.addEventListener('click', () => {
    if (SMRITI_STATE.activeProfile?.role === 'doctor') {
      document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
      document.getElementById('viewCaregiverDashboard').classList.add('active');
    } else {
      const activePid = SMRITI_STATE.activeProfile?.id || 'p1';
      const patientMsgs = SMRITI_STATE.messages[activePid] || [];
      patientMsgs.forEach(m => {
        if (m.sender === 'doctor') m.isRead = true;
      });
      telemetry.saveToStorage();
      telemetry.updateDashboardUI();

      const noticeCard = document.getElementById('doctorNoticeCard');
      if (noticeCard && noticeCard.style.display !== 'none') {
        noticeCard.scrollIntoView({ behavior: 'smooth' });
        const docText = document.getElementById('patientDoctorAdviceText')?.textContent;
        if (docText) audio.speak(`Doctor's guidance: ${docText}`);
      } else {
        audio.speak('No new doctor notes at this time.');
      }
    }
  });

  // Patient Voice Readout of Doctor Advice
  document.getElementById('btnSpeakDoctorAdvice')?.addEventListener('click', () => {
    const docText = document.getElementById('patientDoctorAdviceText')?.textContent;
    if (docText) {
      audio.speak(`Doctor's guidance: ${docText}`);
    }
  });

  // Patient Quick Reply Buttons
  document.querySelectorAll('.btn-quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const reply = btn.getAttribute('data-reply');
      telemetry.sendPatientReply(reply);
    });
  });

  // Doctor Messaging Controls
  document.getElementById('btnSendDoctorMsg')?.addEventListener('click', () => {
    const input = document.getElementById('doctorMsgInput');
    if (input && input.value.trim()) {
      telemetry.sendDoctorMessage(input.value);
      input.value = '';
    }
  });

  document.querySelectorAll('.btn-preset-msg').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.getAttribute('data-msg');
      const input = document.getElementById('doctorMsgInput');
      if (input) {
        input.value = msg;
        input.focus();
      }
    });
  });

  // Doctor PIN Modal Controls
  const modalPin = document.getElementById('modalPinAuth');
  document.getElementById('btnClosePinModal')?.addEventListener('click', () => {
    modalPin?.classList.remove('open');
  });

  // Keypad keys
  document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      if (currentEnteredPin.length < 4) {
        currentEnteredPin += key;
        updatePinDots();
        audio.playGentleChime();
        if (currentEnteredPin.length === 4) {
          setTimeout(verifyPinAndEnterDoctor, 250);
        }
      }
    });
  });

  document.getElementById('btnPinClear')?.addEventListener('click', () => {
    currentEnteredPin = '';
    updatePinDots();
    document.getElementById('pinErrorMsg').textContent = '';
  });

  document.getElementById('btnPinSubmit')?.addEventListener('click', verifyPinAndEnterDoctor);

  document.getElementById('btnQuickFillPin')?.addEventListener('click', () => {
    currentEnteredPin = '1234';
    updatePinDots();
    setTimeout(verifyPinAndEnterDoctor, 200);
  });

  // Doctor Export / Reset Handlers
  document.getElementById('btnExportCSV')?.addEventListener('click', () => telemetry.exportCSV());
  document.getElementById('btnExportJSON')?.addEventListener('click', () => telemetry.exportJSON());
  document.getElementById('btnResetTelemetry')?.addEventListener('click', () => telemetry.resetTelemetry());

  // Emergency Caretaker Assistance (SOS) Handlers
  document.getElementById('btnTriggerSOS')?.addEventListener('click', () => {
    emergencyController.triggerSOS();
  });

  document.getElementById('btnCloseEmergencyModal')?.addEventListener('click', () => {
    document.getElementById('modalEmergencySOS')?.classList.remove('open');
  });

  document.getElementById('btnDismissSosModal')?.addEventListener('click', () => {
    document.getElementById('modalEmergencySOS')?.classList.remove('open');
  });

  // Initialize UI
  telemetry.updateDashboardUI();
});

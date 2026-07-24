/**
 * LOAD TEST — HealthSync
 * ─────────────────────────────────────────────────────────────────────────
 * Purpose  : Validate normal + peak expected traffic with gradual ramp-up.
 * Stages   : 100 → 250 → 500 → 1000 → 2000 → 5000 → 10000 VUs
 * Duration : ~40 minutes total
 * Pass     : All thresholds green, error rate < 1%
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { CONFIG, THRESHOLDS } from './config.js';
import {
  get, post, assertOk,
  loginAsPatient, loginAsAdmin,
  randomEmail, randomName, randomPhone,
  randomItem, randomDate, randomTime,
  SPECIALIZATIONS, CONSULTATION_TYPES,
  bookingDuration, doctorsDuration,
  thinkTime, log,
} from './utils.js';

// ── Stage plan ────────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '2m',  target: 100  },
    { duration: '3m',  target: 100  },
    { duration: '2m',  target: 250  },
    { duration: '3m',  target: 250  },
    { duration: '2m',  target: 500  },
    { duration: '3m',  target: 500  },
    { duration: '2m',  target: 1000 },
    { duration: '3m',  target: 1000 },
    { duration: '2m',  target: 2000 },
    { duration: '3m',  target: 2000 },
    { duration: '3m',  target: 5000 },
    { duration: '3m',  target: 5000 },
    { duration: '4m',  target: 10000},
    { duration: '3m',  target: 10000},
    { duration: '3m',  target: 0    },
  ],
  thresholds: {
    ...THRESHOLDS,
    http_req_failed:   [{ threshold: 'rate>0.05', abortOnFail: true }],
    http_req_duration: [{ threshold: 'p(99)>5000', abortOnFail: true }],
  },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)'],
};

// ── Shared state: token per VU ────────────────────────────────────────────
let token = null;
let userId = null;

// ── Setup: login once per VU ──────────────────────────────────────────────
export function setup() {
  // Warm-up: verify server is alive
  const res = get('/health');
  check(res, { 'setup: server alive': (r) => r.status === 200 });
}

// ── Main scenario ─────────────────────────────────────────────────────────
export default function () {
  // Re-authenticate if token not yet set for this VU
  if (!token) {
    token = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
    if (!token) { sleep(2); return; }
  }

  // Weighted scenario distribution matching real user behaviour:
  // 40% browse doctors, 25% view appointments, 20% health/profile,
  // 10% book appointment, 5% payment/wallet
  const roll = Math.random();

  if (roll < 0.40) {
    scenarioBrowseDoctors();
  } else if (roll < 0.65) {
    scenarioViewAppointments();
  } else if (roll < 0.85) {
    scenarioHealthProfile();
  } else if (roll < 0.95) {
    scenarioBookAppointment();
  } else {
    scenarioWalletPayments();
  }

  thinkTime(1, 4);
}

// ── Scenario: Browse doctors ──────────────────────────────────────────────
function scenarioBrowseDoctors() {
  group('Browse Doctors', () => {
    const t0 = Date.now();
    const res = get('/doctors', token);
    doctorsDuration.add(Date.now() - t0);
    assertOk(res, 'GET /doctors');
    thinkTime(0.5, 1.5);

    // Filter by specialization
    const spec = randomItem(SPECIALIZATIONS);
    const filtered = get(`/doctors?specialization=${encodeURIComponent(spec)}`, token);
    assertOk(filtered, 'GET /doctors?specialization');
    thinkTime(0.5, 1);

    // View single doctor (if list returned IDs)
    try {
      const docs = JSON.parse(res.body);
      if (Array.isArray(docs) && docs.length > 0) {
        const doc = randomItem(docs.slice(0, 20));
        if (doc && doc._id) {
          const detail = get(`/doctors/${doc._id}`, token);
          assertOk(detail, 'GET /doctors/:id');
          thinkTime(0.3, 0.8);

          // Available slots
          const slots = get(`/doctors/${doc._id}/available-slots`, token);
          assertOk(slots, 'GET /doctors/:id/available-slots');
        }
      }
    } catch (e) { log(`browse parse error: ${e}`); }
  });
}

// ── Scenario: View appointments ───────────────────────────────────────────
function scenarioViewAppointments() {
  group('View Appointments', () => {
    const res = get('/appointments', token);
    assertOk(res, 'GET /appointments');
    thinkTime(0.5, 1.5);

    const queue = get('/queue', token);
    assertOk(queue, 'GET /queue');
    thinkTime(0.3, 0.8);

    const notifs = get('/notifications', token);
    assertOk(notifs, 'GET /notifications');
  });
}

// ── Scenario: Health profile ──────────────────────────────────────────────
function scenarioHealthProfile() {
  group('Health Profile', () => {
    const profile = get('/profile', token);
    assertOk(profile, 'GET /profile');
    thinkTime(0.5, 1);

    const health = get('/health', null);
    assertOk(health, 'GET /health');
    thinkTime(0.3, 0.7);

    const loyalty = get('/loyalty-points', token);
    assertOk(loyalty, 'GET /loyalty-points');
  });
}

// ── Scenario: Book appointment ────────────────────────────────────────────
function scenarioBookAppointment() {
  group('Book Appointment', () => {
    // First get doctors
    const docsRes = get('/doctors', token);
    if (!assertOk(docsRes, 'book: GET /doctors')) return;
    thinkTime(0.5, 1);

    let doctorId;
    try {
      const docs = JSON.parse(docsRes.body);
      if (!Array.isArray(docs) || docs.length === 0) return;
      doctorId = randomItem(docs.slice(0, 10))?._id;
      if (!doctorId) return;
    } catch { return; }

    // Check slots
    const slotsRes = get(`/doctors/${doctorId}/available-slots`, token);
    assertOk(slotsRes, 'book: GET slots');
    thinkTime(0.5, 1.5);

    // Book the appointment
    const t0 = Date.now();
    const bookRes = post('/appointments', {
      doctorId,
      date: randomDate(),
      time: randomTime(),
      consultationType: randomItem(CONSULTATION_TYPES),
      reason: randomItem(['General checkup', 'Follow-up', 'Consultation']),
      isUrgent: false,
    }, token);
    bookingDuration.add(Date.now() - t0);
    assertOk(bookRes, 'POST /appointments');
  });
}

// ── Scenario: Wallet / payments ───────────────────────────────────────────
function scenarioWalletPayments() {
  group('Wallet', () => {
    const wallet = get('/wallet', token);
    assertOk(wallet, 'GET /wallet');
    thinkTime(0.3, 0.8);

    const history = get('/payments/history', token);
    assertOk(history, 'GET /payments/history');
  });
}

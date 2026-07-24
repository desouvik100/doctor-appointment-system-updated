/**
 * SOAK TEST — HealthSync
 * ─────────────────────────────────────────────────────────────────────────
 * Purpose  : Detect memory leaks, connection pool exhaustion, database
 *            cursor leaks, and gradual performance degradation over time.
 *            Runs at a moderate sustained load for a long duration.
 * Duration : 2 hours (override with DURATION env var)
 * Load     : 200–500 VUs sustained
 * Pass     : Response times remain flat; error rate stays below 1% throughout.
 */
import { check, group, sleep } from 'k6';
import { CONFIG } from './config.js';
import {
  get, post, assertOk,
  loginAsPatient,
  randomItem, randomDate, randomTime,
  SPECIALIZATIONS, CONSULTATION_TYPES,
  bookingDuration, doctorsDuration, healthDuration,
  thinkTime, log,
} from './utils.js';

const SOAK_DURATION = CONFIG.DURATION || '2h';

export const options = {
  stages: [
    { duration: '5m',          target: 100 },   // gentle ramp
    { duration: '10m',         target: 300 },   // reach soak level
    { duration: SOAK_DURATION, target: 300 },   // sustained load
    { duration: '10m',         target: 500 },   // brief stress at end
    { duration: '5m',          target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: [
      'p(95)<500',
      'p(99)<1000',
      { threshold: 'p(99)>5000', abortOnFail: true },
    ],
    login_duration:   ['p(95)<300'],
    booking_duration: ['p(95)<700'],
    health_duration:  ['p(95)<200'],
  },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)'],
};

let token = null;
let loginTime = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000; // refresh every 50 min

export function setup() {
  const res = get('/health');
  check(res, { 'soak setup: server alive': (r) => r.status === 200 });
  console.log(`🚀 Soak test starting. Duration: ${SOAK_DURATION}`);
}

export default function () {
  // Refresh token periodically to simulate real session management
  const now = Date.now();
  if (!token || (now - loginTime) > TOKEN_TTL_MS) {
    token = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
    loginTime = now;
    if (!token) { sleep(5); return; }
    log('token refreshed');
  }

  const roll = Math.random();

  if (roll < 0.30) {
    group('Soak: Health Check', () => {
      const t0 = Date.now();
      const res = get('/health');
      healthDuration.add(Date.now() - t0);
      assertOk(res, 'soak GET /health');
    });
  } else if (roll < 0.55) {
    group('Soak: Doctors', () => {
      const t0 = Date.now();
      const res = get('/doctors', token);
      doctorsDuration.add(Date.now() - t0);
      assertOk(res, 'soak GET /doctors');
      thinkTime(0.5, 1.5);
      const spec = randomItem(SPECIALIZATIONS);
      assertOk(
        get(`/doctors?specialization=${encodeURIComponent(spec)}`, token),
        'soak GET /doctors?spec'
      );
    });
  } else if (roll < 0.75) {
    group('Soak: Appointments', () => {
      assertOk(get('/appointments', token), 'soak GET /appointments');
      thinkTime(0.5, 1);
      assertOk(get('/notifications', token), 'soak GET /notifications');
    });
  } else if (roll < 0.88) {
    group('Soak: Book', () => {
      const docsRes = get('/doctors', token);
      if (!assertOk(docsRes, 'soak book: GET /doctors')) return;
      try {
        const docs = JSON.parse(docsRes.body);
        if (!Array.isArray(docs) || docs.length === 0) return;
        const doctorId = randomItem(docs.slice(0, 10))?._id;
        if (!doctorId) return;
        thinkTime(0.5, 1);
        const t0 = Date.now();
        const res = post('/appointments', {
          doctorId,
          date: randomDate(),
          time: randomTime(),
          consultationType: randomItem(CONSULTATION_TYPES),
          reason: 'Soak test booking',
        }, token);
        bookingDuration.add(Date.now() - t0);
        assertOk(res, 'soak POST /appointments');
      } catch (e) { log(`soak book error: ${e}`); }
    });
  } else {
    group('Soak: Profile & Wallet', () => {
      assertOk(get('/profile', token), 'soak GET /profile');
      thinkTime(0.3, 0.8);
      assertOk(get('/loyalty-points', token), 'soak GET /loyalty-points');
      thinkTime(0.3, 0.8);
      assertOk(get('/wallet', token), 'soak GET /wallet');
    });
  }

  thinkTime(2, 5);  // realistic think time for soak
}

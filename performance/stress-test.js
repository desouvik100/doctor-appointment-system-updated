/**
 * STRESS TEST — HealthSync
 * ─────────────────────────────────────────────────────────────────────────
 * Purpose  : Push the system beyond normal capacity to find the breaking
 *            point. Identifies the maximum sustainable load before errors
 *            or latency SLOs are violated.
 * Stages   : Aggressive ramp, hold at extreme, then observe recovery.
 * Duration : ~30 minutes
 * Pass     : Identifies breaking point; system recovers after ramp-down.
 */
import { check, group, sleep } from 'k6';
import { CONFIG, THRESHOLDS } from './config.js';
import {
  get, post, assertOk,
  loginAsPatient,
  randomItem, randomDate, randomTime,
  CONSULTATION_TYPES,
  bookingDuration, doctorsDuration,
  thinkTime, log,
} from './utils.js';

export const options = {
  stages: [
    { duration: '1m',  target: 500  },
    { duration: '2m',  target: 1000 },
    { duration: '2m',  target: 2000 },
    { duration: '2m',  target: 4000 },
    { duration: '2m',  target: 6000 },
    { duration: '3m',  target: 8000 },
    { duration: '3m',  target: 10000},
    { duration: '3m',  target: 12000},  // beyond expected max
    { duration: '3m',  target: 15000},  // extreme stress
    { duration: '3m',  target: 10000},  // begin recovery
    { duration: '3m',  target: 5000 },
    { duration: '2m',  target: 0    },  // full recovery
  ],
  thresholds: {
    http_req_failed:   [
      { threshold: 'rate<0.10',    abortOnFail: false },  // warn at 10%
      { threshold: 'rate>0.50',    abortOnFail: true  },  // abort at 50%
    ],
    http_req_duration: [
      { threshold: 'p(95)<2000',   abortOnFail: false },
      { threshold: 'p(99)>10000',  abortOnFail: true  },  // abort if p99 > 10s
    ],
    login_duration:   ['p(95)<1000'],
    booking_duration: ['p(95)<2000'],
  },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)'],
};

let token = null;

export function setup() {
  const res = get('/health');
  check(res, { 'stress setup: server alive': (r) => r.status === 200 });
}

export default function () {
  if (!token) {
    token = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
    if (!token) { sleep(3); return; }
  }

  // At stress levels focus on heaviest endpoints
  const roll = Math.random();

  if (roll < 0.35) {
    group('Stress: Doctor List', () => {
      const t0 = Date.now();
      const res = get('/doctors', token);
      doctorsDuration.add(Date.now() - t0);
      assertOk(res, 'stress GET /doctors');
    });
  } else if (roll < 0.60) {
    group('Stress: Appointments', () => {
      const res = get('/appointments', token);
      assertOk(res, 'stress GET /appointments');
    });
  } else if (roll < 0.80) {
    group('Stress: Book Appointment', () => {
      const docsRes = get('/doctors', token);
      if (!assertOk(docsRes, 'stress GET /doctors')) return;
      try {
        const docs = JSON.parse(docsRes.body);
        if (!Array.isArray(docs) || docs.length === 0) return;
        const doctorId = randomItem(docs.slice(0, 5))?._id;
        if (!doctorId) return;
        const t0 = Date.now();
        const bookRes = post('/appointments', {
          doctorId,
          date: randomDate(),
          time: randomTime(),
          consultationType: randomItem(CONSULTATION_TYPES),
          reason: 'Stress test appointment',
        }, token);
        bookingDuration.add(Date.now() - t0);
        assertOk(bookRes, 'stress POST /appointments');
      } catch (e) { log(`stress book error: ${e}`); }
    });
  } else {
    group('Stress: Auth Re-login', () => {
      // Simulate session expiry and re-login under stress
      const newToken = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
      if (newToken) token = newToken;
      check(token, { 'stress relogin ok': (t) => t !== null });
    });
  }

  // Shorter think time under stress to maximise pressure
  thinkTime(0.2, 1.0);
}

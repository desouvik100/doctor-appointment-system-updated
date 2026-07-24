/**
 * SPIKE TEST — HealthSync
 * ─────────────────────────────────────────────────────────────────────────
 * Purpose  : Simulate sudden burst traffic (e.g. a viral moment, promo
 *            campaign, or flash sale). Tests how the system handles
 *            instantaneous load jumps and whether it recovers gracefully.
 * Pattern  : Idle → instant spike → back to idle (repeated 3×)
 * Duration : ~20 minutes
 */
import { check, group, sleep } from 'k6';
import { CONFIG } from './config.js';
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
    // Baseline
    { duration: '1m',  target: 50   },

    // Spike 1 — sudden to 3000
    { duration: '30s', target: 3000 },
    { duration: '2m',  target: 3000 },
    { duration: '30s', target: 50   },  // drop back
    { duration: '1m',  target: 50   },  // recovery hold

    // Spike 2 — even higher
    { duration: '30s', target: 6000 },
    { duration: '2m',  target: 6000 },
    { duration: '30s', target: 50   },
    { duration: '1m',  target: 50   },

    // Spike 3 — maximum
    { duration: '30s', target: 10000},
    { duration: '2m',  target: 10000},
    { duration: '1m',  target: 50   },
    { duration: '30s', target: 0    },
  ],
  thresholds: {
    http_req_failed:   [
      { threshold: 'rate<0.15',   abortOnFail: false },
      { threshold: 'rate>0.40',   abortOnFail: true  },
    ],
    http_req_duration: [
      { threshold: 'p(95)<3000',  abortOnFail: false },
      { threshold: 'p(99)>15000', abortOnFail: true  },
    ],
    login_duration:   ['p(95)<1500'],
    booking_duration: ['p(95)<3000'],
  },
  summaryTrendStats: ['avg','min','med','max','p(90)','p(95)','p(99)'],
};

let token = null;

export function setup() {
  const res = get('/health');
  check(res, { 'spike setup: server alive': (r) => r.status === 200 });
}

export default function () {
  if (!token) {
    token = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
    if (!token) { sleep(2); return; }
  }

  const roll = Math.random();

  if (roll < 0.50) {
    group('Spike: Browse', () => {
      const t0 = Date.now();
      const res = get('/doctors', token);
      doctorsDuration.add(Date.now() - t0);
      assertOk(res, 'spike GET /doctors');
    });
  } else if (roll < 0.80) {
    group('Spike: Appointments', () => {
      assertOk(get('/appointments', token), 'spike GET /appointments');
      assertOk(get('/queue', token), 'spike GET /queue');
    });
  } else {
    group('Spike: Book', () => {
      const docsRes = get('/doctors', token);
      if (!assertOk(docsRes, 'spike book: GET /doctors')) return;
      try {
        const docs = JSON.parse(docsRes.body);
        if (!Array.isArray(docs) || docs.length === 0) return;
        const doctorId = randomItem(docs.slice(0, 5))?._id;
        if (!doctorId) return;
        const t0 = Date.now();
        const res = post('/appointments', {
          doctorId,
          date: randomDate(),
          time: randomTime(),
          consultationType: randomItem(CONSULTATION_TYPES),
          reason: 'Spike test',
        }, token);
        bookingDuration.add(Date.now() - t0);
        assertOk(res, 'spike POST /appointments');
      } catch (e) { log(`spike error: ${e}`); }
    });
  }

  thinkTime(0.1, 0.5);  // minimal think-time during spike
}

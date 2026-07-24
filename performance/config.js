/**
 * HealthSync Performance Testing Configuration
 * All settings driven by environment variables — no hardcoded secrets.
 */

export const CONFIG = {
  // ── Target ──────────────────────────────────────────────────────────
  BASE_URL: __ENV.BASE_URL || 'http://localhost:5005',

  // ── Test Mode ────────────────────────────────────────────────────────
  // When true, email delivery is bypassed; no real emails are sent.
  TEST_MODE: __ENV.TEST_MODE !== 'false',

  // ── Credentials (injected via env — never hardcoded) ────────────────
  ADMIN_EMAIL:    __ENV.ADMIN_EMAIL    || 'admin@healthsync.test',
  ADMIN_PASSWORD: __ENV.ADMIN_PASSWORD || 'Admin@123456',
  DOCTOR_EMAIL:   __ENV.DOCTOR_EMAIL   || 'doctor@healthsync.test',
  DOCTOR_PASSWORD:__ENV.DOCTOR_PASSWORD|| 'Doctor@123456',
  STAFF_EMAIL:    __ENV.STAFF_EMAIL    || 'staff@healthsync.test',
  STAFF_PASSWORD: __ENV.STAFF_PASSWORD || 'Staff@123456',

  // ── Scale knobs ──────────────────────────────────────────────────────
  MAX_USERS:  parseInt(__ENV.MAX_USERS  || '10000'),
  RAMP_TIME:  __ENV.RAMP_TIME  || '2m',
  DURATION:   __ENV.DURATION   || '10m',

  // ── Per-request timeout ──────────────────────────────────────────────
  TIMEOUT: '30s',
};

// ── Shared thresholds (imported by every test) ───────────────────────────
export const THRESHOLDS = {
  // Global latency SLOs
  http_req_duration: [
    'p(95)<500',   // 95th percentile < 500 ms
    'p(99)<1000',  // 99th percentile < 1 s
    'avg<300',     // average < 300 ms
  ],
  http_req_failed: ['rate<0.01'],   // error rate < 1 %

  // Custom per-endpoint thresholds (defined in utils.js Trend metrics)
  login_duration:    ['p(95)<300'],  // login < 300 ms p95
  booking_duration:  ['p(95)<700'],  // booking < 700 ms p95
  doctors_duration:  ['p(95)<500'],
  health_duration:   ['p(95)<200'],
};

// ── Abort condition helper ────────────────────────────────────────────────
// k6 will call abortOnFail automatically when a threshold is breached
// and failFast is set; individual tests reference this object.
export const ABORT_ON = {
  http_req_failed:   { threshold: 'rate>0.05', abortOnFail: true },
  http_req_duration: { threshold: 'p(99)>5000', abortOnFail: true },
};

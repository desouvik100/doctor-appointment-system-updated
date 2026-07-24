/**
 * SMOKE TEST — HealthSync
 * ─────────────────────────────────────────────────────────────────────────
 * Purpose  : Quick sanity check. 1–2 VUs, 1 iteration each.
 *            Confirms every critical endpoint returns 2xx before any
 *            serious load is applied.
 * When     : Run before every load/stress/spike/soak test.
 * Duration : ~30 seconds
 */
import { check } from 'k6';
import { THRESHOLDS, CONFIG } from './config.js';
import { get, post, assertOk, loginAsPatient, thinkTime } from './utils.js';

export const options = {
  vus: 2,
  iterations: 2,
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],  // relaxed for smoke
  },
};

export default function () {
  // 1. Health check
  const health = get('/health');
  assertOk(health, 'GET /health');
  thinkTime(0.5, 1);

  // 2. List doctors (public)
  const doctors = get('/doctors');
  assertOk(doctors, 'GET /doctors');
  thinkTime(0.5, 1);

  // 3. Login as patient
  const token = loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
  check(token, { 'smoke: login returns token': (t) => t !== null });
  if (!token) return;
  thinkTime(0.5, 1);

  // 4. Get appointments
  const appts = get('/appointments', token);
  assertOk(appts, 'GET /appointments');
  thinkTime(0.5, 1);

  // 5. Get notifications
  const notifs = get('/notifications', token);
  assertOk(notifs, 'GET /notifications');

  console.log(`✅ Smoke test VU ${__VU} complete`);
}

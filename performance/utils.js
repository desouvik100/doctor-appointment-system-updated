/**
 * HealthSync k6 Utility Library
 * Reusable helpers: HTTP wrappers, auth, metrics, assertions, think-time.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { CONFIG } from './config.js';

// ── Custom Metrics ────────────────────────────────────────────────────────
export const loginDuration   = new Trend('login_duration',   true);
export const bookingDuration = new Trend('booking_duration', true);
export const doctorsDuration = new Trend('doctors_duration', true);
export const healthDuration  = new Trend('health_duration',  true);
export const apiErrors       = new Counter('api_errors');
export const authFailures    = new Counter('auth_failures');
export const timeouts        = new Counter('request_timeouts');

// ── Base headers ─────────────────────────────────────────────────────────
export function headers(token = null) {
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── URL builder ───────────────────────────────────────────────────────────
export const url = (path) => `${CONFIG.BASE_URL}/api${path}`;

// ── JSON POST helper ──────────────────────────────────────────────────────
export function post(path, body, token = null) {
  return http.post(url(path), JSON.stringify(body), {
    headers: headers(token),
    timeout: CONFIG.TIMEOUT,
    tags: { endpoint: path },
  });
}

// ── JSON GET helper ───────────────────────────────────────────────────────
export function get(path, token = null, params = {}) {
  return http.get(url(path), {
    headers: headers(token),
    timeout: CONFIG.TIMEOUT,
    tags: { endpoint: path },
    ...params,
  });
}

// ── JSON PUT helper ───────────────────────────────────────────────────────
export function put(path, body, token = null) {
  return http.put(url(path), JSON.stringify(body), {
    headers: headers(token),
    timeout: CONFIG.TIMEOUT,
    tags: { endpoint: path },
  });
}

// ── Assertion helper ──────────────────────────────────────────────────────
export function assertOk(res, name = '') {
  const ok = check(res, {
    [`${name} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} not empty`]:  (r) => r.body && r.body.length > 0,
  });
  if (!ok) {
    apiErrors.add(1, { endpoint: name });
    if (res.timings.duration > 25000) timeouts.add(1);
  }
  return ok;
}

// ── Login and return JWT token ────────────────────────────────────────────
export function loginAsPatient(email, password) {
  const start = Date.now();
  const res = post('/auth/login', { email, password });
  loginDuration.add(Date.now() - start);

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login has token': (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
  });
  if (!ok) { authFailures.add(1); return null; }
  try { return JSON.parse(res.body).token; } catch { return null; }
}

// ── Login as Admin ────────────────────────────────────────────────────────
export function loginAsAdmin() {
  return loginAsPatient(CONFIG.ADMIN_EMAIL, CONFIG.ADMIN_PASSWORD);
}

// ── Login as Doctor ───────────────────────────────────────────────────────
export function loginAsDoctor() {
  return loginAsPatient(CONFIG.DOCTOR_EMAIL, CONFIG.DOCTOR_PASSWORD);
}

// ── Random data generators ────────────────────────────────────────────────
const FIRST = ['Amit','Priya','Rahul','Sneha','Raj','Anita','Vikram','Meera'];
const LAST  = ['Sharma','Singh','Patel','Kumar','Gupta','Rao','Das','Verma'];

export function randomName() {
  return `${FIRST[Math.floor(Math.random()*FIRST.length)]} ${LAST[Math.floor(Math.random()*LAST.length)]}`;
}

export function randomEmail() {
  return `perftest_${__VU}_${Date.now()}@healthsync.test`;
}

export function randomPhone() {
  return `9${Math.floor(100000000 + Math.random()*900000000)}`;
}

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const SPECIALIZATIONS = [
  'General Physician','Cardiologist','Dermatologist','Pediatrician',
  'Orthopedic','Gynecologist','Neurologist','Dentist','ENT','Psychiatrist',
];

export const SYMPTOMS = [
  'Fever','Cough','Headache','Back Pain','Stomach Pain','Skin Rash',
  'Chest Pain','Dizziness','Fatigue','Breathing Difficulty',
];

export const CONSULTATION_TYPES = ['clinic','online'];

export function randomDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 14) + 1);
  return d.toISOString().split('T')[0];
}

export function randomTime() {
  const hours = ['09','10','11','14','15','16','17'];
  const mins  = ['00','30'];
  return `${randomItem(hours)}:${randomItem(mins)}`;
}

// ── Think-time (realistic user pause) ────────────────────────────────────
export function thinkTime(min = 1, max = 3) {
  sleep(min + Math.random() * (max - min));
}

// ── Log helper (only prints in verbose mode) ─────────────────────────────
export function log(msg) {
  if (__ENV.VERBOSE === 'true') console.log(`[VU:${__VU}] ${msg}`);
}

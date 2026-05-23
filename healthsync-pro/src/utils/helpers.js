/**
 * HealthSync Pro — Utility Helper Functions
 */

// ─── Performance ──────────────────────────────────────────────────────────

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, wait) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

// ─── Formatting ───────────────────────────────────────────────────────────

export const formatCurrency = (amount, currency = '₹') => {
  if (amount === null || amount === undefined) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

export const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 4 ? `******${cleaned.slice(-4)}` : phone;
};

export const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 2
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : local;
  return `${masked}@${domain}`;
};

// ─── Date & Time ──────────────────────────────────────────────────────────

export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    short:    { day: 'numeric', month: 'short', year: 'numeric' },
    long:     { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time:     { hour: '2-digit', minute: '2-digit', hour12: true },
    datetime: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    relative: null,
  };

  if (format === 'relative') return getRelativeTime(d);
  return d.toLocaleDateString('en-IN', options[format] || options.short);
};

export const formatTime = (time) => {
  if (!time) return '';
  // Handle "HH:MM" format
  if (typeof time === 'string' && time.includes(':')) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  return time;
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60)  return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr < 24)   return `${diffHr}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  return formatDate(date, 'short');
};

export const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isFutureDate = (date) => new Date(date) > new Date();

export const getDayName = (date) => {
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'long' });
};

// ─── Validation ───────────────────────────────────────────────────────────

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test((phone || '').replace(/\D/g, ''));

export const isValidObjectId = (id) =>
  /^[0-9a-fA-F]{24}$/.test(id);

// ─── String utilities ─────────────────────────────────────────────────────

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
};

export const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// ─── Object utilities ─────────────────────────────────────────────────────

export const deepClone = (obj) => {
  try { return JSON.parse(JSON.stringify(obj)); }
  catch { return obj; }
};

export const isEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  if (typeof val === 'string') return val.trim() === '';
  return false;
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((k) => delete result[k]);
  return result;
};

export const pick = (obj, keys) =>
  keys.reduce((acc, k) => { if (k in obj) acc[k] = obj[k]; return acc; }, {});

// ─── ID generation ────────────────────────────────────────────────────────

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

// ─── Status helpers ───────────────────────────────────────────────────────

export const getStatusColor = (status) => {
  const map = {
    pending:      '#F59E0B',
    confirmed:    '#10B981',
    completed:    '#3B82F6',
    cancelled:    '#EF4444',
    in_progress:  '#8B5CF6',
    'checked-in': '#8B5CF6',
    active:       '#10B981',
    inactive:     '#6B7280',
    paid:         '#10B981',
    unpaid:       '#F59E0B',
    refunded:     '#8B5CF6',
  };
  return map[status?.toLowerCase()] || '#6B7280';
};

export const getStatusLabel = (status) => {
  const map = {
    pending:      'Pending',
    confirmed:    'Confirmed',
    completed:    'Completed',
    cancelled:    'Cancelled',
    in_progress:  'In Progress',
    'checked-in': 'Checked In',
    active:       'Active',
    inactive:     'Inactive',
    paid:         'Paid',
    unpaid:       'Unpaid',
    refunded:     'Refunded',
  };
  return map[status?.toLowerCase()] || capitalizeWords(status || 'Unknown');
};

// ─── Medical helpers ──────────────────────────────────────────────────────

export const getVitalStatus = (type, value) => {
  const v = parseFloat(value);
  if (isNaN(v)) return 'normal';

  const ranges = {
    hr:   { low: 60, high: 100, critical: 150 },
    spo2: { low: 95, critical: 90 },
    temp: { low: 97, high: 99.5, critical: 103 },
    sugar: { low: 70, high: 140, critical: 200 },
  };

  const r = ranges[type];
  if (!r) return 'normal';

  if (r.critical && v >= r.critical) return 'critical';
  if (r.high && v > r.high) return 'high';
  if (r.low && v < r.low) return 'low';
  return 'normal';
};

export const formatBloodPressure = (systolic, diastolic) => {
  if (!systolic || !diastolic) return 'N/A';
  return `${systolic}/${diastolic} mmHg`;
};

export default {
  debounce, throttle,
  formatCurrency, formatPhone, maskPhone, maskEmail,
  formatDate, formatTime, getRelativeTime, isToday, isFutureDate, getDayName,
  isValidEmail, isValidPhone, isValidObjectId,
  capitalizeWords, truncateText, getInitials, slugify,
  deepClone, isEmpty, omit, pick,
  generateId,
  getStatusColor, getStatusLabel,
  getVitalStatus, formatBloodPressure,
};

/**
 * Socket.IO Configuration
 * 
 * Centralized configuration for Socket.IO server settings.
 * Supports web and mobile clients with proper CORS configuration.
 * 
 * @module socketConfig
 */

const SOCKET_CONFIG = {
  // CORS configuration for web and mobile clients
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      'https://healthsyncpro.in',
      'https://www.healthsyncpro.in',
      // Capacitor mobile app origins
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      'https://localhost',
      // Android WebView
      'file://',
      // React Native
      '*',
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  
  // Connection settings
  pingTimeout: 60000,        // 60 seconds
  pingInterval: 25000,       // 25 seconds
  connectTimeout: 45000,     // 45 seconds
  
  // Transport settings
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  
  // Path for socket connections
  path: '/socket.io',
  
  // Adapter settings (for scaling with Redis)
  adapter: null, // Will be set if Redis is available
};

// Event names for consistency across the application
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Authentication events
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',
  
  // Room events
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  
  // Appointment events
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_UPDATED: 'appointment:updated',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_STATUS_CHANGED: 'appointment:status_changed',
  
  // Wallet events
  WALLET_TRANSACTION: 'wallet:transaction',
  WALLET_BALANCE_UPDATED: 'wallet:balance_updated',
  
  // Prescription events
  PRESCRIPTION_CREATED: 'prescription:created',
  PRESCRIPTION_UPDATED: 'prescription:updated',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  
  // Queue events
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_POSITION_CHANGED: 'queue:position_changed',
  QUEUE_YOUR_TURN: 'queue:your_turn',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  
  // Lab report events
  LAB_REPORT_READY: 'lab_report:ready',
  
  // Imaging events
  IMAGING_REPORT_READY: 'imaging:report_ready',
  
  // Doctor availability events
  DOCTOR_ONLINE: 'doctor:online',
  DOCTOR_OFFLINE: 'doctor:offline',
  DOCTOR_BUSY: 'doctor:busy',
};

// Room prefixes for different entity types
const ROOM_PREFIXES = {
  USER: 'user:',
  CLINIC: 'clinic:',
  DOCTOR: 'doctor:',
  APPOINTMENT: 'appointment:',
  QUEUE: 'queue:',
  CHAT: 'chat:',
};

/**
 * Get room name for a user
 * @param {string} userId - User ID
 * @returns {string} Room name
 */
const getUserRoom = (userId) => `${ROOM_PREFIXES.USER}${userId}`;

/**
 * Get room name for a clinic
 * @param {string} clinicId - Clinic ID
 * @returns {string} Room name
 */
const getClinicRoom = (clinicId) => `${ROOM_PREFIXES.CLINIC}${clinicId}`;

/**
 * Get room name for a doctor
 * @param {string} doctorId - Doctor ID
 * @returns {string} Room name
 */
const getDoctorRoom = (doctorId) => `${ROOM_PREFIXES.DOCTOR}${doctorId}`;

/**
 * Get room name for an appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {string} Room name
 */
const getAppointmentRoom = (appointmentId) => `${ROOM_PREFIXES.APPOINTMENT}${appointmentId}`;

/**
 * Get room name for a queue
 * @param {string} clinicId - Clinic ID
 * @param {string} doctorId - Doctor ID
 * @returns {string} Room name
 */
const getQueueRoom = (clinicId, doctorId) => `${ROOM_PREFIXES.QUEUE}${clinicId}:${doctorId}`;

/**
 * Get room name for a chat
 * @param {string} chatId - Chat/Conversation ID
 * @returns {string} Room name
 */
const getChatRoom = (chatId) => `${ROOM_PREFIXES.CHAT}${chatId}`;

module.exports = {
  SOCKET_CONFIG,
  SOCKET_EVENTS,
  ROOM_PREFIXES,
  getUserRoom,
  getClinicRoom,
  getDoctorRoom,
  getAppointmentRoom,
  getQueueRoom,
  getChatRoom,
};

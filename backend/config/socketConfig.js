 

const SOCKET_CONFIG = {
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
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      'https://localhost',
      'file://',
      '*',
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  pingTimeout: 60000,        
  pingInterval: 25000,       
  connectTimeout: 45000,     
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  path: '/socket.io',
  adapter: null, 
};
const SOCKET_EVENTS = {
  // XXX needs optimization
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_UPDATED: 'appointment:updated',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_STATUS_CHANGED: 'appointment:status_changed',
  WALLET_TRANSACTION: 'wallet:transaction',
  WALLET_BALANCE_UPDATED: 'wallet:balance_updated',
  PRESCRIPTION_CREATED: 'prescription:created',
  PRESCRIPTION_UPDATED: 'prescription:updated',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_POSITION_CHANGED: 'queue:position_changed',
  QUEUE_YOUR_TURN: 'queue:your_turn',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  LAB_REPORT_READY: 'lab_report:ready',
  IMAGING_REPORT_READY: 'imaging:report_ready',
  DOCTOR_ONLINE: 'doctor:online',
  DOCTOR_OFFLINE: 'doctor:offline', 
  DOCTOR_BUSY: 'doctor:busy',
};
const ROOM_PREFIXES = {
  USER: 'user:',
  CLINIC: 'clinic:',
  DOCTOR: 'doctor:',
  APPOINTMENT: 'appointment:',
  QUEUE: 'queue:',
  CHAT: 'chat:',
};

const getUserRoom = (userId) => `${ROOM_PREFIXES.USER}${userId}`;

const getClinicRoom = (clinicId) => `${ROOM_PREFIXES.CLINIC}${clinicId}`;

const getDoctorRoom = (doctorId) => `${ROOM_PREFIXES.DOCTOR}${doctorId}`;

const getAppointmentRoom = (appointmentId) => `${ROOM_PREFIXES.APPOINTMENT}${appointmentId}`;

const getQueueRoom = (clinicId, doctorId) => `${ROOM_PREFIXES.QUEUE}${clinicId}:${doctorId}`;

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

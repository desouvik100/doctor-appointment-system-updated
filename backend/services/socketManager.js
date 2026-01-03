/**
 * Socket.IO Manager Service
 * 
 * Manages WebSocket connections, authentication, and room management.
 * Provides methods for emitting events to specific users, clinics, or rooms.
 * 
 * @module socketManager
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const {
  SOCKET_CONFIG,
  SOCKET_EVENTS,
  getUserRoom,
  getClinicRoom,
  getDoctorRoom,
  getQueueRoom,
} = require('../config/socketConfig');

let io = null;
const connectedUsers = new Map(); // Map<userId, Set<socketId>>
const socketToUser = new Map();   // Map<socketId, { userId, userType, clinicId }>

/**
 * Initialize Socket.IO server with Express HTTP server
 * 
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
const initializeSocket = (httpServer) => {
  io = new Server(httpServer, SOCKET_CONFIG);
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Attach user info to socket
      socket.userId = decoded.userId || decoded.doctorId || decoded.id;
      socket.userType = decoded.role || 'patient';
      socket.clinicId = decoded.clinicId || null;
      socket.doctorId = decoded.doctorId || null;
      
      if (!socket.userId) {
        return next(new Error('Invalid token'));
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });
  
  // Connection handler
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const { userId, userType, clinicId, doctorId } = socket;
    
    console.log(`🔌 Socket connected: ${socket.id} (User: ${userId}, Type: ${userType})`);
    
    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, { userId, userType, clinicId });
    
    // Auto-join user's personal room
    socket.join(getUserRoom(userId));
    
    // Auto-join clinic room if applicable
    if (clinicId) {
      socket.join(getClinicRoom(clinicId));
    }
    
    // Auto-join doctor room if applicable
    if (doctorId) {
      socket.join(getDoctorRoom(doctorId));
    }
    
    // Send authentication success
    socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
      userId,
      userType,
      clinicId,
      rooms: Array.from(socket.rooms),
    });
    
    // Handle room subscription requests
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
      if (isValidRoomAccess(socket, roomId)) {
        socket.join(roomId);
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId });
        console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied to room' });
      }
    });
    
    // Handle room unsubscription
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
      socket.leave(roomId);
      socket.emit(SOCKET_EVENTS.ROOM_LEFT, { roomId });
      console.log(`📤 Socket ${socket.id} left room: ${roomId}`);
    });
    
    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
      
      // Clean up tracking
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      socketToUser.delete(socket.id);
    });
    
    // Handle errors
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
  
  console.log('🔌 Socket.IO server initialized');
  return io;
};

/**
 * Validate if socket has access to a room
 * @private
 */
const isValidRoomAccess = (socket, roomId) => {
  const { userId, userType, clinicId } = socket;
  
  // Users can always access their own room
  if (roomId === getUserRoom(userId)) return true;
  
  // Clinic staff can access their clinic room
  if (roomId.startsWith('clinic:') && clinicId && roomId === getClinicRoom(clinicId)) {
    return true;
  }
  
  // Doctors can access their doctor room
  if (roomId.startsWith('doctor:') && socket.doctorId && roomId === getDoctorRoom(socket.doctorId)) {
    return true;
  }
  
  // Queue rooms - allow patients and clinic staff
  if (roomId.startsWith('queue:')) {
    return true; // Allow all authenticated users to join queue rooms
  }
  
  // Appointment rooms - would need to verify user is part of appointment
  if (roomId.startsWith('appointment:')) {
    return true; // For now, allow - should add verification
  }
  
  // Chat rooms - would need to verify user is part of conversation
  if (roomId.startsWith('chat:')) {
    return true; // For now, allow - should add verification
  }
  
  return false;
};

/**
 * Get Socket.IO server instance
 * @returns {Server|null}
 */
const getIO = () => io;

/**
 * Check if a user is currently connected
 * @param {string} userId - User ID
 * @returns {boolean}
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

/**
 * Get count of connected users
 * @returns {number}
 */
const getConnectedUsersCount = () => connectedUsers.size;

/**
 * Emit event to a specific user (all their connected devices)
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(getUserRoom(userId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit event to a clinic (all connected staff)
 * @param {string} clinicId - Clinic ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToClinic = (clinicId, event, data) => {
  if (!io) return;
  io.to(getClinicRoom(clinicId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit event to a doctor
 * @param {string} doctorId - Doctor ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToDoctor = (doctorId, event, data) => {
  if (!io) return;
  io.to(getDoctorRoom(doctorId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit event to a specific room
 * @param {string} roomId - Room ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const emitToRoom = (roomId, event, data) => {
  if (!io) return;
  io.to(roomId).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// ==================== APPOINTMENT EVENTS ====================

/**
 * Emit appointment created event
 * @param {Object} appointment - Appointment data
 * @param {string} appointment.userId - Patient user ID
 * @param {string} appointment.doctorId - Doctor ID
 * @param {string} [appointment.clinicId] - Clinic ID
 */
const emitAppointmentCreated = (appointment) => {
  const event = SOCKET_EVENTS.APPOINTMENT_CREATED;
  const data = { appointment };
  
  // Notify patient
  if (appointment.userId) {
    emitToUser(appointment.userId.toString(), event, data);
  }
  
  // Notify doctor
  if (appointment.doctorId) {
    emitToDoctor(appointment.doctorId.toString(), event, data);
  }
  
  // Notify clinic
  if (appointment.clinicId) {
    emitToClinic(appointment.clinicId.toString(), event, data);
  }
};

/**
 * Emit appointment updated event
 * @param {Object} appointment - Updated appointment data
 */
const emitAppointmentUpdated = (appointment) => {
  const event = SOCKET_EVENTS.APPOINTMENT_UPDATED;
  const data = { appointment };
  
  if (appointment.userId) {
    emitToUser(appointment.userId.toString(), event, data);
  }
  
  if (appointment.doctorId) {
    emitToDoctor(appointment.doctorId.toString(), event, data);
  }
  
  if (appointment.clinicId) {
    emitToClinic(appointment.clinicId.toString(), event, data);
  }
};

/**
 * Emit appointment cancelled event
 * @param {Object} appointment - Cancelled appointment data
 */
const emitAppointmentCancelled = (appointment) => {
  const event = SOCKET_EVENTS.APPOINTMENT_CANCELLED;
  const data = { 
    appointmentId: appointment._id,
    appointment,
  };
  
  if (appointment.userId) {
    emitToUser(appointment.userId.toString(), event, data);
  }
  
  if (appointment.doctorId) {
    emitToDoctor(appointment.doctorId.toString(), event, data);
  }
  
  if (appointment.clinicId) {
    emitToClinic(appointment.clinicId.toString(), event, data);
  }
};

// ==================== WALLET EVENTS ====================

/**
 * Emit wallet transaction event
 * @param {string} userId - User ID
 * @param {Object} transaction - Transaction data
 * @param {number} newBalance - New wallet balance
 */
const emitWalletTransaction = (userId, transaction, newBalance) => {
  emitToUser(userId, SOCKET_EVENTS.WALLET_TRANSACTION, {
    transaction,
    balance: newBalance,
  });
};

// ==================== PRESCRIPTION EVENTS ====================

/**
 * Emit prescription created event
 * @param {Object} prescription - Prescription data
 */
const emitPrescriptionCreated = (prescription) => {
  const event = SOCKET_EVENTS.PRESCRIPTION_CREATED;
  const data = { prescription };
  
  // Notify patient
  if (prescription.patientId) {
    emitToUser(prescription.patientId.toString(), event, data);
  }
  
  // Notify clinic
  if (prescription.clinicId) {
    emitToClinic(prescription.clinicId.toString(), event, data);
  }
};

/**
 * Emit prescription updated event
 * @param {Object} prescription - Updated prescription data
 */
const emitPrescriptionUpdated = (prescription) => {
  const event = SOCKET_EVENTS.PRESCRIPTION_UPDATED;
  const data = { prescription };
  
  if (prescription.patientId) {
    emitToUser(prescription.patientId.toString(), event, data);
  }
  
  if (prescription.clinicId) {
    emitToClinic(prescription.clinicId.toString(), event, data);
  }
};

// ==================== NOTIFICATION EVENTS ====================

/**
 * Emit new notification event
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
const emitNotification = (userId, notification) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
};

// ==================== QUEUE EVENTS ====================

/**
 * Emit queue updated event
 * @param {string} clinicId - Clinic ID
 * @param {string} doctorId - Doctor ID
 * @param {Object} queueData - Queue data
 */
const emitQueueUpdated = (clinicId, doctorId, queueData) => {
  const roomId = getQueueRoom(clinicId, doctorId);
  emitToRoom(roomId, SOCKET_EVENTS.QUEUE_UPDATED, { queueData });
  
  // Also notify clinic
  emitToClinic(clinicId, SOCKET_EVENTS.QUEUE_UPDATED, { queueData, doctorId });
};

/**
 * Emit queue position changed event to specific user
 * @param {string} userId - User ID
 * @param {Object} positionData - Position data
 */
const emitQueuePositionChanged = (userId, positionData) => {
  emitToUser(userId, SOCKET_EVENTS.QUEUE_POSITION_CHANGED, positionData);
};

/**
 * Emit "your turn" notification
 * @param {string} userId - User ID
 * @param {Object} appointmentData - Appointment data
 */
const emitYourTurn = (userId, appointmentData) => {
  emitToUser(userId, SOCKET_EVENTS.QUEUE_YOUR_TURN, appointmentData);
};

// ==================== LAB REPORT EVENTS ====================

/**
 * Emit lab report ready event
 * @param {string} userId - Patient user ID
 * @param {Object} report - Lab report data
 */
const emitLabReportReady = (userId, report) => {
  emitToUser(userId, SOCKET_EVENTS.LAB_REPORT_READY, { report });
};

// ==================== CHAT EVENTS ====================

/**
 * Emit chat message event
 * @param {string} roomId - Chat room ID
 * @param {Object} message - Message data
 */
const emitChatMessage = (roomId, message) => {
  emitToRoom(roomId, SOCKET_EVENTS.CHAT_MESSAGE, { message });
};

module.exports = {
  initializeSocket,
  getIO,
  isUserConnected,
  getConnectedUsersCount,
  
  // Generic emitters
  emitToUser,
  emitToClinic,
  emitToDoctor,
  emitToRoom,
  broadcast,
  
  // Appointment events
  emitAppointmentCreated,
  emitAppointmentUpdated,
  emitAppointmentCancelled,
  
  // Wallet events
  emitWalletTransaction,
  
  // Prescription events
  emitPrescriptionCreated,
  emitPrescriptionUpdated,
  
  // Notification events
  emitNotification,
  
  // Queue events
  emitQueueUpdated,
  emitQueuePositionChanged,
  emitYourTurn,
  
  // Lab report events
  emitLabReportReady,
  
  // Chat events
  emitChatMessage,
  
  // Event constants
  SOCKET_EVENTS,
};

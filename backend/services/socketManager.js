

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
const connectedUsers = new Map(); 
const socketToUser = new Map();   

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, SOCKET_CONFIG);
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const { userId, userType, clinicId, doctorId } = socket;
    
    console.log(`🔌 Socket connected: ${socket.id} (User: ${userId}, Type: ${userType})`);
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, { userId, userType, clinicId });
    socket.join(getUserRoom(userId));
    if (clinicId) {
      socket.join(getClinicRoom(clinicId));
    }
    if (doctorId) {
      socket.join(getDoctorRoom(doctorId));
    }
    socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
      userId,
      userType,
      clinicId,
      rooms: Array.from(socket.rooms),
    });
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
      if (isValidRoomAccess(socket, roomId)) {
        socket.join(roomId);
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomId });
        console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied to room' });
      }
    });
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
      socket.leave(roomId);
      socket.emit(SOCKET_EVENTS.ROOM_LEFT, { roomId });
      console.log(`📤 Socket ${socket.id} left room: ${roomId}`);
    });
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      socketToUser.delete(socket.id);
    });
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
  
  console.log('🔌 Socket.IO server initialized');
  return io;
};

const isValidRoomAccess = (socket, roomId) => {
  const { userId, userType, clinicId } = socket;
  if (roomId === getUserRoom(userId)) return true;
  if (roomId.startsWith('clinic:') && clinicId && roomId === getClinicRoom(clinicId)) {
    return true;
  }
  if (roomId.startsWith('doctor:') && socket.doctorId && roomId === getDoctorRoom(socket.doctorId)) {
    return true;
  }
  if (roomId.startsWith('queue:')) {
    return true; 
  }
  if (roomId.startsWith('appointment:')) {
    return true; 
  }
  if (roomId.startsWith('chat:')) {
    return true; 
  }
  
  return false;
};

const getIO = () => io;

const isUserConnected = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

const getConnectedUsersCount = () => connectedUsers.size;

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(getUserRoom(userId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const emitToClinic = (clinicId, event, data) => {
  if (!io) return;
  io.to(getClinicRoom(clinicId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const emitToDoctor = (doctorId, event, data) => {
  if (!io) return;
  io.to(getDoctorRoom(doctorId)).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const emitToRoom = (roomId, event, data) => {
  if (!io) return;
  io.to(roomId).emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const emitAppointmentCreated = (appointment) => {
  const event = SOCKET_EVENTS.APPOINTMENT_CREATED;
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

const emitWalletTransaction = (userId, transaction, newBalance) => {
  emitToUser(userId, SOCKET_EVENTS.WALLET_TRANSACTION, {
    transaction,
    balance: newBalance,
  });
};

const emitPrescriptionCreated = (prescription) => {
  const event = SOCKET_EVENTS.PRESCRIPTION_CREATED;
  const data = { prescription };
  if (prescription.patientId) {
    emitToUser(prescription.patientId.toString(), event, data);
  }
  if (prescription.clinicId) {
    emitToClinic(prescription.clinicId.toString(), event, data);
  }
};

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

const emitNotification = (userId, notification) => {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, { notification });
};

const emitQueueUpdated = (clinicId, doctorId, queueData) => {
  const roomId = getQueueRoom(clinicId, doctorId);
  emitToRoom(roomId, SOCKET_EVENTS.QUEUE_UPDATED, { queueData });
  emitToClinic(clinicId, SOCKET_EVENTS.QUEUE_UPDATED, { queueData, doctorId });
};

const emitQueuePositionChanged = (userId, positionData) => {
  emitToUser(userId, SOCKET_EVENTS.QUEUE_POSITION_CHANGED, positionData);
};

const emitYourTurn = (userId, appointmentData) => {
  emitToUser(userId, SOCKET_EVENTS.QUEUE_YOUR_TURN, appointmentData);
};

const emitLabReportReady = (userId, report) => {
  emitToUser(userId, SOCKET_EVENTS.LAB_REPORT_READY, { report });
};

const emitChatMessage = (roomId, message) => {
  emitToRoom(roomId, SOCKET_EVENTS.CHAT_MESSAGE, { message });
};

module.exports = {
  initializeSocket,
  getIO,
  isUserConnected,
  getConnectedUsersCount,
  emitToUser,
  emitToClinic,
  emitToDoctor,
  emitToRoom,
  broadcast,
  emitAppointmentCreated,
  emitAppointmentUpdated,
  emitAppointmentCancelled,
  emitWalletTransaction,
  emitPrescriptionCreated,
  emitPrescriptionUpdated,
  emitNotification,
  emitQueueUpdated,
  emitQueuePositionChanged,
  emitYourTurn,
  emitLabReportReady,
  emitChatMessage,
  SOCKET_EVENTS,
};

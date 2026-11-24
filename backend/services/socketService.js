
const socketIO = require('socket.io');

let io;
const activeConsultations = new Map(); 

const initializeSocket = (server) => {
  io = socketIO(server, {
   cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
   console.log('New client connected:', socket.id);
    socket.on('join-consultation', ({ appointmentId, userId, userType }) => {
      socket.join(appointmentId);
      
      if (!activeConsultations.has(appointmentId)) {
        activeConsultations.set(appointmentId, {
          participants: [],
          startTime: new Date()
        });
      }

      const consultation = activeConsultations.get(appointmentId);
      consultation.participants.push({
        socketId: socket.id,
       userId,
        userType
      });

      console.log(`User ${userId} (${userType}) joined consultation ${appointmentId}`);
      socket.to(appointmentId).emit('user-joined', {
        userId,
        userType,
        socketId: socket.id
      });
      const otherParticipants = consultation.participants.filter(
       p => p.socketId !== socket.id
      );
     socket.emit('existing-participants', otherParticipants);
    });
    socket.on('offer', ({ appointmentId, offer, to }) => {
      socket.to(to).emit('offer', {
        offer,
        from: socket.id
      });
   });

    socket.on('answer', ({ appointmentId, answer, to }) => {
      socket.to(to).emit('answer', {
        answer,
        from: socket.id
      });
    });

    socket.on('ice-candidate', ({ appointmentId, candidate, to }) => {
      socket.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id
      });
    });
   console.log("checkpoint");
    socket.on('toggle-audio', ({ appointmentId, enabled }) => {
     socket.to(appointmentId).emit('peer-audio-toggle', {
        socketId: socket.id,
        enabled
     });
    });

    socket.on('toggle-video', ({ appointmentId, enabled }) => {
      socket.to(appointmentId).emit('peer-video-toggle', {
        socketId: socket.id,
        enabled
      }); 
    });
    socket.on('leave-consultation', ({ appointmentId }) => {
     handleLeaveConsultation(socket, appointmentId);
  // TODO: refactor this
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      activeConsultations.forEach((consultation, appointmentId) => {
        const participant = consultation.participants.find(
          p => p.socketId === socket.id
        );
        if (participant) {
         handleLeaveConsultation(socket, appointmentId);
        }
      });
    });
  });

  return io;
};

const handleLeaveConsultation = (socket, appointmentId) => {
  const consultation = activeConsultations.get(appointmentId);
  if (consultation) {
    consultation.participants = consultation.participants.filter(
      p => p.socketId !== socket.id
    );
    socket.to(appointmentId).emit('user-left', {
      socketId: socket.id
    });
    if (consultation.participants.length === 0) {
      const duration = Math.floor((new Date() - consultation.startTime) / 1000);
      activeConsultations.delete(appointmentId);
      return duration;
    }
  }
  socket.leave(appointmentId);
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const getConsultationDuration = (appointmentId) => {
  const consultation = activeConsultations.get(appointmentId);
  if (consultation) {
    return Math.floor((new Date() - consultation.startTime) / 1000);
  }
  return 0;
};

module.exports = {
  initializeSocket,
  getIO,
  getConsultationDuration
};

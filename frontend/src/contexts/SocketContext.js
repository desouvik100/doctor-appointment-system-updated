/**
 * Socket Context - Real-time WebSocket connection for React Web
 * 
 * Provides socket connection management and event subscription
 * throughout the React web application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Socket events - mirrors backend/config/socketConfig.js
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
  
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
};

const SocketContext = createContext(null);

/**
 * Hook to access socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('useSocket must be used within a SocketProvider');
    return {
      isConnected: false,
      subscribe: () => () => {},
      emit: () => {},
      joinRoom: () => {},
      leaveRoom: () => {},
      SOCKET_EVENTS,
    };
  }
  return context;
};

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const receptionist = JSON.parse(localStorage.getItem('receptionist') || '{}');
  const doctor = JSON.parse(localStorage.getItem('doctor') || '{}');
  
  return user.token || admin.token || receptionist.token || doctor.token || null;
};

/**
 * Get socket server URL
 */
const getSocketUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://doctor-appointment-system-updated.onrender.com'
      : 'http://localhost:5005');
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Socket Provider Component
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const eventListenersRef = useRef(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const maxReconnectAttempts = 10;


  /**
   * Emit to all registered listeners for an event
   */
  const emitToListeners = useCallback((event, data) => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔌 [Socket] Listener error for ${event}:`, error);
        }
      });
    }
  }, []);

  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('🔌 [Socket] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    console.log(`🔌 [Socket] Reconnecting in ${delay}ms`);

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, []);

  /**
   * Connect to socket server
   */
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      console.log('🔌 [Socket] No auth token available');
      return;
    }

    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    const socketUrl = getSocketUrl();
    console.log('🔌 [Socket] Connecting to:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 [Socket] Connected:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on(SOCKET_EVENTS.AUTHENTICATED, (data) => {
      console.log('🔌 [Socket] Authenticated:', data);
      emitToListeners(SOCKET_EVENTS.AUTHENTICATED, data);
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('🔌 [Socket] Connection error:', error.message);
      setIsConnecting(false);
      setConnectionError(error.message);
      handleReconnect();
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('🔌 [Socket] Disconnected:', reason);
      setIsConnected(false);
      emitToListeners(SOCKET_EVENTS.DISCONNECT, { reason });
      
      if (reason !== 'io client disconnect') {
        handleReconnect();
      }
    });

    // Setup business event forwarding
    const businessEvents = [
      SOCKET_EVENTS.APPOINTMENT_CREATED,
      SOCKET_EVENTS.APPOINTMENT_UPDATED,
      SOCKET_EVENTS.APPOINTMENT_CANCELLED,
      SOCKET_EVENTS.WALLET_TRANSACTION,
      SOCKET_EVENTS.PRESCRIPTION_CREATED,
      SOCKET_EVENTS.PRESCRIPTION_UPDATED,
      SOCKET_EVENTS.NOTIFICATION_NEW,
      SOCKET_EVENTS.QUEUE_UPDATED,
      SOCKET_EVENTS.QUEUE_POSITION_CHANGED,
      SOCKET_EVENTS.QUEUE_YOUR_TURN,
      SOCKET_EVENTS.CHAT_MESSAGE,
      SOCKET_EVENTS.LAB_REPORT_READY,
    ];

    businessEvents.forEach(event => {
      newSocket.on(event, (data) => {
        console.log(`🔌 [Socket] Event: ${event}`, data);
        emitToListeners(event, data);
      });
    });

    setSocket(newSocket);
  }, [isConnecting, isConnected, emitToListeners, handleReconnect]);


  /**
   * Disconnect socket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  /**
   * Subscribe to a socket event
   */
  const subscribe = useCallback((event, callback) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }, []);

  /**
   * Emit an event to the server
   */
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('🔌 [Socket] Cannot emit - not connected');
    }
  }, [socket, isConnected]);

  /**
   * Join a room
   */
  const joinRoom = useCallback((roomId) => {
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);
    }
  }, [socket, isConnected]);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((roomId) => {
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomId);
    }
  }, [socket, isConnected]);

  // Auto-connect when token is available
  useEffect(() => {
    const token = getAuthToken();
    if (token && !socket && !isConnecting) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (['user', 'admin', 'receptionist', 'doctor'].includes(e.key)) {
        const token = getAuthToken();
        if (token && !isConnected && !isConnecting) {
          connect();
        } else if (!token && isConnected) {
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isConnected, isConnecting, connect, disconnect]);

  const value = {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    subscribe,
    emit,
    joinRoom,
    leaveRoom,
    SOCKET_EVENTS,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

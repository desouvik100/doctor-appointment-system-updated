

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socketManager, { SOCKET_EVENTS } from '../services/api/socketManager';
import { useUser } from './UserContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isLoggedIn } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const unsubscribersRef = useRef([]);

  const connect = useCallback(async () => {
    if (!user?.token) {
      console.log('🔌 [SocketContext] No token available for connection');
      return false;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const success = await socketManager.connect(user.token);
      setIsConnected(success);
      if (!success) {
        setConnectionError('Failed to connect to server');
      }
      return success;
    } catch (error) {
      setConnectionError(error.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [user?.token]);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const subscribe = useCallback((event, callback) => {
    return socketManager.subscribe(event, callback);
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    socketManager.unsubscribe(event, callback);
  }, []);

  const joinRoom = useCallback((roomId) => {
    socketManager.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    socketManager.leaveRoom(roomId);
  }, []);

  const emit = useCallback((event, data) => {
    socketManager.emit(event, data);
  }, []);

  const getStatus = useCallback(() => {
    return socketManager.getStatus();
  }, []);
  useEffect(() => {
    if (isLoggedIn && user?.token) {
      connect();
    } else if (!isLoggedIn) {
      disconnect();
    }

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [isLoggedIn, user?.token, connect, disconnect]);
  useEffect(() => {
    const unsubAuth = socketManager.subscribe(SOCKET_EVENTS.AUTHENTICATED, () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    const unsubDisconnect = socketManager.subscribe(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
    });

    const unsubError = socketManager.subscribe(SOCKET_EVENTS.ERROR, (error) => {
      setConnectionError(error?.message || 'Socket error');
    });
    const trackEvent = (eventName) => {
      return socketManager.subscribe(eventName, (data) => {
        setLastEvent({ event: eventName, data, timestamp: new Date().toISOString() });
      });
    };

    const eventTrackers = [
      trackEvent(SOCKET_EVENTS.APPOINTMENT_CREATED),
      trackEvent(SOCKET_EVENTS.APPOINTMENT_UPDATED),
      trackEvent(SOCKET_EVENTS.APPOINTMENT_CANCELLED),
      trackEvent(SOCKET_EVENTS.WALLET_TRANSACTION),
      trackEvent(SOCKET_EVENTS.PRESCRIPTION_CREATED),
      trackEvent(SOCKET_EVENTS.NOTIFICATION_NEW),
    ];

    unsubscribersRef.current = [unsubAuth, unsubDisconnect, unsubError, ...eventTrackers];

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, []);

  const value = {
    isConnected,
    isConnecting,
    connectionError,
    lastEvent,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    emit,
    getStatus,
    SOCKET_EVENTS,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export { SOCKET_EVENTS };
export default SocketContext;

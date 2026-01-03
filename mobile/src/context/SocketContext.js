/**
 * Socket Context - Manage real-time socket connection state
 * 
 * Provides socket connection management and event subscription
 * throughout the React Native application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socketManager, { SOCKET_EVENTS } from '../services/api/socketManager';
import { useUser } from './UserContext';

const SocketContext = createContext();

/**
 * Hook to access socket context
 * @returns {Object} Socket context value
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * Socket Provider Component
 * Manages socket connection lifecycle based on user authentication
 */
export const SocketProvider = ({ children }) => {
  const { user, isLoggedIn } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const unsubscribersRef = useRef([]);

  /**
   * Connect to socket server
   */
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

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  const subscribe = useCallback((event, callback) => {
    return socketManager.subscribe(event, callback);
  }, []);

  /**
   * Unsubscribe from a socket event
   * @param {string} event - Event name
   * @param {Function} [callback] - Specific callback to remove
   */
  const unsubscribe = useCallback((event, callback) => {
    socketManager.unsubscribe(event, callback);
  }, []);

  /**
   * Join a room
   * @param {string} roomId - Room identifier
   */
  const joinRoom = useCallback((roomId) => {
    socketManager.joinRoom(roomId);
  }, []);

  /**
   * Leave a room
   * @param {string} roomId - Room identifier
   */
  const leaveRoom = useCallback((roomId) => {
    socketManager.leaveRoom(roomId);
  }, []);

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  const emit = useCallback((event, data) => {
    socketManager.emit(event, data);
  }, []);

  /**
   * Get current connection status
   * @returns {Object} Connection status
   */
  const getStatus = useCallback(() => {
    return socketManager.getStatus();
  }, []);

  // Auto-connect when user logs in
  // Disabled for now due to Render free tier WebSocket limitations
  useEffect(() => {
    // Socket connection disabled - uncomment to enable real-time updates
    // if (isLoggedIn && user?.token) {
    //   connect();
    // } else if (!isLoggedIn) {
    //   disconnect();
    // }

    // Just disconnect on logout
    if (!isLoggedIn) {
      disconnect();
    }

    return () => {
      // Cleanup on unmount
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [isLoggedIn, user?.token, disconnect]);

  // Setup internal event listeners
  useEffect(() => {
    // Track connection state changes
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

    // Track last event for debugging
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
    // State
    isConnected,
    isConnecting,
    connectionError,
    lastEvent,
    
    // Methods
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    emit,
    getStatus,
    
    // Event constants
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

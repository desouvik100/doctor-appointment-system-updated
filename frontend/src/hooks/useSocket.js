/**
 * useSocket — Real-time socket event subscription hook
 * Wraps the SocketContext for easy event listening
 */
import { useEffect, useCallback } from 'react';
import { useSocket as useSocketContext } from '../contexts/SocketContext';

/**
 * Subscribe to a socket event with automatic cleanup
 * @param {string} event - Socket event name
 * @param {Function} handler - Event handler
 * @param {Array} deps - Dependencies (like useEffect)
 */
export const useSocketEvent = (event, handler, deps = []) => {
  const { subscribe, isConnected } = useSocketContext();

  useEffect(() => {
    if (!event || !handler) return;
    const unsubscribe = subscribe(event, handler);
    return () => unsubscribe?.();
  }, [event, isConnected, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * Subscribe to multiple socket events
 * @param {Object} eventHandlers - { eventName: handler }
 */
export const useSocketEvents = (eventHandlers) => {
  const { subscribe, isConnected } = useSocketContext();

  useEffect(() => {
    if (!eventHandlers) return;
    const unsubscribers = Object.entries(eventHandlers).map(([event, handler]) =>
      subscribe(event, handler)
    );
    return () => unsubscribers.forEach(unsub => unsub?.());
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * Emit a socket event
 */
export const useSocketEmit = () => {
  const { emit, isConnected } = useSocketContext();

  const safeEmit = useCallback((event, data) => {
    if (isConnected) {
      emit(event, data);
      return true;
    }
    console.warn(`[Socket] Cannot emit '${event}' — not connected`);
    return false;
  }, [emit, isConnected]);

  return { emit: safeEmit, isConnected };
};

/**
 * Join/leave a socket room
 */
export const useSocketRoom = (roomId) => {
  const { joinRoom, leaveRoom, isConnected } = useSocketContext();

  useEffect(() => {
    if (!roomId || !isConnected) return;
    joinRoom(roomId);
    return () => leaveRoom(roomId);
  }, [roomId, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useSocketContext;

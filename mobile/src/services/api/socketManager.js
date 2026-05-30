/**
 * Socket.IO Manager for Mobile
 * 
 * Manages WebSocket connections with JWT authentication,
 * exponential backoff reconnection, and room subscriptions.
 * 
 * @module socketManager
 */

import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { API_URL } from '../../config/env';

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
  
  // Imaging events
  IMAGING_REPORT_READY: 'imaging:report_ready',
};

// Reconnection configuration with exponential backoff
const RECONNECT_CONFIG = {
  maxAttempts: 15,         // More attempts for mobile networks
  initialDelay: 1000,      // 1 second
  maxDelay: 30000,         // 30 seconds max
  multiplier: 1.5,
};

// Heartbeat configuration to keep connection alive
const HEARTBEAT_CONFIG = {
  interval: 25000,         // Send ping every 25 seconds
  timeout: 10000,          // Wait 10 seconds for pong
};

/**
 * Calculate reconnection delay with exponential backoff
 * @param {number} attempt - Current attempt number
 * @returns {number} Delay in milliseconds
 */
const getReconnectDelay = (attempt) => {
  const delay = RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.multiplier, attempt);
  return Math.min(delay, RECONNECT_CONFIG.maxDelay);
};

// Extract base URL from API_URL (remove /api suffix)
const getSocketUrl = () => {
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  console.log('🔌 [Socket] URL:', baseUrl);
  return baseUrl;
};

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeout = null;
    this.eventListeners = new Map();
    this.subscribedRooms = new Set();
    this.appStateSubscription = null;
    this.lastAppState = 'active';
    this.userId = null;
    this.userType = null;
    this.clinicId = null;
    this.authToken = null;
    this.isAuthPaused = false;
    // Listeners notified when a fresh token is installed via updateToken()
    this.tokenUpdateListeners = new Set();
  }

  /**
   * Initialize socket connection with JWT token
   * @param {string} token - JWT authentication token
   * @returns {Promise<boolean>} Connection success
   */
  async connect(token) {
    if (this.isConnecting) {
      console.log('🔌 [Socket] Connection already in progress');
      return false;
    }

    if (this.isConnected && this.socket?.connected) {
      console.log('🔌 [Socket] Already connected');
      return true;
    }

    // Get token from storage if not provided
    const authToken = token || await AsyncStorage.getItem('token');
    if (!authToken) {
      console.log('🔌 [Socket] No auth token available');
      return false;
    }

    this.authToken = authToken;
    this.isConnecting = true;
    this.reconnectAttempts = 0;

    return new Promise((resolve) => {
      try {
        const socketUrl = getSocketUrl();
        console.log('🔌 [Socket] Connecting to:', socketUrl);

        if (this.socket) {
          try {
            console.log('🔌 [Socket] Disconnecting existing socket before creating new one');
            this.socket.disconnect();
          } catch (e) {
            // Ignore Hermes non-configurable property errors
          }
        }

        this.socket = io(socketUrl, {
          auth: { token: authToken },
          transports: ['websocket', 'polling'],
          // Disable Socket.io's own reconnection engine.
          // We own the entire backoff schedule via _handleReconnect()
          // to prevent uncontrolled 1000ms polling loops.
          reconnection: false,
          timeout: 20000,
          forceNew: true,
          pingInterval: 25000,
          pingTimeout: 10000,
        });

        // Single-resolution guard — ensures the Promise resolves only once
        // regardless of how many events fire on the same connection attempt.
        let settled = false;
        const settle = (value) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };

        // Connection successful
        this.socket.on('connect', () => {
          console.log('🔌 [Socket] Connected:', this.socket.id);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this._clearReconnectTimer();
          this._startHeartbeat();
          this._setupAppStateListener();
          settle(true);
        });

        // Authentication success
        this.socket.on(SOCKET_EVENTS.AUTHENTICATED, (data) => {
          console.log('🔌 [Socket] Authenticated:', data);
          this.userId = data.userId;
          this.userType = data.userType;
          this.clinicId = data.clinicId;
          
          // Rejoin previously subscribed rooms
          this.subscribedRooms.forEach(roomId => {
            this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);
          });
          
          // Emit to listeners
          this._emitToListeners(SOCKET_EVENTS.AUTHENTICATED, data);
        });

        // Connection error
        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
          // Only log in dev mode to avoid spamming console
          if (__DEV__) {
            console.log('🔌 [Socket] Connection error:', error.message);
          }
          this.isConnecting = false;
          
          if (error.message === 'Authentication failed' || error.message?.includes('Authentication failed')) {
            console.log('🔌 [Socket] Authentication handshake failed. Pausing reconnection scheduler.');
            this.isAuthPaused = true;
            this._clearReconnectTimer();
            if (this.socket) {
              try {
                this.socket.disconnect();
              } catch (e) {}
            }
          } else {
            this._handleReconnect();
          }
          settle(false);
        });

        // Disconnection
        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
          console.log('🔌 [Socket] Disconnected:', reason);
          this.isConnected = false;
          this._stopHeartbeat();
          this._emitToListeners(SOCKET_EVENTS.DISCONNECT, { reason });
          
          // Auto-reconnect unless intentional disconnect
          if (reason !== 'io client disconnect') {
            this._handleReconnect();
          }
        });

        // Handle reconnect events from socket.io
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔌 [Socket] Reconnected after', attemptNumber, 'attempts');
          this.isConnected = true;
          this._startHeartbeat();
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔌 [Socket] Reconnect attempt:', attemptNumber);
        });

        this.socket.on('reconnect_failed', () => {
          console.log('🔌 [Socket] Reconnect failed, trying manual reconnect');
          this._handleReconnect();
        });

        // Error handling
        this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
          if (__DEV__) {
            console.log('🔌 [Socket] Error:', error);
          }
          this._emitToListeners(SOCKET_EVENTS.ERROR, error);
        });

        // Room events
        this.socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
          console.log('🔌 [Socket] Joined room:', data.roomId);
          this._emitToListeners(SOCKET_EVENTS.ROOM_JOINED, data);
        });

        this.socket.on(SOCKET_EVENTS.ROOM_LEFT, (data) => {
          console.log('🔌 [Socket] Left room:', data.roomId);
          this._emitToListeners(SOCKET_EVENTS.ROOM_LEFT, data);
        });

        // Setup event forwarding for all business events
        this._setupEventForwarding();

      } catch (error) {
        console.error('🔌 [Socket] Setup error:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  /**
   * Setup forwarding for all business events to registered listeners
   * @private
   */
  _setupEventForwarding() {
    const businessEvents = [
      SOCKET_EVENTS.APPOINTMENT_CREATED,
      SOCKET_EVENTS.APPOINTMENT_UPDATED,
      SOCKET_EVENTS.APPOINTMENT_CANCELLED,
      SOCKET_EVENTS.APPOINTMENT_STATUS_CHANGED,
      SOCKET_EVENTS.WALLET_TRANSACTION,
      SOCKET_EVENTS.WALLET_BALANCE_UPDATED,
      SOCKET_EVENTS.PRESCRIPTION_CREATED,
      SOCKET_EVENTS.PRESCRIPTION_UPDATED,
      SOCKET_EVENTS.NOTIFICATION_NEW,
      SOCKET_EVENTS.NOTIFICATION_READ,
      SOCKET_EVENTS.QUEUE_UPDATED,
      SOCKET_EVENTS.QUEUE_POSITION_CHANGED,
      SOCKET_EVENTS.QUEUE_YOUR_TURN,
      SOCKET_EVENTS.CHAT_MESSAGE,
      SOCKET_EVENTS.CHAT_TYPING,
      SOCKET_EVENTS.LAB_REPORT_READY,
      SOCKET_EVENTS.IMAGING_REPORT_READY,
    ];

    businessEvents.forEach(event => {
      this.socket.on(event, (data) => {
        console.log(`🔌 [Socket] Event received: ${event}`, data);
        this._emitToListeners(event, data);
      });
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    console.log('🔌 [Socket] Disconnecting...');
    this._clearReconnectTimer();
    this._stopHeartbeat();
    this._removeAppStateListener();
    
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (error) {
        // Ignore "property is not configurable" error from Hermes
        if (!error.message?.includes('not configurable')) {
          console.log('🔌 [Socket] Disconnect error:', error.message);
        }
      }
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.subscribedRooms.clear();
    this.userId = null;
    this.userType = null;
    this.clinicId = null;
    this.authToken = null;
  }

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Unsubscribe from a socket event
   * @param {string} event - Event name
   * @param {Function} [callback] - Specific callback to remove (removes all if not provided)
   */
  unsubscribe(event, callback) {
    if (callback) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    } else {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Join a room
   * @param {string} roomId - Room identifier
   */
  joinRoom(roomId) {
    this.subscribedRooms.add(roomId);
    if (this.isConnected && this.socket) {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomId);
    }
  }

  /**
   * Leave a room
   * @param {string} roomId - Room identifier
   */
  leaveRoom(roomId) {
    this.subscribedRooms.delete(roomId);
    if (this.isConnected && this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomId);
    }
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('🔌 [Socket] Cannot emit - not connected');
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null,
      userId: this.userId,
      userType: this.userType,
      clinicId: this.clinicId,
      subscribedRooms: Array.from(this.subscribedRooms),
    };
  }

  /**
   * Update auth token and resume reconnection if paused.
   * Also notifies all registered tokenUpdateListeners so dependent subsystems
   * (e.g. background sync hooks) can react immediately.
   * @param {string} token - Fresh JWT token
   */
  updateToken(token) {
    if (!token) return;
    console.log('🔌 [Socket] Updating auth token and resetting paused state');
    this.authToken = token;
    this.isAuthPaused = false;
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.auth = { token };
    }
    if (!this.isConnected && !this.isConnecting) {
      this.connect(token);
    }
    // Notify all registered listeners that a fresh token is available
    this.tokenUpdateListeners.forEach((cb) => {
      try { cb(token); } catch (e) { /* listener errors must not block others */ }
    });
  }

  /**
   * Register a listener that fires whenever the socket receives a new token.
   * @param {Function} callback - Receives (token: string)
   * @returns {Function} Unsubscribe function
   */
  onTokenUpdated(callback) {
    this.tokenUpdateListeners.add(callback);
    return () => this.tokenUpdateListeners.delete(callback);
  }

  /**
   * Remove a previously registered token-update listener.
   * @param {Function} callback
   */
  offTokenUpdated(callback) {
    this.tokenUpdateListeners.delete(callback);
  }

  /**
   * Emit event to all registered listeners
   * @private
   */
  _emitToListeners(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🔌 [Socket] Listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle reconnection with exponential backoff
   * @private
   */
  _handleReconnect() {
    if (this.isConnecting) {
      return;
    }

    if (this.isAuthPaused) {
      console.log('🔌 [Socket] Reconnection scheduler is paused — awaiting token refresh signal');
      return;
    }

    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      console.log('🔌 [Socket] Max reconnect attempts reached, will retry on app foreground');
      this.reconnectAttempts = 0; // Reset for next foreground event
      return;
    }

    const delay = getReconnectDelay(this.reconnectAttempts);
    console.log(`🔌 [Socket] Exponential backoff reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${RECONNECT_CONFIG.maxAttempts})`);

    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      if (this.authToken) {
        await this.connect(this.authToken);
      } else {
        await this.connect();
      }
    }, delay);
  }

  /**
   * Clear reconnection timer
   * @private
   */
  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   * @private
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.socket) {
        // Socket.io handles ping/pong automatically, but we can check connection
        if (!this.socket.connected) {
          console.log('🔌 [Socket] Heartbeat detected disconnection');
          this.isConnected = false;
          this._stopHeartbeat();
          this._handleReconnect();
        }
      }
    }, HEARTBEAT_CONFIG.interval);
  }

  /**
   * Stop heartbeat timer
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Setup app state listener for reconnection on foreground
   * @private
   */
  _setupAppStateListener() {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (this.lastAppState.match(/inactive|background/) && nextAppState === 'active') {
        if (__DEV__) {
          console.log('🔌 [Socket] App came to foreground');
        }
        // Do not attempt reconnect while waiting for a fresh auth token
        if (!this.isAuthPaused && !this.isConnected && !this.isConnecting) {
          await this.connect();
        }
      }
      this.lastAppState = nextAppState;
    });
  }

  /**
   * Remove app state listener
   * @private
   */
  _removeAppStateListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Singleton instance
const socketManager = new SocketManager();

export default socketManager;

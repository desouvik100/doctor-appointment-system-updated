/**
 * Offline Manager - Handle offline data caching and sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'cache_';
const QUEUE_KEY = 'offline_queue';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.pendingActions = [];
    this.listeners = [];
    this.syncInProgress = false;
    
    this.init();
  }

  /**
   * Initialize network listener
   */
  async init() {
    // Load pending actions from storage
    await this.loadPendingActions();
    
    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));
      
      // Sync when coming back online
      if (wasOffline && this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  /**
   * Add listener for online/offline status changes
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Check if currently online
   */
  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected && state.isInternetReachable;
    return this.isOnline;
  }

  /**
   * Cache data with expiration
   */
  async cacheData(key, data, duration = DEFAULT_CACHE_DURATION) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  }

  /**
   * Get cached data if not expired
   */
  async getCachedData(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, expiry } = JSON.parse(cached);
    
    // Check if expired
    if (Date.now() > expiry) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  }

  /**
   * Get cached data even if expired (for offline fallback)
   */
  async getCachedDataForce(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data } = JSON.parse(cached);
    return data;
  }

  /**
   * Clear specific cache
   */
  async clearCache(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
  }

  /**
   * Clear all cached data
   */
  async clearAllCache() {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Load pending actions from storage
   */
  async loadPendingActions() {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    this.pendingActions = stored ? JSON.parse(stored) : [];
  }

  /**
   * Save pending actions to storage
   */
  async savePendingActions() {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.pendingActions));
  }

  /**
   * Queue an action for later execution
   */
  async queueAction(action) {
    const queuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.pendingActions.push(queuedAction);
    await this.savePendingActions();
    
    // Try to execute immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }
    
    return queuedAction.id;
  }

  /**
   * Sync all pending actions
   */
  async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline || this.pendingActions.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    const actionsToProcess = [...this.pendingActions];
    
    for (const action of actionsToProcess) {
      try {
        await this.executeAction(action);
        // Remove successful action
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        
        // Increment retry count
        const actionIndex = this.pendingActions.findIndex(a => a.id === action.id);
        if (actionIndex !== -1) {
          this.pendingActions[actionIndex].retryCount++;
          
          // Remove if too many retries
          if (this.pendingActions[actionIndex].retryCount > 3) {
            this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
          }
        }
      }
    }
    
    await this.savePendingActions();
    this.syncInProgress = false;
  }

  /**
   * Execute a queued action
   */
  async executeAction(action) {
    const { type, payload, endpoint, method } = action;
    
    // Import apiClient dynamically to avoid circular dependency
    const { default: apiClient } = await import('../api/apiClient');
    
    switch (method) {
      case 'POST':
        return await apiClient.post(endpoint, payload);
      case 'PUT':
        return await apiClient.put(endpoint, payload);
      case 'DELETE':
        return await apiClient.delete(endpoint);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  /**
   * Get pending actions count
   */
  getPendingCount() {
    return this.pendingActions.length;
  }

  /**
   * Get all pending actions
   */
  getPendingActions() {
    return [...this.pendingActions];
  }

  /**
   * Remove a specific pending action
   */
  async removeAction(actionId) {
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId);
    await this.savePendingActions();
  }

  /**
   * Clear all pending actions
   */
  async clearPendingActions() {
    this.pendingActions = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Cleanup on app close
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

export default offlineManager;

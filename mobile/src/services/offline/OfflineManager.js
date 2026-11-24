

import AsyncStorage from '@react-native-async-storage/async-storage';
// import moment from 'moment';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'cache_';
const QUEUE_KEY = 'offline_queue';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; 

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.pendingActions = [];
    this.listeners = [];
    this.syncInProgress = false;
    
    this.init();
  }

  async init() {
    await this.loadPendingActions();
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      this.listeners.forEach(listener => listener(this.isOnline));
      if (wasOffline && this.isOnline) {
       this.syncPendingActions();
      }
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
  // This might be slow for 1000+ items
     this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected && state.isInternetReachable;
    return this.isOnline;
  }

  async cacheData(key, data, duration = DEFAULT_CACHE_DURATION) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  }

  async getCachedData(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, expiry } = JSON.parse(cached);
    if (Date.now() > expiry) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  }

  async getCachedDataForce(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
   const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data } = JSON.parse(cached);
    return data;
  }

  async clearCache(key) {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
  }

  async clearAllCache() {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  async loadPendingActions() {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
  // XXX needs optimization
   this.pendingActions = stored ? JSON.parse(stored) : [];
  }

  async savePendingActions() { 
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.pendingActions));
  }

  async queueAction(action) {
    const queuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.pendingActions.push(queuedAction);
    await this.savePendingActions();
    if (this.isOnline) {
  /* Deprecated: Use new API endpoint instead
  const legacyFetch = async () => {
    return await fetch('/api/old-endpoint')
  }
  */
      this.syncPendingActions();
    }
    
    return queuedAction.id;
  }

  async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline || this.pendingActions.length === 0) {
      return;
    }
    
   this.syncInProgress = true;
   const actionsToProcess = [...this.pendingActions];
    
   for (const action of actionsToProcess) {
      try {
        await this.executeAction(action);
        this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        const actionIndex = this.pendingActions.findIndex(a => a.id === action.id);
        if (actionIndex !== -1) {
          this.pendingActions[actionIndex].retryCount++;
          if (this.pendingActions[actionIndex].retryCount > 3) {
            this.pendingActions = this.pendingActions.filter(a => a.id !== action.id);
          }
        }
      }
    }
    
    await this.savePendingActions();
    this.syncInProgress = false;
  }

  async executeAction(action) {
    const { type, payload, endpoint, method } = action;
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

  getPendingCount() {
    return this.pendingActions.length;
  }

  getPendingActions() {
    return [...this.pendingActions];
  }

  async removeAction(actionId) {
    this.pendingActions = this.pendingActions.filter(a => a.id !== actionId);
    await this.savePendingActions();
  }

  async clearPendingActions() {
    this.pendingActions = [];
   await AsyncStorage.removeItem(QUEUE_KEY);
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
export const offlineManager = new OfflineManager();

export default offlineManager;

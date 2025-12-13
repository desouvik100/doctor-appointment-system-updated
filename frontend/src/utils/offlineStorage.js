/**
 * Offline Storage Utility
 * Supports offline-first queue token system
 * Uses IndexedDB for reliable offline storage
 */

const DB_NAME = 'HealthSyncProOffline';
const DB_VERSION = 1;

class OfflineStorage {
  constructor() {
    this.db = null;
    this.isSupported = 'indexedDB' in window;
  }

  async init() {
    if (!this.isSupported) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      return false;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Queue tokens store
        if (!db.objectStoreNames.contains('queueTokens')) {
          const tokenStore = db.createObjectStore('queueTokens', { keyPath: 'localId', autoIncrement: true });
          tokenStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          tokenStore.createIndex('clinicId', 'clinicId', { unique: false });
          tokenStore.createIndex('tokenDate', 'tokenDate', { unique: false });
        }

        // Pending actions store (for sync)
        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
          actionStore.createIndex('type', 'type', { unique: false });
          actionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cached data store
        if (!db.objectStoreNames.contains('cachedData')) {
          db.createObjectStore('cachedData', { keyPath: 'key' });
        }
      };
    });
  }

  // ===== Queue Tokens =====

  async saveQueueToken(tokenData) {
    const token = {
      ...tokenData,
      localId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      syncStatus: 'pending',
      localCreatedAt: new Date().toISOString(),
      tokenDate: new Date().toISOString().split('T')[0]
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['queueTokens'], 'readwrite');
        const store = transaction.objectStore('queueTokens');
        const request = store.add(token);

        request.onsuccess = () => resolve(token);
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback to localStorage
      const tokens = JSON.parse(localStorage.getItem('offlineQueueTokens') || '[]');
      tokens.push(token);
      localStorage.setItem('offlineQueueTokens', JSON.stringify(tokens));
      return token;
    }
  }

  async getPendingTokens() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['queueTokens'], 'readonly');
        const store = transaction.objectStore('queueTokens');
        const index = store.index('syncStatus');
        const request = index.getAll('pending');

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      const tokens = JSON.parse(localStorage.getItem('offlineQueueTokens') || '[]');
      return tokens.filter(t => t.syncStatus === 'pending');
    }
  }

  async markTokenSynced(localId, serverId) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['queueTokens'], 'readwrite');
        const store = transaction.objectStore('queueTokens');
        const request = store.get(localId);

        request.onsuccess = () => {
          const token = request.result;
          if (token) {
            token.syncStatus = 'synced';
            token.serverId = serverId;
            token.syncedAt = new Date().toISOString();
            store.put(token);
          }
          resolve(token);
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      const tokens = JSON.parse(localStorage.getItem('offlineQueueTokens') || '[]');
      const index = tokens.findIndex(t => t.localId === localId);
      if (index !== -1) {
        tokens[index].syncStatus = 'synced';
        tokens[index].serverId = serverId;
        tokens[index].syncedAt = new Date().toISOString();
        localStorage.setItem('offlineQueueTokens', JSON.stringify(tokens));
      }
      return tokens[index];
    }
  }

  async getTodayTokens(clinicId, doctorId) {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['queueTokens'], 'readonly');
        const store = transaction.objectStore('queueTokens');
        const request = store.getAll();

        request.onsuccess = () => {
          const tokens = request.result.filter(t => 
            t.tokenDate === today &&
            t.clinicId === clinicId &&
            t.doctorId === doctorId
          );
          resolve(tokens);
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      const tokens = JSON.parse(localStorage.getItem('offlineQueueTokens') || '[]');
      return tokens.filter(t => 
        t.tokenDate === today &&
        t.clinicId === clinicId &&
        t.doctorId === doctorId
      );
    }
  }

  // ===== Pending Actions =====

  async addPendingAction(action) {
    const pendingAction = {
      ...action,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['pendingActions'], 'readwrite');
        const store = transaction.objectStore('pendingActions');
        const request = store.add(pendingAction);

        request.onsuccess = () => resolve({ ...pendingAction, id: request.result });
        request.onerror = () => reject(request.error);
      });
    } else {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
      pendingAction.id = Date.now();
      actions.push(pendingAction);
      localStorage.setItem('pendingActions', JSON.stringify(actions));
      return pendingAction;
    }
  }

  async getPendingActions() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['pendingActions'], 'readonly');
        const store = transaction.objectStore('pendingActions');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      return JSON.parse(localStorage.getItem('pendingActions') || '[]');
    }
  }

  async removePendingAction(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['pendingActions'], 'readwrite');
        const store = transaction.objectStore('pendingActions');
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } else {
      const actions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
      const filtered = actions.filter(a => a.id !== id);
      localStorage.setItem('pendingActions', JSON.stringify(filtered));
      return true;
    }
  }

  // ===== Cached Data =====

  async cacheData(key, data, ttlMinutes = 60) {
    const cacheEntry = {
      key,
      data,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['cachedData'], 'readwrite');
        const store = transaction.objectStore('cachedData');
        const request = store.put(cacheEntry);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } else {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      return true;
    }
  }

  async getCachedData(key) {
    let cacheEntry;

    if (this.db) {
      cacheEntry = await new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['cachedData'], 'readonly');
        const store = transaction.objectStore('cachedData');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      const stored = localStorage.getItem(`cache_${key}`);
      cacheEntry = stored ? JSON.parse(stored) : null;
    }

    if (!cacheEntry) return null;

    // Check if expired
    if (new Date(cacheEntry.expiresAt) < new Date()) {
      await this.clearCachedData(key);
      return null;
    }

    return cacheEntry.data;
  }

  async clearCachedData(key) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['cachedData'], 'readwrite');
        const store = transaction.objectStore('cachedData');
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } else {
      localStorage.removeItem(`cache_${key}`);
      return true;
    }
  }

  // ===== Sync Manager =====

  async syncWithServer(apiBaseUrl, authToken) {
    if (!navigator.onLine) {
      console.log('Offline - sync skipped');
      return { success: false, reason: 'offline' };
    }

    const results = {
      tokens: { synced: 0, failed: 0 },
      actions: { synced: 0, failed: 0 }
    };

    // Sync pending tokens
    const pendingTokens = await this.getPendingTokens();
    if (pendingTokens.length > 0) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/offline-queue/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tokens: pendingTokens,
            deviceId: this.getDeviceId()
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Mark synced tokens
          for (const syncedToken of data.details.synced) {
            await this.markTokenSynced(syncedToken.localId, syncedToken._id);
            results.tokens.synced++;
          }
          
          results.tokens.failed = data.details.errors.length;
        }
      } catch (error) {
        console.error('Token sync failed:', error);
        results.tokens.failed = pendingTokens.length;
      }
    }

    // Sync pending actions
    const pendingActions = await this.getPendingActions();
    for (const action of pendingActions) {
      try {
        const response = await fetch(`${apiBaseUrl}${action.endpoint}`, {
          method: action.method,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        });

        if (response.ok) {
          await this.removePendingAction(action.id);
          results.actions.synced++;
        } else {
          results.actions.failed++;
        }
      } catch (error) {
        console.error('Action sync failed:', error);
        results.actions.failed++;
      }
    }

    return { success: true, results };
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Listen for online/offline events
  onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

// Export singleton instance
const offlineStorage = new OfflineStorage();
export default offlineStorage;

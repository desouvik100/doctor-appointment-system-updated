/**
 * Offline Booking Utility
 * Stores bookings in IndexedDB when offline and syncs when back online
 */

const DB_NAME = 'healthsync-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-bookings';

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

// Save booking for offline sync
export const saveOfflineBooking = async (bookingData) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const booking = {
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      syncAttempts: 0
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(booking);
      request.onsuccess = () => {
        console.log('📦 Booking saved offline:', request.result);
        // Register for background sync if available
        if ('serviceWorker' in navigator && 'sync' in window.registration) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-bookings');
          });
        }
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save offline booking:', error);
    throw error;
  }
};

// Get all pending bookings
export const getPendingBookings = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending bookings:', error);
    return [];
  }
};

// Update booking status
export const updateBookingStatus = async (id, status, response = null) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const booking = getRequest.result;
        if (booking) {
          booking.status = status;
          booking.syncedAt = new Date().toISOString();
          booking.response = response;
          booking.syncAttempts = (booking.syncAttempts || 0) + 1;
          
          const updateRequest = store.put(booking);
          updateRequest.onsuccess = () => resolve(booking);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Booking not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Failed to update booking status:', error);
    throw error;
  }
};

// Delete synced booking
export const deleteBooking = async (id) => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete booking:', error);
    throw error;
  }
};

// Sync all pending bookings
export const syncPendingBookings = async (apiCall) => {
  const pendingBookings = await getPendingBookings();
  const results = [];
  
  for (const booking of pendingBookings) {
    try {
      // Skip if too many attempts
      if (booking.syncAttempts >= 3) {
        await updateBookingStatus(booking.id, 'failed');
        continue;
      }
      
      const response = await apiCall(booking);
      await updateBookingStatus(booking.id, 'synced', response);
      results.push({ id: booking.id, success: true, response });
      
      // Clean up synced bookings after 24 hours
      setTimeout(() => deleteBooking(booking.id), 24 * 60 * 60 * 1000);
      
    } catch (error) {
      await updateBookingStatus(booking.id, 'pending');
      results.push({ id: booking.id, success: false, error: error.message });
    }
  }
  
  return results;
};

// Check if there are pending bookings
export const hasPendingBookings = async () => {
  const pending = await getPendingBookings();
  return pending.length > 0;
};

// Get booking count
export const getPendingCount = async () => {
  const pending = await getPendingBookings();
  return pending.length;
};

export default {
  saveOfflineBooking,
  getPendingBookings,
  updateBookingStatus,
  deleteBooking,
  syncPendingBookings,
  hasPendingBookings,
  getPendingCount
};

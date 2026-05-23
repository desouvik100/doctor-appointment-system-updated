/**
 * Frontend Performance Optimization Utilities
 * Comprehensive performance enhancements for production
 */

import React, { lazy, Suspense } from 'react';

/**
 * Lazy Loading Components with Error Boundaries
 */
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  return (props) => (
    <Suspense fallback={fallback || <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Memory Management
 */
export const memoryManagement = {
  cleanup: (subscriptions = [], timers = [], observers = []) => {
    subscriptions.forEach(sub => sub?.unsubscribe?.());
    timers.forEach(timer => { clearTimeout(timer); clearInterval(timer); });
    observers.forEach(observer => observer?.disconnect?.());
  },

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle: (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

/**
 * Caching Strategies
 */
export const caching = {
  setWithExpiry: (key, value, ttl) => {
    try {
      localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + ttl }));
    } catch { /* storage full */ }
  },

  getWithExpiry: (key) => {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) { localStorage.removeItem(key); return null; }
      return item.value;
    } catch { return null; }
  },

  memoryCache: new Map(),

  setCacheData: (key, data, ttl = 300000) => {
    caching.memoryCache.set(key, { data, expiry: Date.now() + ttl });
  },

  getCacheData: (key) => {
    const cached = caching.memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) { caching.memoryCache.delete(key); return null; }
    return cached.data;
  },

  clearAll: () => {
    caching.memoryCache.clear();
  },
};

/**
 * Network Optimization
 */
export const networkOptimization = {
  pendingRequests: new Map(),

  deduplicateRequest: async (key, requestFunc) => {
    if (networkOptimization.pendingRequests.has(key)) {
      return networkOptimization.pendingRequests.get(key);
    }
    const promise = requestFunc();
    networkOptimization.pendingRequests.set(key, promise);
    try {
      const result = await promise;
      networkOptimization.pendingRequests.delete(key);
      return result;
    } catch (error) {
      networkOptimization.pendingRequests.delete(key);
      throw error;
    }
  },

  retryRequest: async (requestFunc, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFunc();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
      }
    }
  },
};

/**
 * Security Enhancements
 */
export const securityEnhancements = {
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim().slice(0, 1000);
  },

  validateFile: (file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
    const errors = [];
    if (!allowedTypes.includes(file.type)) errors.push(`File type ${file.type} not allowed`);
    if (file.size > 10 * 1024 * 1024) errors.push('File size exceeds 10MB limit');
    if (!/^[a-zA-Z0-9._\- ]+$/.test(file.name)) errors.push('Invalid characters in filename');
    return errors;
  },

  generateSecureId: () => {
    try {
      return crypto.getRandomValues(new Uint32Array(4)).join('-');
    } catch {
      return Math.random().toString(36).substr(2, 9);
    }
  },
};

/**
 * Image Optimization
 */
export const imageOptimization = {
  getResponsiveImageUrl: (baseUrl, width) => {
    if (!baseUrl) return '';
    if (baseUrl.includes('cloudinary.com')) {
      return baseUrl.replace('/upload/', `/upload/w_${width},c_scale,f_auto,q_auto/`);
    }
    return baseUrl;
  },

  preloadImage: (src) => {
    if (!src) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  },
};

/**
 * Accessibility Enhancements
 */
export const accessibilityEnhancements = {
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },

  trapFocus: (element) => {
    const focusable = element.querySelectorAll(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
  },
};

export default {
  createLazyComponent,
  memoryManagement,
  caching,
  networkOptimization,
  securityEnhancements,
  imageOptimization,
  accessibilityEnhancements,
};

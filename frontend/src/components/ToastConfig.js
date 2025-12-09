// frontend/src/components/ToastConfig.js
// Enhanced toast notification configuration

import { Toaster } from 'react-hot-toast';

// Custom toast configuration for consistent styling
export const ToastConfig = () => (
  <Toaster
    position="top-right"
    gutter={12}
    containerStyle={{
      top: 20,
      right: 20,
    }}
    toastOptions={{
      // Default options for all toasts
      duration: 4000,
      style: {
        background: '#fff',
        color: '#1e293b',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        fontSize: '0.95rem',
        fontWeight: '500',
        maxWidth: '400px',
        border: '1px solid #e2e8f0',
      },
      
      // Success toast styling
      success: {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #86efac',
          color: '#166534',
        },
        iconTheme: {
          primary: '#22c55e',
          secondary: '#fff',
        },
      },
      
      // Error toast styling
      error: {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #fca5a5',
          color: '#991b1b',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
      
      // Loading toast styling
      loading: {
        style: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #cbd5e1',
          color: '#475569',
        },
      },
    }}
  />
);

// Custom toast functions with icons
export const showToast = {
  success: (message, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast.success(message, {
      icon: '✅',
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast.error(message, {
      icon: '❌',
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast(message, {
      icon: '⚠️',
      style: {
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid #fcd34d',
        color: '#92400e',
      },
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1px solid #93c5fd',
        color: '#1e40af',
      },
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast.loading(message, options);
  },
  
  dismiss: (toastId) => {
    const toast = require('react-hot-toast').default;
    toast.dismiss(toastId);
  },
  
  // Promise-based toast for async operations
  promise: (promise, messages, options = {}) => {
    const toast = require('react-hot-toast').default;
    return toast.promise(promise, {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    }, options);
  },
};

export default ToastConfig;

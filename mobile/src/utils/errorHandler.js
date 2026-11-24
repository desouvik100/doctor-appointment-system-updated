

export const handleApiError = (error) => {
  if (__DEV__) {
    console.log('API Error:', error?.response?.data || error?.message);
  }

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.'; 
      default:
        return message || 'Something went wrong.';
    }
  }

  if (error.request) {
    return 'Network error. Please check your connection.';
  }
  return 'An unexpected error occurred.';
};

export const devLog = (...args) => {
  if (__DEV__) {
    console.log(...args); 
  }
};

export const devError = (...args) => {
  if (__DEV__) {
    console.error(...args);
  }
};

export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    devError('SafeAsync Error:', error);
    return fallback;
  }
};

export const isValid = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false; 
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

export default {
  handleApiError,
  devLog,
  devError,
  safeAsync,
  isValid,
};

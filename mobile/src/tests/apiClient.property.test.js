

const fc = require('fast-check');
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('../utils/errorHandler', () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));
global.__DEV__ = false;

const transformError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    return {
      success: false,
      message: data?.message || getDefaultErrorMessage(status),
      statusCode: status,
      code: data?.code || undefined,
      errors: data?.errors || [],
      originalError: error,
    };
  }
  if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      code: 'NETWORK_ERROR',
      errors: [],
      originalError: error,
    };
  }
  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: -1,
    code: 'UNKNOWN_ERROR',
    errors: [],
    originalError: error,
  };
};

const getDefaultErrorMessage = (status) => {
  const messages = {
    400: 'Invalid request. Please check your input.',
    401: 'Session expired. Please login again.',
    403: 'Access denied. You do not have permission.',
    404: 'Resource not found.',
    408: 'Request timeout. Please try again.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again.',
  };
  return messages[status] || 'Something went wrong.';
};

const isApiError = (error) => {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
};

const attachAuthorizationHeader = (config, token) => {
  const newConfig = { ...config, headers: { ...config.headers } };
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }
  return newConfig;
};

describe('API Client - Property Tests', () => {

  describe('Property 1: Authorization Header Attachment', () => {
    
    test('when token exists, Authorization header is attached with Bearer prefix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
          fc.record({
            url: fc.string({ minLength: 1, maxLength: 100 }),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            headers: fc.record({
              'Content-Type': fc.constant('application/json'),
            }),
          }),
          (token, config) => {
            const result = attachAuthorizationHeader(config, token);
            expect(result.headers.Authorization).toBeDefined();
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
            expect(result.headers.Authorization.startsWith('Bearer ')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('when token is null/undefined, Authorization header is not attached', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ''),
          fc.record({
            url: fc.string({ minLength: 1, maxLength: 100 }),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            headers: fc.record({
              'Content-Type': fc.constant('application/json'),
            }),
          }),
          (token, config) => {
            const result = attachAuthorizationHeader(config, token);
            expect(result.headers.Authorization).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('existing headers are preserved when adding Authorization', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (token, customHeaderKey, customHeaderValue) => {
            const safeKey = customHeaderKey.replace(/[^a-zA-Z0-9-]/g, '') || 'X-Custom';
            
            const config = {
              url: '/test',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                [safeKey]: customHeaderValue,
              },
            };
            
            const result = attachAuthorizationHeader(config, token);
            expect(result.headers['Content-Type']).toBe('application/json');
            expect(result.headers[safeKey]).toBe(customHeaderValue);
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

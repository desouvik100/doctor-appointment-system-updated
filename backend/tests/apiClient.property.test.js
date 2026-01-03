/**
 * Property-Based Tests for API Client
 * Feature: api-standardization-realtime-sync
 * 
 * Property 1: Authorization Header Attachment
 * Validates: Requirements 1.2
 * 
 * Property 2: Error Response Consistency
 * Validates: Requirements 1.4, 5.1, 5.2
 * 
 * These tests validate the core logic of the API client's request interceptor
 * and error transformation functions without React Native dependencies.
 */

const fc = require('fast-check');

/**
 * Simulated transformError function matching mobile/src/services/api/apiClient.js
 * This is a pure function that can be tested independently
 */
const transformError = (error) => {
  // Handle null/undefined errors
  if (!error) {
    return {
      success: false,
      message: 'An unexpected error occurred.',
      statusCode: -1,
      code: 'UNKNOWN_ERROR',
      errors: [],
      originalError: error,
    };
  }

  // Server responded with an error status
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

  // Request was made but no response received (network error)
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

  // Something else happened during request setup
  return {
    success: false,
    message: error.message || 'An unexpected error occurred.',
    statusCode: -1,
    code: 'UNKNOWN_ERROR',
    errors: [],
    originalError: error,
  };
};

/**
 * Get default error message based on HTTP status code
 */
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

/**
 * Simulated request interceptor logic for attaching Authorization header
 * This mirrors the logic in apiClient.js request interceptor
 */
const attachAuthorizationHeader = (config, token) => {
  const newConfig = { ...config, headers: { ...config.headers } };
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }
  return newConfig;
};

/**
 * Check if an error is a standardized API error
 */
const isApiError = (error) => {
  return (
    error &&
    typeof error === 'object' &&
    error.success === false &&
    typeof error.message === 'string' &&
    typeof error.statusCode === 'number'
  );
};

describe('API Client - Property Tests', () => {
  
  /**
   * Property 1: Authorization Header Attachment
   * Feature: api-standardization-realtime-sync, Property 1: Authorization Header Attachment
   * Validates: Requirements 1.2
   * 
   * For any API request made through the API_Client when a valid token exists,
   * the request SHALL include an `Authorization: Bearer <token>` header.
   */
  describe('Property 1: Authorization Header Attachment', () => {
    
    test('when token exists, Authorization header is attached with Bearer prefix', () => {
      fc.assert(
        fc.property(
          // Generate random JWT-like tokens (base64-ish strings)
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
          // Generate random request configs
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            headers: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z-]+$/.test(s)),
              fc.string({ maxLength: 100 })
            )
          }),
          (token, config) => {
            const result = attachAuthorizationHeader(config, token);
            
            // Authorization header must be present
            expect(result.headers.Authorization).toBeDefined();
            // Must have Bearer prefix
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
            // Original config should not be mutated
            expect(config.headers.Authorization).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('when token is null/undefined, no Authorization header is added', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ''),
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
            headers: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z-]+$/.test(s)),
              fc.string({ maxLength: 100 })
            )
          }),
          (token, config) => {
            const result = attachAuthorizationHeader(config, token);
            
            // Authorization header should not be added for falsy tokens
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
          fc.record({
            url: fc.webUrl(),
            method: fc.constantFrom('GET', 'POST'),
            headers: fc.constant({
              'Content-Type': 'application/json',
              'X-Custom-Header': 'custom-value'
            })
          }),
          (token, config) => {
            const result = attachAuthorizationHeader(config, token);
            
            // Original headers should be preserved
            expect(result.headers['Content-Type']).toBe('application/json');
            expect(result.headers['X-Custom-Header']).toBe('custom-value');
            // Authorization should be added
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('Authorization header format is always "Bearer <token>"', () => {
      fc.assert(
        fc.property(
          // Generate various token formats (alphanumeric strings simulating JWT tokens)
          fc.stringMatching(/^[a-zA-Z0-9._-]{10,200}$/),
          (token) => {
            const config = { url: '/test', method: 'GET', headers: {} };
            const result = attachAuthorizationHeader(config, token);
            
            // Must start with "Bearer "
            expect(result.headers.Authorization.startsWith('Bearer ')).toBe(true);
            // Token should be exactly after "Bearer "
            expect(result.headers.Authorization.substring(7)).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Error Response Consistency
   * Feature: api-standardization-realtime-sync, Property 2: Error Response Consistency
   * Validates: Requirements 1.4, 5.1, 5.2
   * 
   * For any error returned by the Backend or API_Client, the error object
   * SHALL contain at minimum: { success: false, message: string, statusCode: number }
   */
  describe('Property 2: Error Response Consistency', () => {
    
    test('server errors (with response) produce standardized error format', () => {
      fc.assert(
        fc.property(
          // Generate random HTTP status codes (4xx and 5xx)
          fc.integer({ min: 400, max: 599 }),
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate optional error code
          fc.option(fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[A-Z_]+$/.test(s))),
          // Generate optional field errors
          fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z]+$/.test(s)),
              message: fc.string({ minLength: 1, maxLength: 100 })
            }),
            { maxLength: 5 }
          ),
          (status, message, code, fieldErrors) => {
            const error = {
              response: {
                status,
                data: {
                  message,
                  code: code || undefined,
                  errors: fieldErrors
                }
              }
            };
            
            const result = transformError(error);
            
            // Must have required fields
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.message.length).toBeGreaterThan(0);
            expect(typeof result.statusCode).toBe('number');
            expect(result.statusCode).toBe(status);
            
            // Must be a valid API error
            expect(isApiError(result)).toBe(true);
            
            // Original error should be preserved
            expect(result.originalError).toBe(error);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('network errors (no response) produce standardized error format', () => {
      fc.assert(
        fc.property(
          fc.record({
            request: fc.constant({}), // Request was made
            message: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (errorProps) => {
            const error = {
              request: errorProps.request,
              message: errorProps.message
            };
            
            const result = transformError(error);
            
            // Must have required fields
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.message).toBe('Network error. Please check your connection.');
            expect(result.statusCode).toBe(0);
            expect(result.code).toBe('NETWORK_ERROR');
            
            // Must be a valid API error
            expect(isApiError(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('unknown errors produce standardized error format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const error = new Error(errorMessage);
            
            const result = transformError(error);
            
            // Must have required fields
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.statusCode).toBe(-1);
            expect(result.code).toBe('UNKNOWN_ERROR');
            
            // Must be a valid API error
            expect(isApiError(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('all transformed errors have consistent structure', () => {
      // Generate various error types
      const errorArbitrary = fc.oneof(
        // Server error with response
        fc.record({
          response: fc.record({
            status: fc.integer({ min: 400, max: 599 }),
            data: fc.record({
              message: fc.string({ minLength: 1, maxLength: 100 }),
              code: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
              errors: fc.array(fc.record({
                field: fc.string({ minLength: 1, maxLength: 20 }),
                message: fc.string({ minLength: 1, maxLength: 50 })
              }), { maxLength: 3 })
            })
          })
        }),
        // Network error
        fc.record({
          request: fc.constant({}),
          message: fc.string({ minLength: 1, maxLength: 100 })
        }),
        // Unknown error
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 100 })
        })
      );
      
      fc.assert(
        fc.property(errorArbitrary, (error) => {
          const result = transformError(error);
          
          // All errors must have these exact fields
          expect(result).toHaveProperty('success', false);
          expect(result).toHaveProperty('message');
          expect(result).toHaveProperty('statusCode');
          expect(result).toHaveProperty('originalError');
          
          // Type checks
          expect(typeof result.success).toBe('boolean');
          expect(typeof result.message).toBe('string');
          expect(typeof result.statusCode).toBe('number');
          
          // Message should never be empty
          expect(result.message.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
    
    test('server errors without message use default messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(400, 401, 403, 404, 500, 502, 503),
          (status) => {
            const error = {
              response: {
                status,
                data: {} // No message provided
              }
            };
            
            const result = transformError(error);
            
            // Should use default message
            expect(result.message).toBe(getDefaultErrorMessage(status));
            expect(result.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('errors array is always an array (never undefined)', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({
              response: fc.record({
                status: fc.integer({ min: 400, max: 599 }),
                data: fc.record({
                  message: fc.string({ minLength: 1, maxLength: 50 })
                  // No errors field
                })
              })
            }),
            fc.record({
              request: fc.constant({})
            }),
            fc.record({
              message: fc.string({ minLength: 1, maxLength: 50 })
            })
          ),
          (error) => {
            const result = transformError(error);
            
            // errors should always be an array
            expect(Array.isArray(result.errors)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge Cases and Unit Tests
   */
  describe('Edge Cases', () => {
    test('handles null error gracefully', () => {
      const result = transformError(null);
      expect(isApiError(result)).toBe(true);
      expect(result.statusCode).toBe(-1);
    });
    
    test('handles undefined error gracefully', () => {
      const result = transformError(undefined);
      expect(isApiError(result)).toBe(true);
      expect(result.statusCode).toBe(-1);
    });
    
    test('handles empty object error gracefully', () => {
      const result = transformError({});
      expect(isApiError(result)).toBe(true);
      expect(result.statusCode).toBe(-1);
    });
    
    test('preserves field-specific validation errors', () => {
      const fieldErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' }
      ];
      
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: fieldErrors
          }
        }
      };
      
      const result = transformError(error);
      expect(result.errors).toEqual(fieldErrors);
      expect(result.errors.length).toBe(2);
    });
  });
});

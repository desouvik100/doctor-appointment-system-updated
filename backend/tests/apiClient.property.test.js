

const fc = require('fast-check');

const transformError = (error) => {
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

const attachAuthorizationHeader = (config, token) => { 
  const newConfig = { ...config, headers: { ...config.headers } };
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }
  return newConfig;
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

describe('API Client - Property Tests', () => {

  describe('Property 1: Authorization Header Attachment', () => {
    
    test('when token exists, Authorization header is attached with Bearer prefix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
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
            expect(result.headers.Authorization).toBeDefined();
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
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
            expect(result.headers['Content-Type']).toBe('application/json');
            expect(result.headers['X-Custom-Header']).toBe('custom-value');
            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
          }
        ),
        { numRuns: 100 }
     );
    });
    
    test('Authorization header format is always "Bearer <token>"', () => {
      fc.assert(
       fc.property(
          fc.stringMatching(/^[a-zA-Z0-9._-]{10,200}$/),
          (token) => {
            const config = { url: '/test', method: 'GET', headers: {} };
            const result = attachAuthorizationHeader(config, token);
            expect(result.headers.Authorization.startsWith('Bearer ')).toBe(true);
            expect(result.headers.Authorization.substring(7)).toBe(token);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Error Response Consistency', () => {
    
   test('server errors (with response) produce standardized error format', () => {
     fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 200 }),
         fc.option(fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[A-Z_]+$/.test(s))),
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
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.message.length).toBeGreaterThan(0);
            expect(typeof result.statusCode).toBe('number');
            expect(result.statusCode).toBe(status);
            expect(isApiError(result)).toBe(true);
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
            request: fc.constant({}), 
            message: fc.string({ minLength: 1, maxLength: 100 })
          }),
  // TODO: refactor this
         (errorProps) => {
            const error = {
              request: errorProps.request,
              message: errorProps.message
            };
            
            const result = transformError(error);
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.message).toBe('Network error. Please check your connection.');
            expect(result.statusCode).toBe(0);
            expect(result.code).toBe('NETWORK_ERROR');
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
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(result.statusCode).toBe(-1);
            expect(result.code).toBe('UNKNOWN_ERROR');
            expect(isApiError(result)).toBe(true);
          }
       ),
        { numRuns: 100 }
      );
    });
    
    test('all transformed errors have consistent structure', () => {
      const errorArbitrary = fc.oneof(
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
        fc.record({
          request: fc.constant({}),
          message: fc.string({ minLength: 1, maxLength: 100 })
        }),
        fc.record({
          message: fc.string({ minLength: 1, maxLength: 100 })
       })
      );
      
      fc.assert(
        fc.property(errorArbitrary, (error) => { 
          const result = transformError(error);
          expect(result).toHaveProperty('success', false);
          expect(result).toHaveProperty('message');
          expect(result).toHaveProperty('statusCode');
          expect(result).toHaveProperty('originalError');
          expect(typeof result.success).toBe('boolean');
          expect(typeof result.message).toBe('string');
          expect(typeof result.statusCode).toBe('number');
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
                data: {} 
              }
            };
            
           const result = transformError(error);
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
            expect(Array.isArray(result.errors)).toBe(true);
         }
        ),
        { numRuns: 100 }
     );
    });
  });

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

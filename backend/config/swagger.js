/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HealthSync API',
      version: '1.0.0',
      description: 'API documentation for HealthSync healthcare platform - A comprehensive doctor appointment and healthcare management system',
      contact: {
        name: 'HealthSync Support',
        email: 'support@healthsyncpro.in'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Doctors', description: 'Doctor management' },
      { name: 'Appointments', description: 'Appointment booking and management' },
      { name: 'Wallet', description: 'Wallet and transactions' },
      { name: 'Prescriptions', description: 'Prescription management' },
      { name: 'Notifications', description: 'Push notifications' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        // Error Responses
        Error400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Error401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Authentication required' }
          }
        },
        Error403: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Access denied' },
            suspended: { type: 'boolean' },
            reason: { type: 'string' }
          }
        },
        Error404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Resource not found' }
          }
        },
        Error500: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Internal server error' },
            error: { type: 'string' }
          }
        },
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'User ID' },
            name: { type: 'string', description: 'Full name' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'admin', 'receptionist'] },
            profilePhoto: { type: 'string', nullable: true },
            clinicId: { type: 'string', nullable: true },
            locationCaptured: { type: 'boolean' }
          }
        },
        // Auth Responses
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT access token' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            loyaltyBonus: { type: 'number', nullable: true }
          }
        },
        OTPResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, options };

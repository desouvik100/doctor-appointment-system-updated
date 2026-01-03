# Design Document

## Overview

This design implements a standardized API architecture for the HealthSync application, ensuring both web (React) and mobile (React Native) applications communicate with a single backend using identical API contracts. The system includes real-time synchronization via Socket.IO and comprehensive API documentation via Swagger/OpenAPI.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React Web     │     │  React Native   │
│   Application   │     │  Mobile App     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │  Same API Contract    │
         │  Same Auth Token      │
         ▼                       ▼
┌─────────────────────────────────────────┐
│           API Client Layer              │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ REST Client │  │ Socket.IO Client│   │
│  │  (Axios)    │  │  (Real-time)    │   │
│  └─────────────┘  └─────────────────┘   │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Backend (Express.js)            │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ REST API    │  │ Socket.IO Server│   │
│  │ Routes      │  │ (Real-time)     │   │
│  └─────────────┘  └─────────────────┘   │
│  ┌─────────────────────────────────┐    │
│  │     Swagger/OpenAPI Docs        │    │
│  └─────────────────────────────────┘    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│            MongoDB Database             │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Mobile API Service Layer

```
mobile/src/services/api/
├── apiClient.js          # Centralized Axios instance
├── socketManager.js      # Socket.IO client manager
├── index.js              # Export all services
├── authService.js        # Authentication APIs
├── appointmentService.js # Appointment APIs
├── doctorService.js      # Doctor APIs
├── patientService.js     # Patient APIs
├── walletService.js      # Wallet APIs
├── familyService.js      # Family member APIs
├── healthRecordService.js# Health records APIs
├── imagingService.js     # Medical imaging APIs
├── prescriptionService.js# Prescription APIs
├── notificationService.js# Notification APIs
└── insuranceService.js   # Insurance APIs
```

### 2. API Client Interface

```javascript
// apiClient.js
const apiClient = {
  baseURL: string,           // From config/env.js
  timeout: number,           // From config/env.js
  
  // Interceptors
  requestInterceptor: (config) => config,  // Adds Authorization header
  responseInterceptor: (response) => response,
  errorInterceptor: (error) => standardizedError,
  
  // Methods
  get: (url, config?) => Promise<Response>,
  post: (url, data, config?) => Promise<Response>,
  put: (url, data, config?) => Promise<Response>,
  patch: (url, data, config?) => Promise<Response>,
  delete: (url, config?) => Promise<Response>,
}
```

### 3. Socket Manager Interface

```javascript
// socketManager.js
const socketManager = {
  socket: Socket | null,
  isConnected: boolean,
  reconnectAttempts: number,
  
  // Methods
  connect: (token: string) => void,
  disconnect: () => void,
  subscribe: (event: string, callback: Function) => void,
  unsubscribe: (event: string) => void,
  joinRoom: (roomId: string) => void,
  leaveRoom: (roomId: string) => void,
  emit: (event: string, data: any) => void,
}
```

### 4. Backend Socket.IO Events

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `appointment:created` | Server → Client | `{ appointment, userId }` | New appointment created |
| `appointment:updated` | Server → Client | `{ appointment, userId }` | Appointment modified |
| `appointment:cancelled` | Server → Client | `{ appointmentId, userId }` | Appointment cancelled |
| `wallet:transaction` | Server → Client | `{ transaction, balance }` | Wallet balance changed |
| `prescription:created` | Server → Client | `{ prescription, patientId }` | New prescription |
| `prescription:updated` | Server → Client | `{ prescription, patientId }` | Prescription modified |
| `notification:new` | Server → Client | `{ notification }` | New notification |
| `queue:updated` | Server → Client | `{ queueData, clinicId }` | Queue position changed |

### 5. Swagger/OpenAPI Configuration

```javascript
// backend/config/swagger.js
const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'HealthSync API',
    version: '1.0.0',
    description: 'API documentation for HealthSync healthcare platform'
  },
  servers: [
    { url: '/api', description: 'API Server' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Appointments', description: 'Appointment management' },
    { name: 'Doctors', description: 'Doctor information' },
    { name: 'Patients', description: 'Patient management' },
    { name: 'Wallet', description: 'Wallet and payments' },
    { name: 'Prescriptions', description: 'Prescription management' },
    { name: 'Imaging', description: 'Medical imaging' },
    // ... more tags
  ]
}
```

## Data Models

### Standardized API Response

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### Standardized Error Response

```typescript
interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: {
    field: string;
    message: string;
  }[];
  statusCode: number;
}
```

### Socket Event Payload

```typescript
interface SocketEvent<T> {
  event: string;
  data: T;
  timestamp: string;
  userId?: string;
  clinicId?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authorization Header Attachment

*For any* API request made through the API_Client when a valid token exists in storage, the request SHALL include an `Authorization: Bearer <token>` header.

**Validates: Requirements 1.2**

### Property 2: Error Response Consistency

*For any* error returned by the Backend or API_Client, the error object SHALL contain at minimum: `{ success: false, message: string, statusCode: number }`.

**Validates: Requirements 1.4, 5.1, 5.2**

### Property 3: API Endpoint Parity

*For any* API service function in the Mobile_App, there SHALL exist an equivalent function in the Web_App calling the same endpoint path with the same HTTP method.

**Validates: Requirements 1.5, 4.1**

### Property 4: Socket Event Emission on Mutation

*For any* successful create, update, or delete operation on appointments, wallet transactions, or prescriptions, the Backend SHALL emit a corresponding socket event to the affected user(s).

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 5: Client State Update on Socket Event

*For any* socket event received by a connected client (web or mobile), the client's local state SHALL be updated to reflect the new data without requiring a manual refresh action.

**Validates: Requirements 2.6, 2.7**

### Property 6: OpenAPI Schema Completeness

*For any* API endpoint defined in the Backend routes, the OpenAPI specification SHALL include: HTTP method, path, request body schema (if applicable), response schema, and authentication requirements.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 7: Request Payload Consistency

*For any* API request, the Mobile_App and Web_App SHALL send payloads with identical structure and field names for the same endpoint.

**Validates: Requirements 4.2, 4.3**

### Property 8: Validation Error Field Specificity

*For any* validation error (400 status), the Backend response SHALL include field-specific error messages identifying which fields failed validation.

**Validates: Requirements 5.4**

## Error Handling

### API Client Error Handling

```javascript
// Error transformation in apiClient.js
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return {
      success: false,
      message: error.response.data?.message || 'Server error',
      statusCode: error.response.status,
      errors: error.response.data?.errors || [],
      originalError: error
    };
  }
  
  if (error.request) {
    // Network error
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      originalError: error
    };
  }
  
  // Unknown error
  return {
    success: false,
    message: 'An unexpected error occurred.',
    statusCode: -1,
    originalError: error
  };
};
```

### Socket Reconnection Strategy

```javascript
// Exponential backoff for reconnection
const reconnectConfig = {
  maxAttempts: 10,
  initialDelay: 1000,      // 1 second
  maxDelay: 30000,         // 30 seconds
  multiplier: 2,
  
  getDelay: (attempt) => {
    const delay = initialDelay * Math.pow(multiplier, attempt);
    return Math.min(delay, maxDelay);
  }
};
```

## Testing Strategy

### Unit Tests

1. **API Client Tests**
   - Test Authorization header is attached when token exists
   - Test error transformation produces consistent format
   - Test token refresh on 401 response

2. **Socket Manager Tests**
   - Test connection establishment with valid token
   - Test reconnection with exponential backoff
   - Test room subscription/unsubscription

3. **API Service Tests**
   - Test each service function calls correct endpoint
   - Test request payload format matches specification

### Property-Based Tests

Property-based testing will be implemented using **fast-check** for JavaScript/TypeScript.

Each property test must run minimum 100 iterations and be tagged with:
`**Feature: api-standardization-realtime-sync, Property {number}: {property_text}**`

1. **Property 1 Test**: Generate random API requests, verify Authorization header presence
2. **Property 2 Test**: Generate random error scenarios, verify error object structure
3. **Property 3 Test**: Compare mobile and web service functions, verify endpoint parity
4. **Property 4 Test**: Generate random mutations, verify socket events are emitted
5. **Property 5 Test**: Generate random socket events, verify client state updates
6. **Property 6 Test**: Compare routes to OpenAPI spec, verify completeness
7. **Property 7 Test**: Generate random payloads, verify structure consistency
8. **Property 8 Test**: Generate invalid payloads, verify field-specific errors

### Integration Tests

1. **End-to-End API Flow**
   - Test complete authentication flow
   - Test appointment CRUD with socket events
   - Test wallet transaction with balance update

2. **Real-Time Sync Tests**
   - Test web creates appointment → mobile receives event
   - Test mobile updates wallet → web receives event

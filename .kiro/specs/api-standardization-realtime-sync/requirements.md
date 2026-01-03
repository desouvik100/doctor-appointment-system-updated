# Requirements Document

## Introduction

This specification covers three interconnected features to standardize the API architecture across web and mobile applications, add real-time synchronization capabilities, and generate comprehensive API documentation. The goal is to ensure both applications (React Web and React Native Mobile) communicate with a single backend using identical API contracts, with optional real-time updates via WebSocket.

## Glossary

- **API_Client**: The centralized HTTP client (Axios instance) used for all API requests
- **API_Service**: A module containing functions for a specific domain (e.g., appointmentService, walletService)
- **Backend**: The Node.js/Express server that serves as the single source of truth
- **Socket_Manager**: The WebSocket client manager for real-time communication
- **OpenAPI_Spec**: The Swagger/OpenAPI 3.0 specification document describing all API endpoints

## Requirements

### Requirement 1: Standardize Mobile API Layer

**User Story:** As a developer, I want a consistent API layer structure in the mobile app that mirrors the web app, so that both applications use identical API contracts and are easier to maintain.

#### Acceptance Criteria

1. THE API_Client SHALL use a centralized configuration from `config/env.js` for base URL and timeout
2. WHEN an API_Service function is called, THE API_Client SHALL automatically attach the Authorization header with the JWT token
3. THE Mobile_App SHALL have dedicated API service files for each domain: auth, appointments, doctors, patients, wallet, family, health-records, imaging, prescriptions, notifications
4. WHEN an API call fails, THE API_Client SHALL return a standardized error object with status code, message, and original error
5. THE API_Service functions SHALL match the exact endpoint paths used by the web application
6. WHEN the token expires (401 response), THE API_Client SHALL attempt to refresh the token automatically before failing
7. THE API_Service files SHALL export typed function signatures with JSDoc comments describing parameters and return types

### Requirement 2: Implement Real-Time Synchronization

**User Story:** As a user, I want changes made on the web app to appear instantly on my mobile app (and vice versa), so that I always see the latest data without manual refresh.

#### Acceptance Criteria

1. THE Backend SHALL implement Socket.IO server on the existing Express application
2. WHEN a user authenticates, THE Socket_Manager SHALL establish a WebSocket connection using the JWT token
3. WHEN an appointment is created, updated, or cancelled via API, THE Backend SHALL emit a socket event to relevant users
4. WHEN a wallet transaction occurs, THE Backend SHALL emit a socket event to the wallet owner
5. WHEN a prescription is created or updated, THE Backend SHALL emit a socket event to the patient
6. THE Mobile_App SHALL listen for socket events and update local state without requiring manual refresh
7. THE Web_App SHALL listen for socket events and update local state without requiring manual refresh
8. IF the WebSocket connection is lost, THEN THE Socket_Manager SHALL attempt reconnection with exponential backoff
9. WHILE the WebSocket is disconnected, THE App SHALL continue to function using REST API with pull-to-refresh
10. THE Socket_Manager SHALL support subscribing to specific rooms (e.g., clinic room, user room) for targeted updates

### Requirement 3: Generate API Documentation

**User Story:** As a developer, I want comprehensive API documentation in OpenAPI/Swagger format, so that I can understand all available endpoints, their parameters, and responses.

#### Acceptance Criteria

1. THE Backend SHALL serve Swagger UI at `/api/docs` endpoint
2. THE OpenAPI_Spec SHALL document all existing API routes with their HTTP methods, paths, and descriptions
3. THE OpenAPI_Spec SHALL include request body schemas for POST/PUT endpoints
4. THE OpenAPI_Spec SHALL include response schemas with example data
5. THE OpenAPI_Spec SHALL document authentication requirements (Bearer token) for protected endpoints
6. THE OpenAPI_Spec SHALL include error response schemas (400, 401, 403, 404, 500)
7. THE OpenAPI_Spec SHALL group endpoints by domain tags (Auth, Appointments, Doctors, Patients, Wallet, etc.)
8. WHEN the backend starts, THE Swagger documentation SHALL be auto-generated from route definitions
9. THE OpenAPI_Spec SHALL be exportable as JSON file at `/api/docs/json` for client code generation

### Requirement 4: API Contract Consistency

**User Story:** As a system architect, I want both web and mobile apps to use identical API contracts, so that there is no divergence in functionality between platforms.

#### Acceptance Criteria

1. THE Mobile_App API services SHALL call the exact same endpoints as the Web_App
2. THE Mobile_App SHALL send request payloads in the same format as the Web_App
3. THE Mobile_App SHALL handle response data in the same format as the Web_App
4. WHEN a new API endpoint is added to the backend, THE OpenAPI_Spec SHALL be updated to reflect the change
5. THE Backend SHALL NOT have mobile-only or web-only endpoints (all endpoints work for both)
6. THE Backend SHALL validate requests identically regardless of client platform

### Requirement 5: Error Handling Consistency

**User Story:** As a developer, I want consistent error handling across web and mobile, so that users see the same error messages and the apps behave predictably.

#### Acceptance Criteria

1. WHEN the Backend returns an error, THE response SHALL include a standardized structure: `{ success: false, message: string, code?: string }`
2. THE API_Client SHALL transform all errors into a consistent format before returning to the caller
3. WHEN a network error occurs, THE API_Client SHALL return a user-friendly message without exposing technical details
4. WHEN a validation error (400) occurs, THE Backend SHALL return field-specific error messages
5. THE Mobile_App and Web_App SHALL display error messages using the same text from the backend response

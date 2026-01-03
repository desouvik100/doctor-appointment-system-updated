# Implementation Plan: API Standardization, Real-Time Sync & Documentation

## Overview

This implementation plan covers three interconnected features: standardizing the mobile API layer, implementing Socket.IO for real-time sync, and generating Swagger/OpenAPI documentation. Tasks are ordered to build incrementally with dependencies resolved.

## Tasks

- [x] 1. Standardize Mobile API Client
  - [x] 1.1 Refactor apiClient.js with enhanced error handling
    - Update interceptors to attach Authorization header automatically
    - Implement standardized error transformation
    - Add token refresh logic on 401 responses
    - _Requirements: 1.2, 1.4, 1.6_
  - [ ]* 1.2 Write property test for Authorization header attachment
    - **Property 1: Authorization Header Attachment**
    - **Validates: Requirements 1.2**
  - [ ]* 1.3 Write property test for error response consistency
    - **Property 2: Error Response Consistency**
    - **Validates: Requirements 1.4, 5.1, 5.2**

- [x] 2. Create Missing Mobile API Services
  - [x] 2.1 Create imagingService.js
    - Implement functions matching backend imaging routes
    - Add JSDoc comments for all functions
    - _Requirements: 1.3, 1.7_
  - [x] 2.2 Create prescriptionService.js
    - Implement functions matching backend prescription routes
    - Add JSDoc comments for all functions
    - _Requirements: 1.3, 1.7_
  - [x] 2.3 Create insuranceService.js
    - Implement functions matching backend insurance routes
    - Add JSDoc comments for all functions
    - _Requirements: 1.3, 1.7_
  - [x] 2.4 Create notificationService.js
    - Implement functions matching backend notification routes
    - Add JSDoc comments for all functions
    - _Requirements: 1.3, 1.7_
  - [x] 2.5 Update services/api/index.js to export all services
    - Export all API services from single entry point
    - _Requirements: 1.3_

- [x] 3. Checkpoint - Verify API Services
  - Ensure all API services are created and exported
  - Verify JSDoc comments are present
  - Ask the user if questions arise

- [x] 4. Implement Backend Socket.IO Server
  - [x] 4.1 Install and configure Socket.IO on backend
    - Add socket.io dependency
    - Initialize Socket.IO with Express server
    - Configure CORS for web and mobile clients
    - _Requirements: 2.1_
  - [x] 4.2 Create socketManager.js for backend
    - Implement authentication middleware for socket connections
    - Implement room management (user rooms, clinic rooms)
    - _Requirements: 2.2, 2.10_
  - [x] 4.3 Add socket event emission to appointment routes
    - Emit `appointment:created` on POST /appointments
    - Emit `appointment:updated` on PUT /appointments/:id
    - Emit `appointment:cancelled` on DELETE /appointments/:id
    - _Requirements: 2.3_
  - [x] 4.4 Add socket event emission to wallet routes
    - Emit `wallet:transaction` on balance changes
    - _Requirements: 2.4_
  - [x] 4.5 Add socket event emission to prescription routes
    - Emit `prescription:created` on POST /prescriptions
    - Emit `prescription:updated` on PUT /prescriptions/:id
    - _Requirements: 2.5_
  - [ ]* 4.6 Write property test for socket event emission
    - **Property 4: Socket Event Emission on Mutation**
    - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 5. Implement Mobile Socket Client
  - [x] 5.1 Create socketManager.js for mobile
    - Implement connection with JWT authentication
    - Implement exponential backoff reconnection
    - Implement room subscription methods
    - _Requirements: 2.2, 2.8, 2.10_
  - [x] 5.2 Create SocketContext for React Native
    - Create context provider for socket state
    - Expose connection status and methods
    - _Requirements: 2.6_
  - [x] 5.3 Integrate socket events with mobile screens
    - Update HomeScreen to listen for appointment events
    - Update WalletScreen to listen for transaction events
    - _Requirements: 2.6, 2.9_
  - [ ]* 5.4 Write property test for client state update on socket event
    - **Property 5: Client State Update on Socket Event**
    - **Validates: Requirements 2.6, 2.7**

- [x] 6. Checkpoint - Verify Real-Time Sync
  - Test socket connection from mobile
  - Test event emission and reception
  - Ask the user if questions arise

- [x] 7. Implement Swagger/OpenAPI Documentation
  - [x] 7.1 Install and configure swagger-jsdoc and swagger-ui-express
    - Add dependencies to backend
    - Create swagger config file
    - Mount Swagger UI at /api/docs
    - _Requirements: 3.1, 3.8_
  - [x] 7.2 Add JSDoc annotations to auth routes
    - Document all auth endpoints with OpenAPI comments
    - Include request/response schemas
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 7.3 Add JSDoc annotations to appointment routes
    - Document all appointment endpoints
    - Include request/response schemas
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 7.4 Add JSDoc annotations to doctor routes
    - Document all doctor endpoints
    - Include request/response schemas
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 7.5 Add JSDoc annotations to wallet routes
    - Document all wallet endpoints
    - Include request/response schemas
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 7.6 Add JSDoc annotations to remaining core routes
    - Document patient, prescription, imaging, family routes
    - Include request/response schemas
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 7.7 Add error response schemas to swagger config
    - Define 400, 401, 403, 404, 500 error schemas
    - Apply to all endpoints
    - _Requirements: 3.6_
  - [x] 7.8 Add JSON export endpoint
    - Create /api/docs/json endpoint
    - Return OpenAPI spec as JSON
    - _Requirements: 3.9_
  - [ ]* 7.9 Write property test for OpenAPI schema completeness
    - **Property 6: OpenAPI Schema Completeness**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 8. Ensure API Contract Consistency
  - [x] 8.1 Audit mobile API services against web API calls
    - Compare endpoint paths between mobile and web
    - Document any discrepancies
    - _Requirements: 4.1, 4.5_
  - [x] 8.2 Fix any endpoint mismatches in mobile services
    - Update mobile services to match web exactly
    - _Requirements: 1.5, 4.1_
  - [ ]* 8.3 Write property test for request payload consistency
    - **Property 7: Request Payload Consistency**
    - **Validates: Requirements 4.2, 4.3**

- [x] 9. Standardize Backend Error Responses
  - [x] 9.1 Create error middleware for consistent error format
    - Implement global error handler
    - Ensure all errors return standardized structure
    - _Requirements: 5.1_
  - [x] 9.2 Update validation errors to include field-specific messages
    - Modify validation middleware to return field errors
    - _Requirements: 5.4_
  - [ ]* 9.3 Write property test for validation error field specificity
    - **Property 8: Validation Error Field Specificity**
    - **Validates: Requirements 5.4**

- [x] 10. Final Checkpoint - Integration Testing
  - Run all property tests
  - Test end-to-end flow: web creates appointment → mobile receives event
  - Verify Swagger docs are accessible at /api/docs
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library with minimum 100 iterations
- Socket.IO events follow the naming convention: `{entity}:{action}`

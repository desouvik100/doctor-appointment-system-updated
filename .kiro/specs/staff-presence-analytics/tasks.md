# Implementation Plan: Staff Presence Analytics

## Overview

This implementation plan breaks down the staff presence analytics feature into incremental coding tasks. We'll start with backend data models and APIs, then build the frontend components, and finally add analytics calculations and visualizations.

## Tasks

- [x] 1. Create AttendanceRecord model and update BranchStaff model
  - [x] 1.1 Create AttendanceRecord MongoDB schema with indexes
    - Create `backend/models/AttendanceRecord.js`
    - Define schema with staffId, userId, organizationId, branchId, eventType, timestamp, shiftDuration, checkInTime, customStatus, source fields
    - Add indexes for efficient querying (staffId+timestamp, organizationId+timestamp, branchId+timestamp)
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 1.2 Update BranchStaff model with custom status fields
    - Add customStatus enum field (available, with_patient, in_surgery, on_break, in_meeting, unavailable)
    - Add customStatusText field (max 50 chars)
    - Add scheduledStartTime and scheduledEndTime fields
    - _Requirements: 2.1, 6.5, 6.6_
  - [x] 1.3 Write property test for attendance record completeness
    - **Property 6: Attendance Record Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 2. Implement attendance tracking API endpoints
  - [x] 2.1 Update check-in endpoint to create AttendanceRecord
    - Modify `/api/branch-staff/check-in` to create attendance record
    - Include all required fields (staffId, userId, orgId, branchId, timestamp, customStatus)
    - _Requirements: 5.1_
  - [x] 2.2 Update check-out endpoint to create AttendanceRecord with duration
    - Modify `/api/branch-staff/check-out` to create attendance record
    - Find paired check-in and calculate shiftDuration
    - Clear customStatus on checkout
    - _Requirements: 5.2, 2.4_
  - [x] 2.3 Write property test for shift duration calculation
    - **Property 7: Shift Duration Calculation**
    - **Validates: Requirements 5.2**
  - [x] 2.4 Write property test for checkout clears status
    - **Property 4: Checkout Clears Custom Status**
    - **Validates: Requirements 2.4**

- [x] 3. Implement custom status API
  - [x] 3.1 Create POST /api/branch-staff/status endpoint
    - Accept status enum and optional statusText
    - Update BranchStaff record
    - Return updated staff object
    - _Requirements: 2.2, 2.3_
  - [x] 3.2 Update presence endpoint to include custom status
    - Modify GET `/api/branch-staff/presence/:orgId` to return customStatus and customStatusText
    - _Requirements: 2.3_

- [x] 4. Implement presence filtering API
  - [x] 4.1 Add query parameter support to presence endpoint
    - Add role, branchId, department, status query params to GET `/api/branch-staff/presence/:orgId`
    - Implement filter logic in query
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 4.2 Write property test for filter correctness
    - **Property 1: Filter by Attribute Correctness**
    - **Property 2: Combined Filter AND Logic**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 5. Checkpoint - Backend presence APIs complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement attendance history API
  - [x] 6.1 Create GET /api/branch-staff/attendance/:orgId endpoint
    - Accept startDate, endDate, staffId, branchId query params
    - Return paginated attendance records
    - _Requirements: 5.4_
  - [x] 6.2 Write property test for date range filtering
    - **Property 8: Date Range Query Filtering**
    - **Validates: Requirements 5.4**

- [x] 7. Implement analytics calculation service
  - [x] 7.1 Create AttendanceAnalyticsService class
    - Create `backend/services/attendanceAnalytics.js`
    - Implement getAverageTimings method
    - Implement getHoursWorked method
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 7.2 Implement late/early detection methods
    - Add getLateArrivals method (compare check-in to scheduledStartTime)
    - Add getEarlyDepartures method (compare check-out to scheduledEndTime)
    - _Requirements: 6.5, 6.6_
  - [x] 7.3 Implement overtime calculation methods
    - Add getOvertimeReport method
    - Calculate overtime as hours beyond standard shift
    - _Requirements: 8.1, 8.2_
  - [x] 7.4 Write property tests for analytics calculations
    - **Property 9: Average Time Calculation**
    - **Property 10: Total Hours Aggregation**
    - **Property 11: Schedule Deviation Detection**
    - **Property 14: Overtime Calculation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6, 8.1, 8.2**

- [x] 8. Implement branch comparison analytics
  - [x] 8.1 Add getBranchComparison method to analytics service
    - Calculate staff count per branch
    - Calculate average hours per branch
    - Calculate peak staffing hours per branch
    - Implement normalization by branch size
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 8.2 Write property tests for branch analytics
    - **Property 12: Branch Aggregation Correctness**
    - **Property 13: Branch Normalization**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 9. Implement pattern detection and export
  - [x] 9.1 Add pattern detection method
    - Detect consecutive late arrivals
    - Detect consecutive early departures
    - Flag staff exceeding overtime threshold
    - _Requirements: 8.3, 8.4_
  - [x] 9.2 Add CSV export method
    - Generate CSV with attendance data
    - Include all relevant columns (name, date, times, duration, flags)
    - _Requirements: 8.6_
  - [x] 9.3 Write property tests for pattern detection and export
    - **Property 15: Overtime Threshold Highlighting**
    - **Property 16: Pattern Detection for Late Arrivals**
    - **Property 17: CSV Export Completeness**
    - **Validates: Requirements 8.3, 8.4, 8.6**

- [x] 10. Create analytics API endpoint
  - [x] 10.1 Create GET /api/branch-staff/analytics/:orgId endpoint
    - Accept startDate, endDate, groupBy query params
    - Return computed analytics from service
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 7.1, 7.2, 7.3_
  - [x] 10.2 Create GET /api/branch-staff/analytics/:orgId/export endpoint
    - Accept format (csv), startDate, endDate params
    - Return downloadable CSV file
    - _Requirements: 8.6_

- [x] 11. Checkpoint - Backend analytics complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Enhance presence widget with filtering UI
  - [x] 12.1 Add filter panel component to presence widget
    - Create collapsible filter panel
    - Add role dropdown filter
    - Add branch dropdown filter
    - Add department dropdown filter
    - Add status filter
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 12.2 Implement filter state management and API integration
    - Add filter state to component
    - Pass filters as query params to presence API
    - Update staff list when filters change
    - Add clear filters button
    - _Requirements: 1.5, 1.6_
  - [x] 12.3 Write property test for filter clear round-trip
    - **Property 3: Filter Clear Round-Trip**
    - **Validates: Requirements 1.6**

- [x] 13. Implement filter presets
  - [x] 13.1 Add preset save/load functionality
    - Create useFilterPresets hook
    - Save presets to localStorage
    - Load presets from localStorage
    - Add preset selector dropdown
    - Add save preset button with name input
    - Add delete preset functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 13.2 Write property test for preset round-trip
    - **Property 5: Preset Save-Load Round-Trip**
    - **Validates: Requirements 3.2**
  - [x] 13.3 Handle edge cases for presets
    - Gracefully handle deleted branches/roles in presets
    - _Requirements: 3.5_

- [x] 14. Add custom status UI to presence widget
  - [x] 14.1 Display custom status in staff cards
    - Show status badge/text alongside staff name
    - Use color coding for different statuses
    - _Requirements: 2.3_
  - [x] 14.2 Add status selector for current user
    - Add status dropdown in widget header (for logged-in staff)
    - Call status API on selection
    - _Requirements: 2.1, 2.2_

- [x] 15. Implement presence notifications
  - [x] 15.1 Create usePresenceNotifications hook
    - Track watched staff IDs in localStorage
    - Compare current vs previous presence state
    - Trigger toast notifications on check-in/out of watched staff
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 15.2 Add notification preferences UI
    - Add watch/unwatch button to staff cards
    - Add notification settings (sound on/off, event types)
    - Persist preferences to localStorage
    - _Requirements: 4.4, 4.5_

- [x] 16. Checkpoint - Enhanced presence widget complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Create analytics dashboard component
  - [x] 17.1 Create StaffAnalyticsSection component structure
    - Create `frontend/src/components/emr/StaffAnalyticsSection.js`
    - Add to EMR index exports
    - Add date range picker
    - Add branch selector
    - Add export button
    - _Requirements: 6.7, 8.6_
  - [x] 17.2 Implement metric cards
    - Display average check-in time
    - Display average check-out time
    - Display total hours worked
    - Display overtime hours
    - _Requirements: 6.1, 6.2, 6.3, 8.2_

- [x] 18. Implement analytics charts
  - [x] 18.1 Add attendance trend line chart
    - Show daily/weekly attendance over time
    - Use recharts or chart.js library
    - _Requirements: 6.4_
  - [x] 18.2 Add hours worked bar chart
    - Show hours per staff member
    - Highlight overtime in different color
    - _Requirements: 6.3, 8.2_
  - [x] 18.3 Add branch comparison chart
    - Show staff count per branch
    - Show average hours per branch
    - _Requirements: 7.1, 7.2_
  - [x] 18.4 Add late arrivals/early departures chart
    - Show count of late/early events per staff
    - _Requirements: 6.5, 6.6_

- [x] 19. Implement staff analytics table
  - [x] 19.1 Create sortable/filterable staff table
    - Columns: name, avgCheckIn, avgCheckOut, hoursWorked, lateCount, overtimeHours
    - Add sorting by each column
    - Add search/filter functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 8.2_

- [x] 20. Implement alerts panel
  - [x] 20.1 Display detected patterns and alerts
    - Show excessive overtime alerts
    - Show consistent late arrival patterns
    - Show consistent early departure patterns
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 21. Add real-time updates and refresh
  - [x] 21.1 Implement auto-refresh for today's analytics
    - Poll for updates every 30 seconds when viewing today
    - Display "last updated" timestamp
    - Add manual refresh button
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 22. Implement mobile responsiveness
  - [x] 22.1 Add responsive styles for analytics dashboard
    - Single column layout below 768px
    - Scrollable charts on mobile
    - Prioritize metric cards over detailed charts
    - _Requirements: 10.1, 10.2, 10.4_
  - [x] 22.2 Ensure presence widget works on mobile
    - Test and fix any mobile layout issues
    - _Requirements: 10.3_

- [x] 23. Wire analytics section into clinic dashboard
  - [x] 23.1 Add analytics menu item and routing
    - Add "Staff Analytics" to EMR menu section
    - Render StaffAnalyticsSection when selected
    - _Requirements: 6.1-6.7, 7.1-7.5, 8.1-8.6_

- [x] 24. Final checkpoint - Feature complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Test end-to-end flow

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Use `fast-check` library for property-based testing in JavaScript

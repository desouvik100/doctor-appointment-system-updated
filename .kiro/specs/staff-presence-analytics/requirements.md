# Requirements Document

## Introduction

This feature enhances the existing real-time staff presence widget with customization options and comprehensive analytics on shift patterns. The system will allow clinic administrators to filter and customize the presence view, set custom statuses, configure notifications, and gain insights into staffing patterns through visual analytics dashboards.

## Glossary

- **Presence_Widget**: The floating UI component that displays real-time staff check-in/check-out status
- **Staff_Member**: Any user assigned to a clinic or branch (doctors, nurses, receptionists, etc.)
- **Check_In_Event**: A recorded event when a staff member starts their shift
- **Check_Out_Event**: A recorded event when a staff member ends their shift
- **Shift_Pattern**: The historical record of check-in/out times for analysis
- **Custom_Status**: User-defined status messages beyond simple "In/Out" (e.g., "In Surgery", "On Break")
- **Attendance_Analytics**: Statistical analysis and visualization of staffing patterns
- **Filter_Preset**: A saved combination of filter settings for quick access

## Requirements

### Requirement 1: Presence Widget Filtering

**User Story:** As a clinic administrator, I want to filter the presence widget by role, branch, or department, so that I can focus on specific staff groups.

#### Acceptance Criteria

1. WHEN the user clicks a filter button on the presence widget, THE Presence_Widget SHALL display filter options for role, branch, and department
2. WHEN the user selects a role filter, THE Presence_Widget SHALL display only Staff_Members with that role
3. WHEN the user selects a branch filter, THE Presence_Widget SHALL display only Staff_Members assigned to that branch
4. WHEN the user selects a department filter, THE Presence_Widget SHALL display only Staff_Members in that department
5. WHEN multiple filters are applied, THE Presence_Widget SHALL display Staff_Members matching ALL selected criteria
6. WHEN the user clears filters, THE Presence_Widget SHALL display all Staff_Members

### Requirement 2: Custom Status Messages

**User Story:** As a staff member, I want to set a custom status message, so that colleagues know my current activity beyond just "checked in".

#### Acceptance Criteria

1. THE System SHALL provide predefined status options: "Available", "With Patient", "In Surgery", "On Break", "In Meeting", "Unavailable"
2. WHEN a Staff_Member selects a custom status, THE System SHALL update their status in real-time across all presence widgets
3. WHEN a Staff_Member sets a custom status, THE Presence_Widget SHALL display the status text alongside their name
4. WHEN a Staff_Member checks out, THE System SHALL automatically clear their custom status
5. THE System SHALL allow administrators to configure custom status options for their organization

### Requirement 3: Filter Presets

**User Story:** As a clinic administrator, I want to save filter combinations as presets, so that I can quickly switch between different views.

#### Acceptance Criteria

1. WHEN the user clicks "Save Preset", THE System SHALL save the current filter combination with a user-provided name
2. WHEN the user selects a saved preset, THE Presence_Widget SHALL apply all filters from that preset
3. THE System SHALL allow users to delete saved presets
4. THE System SHALL persist presets across browser sessions using local storage
5. IF a preset references a deleted branch or role, THEN THE System SHALL gracefully handle the missing reference

### Requirement 4: Presence Notifications

**User Story:** As a clinic administrator, I want to receive notifications when key staff check in or out, so that I can be aware of important staffing changes.

#### Acceptance Criteria

1. THE System SHALL allow users to mark specific Staff_Members as "watched"
2. WHEN a watched Staff_Member checks in, THE System SHALL display a toast notification
3. WHEN a watched Staff_Member checks out, THE System SHALL display a toast notification
4. THE System SHALL allow users to configure notification preferences (sound on/off, which events to notify)
5. THE System SHALL persist notification preferences in local storage

### Requirement 5: Attendance History Tracking

**User Story:** As a clinic administrator, I want the system to track all check-in/out events, so that I can analyze attendance patterns over time.

#### Acceptance Criteria

1. WHEN a Staff_Member checks in, THE System SHALL record the timestamp, staff ID, branch ID, and status
2. WHEN a Staff_Member checks out, THE System SHALL record the timestamp and calculate shift duration
3. THE System SHALL store attendance history for at least 90 days
4. THE System SHALL provide an API endpoint to query attendance history with date range filters
5. WHEN storing attendance records, THE System SHALL include the custom status if one was set

### Requirement 6: Attendance Analytics Dashboard

**User Story:** As a clinic administrator, I want to view analytics on staffing patterns, so that I can optimize scheduling and identify issues.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display average check-in time per Staff_Member over a selected period
2. THE Analytics_Dashboard SHALL display average check-out time per Staff_Member over a selected period
3. THE Analytics_Dashboard SHALL display total hours worked per Staff_Member per week/month
4. THE Analytics_Dashboard SHALL visualize attendance trends using line charts
5. THE Analytics_Dashboard SHALL highlight late arrivals (check-ins after scheduled start time)
6. THE Analytics_Dashboard SHALL highlight early departures (check-outs before scheduled end time)
7. WHEN the user selects a date range, THE Analytics_Dashboard SHALL update all visualizations accordingly

### Requirement 7: Branch Staffing Comparison

**User Story:** As a multi-branch administrator, I want to compare staffing levels across branches, so that I can identify understaffed locations.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a comparison chart showing staff count per branch
2. THE Analytics_Dashboard SHALL display average hours worked per branch
3. THE Analytics_Dashboard SHALL display peak staffing hours per branch
4. WHEN comparing branches, THE System SHALL normalize data by branch size for fair comparison
5. THE Analytics_Dashboard SHALL allow filtering comparison by role type

### Requirement 8: Overtime and Pattern Detection

**User Story:** As a clinic administrator, I want to identify overtime patterns and anomalies, so that I can manage workload and compliance.

#### Acceptance Criteria

1. THE System SHALL calculate overtime hours (hours beyond standard shift length)
2. THE Analytics_Dashboard SHALL display total overtime hours per Staff_Member
3. THE Analytics_Dashboard SHALL highlight Staff_Members with excessive overtime (configurable threshold)
4. THE System SHALL detect patterns of consistent late arrivals or early departures
5. WHEN a pattern is detected, THE System SHALL flag it in the analytics view
6. THE Analytics_Dashboard SHALL provide exportable reports in CSV format

### Requirement 9: Real-time Analytics Updates

**User Story:** As a clinic administrator, I want analytics to reflect recent check-ins/outs, so that I have current information.

#### Acceptance Criteria

1. WHEN viewing today's analytics, THE System SHALL update data in real-time as check-in/out events occur
2. THE Analytics_Dashboard SHALL display a "last updated" timestamp
3. THE System SHALL provide a manual refresh button for analytics data
4. WHEN new attendance data is recorded, THE System SHALL recalculate relevant statistics within 30 seconds

### Requirement 10: Mobile-Responsive Analytics

**User Story:** As a clinic administrator using a mobile device, I want to view analytics on smaller screens, so that I can monitor staffing on the go.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL adapt layout for screens smaller than 768px width
2. WHEN viewed on mobile, THE System SHALL display charts in a scrollable single-column layout
3. THE Presence_Widget SHALL remain functional and readable on mobile devices
4. WHEN on mobile, THE System SHALL prioritize essential metrics over detailed charts

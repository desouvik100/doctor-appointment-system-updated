# Feature Parity Report — Queue System
**Date:** 2026-06-01 | **Method:** Static code analysis

## Summary

| Feature | Web (healthsync-pro) | Mobile | Backend | Socket | Gap |
|---------|---------------------|--------|---------|--------|-----|
| Live Queue Status | ✅ DoctorQueueScreen | ❌ No LiveQueueScreen | ✅ | ✅ | Mobile missing screen |
| Queue Position | ✅ | ⚠️ Static props only | ✅ `/queue/position/:id` | ✅ `QUEUE_POSITION_CHANGED` | Mobile not subscribing |
| Estimated Wait Time | ✅ | ⚠️ Fake simulation | ✅ `smartQueueService` | ✅ | Mobile using fake data |
| Real-time Queue Updates | ✅ | ❌ Polling simulation | ✅ | ✅ Events forwarded | Mobile not using sockets |
| Queue Notifications | ✅ | ❌ Not implemented | ✅ `queueNotificationService` | ✅ `QUEUE_YOUR_TURN` | Mobile not subscribing |
| Token Tracking | ✅ | ⚠️ Display only | ✅ `tokenService` | ✅ | Mobile not live |
| Queue History | ✅ | ⚠️ Via appointments list | ✅ | N/A | Acceptable |
| Smart Queue Calculations | ✅ | ❌ | ✅ `smartQueueService` | ✅ | Mobile not calling API |
| Queue Room Joining | ✅ | ❌ | ✅ `queue:${clinicId}:${doctorId}` | ✅ | Mobile never joins room |
| Home Dashboard Queue Card | ⚠️ | ⚠️ No live data | ✅ | ✅ | Both need live data |

## Root Cause
`QueueTracker.js` uses `setInterval` with `Math.random()` to simulate queue movement.
No socket subscriptions. No API calls. No room joining.

## Recommended Fix
1. Replace fake simulation in `QueueTracker` with real socket subscriptions
2. Add `useQueueTracker` hook that calls `/appointments/my-queue/:appointmentId`
3. Join `queue:${clinicId}:${doctorId}` room on appointment details open
4. Subscribe to `QUEUE_POSITION_CHANGED` and `QUEUE_YOUR_TURN` events
5. Add queue card to Home dashboard with live data
6. Add `LiveQueueScreen` for full queue status view

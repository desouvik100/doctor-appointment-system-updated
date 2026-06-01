# Queue Backend Audit
**Date:** 2026-06-01 | **Verdict:** Backend is complete. No new APIs needed.

## API Endpoints (all existing, reuse only)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/appointments/my-queue/:appointmentId` | GET | JWT | Get live queue status for a specific appointment |
| `/api/appointments/smart-queue/:doctorId/:date` | GET | None | Smart queue with predictions for a doctor/date |
| `/api/appointments/queue-info/:doctorId/:date` | GET | None | Basic queue count and estimated time |
| `/api/queue/position/:appointmentId` | GET | None | Simple queue position |
| `/api/appointments/:id/queue-position` | GET | JWT | Queue position via appointment ID |
| `/api/appointments/:id/notify-patient` | POST | JWT | Force send queue notification |

## Socket Events (all existing, reuse only)

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `queue:updated` | Server → Client | `{ queueData, doctorId }` | Queue state changed |
| `queue:position_changed` | Server → User | `{ position, estimatedWait, ... }` | User's position changed |
| `queue:your_turn` | Server → User | `{ appointmentId, ... }` | It's the user's turn |

## Socket Rooms

| Room Pattern | Who Joins | Purpose |
|-------------|-----------|---------|
| `queue:${clinicId}:${doctorId}` | Patients + Staff | Receive queue updates for a doctor |
| `user:${userId}` | Patient | Receive personal position changes |

## Service Dependencies

- `smartQueueService.getUserQueueUpdate(appointmentId)` — full smart queue data
- `smartQueueService.getSmartQueueStatus(doctorId, date, queueNumber)` — detailed predictions
- `queueNotificationService.getQueuePosition(appointmentId)` — simple position
- `socketManager.emitQueuePositionChanged(userId, data)` — push to user
- `socketManager.emitYourTurn(userId, data)` — push "your turn" alert
- `socketManager.emitQueueUpdated(clinicId, doctorId, data)` — push to queue room

## Database Fields Used

From `Appointment` model:
- `queueNumber` — position in queue
- `tokenNumber` — token assigned
- `estimatedArrivalTime` — calculated arrival time
- `status` — pending/confirmed/in_progress/completed
- `consultationStartTime` — when doctor started
- `consultationEndTime` — when doctor finished
- `queueStatus` — waiting/verified/in_queue/completed/expired/no_show

## Conclusion

**Zero new backend code required.** All APIs, socket events, and services exist.
Mobile only needs to call existing endpoints and subscribe to existing socket events.

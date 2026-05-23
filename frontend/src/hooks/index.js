/**
 * HealthSync Frontend Hooks — Central export
 * All custom hooks for the HealthSync web application
 */

// ─── Core API hooks ───────────────────────────────────────────────────────
export { default as useApi, usePaginatedApi, usePolling, useSearch } from './useApi';

// ─── Utility hooks ────────────────────────────────────────────────────────
export { default as useLocalStorage } from './useLocalStorage';
export { default as useDebounce } from './useDebounce';
export { default as useOnlineStatus } from './useOnlineStatus';

// ─── Auth & Profile hooks ─────────────────────────────────────────────────
export { default as useAuth } from './useAuth';
export { default as useProfile } from './useProfile';

// ─── Feature hooks ────────────────────────────────────────────────────────
export { default as useNotifications } from './useNotifications';
export { default as useAppointments } from './useAppointments';
export { default as useDoctors } from './useDoctors';
export { default as useQueue, useQueueInfo } from './useQueue';
export { default as usePayment } from './usePayment';
export { default as useWallet } from './useWallet';
export { default as useHealthRecords } from './useHealthRecords';
export { default as useClinic } from './useClinic';
export { default as useAI } from './useAI';
export { default as useReviews } from './useReviews';
export { default as useFavorites } from './useFavorites';

// ─── Dashboard hooks ──────────────────────────────────────────────────────
export { default as useDoctorDashboard } from './useDoctorDashboard';
export { default as useAdminDashboard } from './useAdminDashboard';
export { default as useStaffDashboard } from './useStaffDashboard';

// ─── Real-time hooks ──────────────────────────────────────────────────────
export {
  default as useSocket,
  useSocketEvent,
  useSocketEvents,
  useSocketEmit,
  useSocketRoom,
} from './useSocket';

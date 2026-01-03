/**
 * useRealTimeUpdates Hook
 * 
 * Provides easy-to-use real-time update subscriptions for components.
 * Automatically handles subscription cleanup on unmount.
 */

import { useEffect } from 'react';
import { useSocket, SOCKET_EVENTS } from '../contexts/SocketContext';
import { toast } from 'react-hot-toast';

/**
 * Hook for appointment real-time updates
 */
export const useAppointmentUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubCreated = subscribe(SOCKET_EVENTS.APPOINTMENT_CREATED, (data) => {
      toast.success('New appointment booked!');
      onUpdate?.('created', data.appointment);
    });

    const unsubUpdated = subscribe(SOCKET_EVENTS.APPOINTMENT_UPDATED, (data) => {
      toast('Appointment updated', { icon: '📅' });
      onUpdate?.('updated', data.appointment);
    });

    const unsubCancelled = subscribe(SOCKET_EVENTS.APPOINTMENT_CANCELLED, (data) => {
      toast('Appointment cancelled', { icon: '❌' });
      onUpdate?.('cancelled', data.appointment);
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCancelled();
    };
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Hook for wallet/transaction real-time updates
 */
export const useWalletUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(SOCKET_EVENTS.WALLET_TRANSACTION, (data) => {
      const { transaction, balance } = data;
      const isCredit = transaction.type === 'credit';
      toast(
        `${isCredit ? '+' : '-'}₹${transaction.amount} - ${transaction.description}`,
        { icon: isCredit ? '💰' : '💸' }
      );
      onUpdate?.(transaction, balance);
    });

    return unsub;
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Hook for queue position updates
 */
export const useQueueUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubPosition = subscribe(SOCKET_EVENTS.QUEUE_POSITION_CHANGED, (data) => {
      onUpdate?.('position', data);
    });

    const unsubYourTurn = subscribe(SOCKET_EVENTS.QUEUE_YOUR_TURN, (data) => {
      toast.success("It's your turn! Please proceed to the doctor.", {
        duration: 10000,
        icon: '🔔',
      });
      onUpdate?.('yourTurn', data);
    });

    const unsubQueueUpdated = subscribe(SOCKET_EVENTS.QUEUE_UPDATED, (data) => {
      onUpdate?.('queueUpdated', data);
    });

    return () => {
      unsubPosition();
      unsubYourTurn();
      unsubQueueUpdated();
    };
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Hook for notification updates
 */
export const useNotificationUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(SOCKET_EVENTS.NOTIFICATION_NEW, (data) => {
      toast(data.notification?.title || 'New notification', {
        icon: '🔔',
      });
      onUpdate?.(data.notification);
    });

    return unsub;
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Hook for prescription updates
 */
export const usePrescriptionUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubCreated = subscribe(SOCKET_EVENTS.PRESCRIPTION_CREATED, (data) => {
      toast.success('New prescription received!');
      onUpdate?.('created', data.prescription);
    });

    const unsubUpdated = subscribe(SOCKET_EVENTS.PRESCRIPTION_UPDATED, (data) => {
      toast('Prescription updated', { icon: '💊' });
      onUpdate?.('updated', data.prescription);
    });

    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Hook for lab report updates
 */
export const useLabReportUpdates = (onUpdate) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe(SOCKET_EVENTS.LAB_REPORT_READY, (data) => {
      toast.success('Lab report is ready!', { icon: '🔬' });
      onUpdate?.(data.report);
    });

    return unsub;
  }, [isConnected, subscribe, onUpdate]);
};

/**
 * Generic hook for any socket event
 */
export const useSocketEvent = (event, callback) => {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected || !event) return;

    const unsub = subscribe(event, callback);
    return unsub;
  }, [isConnected, subscribe, event, callback]);
};

export default {
  useAppointmentUpdates,
  useWalletUpdates,
  useQueueUpdates,
  useNotificationUpdates,
  usePrescriptionUpdates,
  useLabReportUpdates,
  useSocketEvent,
};

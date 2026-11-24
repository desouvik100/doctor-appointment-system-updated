/**
 * useAppointments — Appointment management hook
 * Handles fetching, cancelling, and rescheduling appointments
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useAppointments = (userId, options = {}) => {
  const { autoFetch = true, status = null } = options;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [total, setTotal]               = useState(0);

  const fetchAppointments = useCallback(async (filterStatus = status) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await axios.get(`/api/appointments/my${params}`);
      const data = res.data;
      const list = data?.data || data?.appointments || (Array.isArray(data) ? data : []);
      setAppointments(list);
      setTotal(data?.total || list.length);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load appointments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId, status]);

  const cancelAppointment = useCallback(async (appointmentId, reason = '') => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/cancel`, { reason });
      setAppointments(prev =>
        prev.map(a => a._id === appointmentId ? { ...a, status: 'cancelled' } : a)
      );
      toast.success('Appointment cancelled successfully');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel appointment');
      return false;
    }
  }, []);

  const rescheduleAppointment = useCallback(async (appointmentId, date, time) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/reschedule`, { date, time });
      await fetchAppointments();
      toast.success('Appointment rescheduled successfully');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reschedule appointment');
      return false;
    }
  }, [fetchAppointments]);

  const addReview = useCallback(async (appointmentId, rating, comment) => {
    try {
      await axios.post('/api/reviews', { appointmentId, rating, comment });
      toast.success('Review submitted successfully');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
      return false;
    }
  }, []);

  useEffect(() => {
    if (autoFetch && userId) fetchAppointments();
  }, [autoFetch, userId, fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    total,
    fetchAppointments,
    cancelAppointment,
    rescheduleAppointment,
    addReview,
    refresh: fetchAppointments,
  };
};

export default useAppointments;

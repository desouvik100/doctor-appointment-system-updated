/**
 * useClinic — Clinic management hook for staff/receptionist dashboards
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useClinic = (clinicId) => {
  const [clinic, setClinic]           = useState(null);
  const [doctors, setDoctors]         = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue]             = useState([]);
  const [analytics, setAnalytics]     = useState(null);
  const [loading, setLoading]         = useState(false);

  const fetchClinic = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await axios.get(`/api/clinics/${clinicId}`);
      setClinic(res.data);
    } catch { /* silent */ }
  }, [clinicId]);

  const fetchDoctors = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await axios.get(`/api/clinics/${clinicId}/doctors`);
      setDoctors(res.data?.doctors || res.data || []);
    } catch { /* silent */ }
  }, [clinicId]);

  const fetchTodayAppointments = useCallback(async (date = null) => {
    if (!clinicId) return;
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/appointments/clinic/${clinicId}`, {
        params: { date: today }
      });
      const list = res.data?.appointments || res.data || [];
      setAppointments(list);
      return list;
    } catch { return []; }
  }, [clinicId]);

  const fetchQueue = useCallback(async (date = null) => {
    if (!clinicId) return;
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/advanced-queue/${clinicId}`, {
        params: { date: today }
      });
      setQueue(res.data?.queue || res.data || []);
    } catch { /* silent */ }
  }, [clinicId]);

  const fetchAnalytics = useCallback(async (period = 'week') => {
    if (!clinicId) return;
    try {
      const res = await axios.get('/api/clinic-analytics', {
        params: { clinicId, period }
      });
      setAnalytics(res.data);
    } catch { /* silent */ }
  }, [clinicId]);

  const updateSettings = useCallback(async (settings) => {
    try {
      await axios.put('/api/clinics/settings', { clinicId, ...settings });
      setClinic(prev => ({ ...prev, ...settings }));
      toast.success('Clinic settings updated');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update settings');
      return false;
    }
  }, [clinicId]);

  const fetchAll = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    await Promise.allSettled([
      fetchClinic(),
      fetchDoctors(),
      fetchTodayAppointments(),
      fetchQueue(),
    ]);
    setLoading(false);
  }, [clinicId, fetchClinic, fetchDoctors, fetchTodayAppointments, fetchQueue]);

  useEffect(() => {
    if (clinicId) fetchAll();
  }, [clinicId, fetchAll]);

  return {
    clinic,
    doctors,
    appointments,
    queue,
    analytics,
    loading,
    fetchClinic,
    fetchDoctors,
    fetchTodayAppointments,
    fetchQueue,
    fetchAnalytics,
    updateSettings,
    refresh: fetchAll,
    // Computed stats
    todayTotal:    appointments.length,
    checkedIn:     appointments.filter(a => a.status === 'checked-in').length,
    waiting:       appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length,
    completed:     appointments.filter(a => a.status === 'completed').length,
  };
};

export default useClinic;

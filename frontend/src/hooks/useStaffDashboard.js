/**
 * useStaffDashboard — Staff/Receptionist dashboard data hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';

export const useStaffDashboard = (clinicId) => {
  const [stats, setStats]             = useState({
    todayAppointments: 0,
    checkedIn: 0,
    waiting: 0,
    completed: 0,
    walkIns: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [queue, setQueue]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!clinicId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [apptRes, queueRes] = await Promise.allSettled([
        axios.get(`/api/appointments/clinic/${clinicId}`, { params: { date: today } }),
        axios.get(`/api/advanced-queue/${clinicId}`, { params: { date: today } }),
      ]);

      if (apptRes.status === 'fulfilled') {
        const data = apptRes.value.data;
        const list = data?.appointments || (Array.isArray(data) ? data : []);
        setTodayAppointments(list);
        setStats({
          todayAppointments: list.length,
          checkedIn:  list.filter(a => a.status === 'checked-in').length,
          waiting:    list.filter(a => ['pending', 'confirmed'].includes(a.status)).length,
          completed:  list.filter(a => a.status === 'completed').length,
          walkIns:    list.filter(a => a.bookingSource === 'receptionist' || a.isWalkIn).length,
        });
      }

      if (queueRes.status === 'fulfilled') {
        const data = queueRes.value.data;
        setQueue(data?.queue || data?.appointments || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error('[useStaffDashboard] fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  const refresh = useCallback(() => fetchDashboard(true), [fetchDashboard]);

  useEffect(() => {
    if (clinicId) fetchDashboard();
  }, [clinicId, fetchDashboard]);

  return {
    stats,
    todayAppointments,
    queue,
    loading,
    refreshing,
    refresh,
    fetchDashboard,
  };
};

export default useStaffDashboard;

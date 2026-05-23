/**
 * useDoctorDashboard — Doctor dashboard data hook
 * Fetches all data needed for the doctor's main dashboard
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';

export const useDoctorDashboard = (doctorId) => {
  const [stats, setStats]             = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    completedToday: 0,
    earnings: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!doctorId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [todayRes, allRes, patientsRes, earningsRes] = await Promise.allSettled([
        // Use the today-queue endpoint for today's appointments
        axios.get(`/api/appointments/doctor/${doctorId}/today-queue`),
        // All appointments for pending count
        axios.get(`/api/appointments/doctor/${doctorId}`),
        // Doctor's patients
        axios.get('/api/doctors/patients'),
        // Doctor's earnings
        axios.get('/api/doctors/earnings'),
      ]);

      // Today's appointments
      if (todayRes.status === 'fulfilled') {
        const data = todayRes.value.data;
        const list = data?.appointments || data?.queue || (Array.isArray(data) ? data : []);
        setTodaySchedule(list);
        setStats(prev => ({
          ...prev,
          todayAppointments: list.length,
          completedToday: list.filter(a => a.status === 'completed').length,
        }));
      }

      // All appointments for pending count
      if (allRes.status === 'fulfilled') {
        const data = allRes.value.data;
        const list = data?.appointments || (Array.isArray(data) ? data : []);
        setStats(prev => ({
          ...prev,
          pendingAppointments: list.filter(a =>
            ['pending', 'confirmed'].includes(a.status)
          ).length,
        }));
      }

      // Patients
      if (patientsRes.status === 'fulfilled') {
        const data = patientsRes.value.data;
        const list = data?.patients || (Array.isArray(data) ? data : []);
        setRecentPatients(list.slice(0, 5));
        setStats(prev => ({ ...prev, totalPatients: list.length }));
      }

      // Earnings
      if (earningsRes.status === 'fulfilled') {
        const data = earningsRes.value.data;
        setStats(prev => ({ ...prev, earnings: data?.balance || 0 }));
      }
    } catch (err) {
      console.error('[useDoctorDashboard] fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  const refresh = useCallback(() => fetchDashboard(true), [fetchDashboard]);

  useEffect(() => {
    if (doctorId) fetchDashboard();
  }, [doctorId, fetchDashboard]);

  return {
    stats,
    todaySchedule,
    recentPatients,
    loading,
    refreshing,
    refresh,
    fetchDashboard,
  };
};

export default useDoctorDashboard;

/**
 * useAdminDashboard — Admin dashboard data hook
 * Fetches all data needed for the admin's main dashboard
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';

export const useAdminDashboard = () => {
  const [overview, setOverview]       = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, usersRes, approvalsRes, alertsRes] = await Promise.allSettled([
        axios.get('/api/analytics/overview'),
        axios.get('/api/users', { params: { limit: 10, sort: '-createdAt' } }),
        axios.get('/api/users', { params: { approvalStatus: 'pending', role: 'receptionist' } }),
        axios.get('/api/security-admin/alerts', { params: { limit: 5 } }),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value.data?.overview || overviewRes.value.data);
      }

      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.data;
        setRecentUsers(data?.users || data?.data || (Array.isArray(data) ? data : []));
      }

      if (approvalsRes.status === 'fulfilled') {
        const data = approvalsRes.value.data;
        setPendingApprovals(data?.users || data?.data || (Array.isArray(data) ? data : []));
      }

      if (alertsRes.status === 'fulfilled') {
        const data = alertsRes.value.data;
        setSecurityAlerts(data?.alerts || data?.data || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error('[useAdminDashboard] fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => fetchDashboard(true), [fetchDashboard]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return {
    overview,
    recentUsers,
    pendingApprovals,
    securityAlerts,
    loading,
    refreshing,
    refresh,
    // Computed stats
    totalUsers:       overview?.totalPatients || 0,
    totalDoctors:     overview?.totalDoctors || 0,
    todayAppointments: overview?.todayAppointments || 0,
    monthlyRevenue:   overview?.thisMonth?.revenue || 0,
    pendingCount:     pendingApprovals.length,
  };
};

export default useAdminDashboard;

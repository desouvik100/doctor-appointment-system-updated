/**
 * useNotifications — Real-time notification management hook
 * Polls for unread count and manages notification state
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/config';

const POLL_INTERVAL = 30000; // 30 seconds

export const useNotifications = (userId) => {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(false);
  const intervalRef = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`/api/notifications/unread-count/${userId}`);
      if (mountedRef.current) {
        setUnreadCount(res.data?.unreadCount ?? 0);
      }
    } catch { /* silent — non-critical */ }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/notifications?userId=${userId}&limit=20`);
      if (mountedRef.current) {
        const data = res.data;
        setNotifications(data?.notifications || data?.data || (Array.isArray(data) ? data : []));
        setUnreadCount(data?.unreadCount ?? 0);
      }
    } catch { /* silent */ }
    finally { if (mountedRef.current) setLoading(false); }
  }, [userId]);

  const markRead = useCallback(async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [userId, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
};

export default useNotifications;

/**
 * NotificationsScreen - View and manage all notifications
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import Card from '../../components/common/Card';
import apiClient from '../../services/api/apiClient';

const NotificationsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread

  const userId = user?.id || user?._id;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const params = filter === 'unread' ? '?unreadOnly=true' : '';
      const response = await apiClient.get(`/notifications/${userId}${params}`);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.log('Error fetching notifications:', error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Error marking as read:', error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put(`/notifications/read-all/${userId}`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.log('Error marking all as read:', error.message);
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete(`/notifications/clear/${userId}`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.log('Error clearing notifications:', error.message);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate based on notification type
    const { type, data } = notification;
    switch (type) {
      case 'appointment':
      case 'appointment_reminder':
        if (data?.appointmentId) {
          navigation.navigate('AppointmentDetail', { appointmentId: data.appointmentId });
        }
        break;
      case 'prescription':
        if (data?.prescriptionId) {
          navigation.navigate('PrescriptionDetail', { prescriptionId: data.prescriptionId });
        }
        break;
      case 'lab_result':
        if (data?.reportId) {
          navigation.navigate('LabReportDetail', { reportId: data.reportId });
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'appointment_reminder': return '⏰';
      case 'prescription': return '💊';
      case 'lab_result': return '🔬';
      case 'reminder': return '🔔';
      case 'promotion': return '🎁';
      case 'health_tip': return '💡';
      default: return '📢';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <Card style={[
        styles.notificationCard, 
        { backgroundColor: colors.surface },
        !item.isRead && styles.unreadCard
      ]}>
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: item.isRead ? colors.background : '#6C5CE720' }]}>
            <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.notificationTitle, { color: colors.textPrimary }, !item.isRead && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
              {getTimeAgo(item.createdAt)}
            </Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filter & Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, { color: filter === 'all' ? '#6C5CE7' : colors.textSecondary }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterTabText, { color: filter === 'unread' ? '#6C5CE7' : colors.textSecondary }]}>
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {filter === 'unread' ? 'All caught up!' : 'You have no notifications yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { ...typography.headlineMedium, fontWeight: '700' },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 20 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  filterTabs: { flexDirection: 'row', gap: spacing.md },
  filterTab: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#6C5CE7' },
  filterTabText: { ...typography.labelMedium, fontWeight: '600' },
  markAllText: { color: '#6C5CE7', ...typography.labelSmall, fontWeight: '600' },
  
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  
  notificationCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: '#6C5CE7' },
  notificationContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  notificationIcon: { fontSize: 22 },
  textContainer: { flex: 1 },
  notificationTitle: { ...typography.bodyMedium, fontWeight: '500', marginBottom: 2 },
  unreadTitle: { fontWeight: '700' },
  notificationMessage: { ...typography.bodySmall, lineHeight: 18 },
  notificationTime: { ...typography.labelSmall, marginTop: spacing.xs },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6C5CE7', marginLeft: spacing.sm },
  
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, fontWeight: '600', marginBottom: spacing.xs },
  emptySubtext: { ...typography.bodyMedium },
});

export default NotificationsScreen;

import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './NotificationCenter.css';

const NotificationCenter = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, [userId, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unreadOnly', 'true');
      
      const response = await axios.get(`/api/notifications/${userId}?${params}`);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Show sample notifications
      setNotifications(getSampleNotifications());
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`/api/notifications/read-all/${userId}`);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await axios.delete(`/api/notifications/clear/${userId}`);
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getIcon = (type) => {
    const icons = {
      appointment_reminder: 'fas fa-bell',
      appointment_confirmed: 'fas fa-check-circle',
      appointment_cancelled: 'fas fa-times-circle',
      appointment_rescheduled: 'fas fa-calendar-alt',
      new_message: 'fas fa-comment',
      prescription_ready: 'fas fa-prescription',
      lab_report_ready: 'fas fa-flask',
      payment_received: 'fas fa-credit-card',
      payment_due: 'fas fa-exclamation-circle',
      review_request: 'fas fa-star',
      emergency: 'fas fa-ambulance',
      promotion: 'fas fa-gift',
      general: 'fas fa-info-circle'
    };
    return icons[type] || icons.general;
  };

  const getIconColor = (type) => {
    const colors = {
      appointment_reminder: '#f59e0b',
      appointment_confirmed: '#10b981',
      appointment_cancelled: '#ef4444',
      appointment_rescheduled: '#3b82f6',
      new_message: '#8b5cf6',
      prescription_ready: '#06b6d4',
      lab_report_ready: '#ec4899',
      payment_received: '#22c55e',
      payment_due: '#f97316',
      review_request: '#eab308',
      emergency: '#dc2626',
      promotion: '#a855f7',
      general: '#64748b'
    };
    return colors[type] || colors.general;
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  const getSampleNotifications = () => [
    {
      _id: '1',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sharma is tomorrow at 10:00 AM',
      type: 'appointment_reminder',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      _id: '2',
      title: 'Appointment Confirmed',
      message: 'Your appointment has been confirmed by the clinic',
      type: 'appointment_confirmed',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      _id: '3',
      title: 'New Message',
      message: 'Dr. Patel sent you a message',
      type: 'new_message',
      isRead: false,
      createdAt: new Date(Date.now() - 7200000)
    }
  ];

  return (
    <div className="notification-center">
      <div className="notification-center__header">
        <div className="notification-center__title">
          <i className="fas fa-bell"></i>
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="notification-center__badge">{unreadCount}</span>
          )}
        </div>
        <button className="notification-center__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="notification-center__filters">
        <button 
          className={`notification-center__filter ${filter === 'all' ? 'notification-center__filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`notification-center__filter ${filter === 'unread' ? 'notification-center__filter--active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <div className="notification-center__actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} title="Mark all as read">
              <i className="fas fa-check-double"></i>
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} title="Clear all">
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      <div className="notification-center__list">
        {loading ? (
          <div className="notification-center__loading">
            <div className="notification-center__spinner"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-center__empty">
            <i className="fas fa-bell-slash"></i>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification._id}
              className={`notification-center__item ${!notification.isRead ? 'notification-center__item--unread' : ''}`}
              onClick={() => !notification.isRead && markAsRead(notification._id)}
            >
              <div 
                className="notification-center__icon"
                style={{ backgroundColor: `${getIconColor(notification.type)}20`, color: getIconColor(notification.type) }}
              >
                <i className={getIcon(notification.type)}></i>
              </div>
              <div className="notification-center__content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-center__time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>
              {!notification.isRead && (
                <span className="notification-center__dot"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

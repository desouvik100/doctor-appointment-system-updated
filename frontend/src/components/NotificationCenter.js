import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const NotificationCenter = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, [userId, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unreadOnly', 'true');
      const r = await axios.get(`/api/notifications/${userId}?${params}`);
      setNotifications(r.data.notifications || []);
      setUnreadCount(r.data.unreadCount || 0);
    } catch { setNotifications(getSampleNotifications()); }
    finally { setLoading(false); }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try { await axios.put(`/api/notifications/read-all/${userId}`); setNotifications(notifications.map(n => ({ ...n, isRead: true }))); setUnreadCount(0); toast.success('All notifications marked as read'); }
    catch {}
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try { await axios.delete(`/api/notifications/clear/${userId}`); setNotifications([]); setUnreadCount(0); toast.success('All notifications cleared'); }
    catch {}
  };

  const getIcon = (type) => ({
    appointment_reminder: 'fa-bell', appointment_confirmed: 'fa-check-circle', appointment_cancelled: 'fa-times-circle', appointment_rescheduled: 'fa-calendar-alt',
    new_message: 'fa-comment', prescription_ready: 'fa-prescription', lab_report_ready: 'fa-flask', payment_received: 'fa-credit-card',
    payment_due: 'fa-exclamation-circle', review_request: 'fa-star', emergency: 'fa-ambulance', promotion: 'fa-gift', general: 'fa-info-circle'
  }[type] || 'fa-info-circle');

  const getIconColor = (type) => ({
    appointment_reminder: 'bg-amber-100 text-amber-600', appointment_confirmed: 'bg-emerald-100 text-emerald-600', appointment_cancelled: 'bg-red-100 text-red-600',
    appointment_rescheduled: 'bg-blue-100 text-blue-600', new_message: 'bg-purple-100 text-purple-600', prescription_ready: 'bg-cyan-100 text-cyan-600',
    lab_report_ready: 'bg-pink-100 text-pink-600', payment_received: 'bg-green-100 text-green-600', payment_due: 'bg-orange-100 text-orange-600',
    review_request: 'bg-yellow-100 text-yellow-600', emergency: 'bg-red-100 text-red-600', promotion: 'bg-violet-100 text-violet-600', general: 'bg-slate-100 text-slate-600'
  }[type] || 'bg-slate-100 text-slate-600');

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
    { _id: '1', title: 'Appointment Reminder', message: 'Your appointment with Dr. Sharma is tomorrow at 10:00 AM', type: 'appointment_reminder', isRead: false, createdAt: new Date(Date.now() - 3600000) },
    { _id: '2', title: 'Appointment Confirmed', message: 'Your appointment has been confirmed by the clinic', type: 'appointment_confirmed', isRead: true, createdAt: new Date(Date.now() - 86400000) },
    { _id: '3', title: 'New Message', message: 'Dr. Patel sent you a message', type: 'new_message', isRead: false, createdAt: new Date(Date.now() - 7200000) }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl mt-16 mr-4 overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-bell text-white"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unreadCount}</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <i className="fas fa-times text-slate-500"></i>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-2">
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="w-8 h-8 rounded-lg bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center" title="Mark all as read">
                <i className="fas fa-check-double"></i>
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll} className="w-8 h-8 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center" title="Clear all">
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-bell-slash text-2xl text-slate-400"></i>
              </div>
              <p className="text-slate-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(notification => (
                <div key={notification._id} onClick={() => !notification.isRead && markAsRead(notification._id)}
                  className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-indigo-50/50' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                    <i className={`fas ${getIcon(notification.type)}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2">{notification.message}</p>
                    <span className="text-xs text-slate-400 mt-1 block">{formatTime(notification.createdAt)}</span>
                  </div>
                  {!notification.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2"></span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;

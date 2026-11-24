import { useState, useEffect, useRef } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/staff-management/notifications/my', { params: { limit: 10 } });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) { console.error('Failed to fetch notifications', err); }
  };

  const markAsRead = async (id) => {
    try {
      await axios.post(`/api/staff-management/notification/${id}/read`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/staff-management/notifications/read-all');
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (err) { toast.error('Failed to mark as read'); }
  };

  const acknowledgeAction = async (id, staffName) => {
    try {
      await axios.post(`/api/staff-management/notification/${id}/acknowledge`);
      toast.success('Acknowledged! On my way to hospital.');
      fetchNotifications();
    } catch (err) { toast.error('Failed to acknowledge'); }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'come_to_hospital': return 'fa-hospital text-amber-500';
      case 'urgent': return 'fa-exclamation-circle text-red-500';
      case 'meeting': return 'fa-video text-blue-500';
      case 'task': return 'fa-tasks text-green-500';
      default: return 'fa-bell text-slate-500';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <i className="fas fa-bell text-xl text-slate-600"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-violet-500 to-purple-600">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-white/80 hover:text-white">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <i className="fas fa-bell-slash text-3xl mb-2 text-slate-300"></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${getTypeIcon(notif.type)}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`font-medium text-sm ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">
                          {notif.senderName && <span className="text-slate-500">From {notif.senderName} • </span>}
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {notif.type === 'come_to_hospital' && !notif.actionTaken && (
                          <button
                            onClick={(e) => { e.stopPropagation(); acknowledgeAction(notif._id); }}
                            className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200"
                          >
                            On my way
                          </button>
                        )}
                        {notif.actionTaken && (
                          <span className="text-xs text-green-600"><i className="fas fa-check mr-1"></i>Acknowledged</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

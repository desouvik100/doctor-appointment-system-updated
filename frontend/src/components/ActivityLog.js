import { useState, useEffect } from 'react';
import axios from '../api/config';

const ActivityLog = ({ userId, userType = 'all', limit = 50 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, [userId, userType]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Try to fetch from API, fallback to generating from appointments
      try {
        const response = await axios.get(`/api/activity-logs?userId=${userId}&type=${userType}&limit=${limit}`);
        setActivities(response.data || []);
      } catch {
        // Generate activity logs from appointments if API not available
        const appointmentsRes = await axios.get('/api/appointments');
        const logs = generateLogsFromAppointments(appointmentsRes.data || []);
        setActivities(logs);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const generateLogsFromAppointments = (appointments) => {
    const logs = [];
    appointments.slice(0, 50).forEach(apt => {
      logs.push({
        id: `${apt._id}-created`,
        type: 'appointment',
        action: 'created',
        description: `Appointment booked with Dr. ${apt.doctorId?.name || 'Unknown'}`,
        user: apt.userId?.name || 'User',
        userType: 'patient',
        timestamp: apt.createdAt || apt.date,
        metadata: { appointmentId: apt._id, status: apt.status }
      });

      if (apt.status === 'completed') {
        logs.push({
          id: `${apt._id}-completed`,
          type: 'appointment',
          action: 'completed',
          description: `Consultation completed with Dr. ${apt.doctorId?.name || 'Unknown'}`,
          user: apt.doctorId?.name || 'Doctor',
          userType: 'doctor',
          timestamp: apt.updatedAt || apt.date,
          metadata: { appointmentId: apt._id }
        });
      }

      if (apt.status === 'cancelled') {
        logs.push({
          id: `${apt._id}-cancelled`,
          type: 'appointment',
          action: 'cancelled',
          description: `Appointment cancelled`,
          user: apt.userId?.name || 'User',
          userType: 'patient',
          timestamp: apt.updatedAt || apt.date,
          metadata: { appointmentId: apt._id }
        });
      }
    });

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getActivityIcon = (type, action) => {
    const icons = {
      appointment: {
        created: { icon: 'fa-calendar-plus', color: 'text-blue-500', bg: 'bg-blue-100' },
        completed: { icon: 'fa-check-circle', color: 'text-emerald-500', bg: 'bg-emerald-100' },
        cancelled: { icon: 'fa-times-circle', color: 'text-red-500', bg: 'bg-red-100' },
        rescheduled: { icon: 'fa-calendar-alt', color: 'text-amber-500', bg: 'bg-amber-100' }
      },
      payment: {
        success: { icon: 'fa-credit-card', color: 'text-emerald-500', bg: 'bg-emerald-100' },
        failed: { icon: 'fa-exclamation-circle', color: 'text-red-500', bg: 'bg-red-100' },
        refund: { icon: 'fa-undo', color: 'text-amber-500', bg: 'bg-amber-100' }
      },
      user: {
        login: { icon: 'fa-sign-in-alt', color: 'text-indigo-500', bg: 'bg-indigo-100' },
        logout: { icon: 'fa-sign-out-alt', color: 'text-slate-500', bg: 'bg-slate-100' },
        register: { icon: 'fa-user-plus', color: 'text-emerald-500', bg: 'bg-emerald-100' },
        update: { icon: 'fa-user-edit', color: 'text-blue-500', bg: 'bg-blue-100' }
      },
      system: {
        default: { icon: 'fa-cog', color: 'text-slate-500', bg: 'bg-slate-100' }
      }
    };

    return icons[type]?.[action] || icons.system.default;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="activity-log">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
          <p className="text-sm text-slate-500">Track all system activities</p>
        </div>
        <div className="flex gap-2">
          {['all', 'appointment', 'payment', 'user'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
                ${filter === f 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <i className="fas fa-history text-2xl text-slate-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No activities found</h3>
          <p className="text-slate-500">Activity logs will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((activity, index) => {
              const iconStyle = getActivityIcon(activity.type, activity.action);
              return (
                <div 
                  key={activity.id || index} 
                  className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl ${iconStyle.bg} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${iconStyle.icon} ${iconStyle.color}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        <i className="fas fa-user mr-1"></i>
                        {activity.user}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize
                        ${activity.userType === 'admin' ? 'bg-purple-100 text-purple-700' :
                          activity.userType === 'doctor' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'}`}
                      >
                        {activity.userType}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;

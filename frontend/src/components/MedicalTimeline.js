import { useState, useEffect } from 'react';
import axios from '../api/config';

const MedicalTimeline = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (userId) fetchTimeline();
  }, [userId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      // Fetch appointments, lab reports, prescriptions
      const [appointmentsRes, reportsRes] = await Promise.all([
        axios.get(`/api/appointments/user/${userId}`),
        axios.get(`/api/lab-reports/user/${userId}`).catch(() => ({ data: [] }))
      ]);

      const timelineEvents = [];

      // Add appointments
      (appointmentsRes.data || []).forEach(apt => {
        timelineEvents.push({
          id: apt._id,
          type: 'appointment',
          date: new Date(apt.date),
          title: `Appointment with Dr. ${apt.doctorId?.name || 'Unknown'}`,
          subtitle: apt.doctorId?.specialization || '',
          status: apt.status,
          icon: 'fa-calendar-check',
          color: apt.status === 'completed' ? 'emerald' : apt.status === 'cancelled' ? 'red' : 'blue',
          details: {
            time: apt.time,
            type: apt.consultationType,
            reason: apt.reason,
            clinic: apt.clinicId?.name
          }
        });
      });

      // Add lab reports
      (reportsRes.data || []).forEach(report => {
        timelineEvents.push({
          id: report._id,
          type: 'lab_report',
          date: new Date(report.createdAt || report.date),
          title: report.testName || 'Lab Report',
          subtitle: report.labName || 'Laboratory',
          status: report.status || 'completed',
          icon: 'fa-flask',
          color: 'purple',
          details: {
            result: report.result,
            notes: report.notes
          }
        });
      });

      // Sort by date descending
      timelineEvents.sort((a, b) => b.date - a.date);
      setEvents(timelineEvents);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  const getColorClasses = (color) => ({
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-500' }
  }[color] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-500' });

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="medical-timeline">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Medical History</h2>
          <p className="text-sm text-slate-500">Your complete health journey</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: 'fa-list' },
            { key: 'appointment', label: 'Visits', icon: 'fa-calendar-check' },
            { key: 'lab_report', label: 'Lab Reports', icon: 'fa-flask' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                ${filter === f.key 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <i className={`fas ${f.icon}`}></i>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <i className="fas fa-history text-3xl text-slate-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No medical history yet</h3>
          <p className="text-slate-500">Your appointments and reports will appear here</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          {/* Events */}
          <div className="space-y-6">
            {filteredEvents.map((event, index) => {
              const colors = getColorClasses(event.color);
              return (
                <div key={event.id} className="relative pl-16">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${colors.text.replace('text', 'bg')}`}></div>
                  </div>

                  {/* Event card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                          <i className={`fas ${event.icon} ${colors.text}`}></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{event.title}</h4>
                          <p className="text-sm text-slate-500">{event.subtitle}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {event.status}
                      </span>
                    </div>

                    {/* Event details */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-calendar text-slate-400"></i>
                        {formatDate(event.date)}
                      </span>
                      {event.details?.time && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-clock text-slate-400"></i>
                          {event.details.time}
                        </span>
                      )}
                      {event.details?.clinic && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-hospital text-slate-400"></i>
                          {event.details.clinic}
                        </span>
                      )}
                      {event.details?.type && (
                        <span className="flex items-center gap-1">
                          <i className={`fas ${event.details.type === 'online' ? 'fa-video' : 'fa-user'} text-slate-400`}></i>
                          {event.details.type === 'online' ? 'Online' : 'In-Person'}
                        </span>
                      )}
                    </div>

                    {event.details?.reason && (
                      <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                        <strong>Reason:</strong> {event.details.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalTimeline;

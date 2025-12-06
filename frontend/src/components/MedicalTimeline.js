import { useState, useEffect } from 'react';
import axios from '../api/config';

const MedicalTimeline = ({ userId, patientName }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTimeline(); }, [userId]);

  const fetchTimeline = async () => {
    try {
      // Fetch appointments, prescriptions, lab reports
      const [aptsRes, prescRes, labsRes] = await Promise.all([
        axios.get(`/api/appointments/user/${userId}`),
        axios.get(`/api/prescriptions/patient/${userId}`).catch(() => ({ data: [] })),
        axios.get(`/api/lab-reports/user/${userId}`).catch(() => ({ data: [] }))
      ]);

      const events = [];

      // Add appointments
      (aptsRes.data || []).forEach(apt => {
        events.push({
          type: 'appointment',
          date: apt.date,
          title: `Consultation with Dr. ${apt.doctorId?.name || apt.doctorName || 'Doctor'}`,
          subtitle: apt.doctorId?.specialization || '',
          status: apt.status,
          icon: 'fa-stethoscope',
          color: apt.status === 'completed' ? 'green' : apt.status === 'cancelled' ? 'red' : 'blue',
          details: { type: apt.appointmentType, fee: apt.consultationFee }
        });
      });

      // Add prescriptions
      (prescRes.data || []).forEach(pres => {
        events.push({
          type: 'prescription',
          date: pres.createdAt,
          title: `Prescription from Dr. ${pres.doctorId?.name || 'Doctor'}`,
          subtitle: pres.diagnosis || '',
          icon: 'fa-prescription',
          color: 'purple',
          details: { medicines: pres.medicines?.length || 0 }
        });
      });

      // Add lab reports
      (labsRes.data || []).forEach(lab => {
        events.push({
          type: 'lab',
          date: lab.createdAt || lab.date,
          title: lab.testName || 'Lab Report',
          subtitle: lab.labName || '',
          icon: 'fa-flask',
          color: 'amber',
          details: { status: lab.status }
        });
      });

      // Sort by date descending
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimeline(events);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredTimeline = filter === 'all' ? timeline : timeline.filter(e => e.type === filter);

  const colorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500'
  };

  const bgColorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    amber: 'bg-amber-50 border-amber-200'
  };

  if (loading) return <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl text-indigo-500"></i></div>;

  return (
    <div className="medical-timeline">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          <i className="fas fa-history mr-2 text-indigo-500"></i>
          Medical History {patientName && `- ${patientName}`}
        </h2>
        <div className="flex gap-2">
          {['all', 'appointment', 'prescription', 'lab'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {filteredTimeline.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fas fa-clipboard-list text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500">No medical history found</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-4">
            {filteredTimeline.map((event, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={`w-12 h-12 rounded-full ${colorClasses[event.color]} flex items-center justify-center text-white z-10 shadow-lg`}>
                  <i className={`fas ${event.icon}`}></i>
                </div>

                {/* Event card */}
                <div className={`flex-1 rounded-xl p-4 border ${bgColorClasses[event.color]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{event.title}</p>
                      {event.subtitle && <p className="text-sm text-slate-500">{event.subtitle}</p>}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {event.status && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'completed' ? 'bg-green-100 text-green-700' :
                      event.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {event.status}
                    </span>
                  )}

                  {event.details && (
                    <div className="mt-2 text-sm text-slate-600">
                      {event.details.type && <span className="mr-3"><i className="fas fa-video mr-1"></i>{event.details.type}</span>}
                      {event.details.fee && <span className="mr-3"><i className="fas fa-rupee-sign mr-1"></i>{event.details.fee}</span>}
                      {event.details.medicines && <span><i className="fas fa-pills mr-1"></i>{event.details.medicines} medicines</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalTimeline;

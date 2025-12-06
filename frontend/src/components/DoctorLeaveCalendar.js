import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const DoctorLeaveCalendar = ({ doctorId }) => {
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: 'personal', notes: '', isFullDay: true });
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => { fetchLeaves(); }, [doctorId]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`/api/doctor-leaves/doctor/${doctorId}`);
      setLeaves(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/doctor-leaves', { ...form, doctorId });
      toast.success('Leave added');
      if (res.data.conflictingAppointments > 0) {
        setConflicts(res.data.conflicts);
        toast.error(`Warning: ${res.data.conflictingAppointments} appointments conflict with this leave`);
      }
      setShowModal(false);
      setForm({ startDate: '', endDate: '', reason: 'personal', notes: '', isFullDay: true });
      fetchLeaves();
    } catch (e) { toast.error('Failed to add leave'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this leave?')) return;
    try {
      await axios.delete(`/api/doctor-leaves/${id}`);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (e) { toast.error('Failed'); }
  };

  const reasonColors = { vacation: 'bg-blue-100 text-blue-700', sick: 'bg-red-100 text-red-700', personal: 'bg-purple-100 text-purple-700', conference: 'bg-green-100 text-green-700', emergency: 'bg-orange-100 text-orange-700', other: 'bg-slate-100 text-slate-700' };
  const reasonIcons = { vacation: 'fa-umbrella-beach', sick: 'fa-thermometer', personal: 'fa-user', conference: 'fa-chalkboard-teacher', emergency: 'fa-exclamation-circle', other: 'fa-calendar-times' };

  if (loading) return <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl text-indigo-500"></i></div>;

  return (
    <div className="doctor-leave-calendar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800"><i className="fas fa-calendar-alt mr-2 text-indigo-500"></i>Leave Management</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
          <i className="fas fa-plus mr-2"></i>Add Leave
        </button>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fas fa-calendar-check text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500">No upcoming leaves scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => (
            <div key={leave._id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${reasonColors[leave.reason]} flex items-center justify-center`}>
                  <i className={`fas ${reasonIcons[leave.reason]} text-lg`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 capitalize">{leave.reason}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${reasonColors[leave.reason]}`}>{leave.isFullDay ? 'Full Day' : 'Partial'}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {leave.startDate !== leave.endDate && ` - ${new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </p>
                  {leave.notes && <p className="text-xs text-slate-400 mt-1">{leave.notes}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(leave._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Add Leave</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value, endDate: form.endDate || e.target.value})} required min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required min={form.startDate} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="conference">Conference/Training</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Optional notes..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Add Leave</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-800 mb-2"><i className="fas fa-exclamation-triangle mr-2"></i>Conflicting Appointments</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {conflicts.map((c, i) => (
              <li key={i}>{c.patientName} - {new Date(c.date).toLocaleDateString()} at {c.time}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-600 mt-2">Please reschedule these appointments or notify patients.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorLeaveCalendar;

import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const FollowUpManager = ({ doctorId, patientId, appointmentId, isDoctor = false }) => {
  const [followUps, setFollowUps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ scheduledDate: '', reason: '', instructions: '', discountPercent: 20 });

  useEffect(() => { fetchFollowUps(); }, [doctorId, patientId]);

  const fetchFollowUps = async () => {
    try {
      const endpoint = isDoctor ? `/api/follow-ups/doctor/${doctorId}` : `/api/follow-ups/patient/${patientId}`;
      const res = await axios.get(endpoint);
      setFollowUps(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/follow-ups', {
        ...form,
        doctorId,
        patientId,
        originalAppointmentId: appointmentId
      });
      toast.success('Follow-up scheduled! Patient will be notified.');
      setShowModal(false);
      setForm({ scheduledDate: '', reason: '', instructions: '', discountPercent: 20 });
      fetchFollowUps();
    } catch (e) { toast.error('Failed to schedule follow-up'); }
  };

  const handleBook = async (followUpId) => {
    // In real app, this would open booking modal with pre-filled data
    toast.success('Redirecting to booking...');
  };

  if (loading) return <div className="animate-pulse bg-slate-100 rounded-xl h-24"></div>;

  return (
    <div className="follow-up-manager">
      {isDoctor && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800"><i className="fas fa-calendar-plus mr-2 text-indigo-500"></i>Follow-ups</h3>
          <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600">
            <i className="fas fa-plus mr-1"></i>Schedule Follow-up
          </button>
        </div>
      )}

      {followUps.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl">
          <i className="fas fa-calendar-check text-2xl text-slate-300 mb-2"></i>
          <p className="text-sm text-slate-500">{isDoctor ? 'No follow-ups scheduled' : 'No pending follow-ups'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map(fu => (
            <div key={fu._id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${fu.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : fu.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {fu.status}
                    </span>
                    <span className="text-green-600 text-sm font-medium">{fu.discountPercent}% off</span>
                  </div>
                  <p className="font-medium text-slate-800">
                    {new Date(fu.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {fu.reason && <p className="text-sm text-slate-500 mt-1">{fu.reason}</p>}
                  {!isDoctor && fu.doctorId && (
                    <p className="text-sm text-slate-500">Dr. {fu.doctorId.name} • {fu.doctorId.specialization}</p>
                  )}
                  {isDoctor && fu.patientId && (
                    <p className="text-sm text-slate-500">{fu.patientId.name} • {fu.patientId.email}</p>
                  )}
                </div>
                {!isDoctor && fu.status === 'scheduled' && (
                  <button onClick={() => handleBook(fu._id)} className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">
                    Book Now
                  </button>
                )}
              </div>
              {fu.instructions && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-2"></i>{fu.instructions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Schedule Follow-up</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date *</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm({...form, scheduledDate: e.target.value})} required min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="e.g., Check recovery progress" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions for Patient</label>
                <textarea value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} rows={2} placeholder="e.g., Bring latest blood reports" className="w-full px-3 py-2 border border-slate-200 rounded-lg"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
                <input type="number" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: parseInt(e.target.value)})} min={0} max={100} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpManager;

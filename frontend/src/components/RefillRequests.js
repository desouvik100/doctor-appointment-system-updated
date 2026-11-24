import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const RefillRequests = ({ userId, doctorId, isDoctor = false }) => {
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRefill, setSelectedRefill] = useState(null);
  const [processForm, setProcessForm] = useState({ status: 'approved', doctorNotes: '' });

  useEffect(() => { fetchRefills(); }, [userId, doctorId]);

  const fetchRefills = async () => {
    try {
      const endpoint = isDoctor ? `/api/refills/doctor/${doctorId}` : `/api/refills/patient/${userId}`;
      const res = await axios.get(endpoint);
      setRefills(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/refills/${selectedRefill._id}/process`, processForm);
      toast.success(`Refill request ${processForm.status}`);
      setShowProcessModal(false);
      fetchRefills();
    } catch (e) { toast.error('Failed to process'); }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    partially_approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-slate-100 text-slate-600'
  };

  if (loading) return <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl text-indigo-500"></i></div>;

  return (
    <div className="refill-requests">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          <i className="fas fa-prescription-bottle-alt mr-2 text-indigo-500"></i>
          {isDoctor ? 'Refill Requests' : 'My Refill Requests'}
        </h2>
      </div>

      {refills.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <i className="fas fa-prescription text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500">{isDoctor ? 'No pending refill requests' : 'No refill requests yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refills.map(refill => (
            <div key={refill._id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[refill.status]}`}>
                      {refill.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(refill.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {isDoctor && refill.patientId && (
                    <p className="font-medium text-slate-800">{refill.patientId.name}</p>
                  )}
                  {!isDoctor && refill.doctorId && (
                    <p className="font-medium text-slate-800">Dr. {refill.doctorId.name}</p>
                  )}
                </div>
                {isDoctor && refill.status === 'pending' && (
                  <button onClick={() => { setSelectedRefill(refill); setShowProcessModal(true); }} className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600">
                    Process
                  </button>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Requested Medicines:</p>
                <div className="space-y-1">
                  {refill.medicines.map((med, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{med.name} - {med.dosage}</span>
                      {med.approved !== undefined && (
                        <span className={med.approved ? 'text-green-600' : 'text-red-500'}>
                          <i className={`fas fa-${med.approved ? 'check' : 'times'}`}></i>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {refill.patientNotes && (
                <div className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">Patient Notes:</span> {refill.patientNotes}
                </div>
              )}

              {refill.doctorNotes && (
                <div className="text-sm text-indigo-600 bg-indigo-50 rounded-lg p-2">
                  <span className="font-medium">Doctor's Response:</span> {refill.doctorNotes}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">Refill Fee: <span className="font-medium text-green-600">₹{refill.refillFee}</span></span>
                {refill.processedAt && (
                  <span className="text-slate-400">Processed: {new Date(refill.processedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedRefill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Process Refill Request</h3>
              <p className="text-sm text-slate-500">{selectedRefill.patientId?.name}</p>
            </div>
            <form onSubmit={handleProcess} className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Medicines:</p>
                {selectedRefill.medicines.map((med, i) => (
                  <div key={i} className="text-sm text-slate-700">{med.name} - {med.dosage}</div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
                <select value={processForm.status} onChange={e => setProcessForm({...processForm, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                  <option value="approved">✅ Approve All</option>
                  <option value="partially_approved">⚠️ Partially Approve</option>
                  <option value="rejected">❌ Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes for Patient</label>
                <textarea value={processForm.doctorNotes} onChange={e => setProcessForm({...processForm, doctorNotes: e.target.value})} rows={3} placeholder="Any instructions or reasons..." className="w-full px-3 py-2 border border-slate-200 rounded-lg"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProcessModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefillRequests;

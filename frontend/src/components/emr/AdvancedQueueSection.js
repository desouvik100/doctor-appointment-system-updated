import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const AdvancedQueueSection = ({ clinicId, clinicName, doctors }) => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('consultation');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(null);
  const [tokenForm, setTokenForm] = useState({
    patientName: '', patientPhone: '', patientAge: '', patientGender: 'male',
    doctorId: '', department: 'consultation', tokenType: 'regular', chiefComplaint: ''
  });

  const departments = [
    { id: 'consultation', name: 'Consultation', icon: 'fa-stethoscope', color: 'blue' },
    { id: 'lab', name: 'Laboratory', icon: 'fa-flask', color: 'purple' },
    { id: 'pharmacy', name: 'Pharmacy', icon: 'fa-pills', color: 'emerald' },
    { id: 'billing', name: 'Billing', icon: 'fa-file-invoice', color: 'amber' },
    { id: 'radiology', name: 'Radiology', icon: 'fa-x-ray', color: 'rose' },
    { id: 'procedure', name: 'Procedures', icon: 'fa-syringe', color: 'cyan' }
  ];

  const tokenTypes = [
    { id: 'regular', name: 'Regular', color: 'slate' },
    { id: 'priority', name: 'Priority', color: 'amber' },
    { id: 'emergency', name: 'Emergency', color: 'red' },
    { id: 'vip', name: 'VIP', color: 'purple' },
    { id: 'senior', name: 'Senior Citizen', color: 'blue' }
  ];

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams({ department: selectedDepartment });
      if (selectedDoctor) params.append('doctorId', selectedDoctor);
      const res = await axios.get(`/api/advanced-queue/clinic/${clinicId}/queue?${params}`);
      setQueue(res.data.queue || []);
    } catch (err) { console.error(err); }
  }, [clinicId, selectedDepartment, selectedDoctor]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`/api/advanced-queue/clinic/${clinicId}/stats`);
      setStats(res.data.summary || {});
      setDepartmentStats(res.data.departmentStats || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [clinicId]);

  useEffect(() => { fetchQueue(); fetchStats(); const interval = setInterval(() => { fetchQueue(); fetchStats(); }, 30000); return () => clearInterval(interval); }, [fetchQueue, fetchStats]);

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!tokenForm.patientName || !tokenForm.patientPhone) { toast.error('Name and phone required'); return; }
    try {
      const doctor = doctors.find(d => d._id === tokenForm.doctorId);
      const res = await axios.post('/api/advanced-queue/token/issue', {
        ...tokenForm, clinicId, doctorName: doctor?.name
      });
      toast.success(`Token ${res.data.token.tokenNumber} issued!`);
      setShowIssueModal(false);
      setTokenForm({ patientName: '', patientPhone: '', patientAge: '', patientGender: 'male', doctorId: '', department: 'consultation', tokenType: 'regular', chiefComplaint: '' });
      fetchQueue(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCallToken = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/call`);
      toast.success('Patient called'); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const handleStartConsultation = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/start`);
      toast.success('Consultation started'); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const handleCompleteConsultation = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/complete`);
      toast.success('Consultation completed'); fetchQueue(); fetchStats();
    } catch (err) { toast.error('Failed'); }
  };

  const handleNoShow = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/no-show`);
      toast.success('Marked as no-show'); fetchQueue(); fetchStats();
    } catch (err) { toast.error('Failed'); }
  };

  const handleRecall = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/recall`);
      toast.success('Patient recalled'); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const handleTransfer = async (tokenId, toDoctorId, toDepartment) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/transfer`, { toDoctorId, toDepartment, reason: 'Transferred by staff' });
      toast.success('Token transferred'); setShowTransferModal(null); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const handleHold = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/hold`, { reason: 'Put on hold' });
      toast.success('Token on hold'); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const handleResume = async (tokenId) => {
    try {
      await axios.post(`/api/advanced-queue/token/${tokenId}/resume`);
      toast.success('Token resumed'); fetchQueue();
    } catch (err) { toast.error('Failed'); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: 'bg-amber-100 text-amber-700', checked_in: 'bg-blue-100 text-blue-700',
      called: 'bg-purple-100 text-purple-700 animate-pulse', in_consultation: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-slate-100 text-slate-700', no_show: 'bg-red-100 text-red-700',
      on_hold: 'bg-orange-100 text-orange-700', transferred: 'bg-cyan-100 text-cyan-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  const getTokenTypeBadge = (type) => {
    const badges = {
      regular: '', priority: 'bg-amber-500 text-white', emergency: 'bg-red-500 text-white animate-pulse',
      vip: 'bg-purple-500 text-white', senior: 'bg-blue-500 text-white'
    };
    return badges[type] || '';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <i className="fas fa-users text-blue-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
          <p className="text-sm text-slate-500">Total Today</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <i className="fas fa-clock text-amber-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{stats.waiting || 0}</p>
          <p className="text-sm text-slate-500">Waiting</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <i className="fas fa-user-md text-emerald-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{stats.inConsultation || 0}</p>
          <p className="text-sm text-slate-500">In Consultation</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
          <i className="fas fa-check-circle text-purple-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{stats.completed || 0}</p>
          <p className="text-sm text-slate-500">Completed</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <i className="fas fa-user-slash text-red-500 mb-2"></i>
          <p className="text-2xl font-bold text-slate-800">{stats.noShow || 0}</p>
          <p className="text-sm text-slate-500">No Show</p>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {departments.map(dept => (
            <button key={dept.id} onClick={() => setSelectedDepartment(dept.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedDepartment === dept.id ? `bg-${dept.color}-500 text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <i className={`fas ${dept.icon}`}></i>
              <span>{dept.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {departmentStats.find(d => d._id === dept.id)?.waiting || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Queue Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <i className="fas fa-list-ol text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Queue Management</h2>
              <p className="text-sm text-slate-500">{departments.find(d => d.id === selectedDepartment)?.name} Queue</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl">
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <button onClick={() => setShowDisplayModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">
              <i className="fas fa-tv mr-2"></i>Display
            </button>
            <button onClick={() => setShowIssueModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>Issue Token
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Token</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Doctor</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Wait Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((token, idx) => (
                <tr key={token._id} className={`hover:bg-slate-50 ${token.status === 'called' ? 'bg-purple-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg font-bold text-lg ${token.tokenType !== 'regular' ? getTokenTypeBadge(token.tokenType) : 'bg-slate-100'}`}>
                        {token.tokenNumber}
                      </span>
                      {token.isVirtualQueue && <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">Virtual</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{token.patientName}</p>
                    <p className="text-sm text-slate-500">{token.patientPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{token.doctorId?.name || token.doctorName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{token.estimatedWaitTime || 0} min</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(token.status)}`}>
                      {token.status?.replace('_', ' ')}
                    </span>
                    {token.callCount > 1 && <span className="ml-1 text-xs text-orange-500">({token.callCount}x)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {token.status === 'waiting' && (
                        <button onClick={() => handleCallToken(token._id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Call"><i className="fas fa-bullhorn"></i></button>
                      )}
                      {token.status === 'called' && (
                        <>
                          <button onClick={() => handleStartConsultation(token._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Start"><i className="fas fa-play"></i></button>
                          <button onClick={() => handleRecall(token._id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Recall"><i className="fas fa-redo"></i></button>
                          <button onClick={() => handleNoShow(token._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="No Show"><i className="fas fa-user-slash"></i></button>
                        </>
                      )}
                      {token.status === 'in_consultation' && (
                        <button onClick={() => handleCompleteConsultation(token._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Complete"><i className="fas fa-check"></i></button>
                      )}
                      {token.status === 'on_hold' ? (
                        <button onClick={() => handleResume(token._id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Resume"><i className="fas fa-play-circle"></i></button>
                      ) : token.status !== 'completed' && token.status !== 'no_show' && (
                        <button onClick={() => handleHold(token._id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Hold"><i className="fas fa-pause"></i></button>
                      )}
                      {token.status !== 'completed' && token.status !== 'no_show' && (
                        <button onClick={() => setShowTransferModal(token)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg" title="Transfer"><i className="fas fa-exchange-alt"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {queue.length === 0 && <p className="text-center py-8 text-slate-500">No patients in queue</p>}
        </div>
      </div>

      {/* Issue Token Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Issue New Token</h3>
              <button onClick={() => setShowIssueModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleIssueToken} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                  <input type="text" value={tokenForm.patientName} onChange={(e) => setTokenForm({...tokenForm, patientName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input type="tel" value={tokenForm.patientPhone} onChange={(e) => setTokenForm({...tokenForm, patientPhone: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input type="number" value={tokenForm.patientAge} onChange={(e) => setTokenForm({...tokenForm, patientAge: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select value={tokenForm.patientGender} onChange={(e) => setTokenForm({...tokenForm, patientGender: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Token Type</label>
                  <select value={tokenForm.tokenType} onChange={(e) => setTokenForm({...tokenForm, tokenType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {tokenTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select value={tokenForm.department} onChange={(e) => setTokenForm({...tokenForm, department: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                  <select value={tokenForm.doctorId} onChange={(e) => setTokenForm({...tokenForm, doctorId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint</label>
                <input type="text" value={tokenForm.chiefComplaint} onChange={(e) => setTokenForm({...tokenForm, chiefComplaint: e.target.value})} placeholder="Reason for visit" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg">Issue Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Transfer Token {showTransferModal.tokenNumber}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Transfer to Doctor</label>
                <select id="transferDoctor" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="">Select Doctor</option>
                  {doctors.filter(d => d._id !== showTransferModal.doctorId?._id).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Transfer to Department</label>
                <select id="transferDept" defaultValue={showTransferModal.department} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowTransferModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl">Cancel</button>
                <button onClick={() => {
                  const doc = document.getElementById('transferDoctor').value;
                  const dept = document.getElementById('transferDept').value;
                  handleTransfer(showTransferModal._id, doc, dept);
                }} className="flex-1 py-3 bg-cyan-500 text-white font-medium rounded-xl">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Board Modal */}
      {showDisplayModal && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button onClick={() => setShowDisplayModal(false)} className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl"><i className="fas fa-times"></i></button>
          <div className="w-full h-full p-8 flex flex-col">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">{clinicName || 'Hospital'}</h1>
              <p className="text-xl text-white/60">Token Display Board</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-3"><i className="fas fa-user-md"></i> Now Serving</h2>
                <div className="space-y-4">
                  {queue.filter(t => t.status === 'in_consultation' || t.status === 'called').slice(0, 5).map(token => (
                    <div key={token._id} className={`p-6 rounded-2xl ${token.status === 'called' ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-5xl font-bold text-white">{token.tokenNumber}</span>
                        <div className="text-right">
                          <p className="text-xl text-white/80">{token.patientName}</p>
                          <p className="text-white/60">{token.doctorId?.name || token.doctorName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3"><i className="fas fa-clock"></i> Waiting ({queue.filter(t => t.status === 'waiting').length})</h2>
                <div className="grid grid-cols-3 gap-4">
                  {queue.filter(t => t.status === 'waiting').slice(0, 12).map(token => (
                    <div key={token._id} className={`p-4 rounded-xl text-center ${token.tokenType === 'emergency' ? 'bg-red-500' : token.tokenType === 'priority' ? 'bg-amber-500' : 'bg-white/20'}`}>
                      <span className="text-2xl font-bold text-white">{token.tokenNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-white/40 text-sm">Powered by <span className="text-indigo-400 font-semibold">HealthSync</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedQueueSection;

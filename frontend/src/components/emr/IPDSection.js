import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const IPDSection = ({ clinicId, clinicName, doctors, patients }) => {
  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('admitted');
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showProgressNoteModal, setShowProgressNoteModal] = useState(false);
  const [showBedTransferModal, setShowBedTransferModal] = useState(false);
  const [activeTab, setActiveTab] = useState('admissions'); // admissions, beds

  const [admitForm, setAdmitForm] = useState({
    patientId: '', patientName: '', patientPhone: '', patientAge: '', patientGender: 'male',
    chiefComplaint: '', provisionalDiagnosis: '', attendingDoctorId: '', bedId: '',
    wardType: 'general', admissionType: 'elective', treatmentPlan: '', estimatedCost: ''
  });

  const [dischargeForm, setDischargeForm] = useState({
    dischargeType: 'normal', dischargeCondition: '', dischargeSummary: '', finalDiagnosis: ''
  });

  const [progressNote, setProgressNote] = useState('');
  const [transferBedId, setTransferBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  useEffect(() => { fetchData(); }, [clinicId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAdmissions(), fetchBeds(), fetchStats()]);
    setLoading(false);
  };

  const fetchAdmissions = async () => {
    try {
      const res = await axios.get(`/api/ipd/clinic/${clinicId}`, { params: { status: filter !== 'all' ? filter : undefined } });
      setAdmissions(res.data.admissions || []);
    } catch (err) { console.error(err); }
  };

  const fetchBeds = async () => {
    try {
      const res = await axios.get(`/api/beds/clinic/${clinicId}`);
      setBeds(res.data.beds || []);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const [ipdStats, bedOccupancy] = await Promise.all([
        axios.get(`/api/ipd/stats/${clinicId}`),
        axios.get(`/api/beds/occupancy/${clinicId}`)
      ]);
      setStats({
        ...ipdStats.data.stats,
        bedOccupancy: bedOccupancy.data.totals
      });
    } catch (err) { console.error(err); }
  };

  // Fetch admissions when filter changes (but not on initial mount)
  useEffect(() => { 
    if (!loading) {
      fetchAdmissions(); 
    }
  }, [filter]);

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!admitForm.patientName || !admitForm.chiefComplaint) {
      toast.error('Patient name and chief complaint are required');
      return;
    }
    try {
      await axios.post('/api/ipd/admit', { ...admitForm, clinicId });
      toast.success('Patient admitted successfully');
      setShowAdmitModal(false);
      resetAdmitForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to admit patient'); }
  };

  const handleDischarge = async () => {
    if (!selectedAdmission) return;
    try {
      await axios.post(`/api/ipd/${selectedAdmission._id}/discharge`, dischargeForm);
      toast.success('Patient discharged successfully');
      setShowDischargeModal(false);
      setSelectedAdmission(null);
      setDischargeForm({ dischargeType: 'normal', dischargeCondition: '', dischargeSummary: '', finalDiagnosis: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to discharge patient'); }
  };

  const handleAddProgressNote = async () => {
    if (!selectedAdmission || !progressNote.trim()) return;
    try {
      await axios.post(`/api/ipd/${selectedAdmission._id}/progress-note`, { note: progressNote });
      toast.success('Progress note added');
      setShowProgressNoteModal(false);
      setProgressNote('');
      fetchAdmissions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add note'); }
  };

  const handleBedTransfer = async () => {
    if (!selectedAdmission || !transferBedId) return;
    try {
      await axios.post(`/api/ipd/${selectedAdmission._id}/transfer-bed`, { newBedId: transferBedId, reason: transferReason });
      toast.success('Bed transferred successfully');
      setShowBedTransferModal(false);
      setTransferBedId('');
      setTransferReason('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to transfer bed'); }
  };

  const handleLockRecord = async (admissionId) => {
    if (!window.confirm('Lock this record? This action cannot be undone.')) return;
    try {
      await axios.post(`/api/ipd/${admissionId}/lock`);
      toast.success('Record locked');
      fetchAdmissions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to lock record'); }
  };

  const handleSignRecord = async (admissionId, type) => {
    try {
      await axios.post(`/api/ipd/${admissionId}/sign`, { signatureType: type });
      toast.success(`${type} signed successfully`);
      fetchAdmissions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to sign record'); }
  };

  const resetAdmitForm = () => {
    setAdmitForm({
      patientId: '', patientName: '', patientPhone: '', patientAge: '', patientGender: 'male',
      chiefComplaint: '', provisionalDiagnosis: '', attendingDoctorId: '', bedId: '',
      wardType: 'general', admissionType: 'elective', treatmentPlan: '', estimatedCost: ''
    });
  };

  const availableBeds = beds.filter(b => b.status === 'available');
  const filteredAdmissions = admissions.filter(a =>
    a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.admissionNumber?.includes(searchTerm)
  );

  const getStatusBadge = (status) => {
    const badges = {
      admitted: 'bg-blue-100 text-blue-700',
      in_treatment: 'bg-amber-100 text-amber-700',
      discharged: 'bg-emerald-100 text-emerald-700',
      transferred: 'bg-purple-100 text-purple-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  const getBedStatusColor = (status) => {
    const colors = {
      available: 'bg-emerald-500',
      occupied: 'bg-red-500',
      reserved: 'bg-amber-500',
      maintenance: 'bg-slate-500',
      cleaning: 'bg-blue-500'
    };
    return colors[status] || 'bg-slate-400';
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Admitted', value: stats.byStatus?.find(s => s._id === 'admitted')?.count || 0, icon: 'fa-bed', color: 'blue' },
          { label: 'In Treatment', value: stats.byStatus?.find(s => s._id === 'in_treatment')?.count || 0, icon: 'fa-stethoscope', color: 'amber' },
          { label: 'Today Admissions', value: stats.todayAdmissions || 0, icon: 'fa-user-plus', color: 'emerald' },
          { label: 'Today Discharges', value: stats.todayDischarges || 0, icon: 'fa-user-check', color: 'purple' },
          { label: 'Bed Occupancy', value: `${stats.bedOccupancy?.occupancyRate || 0}%`, icon: 'fa-chart-pie', color: 'indigo' }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
            <i className={`fas ${stat.icon} text-${stat.color}-500 mb-2`}></i>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <i className="fas fa-procedures text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">IPD Management</h2>
              <p className="text-sm text-slate-500">Manage inpatient admissions and beds</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('admissions')} className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'admissions' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <i className="fas fa-clipboard-list mr-2"></i>Admissions
            </button>
            <button onClick={() => setActiveTab('beds')} className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'beds' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <i className="fas fa-bed mr-2"></i>Bed Map
            </button>
            <button onClick={() => { resetAdmitForm(); setShowAdmitModal(true); }} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg">
              <i className="fas fa-plus mr-2"></i>New Admission
            </button>
          </div>
        </div>

        {activeTab === 'admissions' && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Search by patient name or admission #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl" />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl">
                <option value="all">All Status</option>
                <option value="admitted">Admitted</option>
                <option value="in_treatment">In Treatment</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>

            {/* Admissions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Admission #</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Ward/Bed</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Doctor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Admitted</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdmissions.map(admission => (
                    <tr key={admission._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{admission.admissionNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{admission.patientName}</p>
                        <p className="text-sm text-slate-500">{admission.patientPhone} • {admission.patientAge}y/{admission.patientGender?.charAt(0).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 rounded text-sm">{admission.wardType}</span>
                        <span className="ml-2 text-slate-600">Bed {admission.bedNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{admission.attendingDoctorName || 'Not assigned'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(admission.admissionDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(admission.status)}`}>
                          {admission.status?.replace('_', ' ')}
                        </span>
                        {admission.isLocked && <i className="fas fa-lock text-amber-500 ml-2" title="Record Locked"></i>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelectedAdmission(admission); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                            <i className="fas fa-eye"></i>
                          </button>
                          {admission.status !== 'discharged' && !admission.isLocked && (
                            <>
                              <button onClick={() => { setSelectedAdmission(admission); setShowProgressNoteModal(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Add Note">
                                <i className="fas fa-notes-medical"></i>
                              </button>
                              <button onClick={() => { setSelectedAdmission(admission); setShowBedTransferModal(true); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Transfer Bed">
                                <i className="fas fa-exchange-alt"></i>
                              </button>
                              <button onClick={() => { setSelectedAdmission(admission); setShowDischargeModal(true); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Discharge">
                                <i className="fas fa-sign-out-alt"></i>
                              </button>
                            </>
                          )}
                          {admission.status === 'discharged' && !admission.isLocked && (
                            <button onClick={() => handleLockRecord(admission._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Lock Record">
                              <i className="fas fa-lock"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAdmissions.length === 0 && <p className="text-center py-8 text-slate-500">No admissions found</p>}
            </div>
          </>
        )}

        {activeTab === 'beds' && (
          <div className="space-y-6">
            {/* Bed Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl">
              {[
                { status: 'available', label: 'Available' },
                { status: 'occupied', label: 'Occupied' },
                { status: 'reserved', label: 'Reserved' },
                { status: 'maintenance', label: 'Maintenance' },
                { status: 'cleaning', label: 'Cleaning' }
              ].map(item => (
                <div key={item.status} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${getBedStatusColor(item.status)}`}></div>
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Beds by Ward */}
            {['general', 'icu', 'private', 'semi_private', 'pediatric', 'maternity'].map(wardType => {
              const wardBeds = beds.filter(b => b.wardType === wardType);
              if (wardBeds.length === 0) return null;
              return (
                <div key={wardType} className="border border-slate-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-800 mb-4 capitalize">{wardType.replace('_', ' ')} Ward ({wardBeds.filter(b => b.status === 'available').length}/{wardBeds.length} available)</h3>
                  <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                    {wardBeds.map(bed => (
                      <div key={bed._id} className={`p-3 rounded-lg ${getBedStatusColor(bed.status)} text-white text-center cursor-pointer hover:opacity-80`} title={`${bed.bedNumber} - ${bed.status}${bed.currentPatientId?.name ? ` (${bed.currentPatientId.name})` : ''}`}>
                        <i className="fas fa-bed text-lg"></i>
                        <p className="text-xs mt-1 font-medium">{bed.bedNumber}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">New IPD Admission</h3>
              <button onClick={() => setShowAdmitModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAdmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                  <input type="text" value={admitForm.patientName} onChange={(e) => setAdmitForm({...admitForm, patientName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Enter patient name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={admitForm.patientPhone} onChange={(e) => setAdmitForm({...admitForm, patientPhone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Phone number" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input type="number" value={admitForm.patientAge} onChange={(e) => setAdmitForm({...admitForm, patientAge: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select value={admitForm.patientGender} onChange={(e) => setAdmitForm({...admitForm, patientGender: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admission Type</label>
                  <select value={admitForm.admissionType} onChange={(e) => setAdmitForm({...admitForm, admissionType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="elective">Elective</option>
                    <option value="emergency">Emergency</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint *</label>
                <textarea value={admitForm.chiefComplaint} onChange={(e) => setAdmitForm({...admitForm, chiefComplaint: e.target.value})} required rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Main reason for admission"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provisional Diagnosis</label>
                <input type="text" value={admitForm.provisionalDiagnosis} onChange={(e) => setAdmitForm({...admitForm, provisionalDiagnosis: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Initial diagnosis" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attending Doctor</label>
                  <select value={admitForm.attendingDoctorId} onChange={(e) => {
                    const doc = doctors?.find(d => d._id === e.target.value);
                    setAdmitForm({...admitForm, attendingDoctorId: e.target.value, attendingDoctorName: doc?.name || ''});
                  }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Doctor</option>
                    {doctors?.map(d => <option key={d._id} value={d._id}>{d.name} - {d.specialization}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ward Type</label>
                  <select value={admitForm.wardType} onChange={(e) => setAdmitForm({...admitForm, wardType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="general">General Ward</option>
                    <option value="semi_private">Semi-Private</option>
                    <option value="private">Private Room</option>
                    <option value="icu">ICU</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="maternity">Maternity</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Bed</label>
                <select value={admitForm.bedId} onChange={(e) => setAdmitForm({...admitForm, bedId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="">Select Available Bed</option>
                  {availableBeds.filter(b => !admitForm.wardType || b.wardType === admitForm.wardType).map(b => (
                    <option key={b._id} value={b._id}>{b.bedNumber} - {b.wardType} (Room {b.roomNumber || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Plan</label>
                <textarea value={admitForm.treatmentPlan} onChange={(e) => setAdmitForm({...admitForm, treatmentPlan: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Initial treatment plan"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdmitModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg">Admit Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Discharge Patient</h3>
              <button onClick={() => setShowDischargeModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-800">{selectedAdmission.patientName}</p>
                <p className="text-sm text-slate-500">Admission: {selectedAdmission.admissionNumber} • Bed: {selectedAdmission.bedNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discharge Type</label>
                <select value={dischargeForm.dischargeType} onChange={(e) => setDischargeForm({...dischargeForm, dischargeType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="normal">Normal Discharge</option>
                  <option value="against_advice">Against Medical Advice (LAMA)</option>
                  <option value="transfer">Transfer to Another Hospital</option>
                  <option value="death">Death</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition at Discharge</label>
                <select value={dischargeForm.dischargeCondition} onChange={(e) => setDischargeForm({...dischargeForm, dischargeCondition: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="">Select Condition</option>
                  <option value="recovered">Recovered</option>
                  <option value="improved">Improved</option>
                  <option value="unchanged">Unchanged</option>
                  <option value="deteriorated">Deteriorated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Final Diagnosis</label>
                <input type="text" value={dischargeForm.finalDiagnosis} onChange={(e) => setDischargeForm({...dischargeForm, finalDiagnosis: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Final diagnosis" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discharge Summary</label>
                <textarea value={dischargeForm.dischargeSummary} onChange={(e) => setDischargeForm({...dischargeForm, dischargeSummary: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Summary of treatment and instructions"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowDischargeModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleDischarge} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg">Discharge Patient</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Note Modal */}
      {showProgressNoteModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Add Progress Note</h3>
              <button onClick={() => setShowProgressNoteModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-800">{selectedAdmission.patientName}</p>
                <p className="text-sm text-slate-500">Admission: {selectedAdmission.admissionNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Progress Note</label>
                <textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Enter progress note..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowProgressNoteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleAddProgressNote} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg">Add Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bed Transfer Modal */}
      {showBedTransferModal && selectedAdmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Transfer Bed</h3>
              <button onClick={() => setShowBedTransferModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-medium text-slate-800">{selectedAdmission.patientName}</p>
                <p className="text-sm text-slate-500">Current: {selectedAdmission.wardType} - Bed {selectedAdmission.bedNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Bed</label>
                <select value={transferBedId} onChange={(e) => setTransferBedId(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  <option value="">Select Available Bed</option>
                  {availableBeds.map(b => (
                    <option key={b._id} value={b._id}>{b.bedNumber} - {b.wardType} (Room {b.roomNumber || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Transfer</label>
                <input type="text" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="e.g., Patient condition improved" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowBedTransferModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button onClick={handleBedTransfer} className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg">Transfer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Admission Details Modal */}
      {selectedAdmission && !showDischargeModal && !showProgressNoteModal && !showBedTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Admission Details</h3>
              <div className="flex gap-2">
                {selectedAdmission.status !== 'discharged' && !selectedAdmission.admissionSignature && (
                  <button onClick={() => handleSignRecord(selectedAdmission._id, 'admission')} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm">
                    <i className="fas fa-signature mr-1"></i>Sign Admission
                  </button>
                )}
                {selectedAdmission.status === 'discharged' && !selectedAdmission.dischargeSignature && (
                  <button onClick={() => handleSignRecord(selectedAdmission._id, 'discharge')} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
                    <i className="fas fa-signature mr-1"></i>Sign Discharge
                  </button>
                )}
                <button onClick={() => setSelectedAdmission(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Patient Information</h4>
                  <p className="font-bold text-lg text-slate-800">{selectedAdmission.patientName}</p>
                  <p className="text-slate-600">{selectedAdmission.patientAge}y / {selectedAdmission.patientGender}</p>
                  <p className="text-slate-600">{selectedAdmission.patientPhone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Admission Info</h4>
                  <p className="font-bold text-slate-800">{selectedAdmission.admissionNumber}</p>
                  <p className="text-slate-600">{new Date(selectedAdmission.admissionDate).toLocaleString()}</p>
                  <p className="text-slate-600">{selectedAdmission.wardType} - Bed {selectedAdmission.bedNumber}</p>
                </div>
              </div>

              {/* Clinical Info */}
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-500 mb-1">Chief Complaint</h4>
                  <p className="text-slate-800">{selectedAdmission.chiefComplaint}</p>
                </div>
                {selectedAdmission.provisionalDiagnosis && (
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-500 mb-1">Provisional Diagnosis</h4>
                    <p className="text-slate-800">{selectedAdmission.provisionalDiagnosis}</p>
                  </div>
                )}
                {selectedAdmission.treatmentPlan && (
                  <div className="p-4 border border-slate-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-500 mb-1">Treatment Plan</h4>
                    <p className="text-slate-800">{selectedAdmission.treatmentPlan}</p>
                  </div>
                )}
              </div>

              {/* Progress Notes */}
              {selectedAdmission.progressNotes?.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Progress Notes</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedAdmission.progressNotes.map((note, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-slate-800">{note.note}</p>
                        <p className="text-xs text-slate-500 mt-1">{note.writerName} ({note.writerRole}) • {new Date(note.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discharge Info */}
              {selectedAdmission.status === 'discharged' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="font-semibold text-emerald-800 mb-2">Discharge Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-emerald-600">Date:</span> {new Date(selectedAdmission.dischargeDate).toLocaleString()}</div>
                    <div><span className="text-emerald-600">Type:</span> {selectedAdmission.dischargeType}</div>
                    <div><span className="text-emerald-600">Condition:</span> {selectedAdmission.dischargeCondition}</div>
                    <div><span className="text-emerald-600">Final Diagnosis:</span> {selectedAdmission.finalDiagnosis}</div>
                  </div>
                  {selectedAdmission.dischargeSummary && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-sm text-emerald-600 mb-1">Discharge Summary:</p>
                      <p className="text-emerald-800">{selectedAdmission.dischargeSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Signatures */}
              <div className="flex gap-4">
                {selectedAdmission.admissionSignature && (
                  <div className="flex-1 p-3 bg-blue-50 rounded-lg text-center">
                    <i className="fas fa-check-circle text-blue-500 text-xl"></i>
                    <p className="text-sm text-blue-700 mt-1">Admission Signed</p>
                    <p className="text-xs text-blue-500">{new Date(selectedAdmission.admissionSignature.signedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedAdmission.dischargeSignature && (
                  <div className="flex-1 p-3 bg-emerald-50 rounded-lg text-center">
                    <i className="fas fa-check-circle text-emerald-500 text-xl"></i>
                    <p className="text-sm text-emerald-700 mt-1">Discharge Signed</p>
                    <p className="text-xs text-emerald-500">{new Date(selectedAdmission.dischargeSignature.signedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedAdmission.isLocked && (
                  <div className="flex-1 p-3 bg-amber-50 rounded-lg text-center">
                    <i className="fas fa-lock text-amber-500 text-xl"></i>
                    <p className="text-sm text-amber-700 mt-1">Record Locked</p>
                    <p className="text-xs text-amber-500">{new Date(selectedAdmission.lockedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPDSection;

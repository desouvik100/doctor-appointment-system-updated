import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const InsuranceClaimsSection = ({ clinicId }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [stats, setStats] = useState({ byStatus: [], byProvider: [] });
  const [filter, setFilter] = useState({ status: '', provider: '' });
  const [form, setForm] = useState({
    patientName: '', policyNumber: '', insuranceProvider: '', claimType: 'cashless',
    claimAmount: '', diagnosisDescription: '', treatmentType: 'opd'
  });

  const providers = ['Star Health', 'ICICI Lombard', 'HDFC Ergo', 'Bajaj Allianz', 'Max Bupa', 'Religare', 'New India', 'United India', 'Oriental', 'National'];
  const statusColors = {
    draft: '#64748b', submitted: '#3b82f6', under_review: '#f59e0b', query_raised: '#ef4444',
    pre_approved: '#8b5cf6', approved: '#10b981', partially_approved: '#f59e0b', rejected: '#ef4444', settled: '#059669'
  };

  useEffect(() => { fetchClaims(); fetchStats(); }, [clinicId, filter]);

  const fetchClaims = async () => {
    try {
      const params = new URLSearchParams({ ...filter });
      const res = await axios.get(`/api/insurance/claims/clinic/${clinicId}?${params}`);
      setClaims(res.data.claims || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`/api/insurance/stats/${clinicId}`);
      setStats({ byStatus: res.data.stats || [], byProvider: res.data.byProvider || [] });
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/insurance/claims', { ...form, clinicId });
      toast.success('Claim created successfully');
      setShowModal(false);
      setForm({ patientName: '', policyNumber: '', insuranceProvider: '', claimType: 'cashless', claimAmount: '', diagnosisDescription: '', treatmentType: 'opd' });
      fetchClaims();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create claim'); }
  };

  const submitClaim = async (id) => {
    try {
      await axios.post(`/api/insurance/claims/${id}/submit`);
      toast.success('Claim submitted');
      fetchClaims();
    } catch (err) { toast.error('Failed to submit'); }
  };

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: claims.length, color: '#6366f1', icon: 'file-medical' },
          { label: 'Pending', value: claims.filter(c => ['submitted', 'under_review'].includes(c.status)).length, color: '#f59e0b', icon: 'clock' },
          { label: 'Approved', value: claims.filter(c => c.status === 'approved').length, color: '#10b981', icon: 'check-circle' },
          { label: 'Total Amount', value: formatCurrency(claims.reduce((s, c) => s + (c.claimAmount || 0), 0)), color: '#3b82f6', icon: 'rupee-sign' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <i className={`fas fa-${stat.icon}`} style={{ color: stat.color }}></i>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-file-invoice-dollar text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Insurance Claims</h2>
              <p className="text-sm text-slate-500">TPA & Insurance Management</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>New Claim
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-xl">
            <option value="">All Status</option>
            {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={filter.provider} onChange={e => setFilter({...filter, provider: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-xl">
            <option value="">All Providers</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Claim #</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Provider</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{claim.claimNumber}</td>
                  <td className="py-3 px-4 text-slate-600">{claim.patientName}</td>
                  <td className="py-3 px-4 text-slate-600">{claim.insuranceProvider}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">{claim.claimType}</span></td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(claim.claimAmount)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[claim.status]}15`, color: statusColors[claim.status] }}>
                      {claim.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedClaim(claim)} className="p-2 hover:bg-slate-100 rounded-lg" title="View"><i className="fas fa-eye text-slate-500"></i></button>
                      {claim.status === 'draft' && <button onClick={() => submitClaim(claim._id)} className="p-2 hover:bg-blue-50 rounded-lg" title="Submit"><i className="fas fa-paper-plane text-blue-500"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 && <p className="text-center py-8 text-slate-500">No claims found</p>}
        </div>
      </div>

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">New Insurance Claim</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                  <input type="text" value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number *</label>
                  <input type="text" value={form.policyNumber} onChange={e => setForm({...form, policyNumber: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Provider *</label>
                  <select value={form.insuranceProvider} onChange={e => setForm({...form, insuranceProvider: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="">Select Provider</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Claim Type</label>
                  <select value={form.claimType} onChange={e => setForm({...form, claimType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="cashless">Cashless</option>
                    <option value="reimbursement">Reimbursement</option>
                    <option value="pre_auth">Pre-Authorization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Type</label>
                  <select value={form.treatmentType} onChange={e => setForm({...form, treatmentType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    <option value="opd">OPD</option>
                    <option value="ipd">IPD</option>
                    <option value="daycare">Daycare</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Claim Amount (₹) *</label>
                  <input type="number" value={form.claimAmount} onChange={e => setForm({...form, claimAmount: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                  <textarea value={form.diagnosisDescription} onChange={e => setForm({...form, diagnosisDescription: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Create Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Claim Details - {selectedClaim.claimNumber}</h3>
              <button onClick={() => setSelectedClaim(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-slate-500">Patient</p><p className="font-medium">{selectedClaim.patientName}</p></div>
                <div><p className="text-sm text-slate-500">Policy Number</p><p className="font-medium">{selectedClaim.policyNumber}</p></div>
                <div><p className="text-sm text-slate-500">Provider</p><p className="font-medium">{selectedClaim.insuranceProvider}</p></div>
                <div><p className="text-sm text-slate-500">Claim Type</p><p className="font-medium capitalize">{selectedClaim.claimType}</p></div>
                <div><p className="text-sm text-slate-500">Claim Amount</p><p className="font-medium text-lg">{formatCurrency(selectedClaim.claimAmount)}</p></div>
                <div><p className="text-sm text-slate-500">Approved Amount</p><p className="font-medium text-lg text-green-600">{formatCurrency(selectedClaim.approvedAmount)}</p></div>
                <div><p className="text-sm text-slate-500">Status</p><span className="px-3 py-1 rounded-full text-sm font-medium capitalize" style={{ background: `${statusColors[selectedClaim.status]}15`, color: statusColors[selectedClaim.status] }}>{selectedClaim.status?.replace('_', ' ')}</span></div>
                <div><p className="text-sm text-slate-500">Created</p><p className="font-medium">{new Date(selectedClaim.createdAt).toLocaleDateString('en-IN')}</p></div>
              </div>
              {selectedClaim.diagnosisDescription && (
                <div><p className="text-sm text-slate-500">Diagnosis</p><p className="font-medium">{selectedClaim.diagnosisDescription}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaimsSection;

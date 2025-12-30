import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const MultiBranchSection = ({ clinicId, organizationId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [form, setForm] = useState({
    branchName: '', branchCode: '', branchType: 'hospital', city: '', state: '', address: '',
    phone: '', email: '', totalBeds: 0, operatingHours: { open: '08:00', close: '20:00' }
  });

  const branchTypes = ['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'nursing_home'];
  const statusColors = { active: '#10b981', inactive: '#64748b', under_renovation: '#f59e0b', temporarily_closed: '#ef4444' };

  useEffect(() => { fetchBranches(); fetchDashboard(); }, [organizationId || clinicId]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`/api/multi-branch/branches/organization/${organizationId || clinicId}`);
      setBranches(res.data.branches || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`/api/multi-branch/dashboard/${organizationId || clinicId}`);
      setDashboard(res.data.dashboard);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/multi-branch/branches', { ...form, organizationId: organizationId || clinicId });
      toast.success('Branch created successfully');
      setShowModal(false);
      setForm({ branchName: '', branchCode: '', branchType: 'hospital', city: '', state: '', address: '', phone: '', email: '', totalBeds: 0, operatingHours: { open: '08:00', close: '20:00' } });
      fetchBranches();
      fetchDashboard();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create branch'); }
  };

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Branches', value: dashboard.totalBranches, color: '#6366f1', icon: 'building' },
            { label: 'Active', value: dashboard.activeBranches, color: '#10b981', icon: 'check-circle' },
            { label: 'Total Beds', value: dashboard.totalBeds, color: '#3b82f6', icon: 'bed' },
            { label: 'Total Staff', value: dashboard.totalStaff, color: '#8b5cf6', icon: 'users' },
            { label: 'Total Doctors', value: dashboard.totalDoctors, color: '#f59e0b', icon: 'user-md' }
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
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <i className="fas fa-sitemap text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Multi-Branch Management</h2>
              <p className="text-sm text-slate-500">Centralized hospital network control</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>Add Branch
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['overview', 'comparison', 'transfers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        {/* Branches Grid */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => (
              <div key={branch._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{branch.branchName}</h3>
                    <p className="text-sm text-slate-500">{branch.branchCode}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[branch.status]}15`, color: statusColors[branch.status] }}>
                    {branch.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><i className="fas fa-map-marker-alt w-5 text-slate-400"></i>{branch.city}, {branch.state}</p>
                  <p className="text-slate-600"><i className="fas fa-phone w-5 text-slate-400"></i>{branch.phone}</p>
                  <div className="flex gap-4 pt-2 border-t border-slate-100 mt-2">
                    <span className="text-slate-500"><i className="fas fa-bed mr-1"></i>{branch.totalBeds || 0} beds</span>
                    <span className="text-slate-500"><i className="fas fa-user-md mr-1"></i>{branch.doctorCount || 0} doctors</span>
                  </div>
                </div>
                <button onClick={() => setSelectedBranch(branch)} className="w-full mt-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">
                  View Details
                </button>
              </div>
            ))}
            {branches.length === 0 && <p className="col-span-full text-center py-8 text-slate-500">No branches found. Add your first branch!</p>}
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Branch</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">City</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Beds</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Doctors</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(branch => (
                  <tr key={branch._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{branch.branchName}</td>
                    <td className="py-3 px-4 text-slate-600">{branch.city}</td>
                    <td className="py-3 px-4 text-slate-600">{branch.totalBeds || 0}</td>
                    <td className="py-3 px-4 text-slate-600">{branch.staffCount || 0}</td>
                    <td className="py-3 px-4 text-slate-600">{branch.doctorCount || 0}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[branch.status]}15`, color: statusColors[branch.status] }}>
                        {branch.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="text-center py-12 text-slate-500">
            <i className="fas fa-exchange-alt text-4xl mb-4 text-slate-300"></i>
            <p>Patient transfer functionality coming soon</p>
            <p className="text-sm">Transfer patients between branches seamlessly</p>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Add New Branch</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name *</label>
                  <input type="text" value={form.branchName} onChange={e => setForm({...form, branchName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code *</label>
                  <input type="text" value={form.branchCode} onChange={e => setForm({...form, branchCode: e.target.value.toUpperCase()})} required placeholder="e.g., MUM-001" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Type</label>
                  <select value={form.branchType} onChange={e => setForm({...form, branchType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {branchTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                  <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Beds</label>
                  <input type="number" value={form.totalBeds} onChange={e => setForm({...form, totalBeds: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Details Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">{selectedBranch.branchName}</h3>
              <button onClick={() => setSelectedBranch(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-slate-500">Branch Code</p><p className="font-medium">{selectedBranch.branchCode}</p></div>
                <div><p className="text-sm text-slate-500">Type</p><p className="font-medium capitalize">{selectedBranch.branchType?.replace('_', ' ')}</p></div>
                <div><p className="text-sm text-slate-500">Location</p><p className="font-medium">{selectedBranch.city}, {selectedBranch.state}</p></div>
                <div><p className="text-sm text-slate-500">Status</p><span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[selectedBranch.status]}15`, color: statusColors[selectedBranch.status] }}>{selectedBranch.status?.replace('_', ' ')}</span></div>
                <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{selectedBranch.phone || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Email</p><p className="font-medium">{selectedBranch.email || '-'}</p></div>
                <div><p className="text-sm text-slate-500">Total Beds</p><p className="font-medium">{selectedBranch.totalBeds || 0}</p></div>
                <div><p className="text-sm text-slate-500">Staff Count</p><p className="font-medium">{selectedBranch.staffCount || 0}</p></div>
              </div>
              {selectedBranch.address && (
                <div><p className="text-sm text-slate-500">Address</p><p className="font-medium">{selectedBranch.address}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiBranchSection;

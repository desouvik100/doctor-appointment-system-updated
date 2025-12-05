import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const HealthInsurance = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('policies');
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showFileClaim, setShowFileClaim] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ provider: '', policyNumber: '', policyType: 'individual', sumInsured: '', premium: '', startDate: '', endDate: '' });
  const [newClaim, setNewClaim] = useState({ policyId: '', claimType: 'cashless', hospitalName: '', diagnosis: '', estimatedAmount: '' });

  const insuranceProviders = ['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Max Bupa', 'Bajaj Allianz', 'New India Assurance'];

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    const savedPolicies = localStorage.getItem('insurance_policies_' + userId);
    const savedClaims = localStorage.getItem('insurance_claims_' + userId);
    if (savedPolicies) setPolicies(JSON.parse(savedPolicies));
    if (savedClaims) setClaims(JSON.parse(savedClaims));
  };

  const savePolicies = (data) => { localStorage.setItem('insurance_policies_' + userId, JSON.stringify(data)); setPolicies(data); };
  const saveClaims = (data) => { localStorage.setItem('insurance_claims_' + userId, JSON.stringify(data)); setClaims(data); };

  const handleAddPolicy = () => {
    if (!newPolicy.provider || !newPolicy.policyNumber || !newPolicy.sumInsured) { toast.error('Please fill required fields'); return; }
    savePolicies([...policies, { ...newPolicy, id: Date.now(), status: 'active', createdAt: new Date().toISOString() }]);
    setNewPolicy({ provider: '', policyNumber: '', policyType: 'individual', sumInsured: '', premium: '', startDate: '', endDate: '' });
    setShowAddPolicy(false);
    toast.success('Policy added!');
  };

  const handleFileClaim = () => {
    if (!newClaim.policyId || !newClaim.hospitalName || !newClaim.diagnosis) { toast.error('Please fill required fields'); return; }
    saveClaims([...claims, { ...newClaim, id: Date.now(), status: 'submitted', claimNumber: 'CLM' + Date.now().toString().slice(-8), submittedAt: new Date().toISOString() }]);
    setNewClaim({ policyId: '', claimType: 'cashless', hospitalName: '', diagnosis: '', estimatedAmount: '' });
    setShowFileClaim(false);
    toast.success('Claim submitted!');
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const getStatusColor = (status) => ({ active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700', submitted: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', processing: 'bg-amber-100 text-amber-700', settled: 'bg-purple-100 text-purple-700' }[status] || 'bg-slate-100 text-slate-700');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 lg:p-8 text-white">
        <h2 className="text-2xl lg:text-3xl font-bold mb-2">Health Insurance</h2>
        <p className="text-emerald-100">Manage your policies and claims</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ icon: 'fa-shield-alt', value: policies.filter(p => p.status === 'active').length, label: 'Active Policies', color: 'from-emerald-500 to-teal-600' },
          { icon: 'fa-rupee-sign', value: formatCurrency(policies.reduce((sum, p) => sum + (parseInt(p.sumInsured) || 0), 0)), label: 'Total Coverage', color: 'from-blue-500 to-indigo-600' },
          { icon: 'fa-file-invoice', value: claims.length, label: 'Total Claims', color: 'from-amber-500 to-orange-600' },
          { icon: 'fa-check-circle', value: claims.filter(c => c.status === 'settled').length, label: 'Settled', color: 'from-purple-500 to-violet-600' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={'w-12 h-12 rounded-xl bg-gradient-to-br ' + s.color + ' flex items-center justify-center mb-3 shadow-lg'}>
              <i className={'fas ' + s.icon + ' text-white text-lg'}></i>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {[{ id: 'policies', icon: 'fa-file-contract', label: 'Policies' }, { id: 'claims', icon: 'fa-hand-holding-medical', label: 'Claims' }, { id: 'network', icon: 'fa-hospital', label: 'Network' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ' + (activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800')}>
            <i className={'fas ' + tab.icon}></i><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'policies' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Insurance Policies</h3>
            <button onClick={() => setShowAddPolicy(!showAddPolicy)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg">{showAddPolicy ? 'Cancel' : 'Add Policy'}</button>
          </div>

          {showAddPolicy && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={newPolicy.provider} onChange={(e) => setNewPolicy({...newPolicy, provider: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Provider *</option>
                  {insuranceProviders.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" placeholder="Policy Number *" value={newPolicy.policyNumber} onChange={(e) => setNewPolicy({...newPolicy, policyNumber: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="Sum Insured (₹) *" value={newPolicy.sumInsured} onChange={(e) => setNewPolicy({...newPolicy, sumInsured: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="Annual Premium (₹)" value={newPolicy.premium} onChange={(e) => setNewPolicy({...newPolicy, premium: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleAddPolicy} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Save Policy</button>
            </div>
          )}

          {policies.length === 0 ? (
            <div className="text-center py-8"><div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3"><i className="fas fa-shield-alt text-2xl text-slate-400"></i></div><p className="text-slate-500">No policies added yet</p></div>
          ) : (
            <div className="space-y-4">
              {policies.map(policy => (
                <div key={policy.id} className="p-4 rounded-xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><i className="fas fa-building text-white"></i></div>
                      <div><h4 className="font-bold text-slate-800">{policy.provider}</h4><p className="text-sm text-slate-500">{policy.policyNumber}</p></div>
                    </div>
                    <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + getStatusColor(policy.status)}>{policy.status}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-slate-500">Sum Insured</p><p className="font-bold text-slate-800">{formatCurrency(policy.sumInsured)}</p></div>
                    <div><p className="text-slate-500">Premium</p><p className="font-bold text-slate-800">{formatCurrency(policy.premium)}/yr</p></div>
                    <div><p className="text-slate-500">Type</p><p className="font-bold text-slate-800 capitalize">{policy.policyType}</p></div>
                    <div><p className="text-slate-500">Valid Till</p><p className="font-bold text-slate-800">{policy.endDate ? new Date(policy.endDate).toLocaleDateString() : 'N/A'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Insurance Claims</h3>
            <button onClick={() => setShowFileClaim(!showFileClaim)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg">{showFileClaim ? 'Cancel' : 'File Claim'}</button>
          </div>

          {showFileClaim && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={newClaim.policyId} onChange={(e) => setNewClaim({...newClaim, policyId: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Policy *</option>
                  {policies.map(p => <option key={p.id} value={p.id}>{p.provider} - {p.policyNumber}</option>)}
                </select>
                <input type="text" placeholder="Hospital Name *" value={newClaim.hospitalName} onChange={(e) => setNewClaim({...newClaim, hospitalName: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="text" placeholder="Diagnosis *" value={newClaim.diagnosis} onChange={(e) => setNewClaim({...newClaim, diagnosis: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" placeholder="Estimated Amount (₹)" value={newClaim.estimatedAmount} onChange={(e) => setNewClaim({...newClaim, estimatedAmount: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleFileClaim} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Submit Claim</button>
            </div>
          )}

          {claims.length === 0 ? (
            <div className="text-center py-8"><div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3"><i className="fas fa-file-invoice text-2xl text-slate-400"></i></div><p className="text-slate-500">No claims filed yet</p></div>
          ) : (
            <div className="space-y-4">
              {claims.map(claim => (
                <div key={claim.id} className="p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div><h4 className="font-bold text-slate-800">{claim.diagnosis}</h4><p className="text-sm text-slate-500">#{claim.claimNumber}</p></div>
                    <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + getStatusColor(claim.status)}>{claim.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span><i className="fas fa-hospital mr-1"></i>{claim.hospitalName}</span>
                    <span><i className="fas fa-calendar mr-1"></i>{new Date(claim.submittedAt).toLocaleDateString()}</span>
                    <span><i className="fas fa-rupee-sign mr-1"></i>{formatCurrency(claim.estimatedAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'network' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Network Hospitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[{ icon: 'fa-hospital', value: '10,000+', label: 'Network Hospitals' }, { icon: 'fa-city', value: '500+', label: 'Cities Covered' }, { icon: 'fa-hand-holding-medical', value: 'Cashless', label: 'Treatment Available' }].map((i, idx) => (
              <div key={idx} className="text-center p-4 bg-slate-50 rounded-xl">
                <i className={'fas ' + i.icon + ' text-2xl text-indigo-500 mb-2'}></i>
                <p className="text-xl font-bold text-slate-800">{i.value}</p>
                <p className="text-sm text-slate-500">{i.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => window.open('https://www.google.com/maps/search/network+hospitals+near+me', '_blank')} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">
            <i className="fas fa-map-marker-alt mr-2"></i>Find Nearby Hospitals
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthInsurance;

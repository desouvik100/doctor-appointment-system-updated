import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './HealthInsurance.css';

const HealthInsurance = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('policies');
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showFileClaim, setShowFileClaim] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newPolicy, setNewPolicy] = useState({
    provider: '',
    policyNumber: '',
    policyType: 'individual',
    sumInsured: '',
    premium: '',
    startDate: '',
    endDate: '',
    members: []
  });

  const [newClaim, setNewClaim] = useState({
    policyId: '',
    claimType: 'cashless',
    hospitalName: '',
    admissionDate: '',
    dischargeDate: '',
    diagnosis: '',
    estimatedAmount: '',
    documents: []
  });

  const insuranceProviders = [
    'Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Max Bupa', 
    'Bajaj Allianz', 'New India Assurance', 'United India', 
    'National Insurance', 'Religare', 'Care Health'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedPolicies = localStorage.getItem(`insurance_policies_${userId}`);
    const savedClaims = localStorage.getItem(`insurance_claims_${userId}`);
    if (savedPolicies) setPolicies(JSON.parse(savedPolicies));
    if (savedClaims) setClaims(JSON.parse(savedClaims));
  };

  const savePolicies = (data) => {
    localStorage.setItem(`insurance_policies_${userId}`, JSON.stringify(data));
    setPolicies(data);
  };

  const saveClaims = (data) => {
    localStorage.setItem(`insurance_claims_${userId}`, JSON.stringify(data));
    setClaims(data);
  };

  const handleAddPolicy = () => {
    if (!newPolicy.provider || !newPolicy.policyNumber || !newPolicy.sumInsured) {
      toast.error('Please fill required fields');
      return;
    }
    const policy = {
      ...newPolicy,
      id: Date.now(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    savePolicies([...policies, policy]);
    setNewPolicy({
      provider: '', policyNumber: '', policyType: 'individual',
      sumInsured: '', premium: '', startDate: '', endDate: '', members: []
    });
    setShowAddPolicy(false);
    toast.success('Insurance policy added!');
  };

  const handleFileClaim = () => {
    if (!newClaim.policyId || !newClaim.hospitalName || !newClaim.diagnosis) {
      toast.error('Please fill required fields');
      return;
    }
    const claim = {
      ...newClaim,
      id: Date.now(),
      status: 'submitted',
      claimNumber: `CLM${Date.now().toString().slice(-8)}`,
      submittedAt: new Date().toISOString()
    };
    saveClaims([...claims, claim]);
    setNewClaim({
      policyId: '', claimType: 'cashless', hospitalName: '',
      admissionDate: '', dischargeDate: '', diagnosis: '', estimatedAmount: '', documents: []
    });
    setShowFileClaim(false);
    toast.success('Claim submitted successfully!');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981', expired: '#ef4444', pending: '#f59e0b',
      submitted: '#3b82f6', approved: '#10b981', rejected: '#ef4444',
      processing: '#f59e0b', settled: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="health-insurance">
      {/* Header Stats */}
      <div className="insurance-stats">
        <div className="stat-card">
          <i className="fas fa-shield-alt"></i>
          <div>
            <h4>{policies.filter(p => p.status === 'active').length}</h4>
            <span>Active Policies</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-rupee-sign"></i>
          <div>
            <h4>{formatCurrency(policies.reduce((sum, p) => sum + (parseInt(p.sumInsured) || 0), 0))}</h4>
            <span>Total Coverage</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-file-invoice"></i>
          <div>
            <h4>{claims.length}</h4>
            <span>Total Claims</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-check-circle"></i>
          <div>
            <h4>{claims.filter(c => c.status === 'settled').length}</h4>
            <span>Settled Claims</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="insurance-tabs">
        <button 
          className={activeTab === 'policies' ? 'active' : ''}
          onClick={() => setActiveTab('policies')}
        >
          <i className="fas fa-file-contract"></i> My Policies
        </button>
        <button 
          className={activeTab === 'claims' ? 'active' : ''}
          onClick={() => setActiveTab('claims')}
        >
          <i className="fas fa-hand-holding-medical"></i> Claims
        </button>
        <button 
          className={activeTab === 'network' ? 'active' : ''}
          onClick={() => setActiveTab('network')}
        >
          <i className="fas fa-hospital"></i> Network Hospitals
        </button>
      </div>

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="policies-section">
          <div className="section-header">
            <h3>Insurance Policies</h3>
            <button className="add-btn" onClick={() => setShowAddPolicy(!showAddPolicy)}>
              <i className={`fas fa-${showAddPolicy ? 'times' : 'plus'}`}></i> 
              {showAddPolicy ? 'Cancel' : 'Add Policy'}
            </button>
          </div>

          {showAddPolicy && (
            <div className="add-policy-form">
              <div className="form-grid">
                <select
                  value={newPolicy.provider}
                  onChange={(e) => setNewPolicy({...newPolicy, provider: e.target.value})}
                >
                  <option value="">Select Insurance Provider *</option>
                  {insuranceProviders.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Policy Number *"
                  value={newPolicy.policyNumber}
                  onChange={(e) => setNewPolicy({...newPolicy, policyNumber: e.target.value})}
                />
                <select
                  value={newPolicy.policyType}
                  onChange={(e) => setNewPolicy({...newPolicy, policyType: e.target.value})}
                >
                  <option value="individual">Individual</option>
                  <option value="family">Family Floater</option>
                  <option value="senior">Senior Citizen</option>
                  <option value="critical">Critical Illness</option>
                </select>
                <input
                  type="number"
                  placeholder="Sum Insured (₹) *"
                  value={newPolicy.sumInsured}
                  onChange={(e) => setNewPolicy({...newPolicy, sumInsured: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Annual Premium (₹)"
                  value={newPolicy.premium}
                  onChange={(e) => setNewPolicy({...newPolicy, premium: e.target.value})}
                />
                <input
                  type="date"
                  placeholder="Start Date"
                  value={newPolicy.startDate}
                  onChange={(e) => setNewPolicy({...newPolicy, startDate: e.target.value})}
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={newPolicy.endDate}
                  onChange={(e) => setNewPolicy({...newPolicy, endDate: e.target.value})}
                />
              </div>
              <button className="save-btn" onClick={handleAddPolicy}>
                <i className="fas fa-save"></i> Save Policy
              </button>
            </div>
          )}

          <div className="policies-list">
            {policies.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-shield-alt"></i>
                <h4>No Insurance Policies</h4>
                <p>Add your health insurance policies to track coverage and file claims easily</p>
              </div>
            ) : (
              policies.map(policy => (
                <div key={policy.id} className="policy-card">
                  <div className="policy-header">
                    <div className="provider-logo">
                      <i className="fas fa-building"></i>
                    </div>
                    <div className="policy-info">
                      <h4>{policy.provider}</h4>
                      <span className="policy-number">{policy.policyNumber}</span>
                    </div>
                    <span className="status-badge" style={{background: getStatusColor(policy.status)}}>
                      {policy.status}
                    </span>
                  </div>
                  <div className="policy-details">
                    <div className="detail">
                      <span>Sum Insured</span>
                      <strong>{formatCurrency(policy.sumInsured)}</strong>
                    </div>
                    <div className="detail">
                      <span>Premium</span>
                      <strong>{formatCurrency(policy.premium)}/year</strong>
                    </div>
                    <div className="detail">
                      <span>Type</span>
                      <strong>{policy.policyType}</strong>
                    </div>
                    <div className="detail">
                      <span>Valid Till</span>
                      <strong>{new Date(policy.endDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                  {policy.endDate && getDaysUntilExpiry(policy.endDate) <= 30 && getDaysUntilExpiry(policy.endDate) > 0 && (
                    <div className="expiry-warning">
                      <i className="fas fa-exclamation-triangle"></i>
                      Expires in {getDaysUntilExpiry(policy.endDate)} days - Renew now!
                    </div>
                  )}
                  <div className="policy-actions">
                    <button onClick={() => { setNewClaim({...newClaim, policyId: policy.id}); setShowFileClaim(true); setActiveTab('claims'); }}>
                      <i className="fas fa-file-medical"></i> File Claim
                    </button>
                    <button>
                      <i className="fas fa-download"></i> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="claims-section">
          <div className="section-header">
            <h3>Insurance Claims</h3>
            <button className="add-btn" onClick={() => setShowFileClaim(!showFileClaim)}>
              <i className={`fas fa-${showFileClaim ? 'times' : 'plus'}`}></i>
              {showFileClaim ? 'Cancel' : 'File New Claim'}
            </button>
          </div>

          {showFileClaim && (
            <div className="file-claim-form">
              <h4><i className="fas fa-file-medical"></i> File Insurance Claim</h4>
              <div className="form-grid">
                <select
                  value={newClaim.policyId}
                  onChange={(e) => setNewClaim({...newClaim, policyId: e.target.value})}
                >
                  <option value="">Select Policy *</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>{p.provider} - {p.policyNumber}</option>
                  ))}
                </select>
                <select
                  value={newClaim.claimType}
                  onChange={(e) => setNewClaim({...newClaim, claimType: e.target.value})}
                >
                  <option value="cashless">Cashless</option>
                  <option value="reimbursement">Reimbursement</option>
                </select>
                <input
                  type="text"
                  placeholder="Hospital Name *"
                  value={newClaim.hospitalName}
                  onChange={(e) => setNewClaim({...newClaim, hospitalName: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Diagnosis/Treatment *"
                  value={newClaim.diagnosis}
                  onChange={(e) => setNewClaim({...newClaim, diagnosis: e.target.value})}
                />
                <input
                  type="date"
                  placeholder="Admission Date"
                  value={newClaim.admissionDate}
                  onChange={(e) => setNewClaim({...newClaim, admissionDate: e.target.value})}
                />
                <input
                  type="date"
                  placeholder="Discharge Date"
                  value={newClaim.dischargeDate}
                  onChange={(e) => setNewClaim({...newClaim, dischargeDate: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Estimated Amount (₹)"
                  value={newClaim.estimatedAmount}
                  onChange={(e) => setNewClaim({...newClaim, estimatedAmount: e.target.value})}
                />
              </div>
              <div className="documents-upload">
                <p><i className="fas fa-info-circle"></i> Required Documents: Hospital bills, Discharge summary, Prescription, Lab reports</p>
              </div>
              <button className="submit-btn" onClick={handleFileClaim}>
                <i className="fas fa-paper-plane"></i> Submit Claim
              </button>
            </div>
          )}

          <div className="claims-list">
            {claims.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-file-invoice"></i>
                <h4>No Claims Filed</h4>
                <p>Your insurance claims will appear here</p>
              </div>
            ) : (
              claims.map(claim => (
                <div key={claim.id} className="claim-card">
                  <div className="claim-header">
                    <div>
                      <h4>{claim.diagnosis}</h4>
                      <span className="claim-number">#{claim.claimNumber}</span>
                    </div>
                    <span className="status-badge" style={{background: getStatusColor(claim.status)}}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="claim-details">
                    <p><i className="fas fa-hospital"></i> {claim.hospitalName}</p>
                    <p><i className="fas fa-calendar"></i> {new Date(claim.submittedAt).toLocaleDateString()}</p>
                    <p><i className="fas fa-rupee-sign"></i> {formatCurrency(claim.estimatedAmount)}</p>
                    <p><i className="fas fa-tag"></i> {claim.claimType}</p>
                  </div>
                  <div className="claim-timeline">
                    <div className={`timeline-step ${['submitted', 'processing', 'approved', 'settled'].includes(claim.status) ? 'completed' : ''}`}>
                      <i className="fas fa-paper-plane"></i>
                      <span>Submitted</span>
                    </div>
                    <div className={`timeline-step ${['processing', 'approved', 'settled'].includes(claim.status) ? 'completed' : ''}`}>
                      <i className="fas fa-cog"></i>
                      <span>Processing</span>
                    </div>
                    <div className={`timeline-step ${['approved', 'settled'].includes(claim.status) ? 'completed' : ''}`}>
                      <i className="fas fa-check"></i>
                      <span>Approved</span>
                    </div>
                    <div className={`timeline-step ${claim.status === 'settled' ? 'completed' : ''}`}>
                      <i className="fas fa-money-bill"></i>
                      <span>Settled</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Network Hospitals Tab */}
      {activeTab === 'network' && (
        <div className="network-section">
          <div className="network-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search network hospitals near you..." />
            <button onClick={() => window.open('https://www.google.com/maps/search/network+hospitals+near+me', '_blank')}>
              <i className="fas fa-map-marker-alt"></i> Find Nearby
            </button>
          </div>
          <div className="network-info">
            <div className="info-card">
              <i className="fas fa-hospital"></i>
              <h4>10,000+</h4>
              <span>Network Hospitals</span>
            </div>
            <div className="info-card">
              <i className="fas fa-city"></i>
              <h4>500+</h4>
              <span>Cities Covered</span>
            </div>
            <div className="info-card">
              <i className="fas fa-hand-holding-medical"></i>
              <h4>Cashless</h4>
              <span>Treatment Available</span>
            </div>
          </div>
          <div className="network-tips">
            <h4><i className="fas fa-lightbulb"></i> Tips for Cashless Claims</h4>
            <ul>
              <li>Always carry your health card and policy documents</li>
              <li>Inform the hospital TPA desk about cashless treatment</li>
              <li>Pre-authorization is required for planned hospitalizations</li>
              <li>Keep all original bills and reports for records</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthInsurance;

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import API_BASE_URL from '../api/config';
import toast from 'react-hot-toast';
import './FamilyHealthWallet.css';

const FamilyHealthWallet = ({ user, onClose }) => {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [taxReport, setTaxReport] = useState(null);

  const fetchWallet = useCallback(async () => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/family-wallet`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/family-wallet/analytics`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchTaxReport = useCallback(async () => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/family-wallet/tax-report`, {
        headers: { 'Authorization': `Bearer ${parsed.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTaxReport(data);
      }
    } catch (error) {
      console.error('Error fetching tax report:', error);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchAnalytics();
  }, [fetchWallet, fetchAnalytics]);

  const handleAddMoney = async (amount) => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/family-wallet/add-money`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: 'upi',
          paymentId: `DEMO_${Date.now()}`
        })
      });
      
      if (response.ok) {
        toast.success(`₹${amount} added to wallet!`);
        fetchWallet();
        setShowAddMoney(false);
      }
    } catch (error) {
      toast.error('Failed to add money');
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/family-wallet/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      });
      
      if (response.ok) {
        toast.success('Family member added!');
        fetchWallet();
        setShowAddMember(false);
      }
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  if (loading) {
    return (
      <div className="family-wallet-loading">
        <div className="spinner"></div>
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="family-wallet">
      <div className="wallet-header">
        <div className="wallet-title">
          <i className="fas fa-wallet"></i>
          <h2>Family Health Wallet</h2>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-info">
          <span className="balance-label">Available Balance</span>
          <span className="balance-amount">₹{wallet?.balance?.toLocaleString() || 0}</span>
        </div>
        <button className="add-money-btn" onClick={() => setShowAddMoney(true)}>
          <i className="fas fa-plus"></i> Add Money
        </button>
      </div>

      {/* Budget Progress */}
      <div className="budget-section">
        <div className="budget-header">
          <span>Monthly Budget</span>
          <span>₹{wallet?.currentMonthSpending?.toLocaleString() || 0} / ₹{wallet?.monthlyBudget?.toLocaleString() || 10000}</span>
        </div>
        <div className="budget-progress">
          <div 
            className="budget-fill"
            style={{ 
              width: `${Math.min((wallet?.currentMonthSpending / wallet?.monthlyBudget) * 100, 100)}%`,
              backgroundColor: (wallet?.currentMonthSpending / wallet?.monthlyBudget) > 0.8 ? '#ef4444' : '#10b981'
            }}
          ></div>
        </div>
        {wallet?.currentMonthSpending > wallet?.monthlyBudget && (
          <div className="budget-warning">
            <i className="fas fa-exclamation-triangle"></i>
            Budget exceeded this month!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>
        <button 
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={`tab ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => { setActiveTab('tax'); fetchTaxReport(); }}
        >
          80D Report
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && analytics && (
          <div className="overview-content">
            <h3>Spending Analytics</h3>
            
            <div className="spending-cards">
              <div className="spending-card">
                <i className="fas fa-stethoscope"></i>
                <div className="spending-info">
                  <span className="spending-label">Consultations</span>
                  <span className="spending-value">₹{analytics.spendingByCategory?.consultation || 0}</span>
                </div>
              </div>
              <div className="spending-card">
                <i className="fas fa-pills"></i>
                <div className="spending-info">
                  <span className="spending-label">Medicines</span>
                  <span className="spending-value">₹{analytics.spendingByCategory?.medicine || 0}</span>
                </div>
              </div>
              <div className="spending-card">
                <i className="fas fa-flask"></i>
                <div className="spending-info">
                  <span className="spending-label">Lab Tests</span>
                  <span className="spending-value">₹{analytics.spendingByCategory?.lab_test || 0}</span>
                </div>
              </div>
              <div className="spending-card">
                <i className="fas fa-box"></i>
                <div className="spending-info">
                  <span className="spending-label">Health Packages</span>
                  <span className="spending-value">₹{analytics.spendingByCategory?.health_package || 0}</span>
                </div>
              </div>
            </div>

            {Object.keys(analytics.spendingByMember || {}).length > 0 && (
              <>
                <h3>Spending by Member</h3>
                <div className="member-spending">
                  {Object.entries(analytics.spendingByMember).map(([name, amount]) => (
                    <div key={name} className="member-spending-item">
                      <span className="member-name">{name}</span>
                      <span className="member-amount">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-content">
            <div className="members-header">
              <h3>Family Members</h3>
              <button className="add-member-btn" onClick={() => setShowAddMember(true)}>
                <i className="fas fa-user-plus"></i> Add Member
              </button>
            </div>
            
            <div className="members-list">
              {wallet?.members?.length > 0 ? (
                wallet.members.map((member, index) => (
                  <div key={index} className="member-card">
                    <div className="member-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="member-details">
                      <span className="member-name">{member.name}</span>
                      <span className="member-relationship">{member.relationship}</span>
                    </div>
                    <div className="member-limits">
                      <span>Limit: ₹{member.spendingLimit}/txn</span>
                      <span>Monthly: ₹{member.monthlyLimit}</span>
                      <span>Spent: ₹{member.currentMonthSpending || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-members">
                  <i className="fas fa-users"></i>
                  <p>No family members added yet</p>
                  <button onClick={() => setShowAddMember(true)}>Add First Member</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-content">
            <h3>Recent Transactions</h3>
            <div className="transactions-list">
              {wallet?.transactions?.slice(-10).reverse().map((txn, index) => (
                <div key={index} className={`transaction-item ${txn.type}`}>
                  <div className="txn-icon">
                    <i className={`fas fa-${txn.type === 'credit' ? 'arrow-down' : 'arrow-up'}`}></i>
                  </div>
                  <div className="txn-details">
                    <span className="txn-description">{txn.description}</span>
                    <span className="txn-date">{new Date(txn.createdAt).toLocaleDateString()}</span>
                    {txn.memberName && <span className="txn-member">by {txn.memberName}</span>}
                  </div>
                  <span className={`txn-amount ${txn.type}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </span>
                </div>
              ))}
              {(!wallet?.transactions || wallet.transactions.length === 0) && (
                <div className="no-transactions">
                  <i className="fas fa-receipt"></i>
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tax' && taxReport && (
          <div className="tax-content">
            <h3>Section 80D Tax Report</h3>
            <p className="tax-year">Financial Year: {taxReport.financialYear}</p>
            
            <div className="tax-summary">
              <div className="tax-card highlight">
                <span className="tax-label">Total Medical Expenses</span>
                <span className="tax-value">₹{taxReport.totalMedicalExpenses?.toLocaleString()}</span>
              </div>
              <div className="tax-card">
                <span className="tax-label">Eligible Deduction (Standard)</span>
                <span className="tax-value">₹{taxReport.eligibleDeduction?.toLocaleString()}</span>
              </div>
              <div className="tax-card">
                <span className="tax-label">Senior Citizen Limit</span>
                <span className="tax-value">₹{taxReport.seniorCitizenEligible?.toLocaleString()}</span>
              </div>
            </div>

            <h4>Expense Breakdown</h4>
            <div className="tax-breakdown">
              <div className="breakdown-item">
                <span>Consultations</span>
                <span>₹{taxReport.breakdown?.consultations?.toLocaleString() || 0}</span>
              </div>
              <div className="breakdown-item">
                <span>Medicines</span>
                <span>₹{taxReport.breakdown?.medicines?.toLocaleString() || 0}</span>
              </div>
              <div className="breakdown-item">
                <span>Lab Tests</span>
                <span>₹{taxReport.breakdown?.labTests?.toLocaleString() || 0}</span>
              </div>
              <div className="breakdown-item">
                <span>Health Packages</span>
                <span>₹{taxReport.breakdown?.healthPackages?.toLocaleString() || 0}</span>
              </div>
            </div>

            <p className="tax-note">
              <i className="fas fa-info-circle"></i>
              {taxReport.note}
            </p>

            <button className="download-report-btn">
              <i className="fas fa-download"></i> Download PDF Report
            </button>
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <AddMoneyModal 
          onClose={() => setShowAddMoney(false)}
          onAdd={handleAddMoney}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onAdd={handleAddMember}
        />
      )}
    </div>
  );
};

// Add Money Modal Component
const AddMoneyModal = ({ onClose, onAdd }) => {
  const [amount, setAmount] = useState('');
  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Money to Wallet</h3>
        
        <div className="quick-amounts">
          {quickAmounts.map(amt => (
            <button 
              key={amt} 
              className={`quick-amount ${amount === amt.toString() ? 'selected' : ''}`}
              onClick={() => setAmount(amt.toString())}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className="amount-input">
          <span className="currency">₹</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="confirm-btn" 
            onClick={() => onAdd(amount)}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Add ₹{amount || 0}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Member Modal Component
const AddMemberModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'spouse',
    spendingLimit: 2000,
    monthlyLimit: 5000
  });

  const relationships = ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'];

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Please enter member name');
      return;
    }
    onAdd(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Family Member</h3>
        
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Member name"
          />
        </div>

        <div className="form-group">
          <label>Relationship</label>
          <select
            value={formData.relationship}
            onChange={e => setFormData({...formData, relationship: e.target.value})}
          >
            {relationships.map(rel => (
              <option key={rel} value={rel}>{rel.charAt(0).toUpperCase() + rel.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Per Transaction Limit (₹)</label>
          <input
            type="number"
            value={formData.spendingLimit}
            onChange={e => setFormData({...formData, spendingLimit: parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label>Monthly Limit (₹)</label>
          <input
            type="number"
            value={formData.monthlyLimit}
            onChange={e => setFormData({...formData, monthlyLimit: parseInt(e.target.value)})}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSubmit}>Add Member</button>
        </div>
      </div>
    </div>
  );
};

export default FamilyHealthWallet;

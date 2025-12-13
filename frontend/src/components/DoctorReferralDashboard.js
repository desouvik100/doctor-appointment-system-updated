import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../api/config';
import toast from 'react-hot-toast';
import './DoctorReferralDashboard.css';

const DoctorReferralDashboard = ({ doctor, onClose }) => {
  const [referralData, setReferralData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [tierBenefits, setTierBenefits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('doctor');
      const parsed = JSON.parse(token);
      const authToken = parsed.token || parsed;
      
      const headers = { 'Authorization': `Bearer ${authToken}` };
      
      const [refRes, compRes, achRes, tierRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/doctor-referral/my-referral`, { headers }),
        fetch(`${API_BASE_URL}/api/doctor-referral/comparison`, { headers }),
        fetch(`${API_BASE_URL}/api/doctor-referral/achievements`, { headers }),
        fetch(`${API_BASE_URL}/api/doctor-referral/tier-benefits`, { headers })
      ]);
      
      if (refRes.ok) setReferralData(await refRes.json());
      if (compRes.ok) setComparison(await compRes.json());
      if (achRes.ok) setAchievements(await achRes.json());
      if (tierRes.ok) setTierBenefits(await tierRes.json());
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = async () => {
    try {
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('doctor');
      const parsed = JSON.parse(token);
      const authToken = parsed.token || parsed;
      
      const response = await fetch(`${API_BASE_URL}/api/doctor-referral/share-code`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.whatsappLink, '_blank');
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      'launch': '#22c55e',
      'growth': '#3b82f6',
      'standard': '#8b5cf6',
      'premium': '#f59e0b',
      'loyalty': '#ef4444'
    };
    return colors[tier] || '#64748b';
  };

  if (loading) {
    return (
      <div className="referral-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your referral data...</p>
      </div>
    );
  }

  return (
    <div className="doctor-referral-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <i className="fas fa-hand-holding-usd"></i>
          <h2>Earnings & Referrals</h2>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Tier Badge */}
      {referralData && (
        <div className="tier-badge-card" style={{ borderColor: getTierColor(referralData.tier) }}>
          <div className="tier-icon" style={{ backgroundColor: getTierColor(referralData.tier) }}>
            {referralData.tier === 'launch' && '🚀'}
            {referralData.tier === 'growth' && '📈'}
            {referralData.tier === 'standard' && '⭐'}
            {referralData.tier === 'premium' && '💎'}
            {referralData.tier === 'loyalty' && '👑'}
          </div>
          <div className="tier-info">
            <span className="tier-name">{referralData.tier?.toUpperCase()} TIER</span>
            <span className="tier-rate">
              {referralData.tier === 'launch' ? 'Zero Commission!' : 
               referralData.tier === 'growth' ? '₹20 flat per appointment' :
               `${referralData.commissionRate?.online}% online / ₹${referralData.commissionRate?.clinic} clinic`}
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card earnings">
          <i className="fas fa-rupee-sign"></i>
          <div className="stat-info">
            <span className="stat-value">₹{referralData?.earnings?.totalEarnings?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Earnings</span>
          </div>
        </div>
        <div className="stat-card savings">
          <i className="fas fa-piggy-bank"></i>
          <div className="stat-info">
            <span className="stat-value">₹{referralData?.earnings?.totalCommissionSaved?.toLocaleString() || 0}</span>
            <span className="stat-label">Saved vs Competitors</span>
          </div>
        </div>
        <div className="stat-card appointments">
          <i className="fas fa-calendar-check"></i>
          <div className="stat-info">
            <span className="stat-value">{referralData?.appointmentCounts?.totalAppointments || 0}</span>
            <span className="stat-label">Total Appointments</span>
          </div>
        </div>
        <div className="stat-card free">
          <i className="fas fa-gift"></i>
          <div className="stat-info">
            <span className="stat-value">
              {referralData?.appointmentCounts?.freeAppointments?.total - referralData?.appointmentCounts?.freeAppointments?.used || 0}
            </span>
            <span className="stat-label">Free Appointments Left</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
          vs Competitors
        </button>
        <button className={`tab ${activeTab === 'referral' ? 'active' : ''}`} onClick={() => setActiveTab('referral')}>
          Refer & Earn
        </button>
        <button className={`tab ${activeTab === 'tiers' ? 'active' : ''}`} onClick={() => setActiveTab('tiers')}>
          Tier Benefits
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Progress to next tier */}
            {achievements?.progress && (
              <div className="progress-section">
                <h3>Progress to Next Milestone</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${achievements.progress.progress}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>{achievements.progress.current} appointments</span>
                  <span>Next: {achievements.progress.nextMilestone}</span>
                </div>
              </div>
            )}

            {/* Badges */}
            {achievements?.badges?.length > 0 && (
              <div className="badges-section">
                <h3>Your Badges</h3>
                <div className="badges-grid">
                  {achievements.badges.map((badge, index) => (
                    <div key={index} className="badge-card">
                      <span className="badge-icon">{badge.icon}</span>
                      <span className="badge-name">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Month */}
            <div className="month-stats">
              <h3>This Month</h3>
              <div className="month-grid">
                <div className="month-item">
                  <span className="month-value">₹{referralData?.earnings?.thisMonthEarnings?.toLocaleString() || 0}</span>
                  <span className="month-label">Earnings</span>
                </div>
                <div className="month-item">
                  <span className="month-value">{referralData?.appointmentCounts?.thisMonthAppointments || 0}</span>
                  <span className="month-label">Appointments</span>
                </div>
                <div className="month-item">
                  <span className="month-value">₹{referralData?.earnings?.thisMonthCommission?.toLocaleString() || 0}</span>
                  <span className="month-label">Commission Paid</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && comparison && (
          <div className="comparison-content">
            <h3>Commission Comparison</h3>
            <p className="comparison-subtitle">See how much you save with HealthSyncPro</p>
            
            <div className="comparison-table">
              <div className="comparison-row header">
                <span>Platform</span>
                <span>Commission</span>
                <span>Your Earnings</span>
              </div>
              <div className="comparison-row healthsync highlight">
                <span>
                  <strong>HealthSyncPro</strong>
                  <small>{comparison.healthSyncPro.rate}</small>
                </span>
                <span className="commission">₹{comparison.healthSyncPro.commission?.toLocaleString()}</span>
                <span className="earnings">₹{comparison.healthSyncPro.earnings?.toLocaleString()}</span>
              </div>
              <div className="comparison-row practo">
                <span>
                  <strong>Practo</strong>
                  <small>{comparison.practo.rate}</small>
                </span>
                <span className="commission">₹{comparison.practo.commission?.toLocaleString()}</span>
                <span className="earnings">₹{comparison.practo.earnings?.toLocaleString()}</span>
              </div>
              <div className="comparison-row lybrate">
                <span>
                  <strong>Lybrate</strong>
                  <small>{comparison.lybrate.rate}</small>
                </span>
                <span className="commission">₹{comparison.lybrate.commission?.toLocaleString()}</span>
                <span className="earnings">₹{comparison.lybrate.earnings?.toLocaleString()}</span>
              </div>
            </div>

            <div className="savings-highlight">
              <div className="savings-card">
                <span className="savings-label">You saved vs Practo</span>
                <span className="savings-value">₹{comparison.savings?.vsPracto?.toLocaleString()}</span>
              </div>
              <div className="savings-card">
                <span className="savings-label">You saved vs Lybrate</span>
                <span className="savings-value">₹{comparison.savings?.vsLybrate?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="referral-content">
            <h3>Refer Fellow Doctors</h3>
            <p>Earn 25 additional free appointments for each doctor you refer!</p>
            
            <div className="referral-code-card">
              <span className="code-label">Your Referral Code</span>
              <div className="code-display">
                <span className="code">{referralData?.referralCode}</span>
                <button className="copy-btn" onClick={copyReferralCode}>
                  <i className={`fas fa-${copied ? 'check' : 'copy'}`}></i>
                </button>
              </div>
            </div>

            <div className="share-buttons">
              <button className="share-btn whatsapp" onClick={shareOnWhatsApp}>
                <i className="fab fa-whatsapp"></i> Share on WhatsApp
              </button>
              <button className="share-btn copy" onClick={copyReferralCode}>
                <i className="fas fa-link"></i> Copy Link
              </button>
            </div>

            <div className="referral-stats">
              <div className="ref-stat">
                <span className="ref-value">{referralData?.referralStats?.totalReferred || 0}</span>
                <span className="ref-label">Doctors Referred</span>
              </div>
              <div className="ref-stat">
                <span className="ref-value">{referralData?.referralStats?.bonusAppointmentsEarned || 0}</span>
                <span className="ref-label">Bonus Appointments Earned</span>
              </div>
            </div>

            <div className="referral-benefits">
              <h4>Referral Benefits</h4>
              <ul>
                <li><i className="fas fa-check"></i> You get 25 free appointments per referral</li>
                <li><i className="fas fa-check"></i> New doctor gets 50 free appointments</li>
                <li><i className="fas fa-check"></i> No limit on referrals</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && tierBenefits && (
          <div className="tiers-content">
            <h3>Commission Tiers</h3>
            <p>Lower commission as you grow with us!</p>
            
            <div className="tiers-list">
              {Object.entries(tierBenefits).map(([key, tier]) => (
                <div 
                  key={key} 
                  className={`tier-card ${referralData?.tier === key ? 'current' : ''}`}
                  style={{ borderColor: getTierColor(key) }}
                >
                  <div className="tier-header">
                    <span className="tier-name" style={{ color: getTierColor(key) }}>{tier.name}</span>
                    {referralData?.tier === key && <span className="current-badge">Current</span>}
                  </div>
                  <p className="tier-desc">{tier.description}</p>
                  <div className="tier-rates">
                    <span>Online: {tier.onlineCommission}</span>
                    <span>Clinic: {tier.clinicCommission}</span>
                  </div>
                  <ul className="tier-benefits">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i}><i className="fas fa-check"></i> {benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReferralDashboard;

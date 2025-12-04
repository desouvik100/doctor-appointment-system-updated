import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './ReferralRewards.css';

const ReferralRewards = ({ userId, userName }) => {
  const [activeTab, setActiveTab] = useState('refer');
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState({ points: 0, cashback: 0, tier: 'bronze' });
  const [rewardHistory, setRewardHistory] = useState([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const tiers = {
    bronze: { min: 0, max: 499, discount: 5, color: '#cd7f32', next: 'silver' },
    silver: { min: 500, max: 1999, discount: 10, color: '#c0c0c0', next: 'gold' },
    gold: { min: 2000, max: 4999, discount: 15, color: '#ffd700', next: 'platinum' },
    platinum: { min: 5000, max: Infinity, discount: 20, color: '#e5e4e2', next: null }
  };

  const redeemOptions = [
    { id: 1, name: 'Consultation Discount', points: 100, value: '₹50 off', icon: 'fa-user-md' },
    { id: 2, name: 'Lab Test Discount', points: 200, value: '₹100 off', icon: 'fa-flask' },
    { id: 3, name: 'Medicine Discount', points: 150, value: '₹75 off', icon: 'fa-pills' },
    { id: 4, name: 'Health Checkup', points: 500, value: '₹250 off', icon: 'fa-heartbeat' },
    { id: 5, name: 'Free Consultation', points: 1000, value: 'Worth ₹500', icon: 'fa-gift' },
    { id: 6, name: 'Amazon Voucher', points: 2000, value: '₹500', icon: 'fa-shopping-cart' }
  ];

  useEffect(() => {
    loadData();
    generateReferralCode();
  }, []);

  const loadData = () => {
    const savedReferrals = localStorage.getItem(`referrals_${userId}`);
    const savedRewards = localStorage.getItem(`rewards_${userId}`);
    const savedHistory = localStorage.getItem(`reward_history_${userId}`);
    
    if (savedReferrals) setReferrals(JSON.parse(savedReferrals));
    if (savedRewards) setRewards(JSON.parse(savedRewards));
    if (savedHistory) setRewardHistory(JSON.parse(savedHistory));
  };

  const generateReferralCode = () => {
    const code = `HS${userName?.slice(0, 3).toUpperCase() || 'USR'}${userId?.slice(-4) || Math.random().toString(36).slice(-4).toUpperCase()}`;
    setReferralCode(code);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const shareReferral = async (platform) => {
    const message = `🏥 Join HealthSync - India's #1 Healthcare App!\n\nUse my referral code: ${referralCode}\n\n✅ Book doctor appointments\n✅ Online consultations\n✅ Get ₹100 off on first booking!\n\nDownload now: ${window.location.origin}`;
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`,
      email: `mailto:?subject=Join HealthSync&body=${encodeURIComponent(message)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(message);
      toast.success('Invite message copied!');
    } else {
      window.open(urls[platform], '_blank');
    }
  };

  const redeemReward = (option) => {
    if (rewards.points < option.points) {
      toast.error('Not enough points!');
      return;
    }

    const newPoints = rewards.points - option.points;
    const newTier = Object.entries(tiers).find(([_, t]) => newPoints >= t.min && newPoints <= t.max)?.[0] || 'bronze';
    
    const updatedRewards = { ...rewards, points: newPoints, tier: newTier };
    localStorage.setItem(`rewards_${userId}`, JSON.stringify(updatedRewards));
    setRewards(updatedRewards);

    const historyEntry = {
      id: Date.now(),
      type: 'redeemed',
      description: option.name,
      points: -option.points,
      value: option.value,
      date: new Date().toISOString()
    };
    const newHistory = [historyEntry, ...rewardHistory];
    localStorage.setItem(`reward_history_${userId}`, JSON.stringify(newHistory));
    setRewardHistory(newHistory);

    toast.success(`Redeemed ${option.name}! Check your email for the coupon.`);
    setShowRedeemModal(false);
  };

  const getCurrentTier = () => tiers[rewards.tier] || tiers.bronze;
  const getNextTierProgress = () => {
    const current = getCurrentTier();
    if (!current.next) return 100;
    const nextTier = tiers[current.next];
    return Math.min(100, ((rewards.points - current.min) / (nextTier.min - current.min)) * 100);
  };

  return (
    <div className="referral-rewards">
      {/* Hero Section */}
      <div className="rewards-hero">
        <div className="hero-content">
          <h2><i className="fas fa-gift"></i> Refer & Earn</h2>
          <p>Invite friends and earn rewards on every successful referral!</p>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-value">{referrals.length}</span>
            <span className="stat-label">Referrals</span>
          </div>
          <div className="stat">
            <span className="stat-value">{rewards.points}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{color: getCurrentTier().color}}>
              {rewards.tier.toUpperCase()}
            </span>
            <span className="stat-label">Tier</span>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="referral-code-card">
        <div className="code-section">
          <span className="label">Your Referral Code</span>
          <div className="code-display">
            <span className="code">{referralCode}</span>
            <button onClick={copyReferralCode} title="Copy code">
              <i className="fas fa-copy"></i>
            </button>
          </div>
        </div>
        <div className="share-section">
          <span className="label">Share via</span>
          <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={() => shareReferral('whatsapp')}>
              <i className="fab fa-whatsapp"></i>
            </button>
            <button className="share-btn telegram" onClick={() => shareReferral('telegram')}>
              <i className="fab fa-telegram"></i>
            </button>
            <button className="share-btn twitter" onClick={() => shareReferral('twitter')}>
              <i className="fab fa-twitter"></i>
            </button>
            <button className="share-btn facebook" onClick={() => shareReferral('facebook')}>
              <i className="fab fa-facebook"></i>
            </button>
            <button className="share-btn email" onClick={() => shareReferral('email')}>
              <i className="fas fa-envelope"></i>
            </button>
            <button className="share-btn copy" onClick={() => shareReferral('copy')}>
              <i className="fas fa-link"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rewards-tabs">
        <button className={activeTab === 'refer' ? 'active' : ''} onClick={() => setActiveTab('refer')}>
          <i className="fas fa-user-plus"></i> How It Works
        </button>
        <button className={activeTab === 'rewards' ? 'active' : ''} onClick={() => setActiveTab('rewards')}>
          <i className="fas fa-coins"></i> My Rewards
        </button>
        <button className={activeTab === 'redeem' ? 'active' : ''} onClick={() => setActiveTab('redeem')}>
          <i className="fas fa-gift"></i> Redeem
        </button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
          <i className="fas fa-history"></i> History
        </button>
      </div>

      {/* How It Works Tab */}
      {activeTab === 'refer' && (
        <div className="how-it-works">
          <div className="steps">
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-share-alt"></i>
              </div>
              <h4>1. Share Your Code</h4>
              <p>Share your unique referral code with friends and family</p>
            </div>
            <div className="step-arrow"><i className="fas fa-arrow-right"></i></div>
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h4>2. Friend Signs Up</h4>
              <p>They register using your code and get ₹100 off first booking</p>
            </div>
            <div className="step-arrow"><i className="fas fa-arrow-right"></i></div>
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <h4>3. They Book</h4>
              <p>When they complete their first appointment</p>
            </div>
            <div className="step-arrow"><i className="fas fa-arrow-right"></i></div>
            <div className="step">
              <div className="step-icon">
                <i className="fas fa-gift"></i>
              </div>
              <h4>4. You Earn!</h4>
              <p>Get 200 points + ₹100 cashback instantly!</p>
            </div>
          </div>

          <div className="rewards-info">
            <h3><i className="fas fa-star"></i> Referral Rewards</h3>
            <div className="reward-cards">
              <div className="reward-card">
                <div className="reward-icon"><i className="fas fa-user-friends"></i></div>
                <h4>Per Referral</h4>
                <p className="reward-value">200 Points + ₹100</p>
                <span>When friend completes first booking</span>
              </div>
              <div className="reward-card">
                <div className="reward-icon"><i className="fas fa-trophy"></i></div>
                <h4>Milestone Bonus</h4>
                <p className="reward-value">500 Extra Points</p>
                <span>Every 5 successful referrals</span>
              </div>
              <div className="reward-card">
                <div className="reward-icon"><i className="fas fa-crown"></i></div>
                <h4>Top Referrer</h4>
                <p className="reward-value">₹5000 Voucher</p>
                <span>Monthly top referrer prize</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="my-rewards">
          {/* Tier Progress */}
          <div className="tier-card" style={{'--tier-color': getCurrentTier().color}}>
            <div className="tier-header">
              <div className="tier-badge">
                <i className="fas fa-medal"></i>
                <span>{rewards.tier.toUpperCase()}</span>
              </div>
              <div className="tier-benefits">
                <span>{getCurrentTier().discount}% discount on all bookings</span>
              </div>
            </div>
            <div className="tier-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${getNextTierProgress()}%`}}></div>
              </div>
              {getCurrentTier().next && (
                <p className="progress-text">
                  {tiers[getCurrentTier().next].min - rewards.points} points to {getCurrentTier().next.toUpperCase()}
                </p>
              )}
            </div>
            <div className="all-tiers">
              {Object.entries(tiers).map(([name, tier]) => (
                <div key={name} className={`tier-item ${rewards.tier === name ? 'current' : ''}`}>
                  <div className="tier-dot" style={{background: tier.color}}></div>
                  <span>{name}</span>
                  <small>{tier.discount}% off</small>
                </div>
              ))}
            </div>
          </div>

          {/* Points Summary */}
          <div className="points-summary">
            <div className="points-card">
              <i className="fas fa-coins"></i>
              <div>
                <h3>{rewards.points}</h3>
                <span>Available Points</span>
              </div>
            </div>
            <div className="points-card">
              <i className="fas fa-wallet"></i>
              <div>
                <h3>₹{rewards.cashback}</h3>
                <span>Cashback Earned</span>
              </div>
            </div>
            <div className="points-card">
              <i className="fas fa-users"></i>
              <div>
                <h3>{referrals.filter(r => r.status === 'completed').length}</h3>
                <span>Successful Referrals</span>
              </div>
            </div>
          </div>

          {/* Referrals List */}
          <div className="referrals-list">
            <h3><i className="fas fa-user-friends"></i> Your Referrals</h3>
            {referrals.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-plus"></i>
                <p>No referrals yet. Start sharing your code!</p>
              </div>
            ) : (
              referrals.map(ref => (
                <div key={ref.id} className="referral-item">
                  <div className="referral-avatar">
                    {ref.name?.charAt(0) || 'U'}
                  </div>
                  <div className="referral-info">
                    <h4>{ref.name}</h4>
                    <span>Joined {new Date(ref.joinedAt).toLocaleDateString()}</span>
                  </div>
                  <div className={`referral-status ${ref.status}`}>
                    {ref.status === 'completed' ? (
                      <><i className="fas fa-check-circle"></i> +200 pts</>
                    ) : (
                      <><i className="fas fa-clock"></i> Pending</>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === 'redeem' && (
        <div className="redeem-section">
          <div className="redeem-header">
            <h3>Redeem Your Points</h3>
            <div className="available-points">
              <i className="fas fa-coins"></i>
              <span>{rewards.points} points available</span>
            </div>
          </div>

          <div className="redeem-grid">
            {redeemOptions.map(option => (
              <div 
                key={option.id} 
                className={`redeem-card ${rewards.points < option.points ? 'disabled' : ''}`}
                onClick={() => rewards.points >= option.points && redeemReward(option)}
              >
                <div className="redeem-icon">
                  <i className={`fas ${option.icon}`}></i>
                </div>
                <h4>{option.name}</h4>
                <p className="redeem-value">{option.value}</p>
                <div className="redeem-points">
                  <i className="fas fa-coins"></i>
                  <span>{option.points} points</span>
                </div>
                {rewards.points >= option.points ? (
                  <button className="redeem-btn">Redeem Now</button>
                ) : (
                  <span className="need-more">Need {option.points - rewards.points} more</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-section">
          <h3><i className="fas fa-history"></i> Reward History</h3>
          {rewardHistory.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-receipt"></i>
              <p>No reward history yet</p>
            </div>
          ) : (
            <div className="history-list">
              {rewardHistory.map(item => (
                <div key={item.id} className={`history-item ${item.type}`}>
                  <div className="history-icon">
                    <i className={`fas fa-${item.type === 'earned' ? 'plus' : 'minus'}`}></i>
                  </div>
                  <div className="history-info">
                    <h4>{item.description}</h4>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className={`history-points ${item.points > 0 ? 'positive' : 'negative'}`}>
                    {item.points > 0 ? '+' : ''}{item.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};





export default ReferralRewards;
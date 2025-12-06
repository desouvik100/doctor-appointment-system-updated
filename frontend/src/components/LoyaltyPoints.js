// frontend/src/components/LoyaltyPoints.js
// Loyalty Points Dashboard - View Points, Redeem, Achievements
import { useState, useEffect } from 'react';
import './LoyaltyPoints.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const LoyaltyPoints = ({ userId, onClose }) => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchLoyaltyData();
      fetchTiers();
      fetchAchievements();
      fetchHistory();
      fetchLeaderboard();
    }
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/user/${userId}`);
      const data = await response.json();
      setLoyaltyData(data);
    } catch (error) {
      console.error('Fetch loyalty data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/tiers`);
      const data = await response.json();
      setTiers(data);
    } catch (error) {
      console.error('Fetch tiers error:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/achievements/${userId}`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Fetch achievements error:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/history/${userId}`);
      const data = await response.json();
      setHistory(data.transactions || []);
    } catch (error) {
      console.error('Fetch history error:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points < 100) {
      alert('Minimum 100 points required for redemption');
      return;
    }
    if (points > loyaltyData?.availablePoints) {
      alert('Insufficient points');
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch(`${API_URL}/api/loyalty-points/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          points,
          description: 'Points redeemed for discount'
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Successfully redeemed ${points} points for ₹${data.discountAmount} discount!`);
        setRedeemAmount('');
        fetchLoyaltyData();
        fetchHistory();
      } else {
        alert(data.message || 'Failed to redeem points');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      alert('Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'basic': return '#94a3b8';
      case 'silver': return '#a8a29e';
      case 'gold': return '#fbbf24';
      case 'platinum': return '#a78bfa';
      default: return '#94a3b8';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'basic': return 'fa-star';
      case 'silver': return 'fa-medal';
      case 'gold': return 'fa-trophy';
      case 'platinum': return 'fa-crown';
      default: return 'fa-star';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned': return 'fa-plus-circle';
      case 'redeemed': return 'fa-minus-circle';
      case 'bonus': return 'fa-gift';
      case 'referral': return 'fa-user-plus';
      case 'expired': return 'fa-clock';
      default: return 'fa-circle';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned': return '#22c55e';
      case 'redeemed': return '#ef4444';
      case 'bonus': return '#f59e0b';
      case 'referral': return '#6366f1';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="loyalty-points">
        <div className="loyalty-points__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading loyalty data...</p>
        </div>
      </div>
    );
  }

  const currentTier = tiers.find(t => t.name === loyaltyData?.tier);
  const nextTier = tiers.find(t => t.threshold > (loyaltyData?.totalPoints || 0));
  const progressToNext = nextTier 
    ? ((loyaltyData?.totalPoints || 0) / nextTier.threshold) * 100 
    : 100;

  return (
    <div className="loyalty-points">
      <div className="loyalty-points__header">
        <h2><i className="fas fa-coins"></i> Loyalty Points</h2>
        {onClose && (
          <button className="loyalty-points__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Points Hero */}
      <div className="points-hero">
        <div className="points-hero__main">
          <div className="points-display">
            <span className="points-display__value">{loyaltyData?.availablePoints || 0}</span>
            <span className="points-display__label">Available Points</span>
          </div>
          <div className="points-value">
            <i className="fas fa-rupee-sign"></i>
            <span>Worth ₹{loyaltyData?.pointsValue || 0}</span>
          </div>
        </div>
        <div className="points-hero__tier">
          <div 
            className="tier-badge-large"
            style={{ background: getTierColor(loyaltyData?.tier) }}
          >
            <i className={`fas ${getTierIcon(loyaltyData?.tier)}`}></i>
            <span>{loyaltyData?.tier || 'Basic'}</span>
          </div>
          {nextTier && (
            <div className="tier-progress">
              <div className="tier-progress__bar">
                <div 
                  className="tier-progress__fill"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                ></div>
              </div>
              <span className="tier-progress__text">
                {nextTier.threshold - (loyaltyData?.totalPoints || 0)} points to {nextTier.displayName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <i className="fas fa-coins"></i>
          <div>
            <span className="value">{loyaltyData?.totalPoints || 0}</span>
            <span className="label">Total Earned</span>
          </div>
        </div>
        <div className="quick-stat">
          <i className="fas fa-shopping-cart"></i>
          <div>
            <span className="value">{loyaltyData?.redeemedPoints || 0}</span>
            <span className="label">Redeemed</span>
          </div>
        </div>
        <div className="quick-stat">
          <i className="fas fa-fire"></i>
          <div>
            <span className="value">{loyaltyData?.currentStreak || 0}</span>
            <span className="label">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="loyalty-points__tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-home"></i> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'redeem' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('redeem')}
        >
          <i className="fas fa-gift"></i> Redeem
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> History
        </button>
        <button 
          className={`tab ${activeTab === 'achievements' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <i className="fas fa-trophy"></i> Achievements
        </button>
      </div>

      <div className="loyalty-points__content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* How to Earn */}
            <div className="earn-ways">
              <h4><i className="fas fa-plus-circle"></i> Ways to Earn Points</h4>
              <div className="earn-ways__grid">
                <div className="earn-way">
                  <div className="earn-way__icon" style={{ background: '#6366f1' }}>
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="earn-way__content">
                    <h5>Book Appointments</h5>
                    <p>Earn 1 point per ₹10 spent</p>
                  </div>
                </div>
                <div className="earn-way">
                  <div className="earn-way__icon" style={{ background: '#22c55e' }}>
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <div className="earn-way__content">
                    <h5>Refer Friends</h5>
                    <p>Earn 1000 points per referral</p>
                  </div>
                </div>
                <div className="earn-way">
                  <div className="earn-way__icon" style={{ background: '#f59e0b' }}>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="earn-way__content">
                    <h5>Write Reviews</h5>
                    <p>Earn 50 points per review</p>
                  </div>
                </div>
                <div className="earn-way">
                  <div className="earn-way__icon" style={{ background: '#ec4899' }}>
                    <i className="fas fa-birthday-cake"></i>
                  </div>
                  <div className="earn-way__content">
                    <h5>Birthday Bonus</h5>
                    <p>Get 500 bonus points</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="tier-benefits">
              <h4><i className="fas fa-crown"></i> Tier Benefits</h4>
              <div className="tiers-grid">
                {tiers.map((tier) => (
                  <div 
                    key={tier.name}
                    className={`tier-card ${loyaltyData?.tier === tier.name ? 'tier-card--active' : ''}`}
                  >
                    <div 
                      className="tier-card__header"
                      style={{ background: tier.color }}
                    >
                      <i className={`fas ${getTierIcon(tier.name)}`}></i>
                      <span>{tier.displayName}</span>
                    </div>
                    <div className="tier-card__threshold">
                      {tier.threshold === 0 ? 'Starting tier' : `${tier.threshold}+ points`}
                    </div>
                    <ul className="tier-card__benefits">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx}>
                          <i className="fas fa-check"></i>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="leaderboard-preview">
              <h4><i className="fas fa-trophy"></i> Top Earners</h4>
              <div className="leaderboard-mini">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={index} className="leaderboard-mini__item">
                    <span className="rank">#{entry.rank}</span>
                    <div className="avatar">
                      {entry.profilePhoto ? (
                        <img src={entry.profilePhoto} alt={entry.name} />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <span className="name">{entry.name}</span>
                    <span className="points">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {activeTab === 'redeem' && (
          <div className="redeem-section">
            <div className="redeem-card">
              <div className="redeem-card__header">
                <h4>Redeem Your Points</h4>
                <p>Convert your points to discounts on appointments</p>
              </div>
              
              <div className="redeem-card__balance">
                <span className="label">Available Balance</span>
                <span className="value">{loyaltyData?.availablePoints || 0} points</span>
                <span className="worth">Worth ₹{loyaltyData?.pointsValue || 0}</span>
              </div>

              <div className="redeem-card__input">
                <label>Points to Redeem</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder="Enter points (min 100)"
                    min="100"
                    max={loyaltyData?.availablePoints || 0}
                  />
                  <span className="conversion">
                    = ₹{Math.floor((parseInt(redeemAmount) || 0) / 10)}
                  </span>
                </div>
              </div>

              <div className="redeem-card__quick">
                <span>Quick Select:</span>
                <div className="quick-amounts">
                  {[100, 250, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setRedeemAmount(amount.toString())}
                      disabled={amount > (loyaltyData?.availablePoints || 0)}
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    onClick={() => setRedeemAmount((loyaltyData?.availablePoints || 0).toString())}
                    disabled={!loyaltyData?.availablePoints}
                  >
                    All
                  </button>
                </div>
              </div>

              <button 
                className="redeem-card__btn"
                onClick={handleRedeem}
                disabled={redeeming || !redeemAmount || parseInt(redeemAmount) < 100}
              >
                {redeeming ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Redeeming...
                  </>
                ) : (
                  <>
                    <i className="fas fa-gift"></i> Redeem Points
                  </>
                )}
              </button>

              <div className="redeem-card__info">
                <i className="fas fa-info-circle"></i>
                <p>Minimum 100 points required. 100 points = ₹10 discount.</p>
              </div>
            </div>

            {/* Redemption Options */}
            <div className="redemption-options">
              <h4>What You Can Get</h4>
              <div className="options-grid">
                <div className="option-card">
                  <div className="option-card__icon">
                    <i className="fas fa-percentage"></i>
                  </div>
                  <h5>Appointment Discount</h5>
                  <p>Use points for instant discount on your next booking</p>
                  <span className="rate">100 pts = ₹10</span>
                </div>
                <div className="option-card">
                  <div className="option-card__icon">
                    <i className="fas fa-box"></i>
                  </div>
                  <h5>Health Packages</h5>
                  <p>Redeem points for health checkup packages</p>
                  <span className="rate">500 pts = ₹50</span>
                </div>
                <div className="option-card">
                  <div className="option-card__icon">
                    <i className="fas fa-ambulance"></i>
                  </div>
                  <h5>Ambulance Service</h5>
                  <p>Get discount on emergency ambulance booking</p>
                  <span className="rate">1000 pts = ₹100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            {history.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-history"></i>
                <p>No transactions yet</p>
                <span>Start earning points by booking appointments!</span>
              </div>
            ) : (
              <div className="transactions-list">
                {history.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div 
                      className="transaction-item__icon"
                      style={{ background: getTransactionColor(transaction.type) }}
                    >
                      <i className={`fas ${getTransactionIcon(transaction.type)}`}></i>
                    </div>
                    <div className="transaction-item__info">
                      <h5>{transaction.description}</h5>
                      <span>{new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div className={`transaction-item__points ${transaction.type === 'redeemed' || transaction.type === 'expired' ? 'negative' : 'positive'}`}>
                      {transaction.type === 'redeemed' || transaction.type === 'expired' ? '-' : '+'}
                      {transaction.points}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-header">
              <h4>Your Achievements</h4>
              <p>Unlock badges by reaching milestones</p>
            </div>
            
            <div className="achievements-grid">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`achievement-card ${achievement.earned ? 'achievement-card--earned' : ''}`}
                >
                  <div className="achievement-card__icon">
                    <i className={`fas ${achievement.icon}`}></i>
                    {achievement.earned && (
                      <span className="earned-badge">
                        <i className="fas fa-check"></i>
                      </span>
                    )}
                  </div>
                  <h5>{achievement.name}</h5>
                  <p>{achievement.description}</p>
                  {achievement.earned ? (
                    <span className="earned-date">
                      Earned {new Date(achievement.earnedAt).toLocaleDateString('en-IN')}
                    </span>
                  ) : (
                    <span className="threshold">
                      Earn {achievement.threshold} points
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Streak Info */}
            <div className="streak-card">
              <div className="streak-card__icon">
                <i className="fas fa-fire"></i>
              </div>
              <div className="streak-card__content">
                <h4>{loyaltyData?.currentStreak || 0} Day Streak</h4>
                <p>Keep booking to maintain your streak and earn bonus points!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyPoints;

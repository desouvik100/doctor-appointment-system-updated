import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './LoyaltyPoints.css';

const LoyaltyPoints = ({ userId }) => {
  const [loyalty, setLoyalty] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => {
    fetchLoyaltyData();
    fetchRewards();
    fetchLeaderboard();
  }, [userId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await axios.get(`/api/loyalty/${userId}`);
      setLoyalty(response.data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await axios.get('/api/loyalty/rewards/available');
      setRewards(response.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/api/loyalty/leaderboard/top');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleRedeem = async (reward) => {
    if (loyalty.totalPoints < reward.points) {
      toast.error('Not enough points!');
      return;
    }

    setRedeeming(reward.id);
    try {
      await axios.post('/api/loyalty/redeem', {
        userId,
        points: reward.points,
        rewardType: reward.type,
        rewardDescription: reward.name
      });
      toast.success(`Redeemed: ${reward.name}`);
      fetchLoyaltyData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem');
    } finally {
      setRedeeming(null);
    }
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: 'fa-medal',
      silver: 'fa-award',
      gold: 'fa-crown',
      platinum: 'fa-gem'
    };
    return icons[tier] || 'fa-star';
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2'
    };
    return colors[tier] || '#667eea';
  };

  if (loading) {
    return (
      <div className="loyalty-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="loyalty-points">
      {/* Points Overview Card */}
      <div className="loyalty-header" style={{ '--tier-color': getTierColor(loyalty?.tier) }}>
        <div className="loyalty-tier-badge">
          <i className={`fas ${getTierIcon(loyalty?.tier)}`}></i>
          <span>{loyalty?.tier?.toUpperCase()}</span>
        </div>
        
        <div className="loyalty-points-display">
          <div className="points-circle">
            <span className="points-number">{loyalty?.totalPoints || 0}</span>
            <span className="points-label">Points</span>
          </div>
        </div>

        <div className="loyalty-stats">
          <div className="stat">
            <span className="stat-value">{loyalty?.lifetimePoints || 0}</span>
            <span className="stat-label">Lifetime Points</span>
          </div>
          <div className="stat">
            <span className="stat-value">{loyalty?.transactions?.length || 0}</span>
            <span className="stat-label">Transactions</span>
          </div>
        </div>

        {loyalty?.nextTier && (
          <div className="tier-progress">
            <div className="progress-info">
              <span>Next: {loyalty.nextTier.name.toUpperCase()}</span>
              <span>{loyalty.nextTier.pointsNeeded} pts needed</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loyalty.nextTier.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="loyalty-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-gift"></i> Rewards
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> History
        </button>
        <button 
          className={activeTab === 'leaderboard' ? 'active' : ''}
          onClick={() => setActiveTab('leaderboard')}
        >
          <i className="fas fa-trophy"></i> Leaderboard
        </button>
        <button 
          className={activeTab === 'earn' ? 'active' : ''}
          onClick={() => setActiveTab('earn')}
        >
          <i className="fas fa-coins"></i> Earn More
        </button>
      </div>

      {/* Tab Content */}
      <div className="loyalty-content">
        {activeTab === 'overview' && (
          <div className="rewards-grid">
            {rewards.map(reward => (
              <div 
                key={reward.id} 
                className={`reward-card ${loyalty?.totalPoints >= reward.points ? 'available' : 'locked'}`}
              >
                <div className="reward-icon">
                  <i className={`fas ${getRewardIcon(reward.type)}`}></i>
                </div>
                <h4>{reward.name}</h4>
                <div className="reward-points">
                  <i className="fas fa-coins"></i>
                  {reward.points} pts
                </div>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={loyalty?.totalPoints < reward.points || redeeming === reward.id}
                  className="redeem-btn"
                >
                  {redeeming === reward.id ? (
                    <><i className="fas fa-spinner fa-spin"></i> Redeeming...</>
                  ) : loyalty?.totalPoints >= reward.points ? (
                    'Redeem Now'
                  ) : (
                    `Need ${reward.points - (loyalty?.totalPoints || 0)} more`
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="transactions-list">
            {loyalty?.transactions?.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-receipt"></i>
                <p>No transactions yet</p>
              </div>
            ) : (
              loyalty?.transactions?.map((tx, index) => (
                <div key={index} className={`transaction-item ${tx.type}`}>
                  <div className="tx-icon">
                    <i className={`fas ${tx.type === 'earned' ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
                  </div>
                  <div className="tx-details">
                    <p className="tx-description">{tx.description}</p>
                    <span className="tx-date">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`tx-points ${tx.type}`}>
                    {tx.type === 'earned' ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-list">
            {leaderboard.map((user, index) => (
              <div key={index} className={`leaderboard-item rank-${user.rank}`}>
                <div className="rank">
                  {user.rank <= 3 ? (
                    <i className={`fas fa-trophy rank-${user.rank}`}></i>
                  ) : (
                    <span>#{user.rank}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className={`user-tier ${user.tier}`}>
                    <i className={`fas ${getTierIcon(user.tier)}`}></i>
                    {user.tier}
                  </span>
                </div>
                <div className="user-points">{user.points.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'earn' && (
          <div className="earn-ways">
            <div className="earn-card">
              <i className="fas fa-calendar-check"></i>
              <h4>Book Appointment</h4>
              <p>Earn 50 points per booking</p>
            </div>
            <div className="earn-card">
              <i className="fas fa-user-plus"></i>
              <h4>Refer a Friend</h4>
              <p>Earn 200 points per referral</p>
            </div>
            <div className="earn-card">
              <i className="fas fa-star"></i>
              <h4>Leave a Review</h4>
              <p>Earn 30 points per review</p>
            </div>
            <div className="earn-card">
              <i className="fas fa-birthday-cake"></i>
              <h4>Birthday Bonus</h4>
              <p>Get 500 bonus points!</p>
            </div>
            <div className="earn-card highlight">
              <i className="fas fa-gem"></i>
              <h4>Tier Multiplier</h4>
              <p>Higher tiers earn up to 2x points!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getRewardIcon = (type) => {
  const icons = {
    discount: 'fa-percent',
    service: 'fa-stethoscope',
    voucher: 'fa-ticket-alt',
    perk: 'fa-bolt'
  };
  return icons[type] || 'fa-gift';
};

export default LoyaltyPoints;

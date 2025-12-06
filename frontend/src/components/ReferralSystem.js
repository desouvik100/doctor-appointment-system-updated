// frontend/src/components/ReferralSystem.js
// Referral System - Share & Earn Rewards
import { useState, useEffect } from 'react';
import './ReferralSystem.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const ReferralSystem = ({ userId, onClose }) => {
  const [referralData, setReferralData] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('share');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchReferralData();
      fetchStats();
      fetchLeaderboard();
    }
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/referrals/code/${userId}`);
      const data = await response.json();
      setReferralData(data);
    } catch (error) {
      console.error('Fetch referral data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/referrals/stats/${userId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/referrals/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const message = `Join HealthSync Pro and get ₹50 off your first appointment! Use my referral code: ${referralData?.referralCode}`;
    const link = referralData?.referralLink;
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('Join HealthSync Pro!')}&body=${encodeURIComponent(message + '\n\n' + link)}`
    };
    
    window.open(urls[platform], '_blank');
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'bronze': return 'fa-medal';
      case 'silver': return 'fa-award';
      case 'gold': return 'fa-trophy';
      case 'platinum': return 'fa-crown';
      default: return 'fa-medal';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#a8a29e';
      case 'gold': return '#fbbf24';
      case 'platinum': return '#a78bfa';
      default: return '#cd7f32';
    }
  };

  if (loading) {
    return (
      <div className="referral-system">
        <div className="referral-system__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-system">
      <div className="referral-system__header">
        <h2><i className="fas fa-gift"></i> Refer & Earn</h2>
        {onClose && (
          <button className="referral-system__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="referral-hero">
        <div className="referral-hero__content">
          <h3>Invite Friends, Earn Rewards!</h3>
          <p>Share your referral code and earn ₹{stats?.rewardPerReferral || 100} for every friend who books their first appointment</p>
          <div className="referral-hero__stats">
            <div className="stat">
              <span className="stat-value">{stats?.totalReferrals || 0}</span>
              <span className="stat-label">Invited</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats?.successfulReferrals || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-value">₹{stats?.totalEarnings || 0}</span>
              <span className="stat-label">Earned</span>
            </div>
          </div>
        </div>
        <div className="referral-hero__illustration">
          <i className="fas fa-users"></i>
        </div>
      </div>

      {/* Tabs */}
      <div className="referral-system__tabs">
        <button 
          className={`tab ${activeTab === 'share' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('share')}
        >
          <i className="fas fa-share-alt"></i> Share
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> History
        </button>
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <i className="fas fa-trophy"></i> Leaderboard
        </button>
      </div>

      <div className="referral-system__content">
        {activeTab === 'share' && (
          <div className="share-section">
            {/* Referral Code Card */}
            <div className="referral-code-card">
              <div className="referral-code-card__label">Your Referral Code</div>
              <div className="referral-code-card__code">
                <span>{referralData?.referralCode}</span>
                <button 
                  className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
                  onClick={() => copyToClipboard(referralData?.referralCode)}
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="referral-link-card">
              <div className="referral-link-card__label">Or share your link</div>
              <div className="referral-link-card__link">
                <input 
                  type="text" 
                  value={referralData?.referralLink} 
                  readOnly 
                />
                <button onClick={() => copyToClipboard(referralData?.referralLink)}>
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="share-buttons">
              <h4>Share via</h4>
              <div className="share-buttons__grid">
                <button className="share-btn share-btn--whatsapp" onClick={() => shareVia('whatsapp')}>
                  <i className="fab fa-whatsapp"></i>
                  <span>WhatsApp</span>
                </button>
                <button className="share-btn share-btn--facebook" onClick={() => shareVia('facebook')}>
                  <i className="fab fa-facebook-f"></i>
                  <span>Facebook</span>
                </button>
                <button className="share-btn share-btn--twitter" onClick={() => shareVia('twitter')}>
                  <i className="fab fa-twitter"></i>
                  <span>Twitter</span>
                </button>
                <button className="share-btn share-btn--telegram" onClick={() => shareVia('telegram')}>
                  <i className="fab fa-telegram-plane"></i>
                  <span>Telegram</span>
                </button>
                <button className="share-btn share-btn--email" onClick={() => shareVia('email')}>
                  <i className="fas fa-envelope"></i>
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="how-it-works">
              <h4>How It Works</h4>
              <div className="steps">
                <div className="step">
                  <div className="step__number">1</div>
                  <div className="step__content">
                    <h5>Share Your Code</h5>
                    <p>Share your unique referral code with friends and family</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step__number">2</div>
                  <div className="step__content">
                    <h5>Friend Signs Up</h5>
                    <p>They sign up using your code and get ₹50 off</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step__number">3</div>
                  <div className="step__content">
                    <h5>You Earn Rewards</h5>
                    <p>When they complete their first appointment, you earn ₹{stats?.rewardPerReferral || 100}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="tier-progress">
              <div className="tier-progress__header">
                <h4>Your Referral Tier</h4>
                <span 
                  className="tier-badge"
                  style={{ background: getTierColor(stats?.tier || 'bronze') }}
                >
                  <i className={`fas ${getTierIcon(stats?.tier || 'bronze')}`}></i>
                  {stats?.tier || 'Bronze'}
                </span>
              </div>
              <div className="tier-progress__info">
                <p>Earn ₹{stats?.rewardPerReferral || 100} per successful referral</p>
                <p className="tier-hint">Refer more friends to unlock higher tiers and earn more!</p>
              </div>
              <div className="tier-levels">
                <div className={`tier-level ${stats?.tier === 'bronze' ? 'tier-level--active' : ''}`}>
                  <i className="fas fa-medal" style={{ color: '#cd7f32' }}></i>
                  <span>Bronze</span>
                  <small>₹100/referral</small>
                </div>
                <div className={`tier-level ${stats?.tier === 'silver' ? 'tier-level--active' : ''}`}>
                  <i className="fas fa-award" style={{ color: '#a8a29e' }}></i>
                  <span>Silver</span>
                  <small>₹150/referral</small>
                </div>
                <div className={`tier-level ${stats?.tier === 'gold' ? 'tier-level--active' : ''}`}>
                  <i className="fas fa-trophy" style={{ color: '#fbbf24' }}></i>
                  <span>Gold</span>
                  <small>₹200/referral</small>
                </div>
                <div className={`tier-level ${stats?.tier === 'platinum' ? 'tier-level--active' : ''}`}>
                  <i className="fas fa-crown" style={{ color: '#a78bfa' }}></i>
                  <span>Platinum</span>
                  <small>₹300/referral</small>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'history' && (
          <div className="history-section">
            {stats?.referredUsers?.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-user-friends"></i>
                <p>No referrals yet</p>
                <span>Share your code to start earning rewards!</span>
              </div>
            ) : (
              <div className="referral-history">
                {stats?.referredUsers?.map((user, index) => (
                  <div key={index} className="referral-item">
                    <div className="referral-item__avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="referral-item__info">
                      <h5>{user.name}</h5>
                      <span>Joined {new Date(user.joinedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className={`referral-item__status ${user.completed ? 'referral-item__status--completed' : ''}`}>
                      {user.completed ? (
                        <>
                          <i className="fas fa-check-circle"></i>
                          <span>+₹{user.reward}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-clock"></i>
                          <span>Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Earnings Summary */}
            <div className="earnings-summary">
              <h4>Earnings Summary</h4>
              <div className="earnings-grid">
                <div className="earning-card">
                  <i className="fas fa-wallet"></i>
                  <div className="earning-card__content">
                    <span className="label">Total Earned</span>
                    <span className="value">₹{stats?.totalEarnings || 0}</span>
                  </div>
                </div>
                <div className="earning-card">
                  <i className="fas fa-hourglass-half"></i>
                  <div className="earning-card__content">
                    <span className="label">Pending</span>
                    <span className="value">₹{stats?.pendingEarnings || 0}</span>
                  </div>
                </div>
                <div className="earning-card">
                  <i className="fas fa-money-bill-wave"></i>
                  <div className="earning-card__content">
                    <span className="label">Withdrawn</span>
                    <span className="value">₹{stats?.withdrawnEarnings || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-header">
              <h4><i className="fas fa-trophy"></i> Top Referrers</h4>
              <p>See who's leading the referral game!</p>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-trophy"></i>
                <p>No leaderboard data yet</p>
                <span>Be the first to refer friends!</span>
              </div>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`leaderboard-item ${index < 3 ? 'leaderboard-item--top' : ''}`}
                  >
                    <div className="leaderboard-item__rank">
                      {index === 0 && <i className="fas fa-crown" style={{ color: '#fbbf24' }}></i>}
                      {index === 1 && <i className="fas fa-medal" style={{ color: '#a8a29e' }}></i>}
                      {index === 2 && <i className="fas fa-medal" style={{ color: '#cd7f32' }}></i>}
                      {index > 2 && <span>#{entry.rank}</span>}
                    </div>
                    <div className="leaderboard-item__avatar">
                      {entry.profilePhoto ? (
                        <img src={entry.profilePhoto} alt={entry.name} />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="leaderboard-item__info">
                      <h5>{entry.name}</h5>
                      <span 
                        className="tier-badge-small"
                        style={{ background: getTierColor(entry.tier) }}
                      >
                        {entry.tier}
                      </span>
                    </div>
                    <div className="leaderboard-item__referrals">
                      <span className="count">{entry.referrals}</span>
                      <span className="label">referrals</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralSystem;

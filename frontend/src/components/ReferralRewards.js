import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from '../api/config';

const ReferralRewards = ({ userId, userName }) => {
  const [activeTab, setActiveTab] = useState('refer');
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState({ points: 0, cashback: 0, tier: 'bronze' });
  const [rewardHistory, setRewardHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { loadData(); generateReferralCode(); }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load from backend loyalty API
      const response = await axios.get(`/api/loyalty/${userId}`);
      const loyaltyData = response.data;
      
      setRewards({
        points: loyaltyData.totalPoints || 0,
        cashback: Math.floor((loyaltyData.lifetimePoints || 0) * 0.1), // 10% as cashback equivalent
        tier: loyaltyData.tier || 'bronze'
      });
      
      // Filter referral transactions from history
      const referralTransactions = (loyaltyData.transactions || [])
        .filter(t => t.referenceType === 'referral')
        .map(t => ({
          id: t._id,
          name: t.description?.replace('Earned points for successful referral from ', '') || 'Friend',
          joinedAt: t.createdAt,
          status: 'completed'
        }));
      setReferrals(referralTransactions);
      setRewardHistory(loyaltyData.transactions || []);
      
    } catch (error) {
      console.log('Loading from localStorage fallback');
      // Fallback to localStorage
      const savedReferrals = localStorage.getItem(`referrals_${userId}`);
      const savedRewards = localStorage.getItem(`rewards_${userId}`);
      const savedHistory = localStorage.getItem(`reward_history_${userId}`);
      if (savedReferrals) setReferrals(JSON.parse(savedReferrals));
      if (savedRewards) setRewards(JSON.parse(savedRewards));
      if (savedHistory) setRewardHistory(JSON.parse(savedHistory));
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    const code = `HS${userName?.slice(0, 3).toUpperCase() || 'USR'}${userId?.slice(-4) || Math.random().toString(36).slice(-4).toUpperCase()}`;
    setReferralCode(code);
  };

  const copyReferralCode = () => { navigator.clipboard.writeText(referralCode); toast.success('Referral code copied!'); };

  const shareReferral = async (platform) => {
    const message = `🏥 Join HealthSync - India's #1 Healthcare App!\n\nUse my referral code: ${referralCode}\n\n✅ Book doctor appointments\n✅ Online consultations\n✅ Get ₹100 off on first booking!\n\nDownload now: ${window.location.origin}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`,
      email: `mailto:?subject=Join HealthSync&body=${encodeURIComponent(message)}`
    };
    if (platform === 'copy') { navigator.clipboard.writeText(message); toast.success('Invite message copied!'); }
    else { window.open(urls[platform], '_blank'); }
  };

  const redeemReward = async (option) => {
    if (rewards.points < option.points) { toast.error('Not enough points!'); return; }
    
    try {
      const response = await axios.post('/api/loyalty/redeem', {
        userId,
        points: option.points,
        rewardType: option.name,
        rewardDescription: `Redeemed ${option.name} (${option.value})`
      });
      
      if (response.data.success) {
        setRewards(prev => ({ ...prev, points: response.data.remainingPoints }));
        toast.success(`Redeemed ${option.name}! Check your email for the coupon.`);
        loadData(); // Refresh data
      }
    } catch (error) {
      // Fallback to localStorage
      const newPoints = rewards.points - option.points;
      const newTier = Object.entries(tiers).find(([_, t]) => newPoints >= t.min && newPoints <= t.max)?.[0] || 'bronze';
      const updatedRewards = { ...rewards, points: newPoints, tier: newTier };
      localStorage.setItem(`rewards_${userId}`, JSON.stringify(updatedRewards));
      setRewards(updatedRewards);
      const historyEntry = { id: Date.now(), type: 'redeemed', description: option.name, points: -option.points, value: option.value, date: new Date().toISOString() };
      const newHistory = [historyEntry, ...rewardHistory];
      localStorage.setItem(`reward_history_${userId}`, JSON.stringify(newHistory));
      setRewardHistory(newHistory);
      toast.success(`Redeemed ${option.name}! Check your email for the coupon.`);
    }
  };

  const getCurrentTier = () => tiers[rewards.tier] || tiers.bronze;
  const getNextTierProgress = () => {
    const current = getCurrentTier();
    if (!current.next) return 100;
    const nextTier = tiers[current.next];
    return Math.min(100, ((rewards.points - current.min) / (nextTier.min - current.min)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-indigo-500 mb-4"></i>
          <p className="text-slate-500">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-3"><i className="fas fa-gift"></i> Refer & Earn</h2>
            <p className="text-indigo-100">Invite friends and earn rewards on every successful referral!</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center"><p className="text-3xl font-bold">{referrals.length}</p><p className="text-indigo-200 text-sm">Referrals</p></div>
            <div className="text-center"><p className="text-3xl font-bold">{rewards.points}</p><p className="text-indigo-200 text-sm">Points</p></div>
            <div className="text-center"><p className="text-3xl font-bold uppercase" style={{color: getCurrentTier().color}}>{rewards.tier}</p><p className="text-indigo-200 text-sm">Tier</p></div>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-indigo-300 rounded-xl px-4 py-3 text-center">
                <span className="text-2xl font-bold text-indigo-600 tracking-wider">{referralCode}</span>
              </div>
              <button onClick={copyReferralCode} className="w-12 h-12 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors"><i className="fas fa-copy text-lg"></i></button>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-2">Share via</p>
            <div className="flex flex-wrap gap-2">
              {[{ p: 'whatsapp', icon: 'fab fa-whatsapp', bg: 'bg-green-500 hover:bg-green-600' }, { p: 'telegram', icon: 'fab fa-telegram', bg: 'bg-blue-500 hover:bg-blue-600' }, { p: 'twitter', icon: 'fab fa-twitter', bg: 'bg-sky-500 hover:bg-sky-600' }, { p: 'facebook', icon: 'fab fa-facebook', bg: 'bg-blue-600 hover:bg-blue-700' }, { p: 'email', icon: 'fas fa-envelope', bg: 'bg-slate-600 hover:bg-slate-700' }, { p: 'copy', icon: 'fas fa-link', bg: 'bg-indigo-500 hover:bg-indigo-600' }].map(s => (
                <button key={s.p} onClick={() => shareReferral(s.p)} className={`w-10 h-10 rounded-xl ${s.bg} text-white flex items-center justify-center transition-colors`}><i className={s.icon}></i></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {[{ id: 'refer', icon: 'fa-user-plus', label: 'How It Works' }, { id: 'rewards', icon: 'fa-coins', label: 'My Rewards' }, { id: 'redeem', icon: 'fa-gift', label: 'Redeem' }, { id: 'history', icon: 'fa-history', label: 'History' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <i className={`fas ${tab.icon}`}></i><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* How It Works */}
      {activeTab === 'refer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ icon: 'fa-share-alt', title: '1. Share Your Code', desc: 'Share your unique referral code with friends' },
              { icon: 'fa-user-plus', title: '2. Friend Signs Up', desc: 'They register using your code and get ₹100 off' },
              { icon: 'fa-calendar-check', title: '3. They Book', desc: 'When they complete their first appointment' },
              { icon: 'fa-gift', title: '4. You Earn!', desc: 'Get 200 points + ₹100 cashback instantly!' }
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4"><i className={`fas ${step.icon} text-white text-xl`}></i></div>
                <h4 className="font-bold text-slate-800 mb-2">{step.title}</h4>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-star text-amber-500"></i> Referral Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ icon: 'fa-user-friends', title: 'Per Referral', value: '200 Points + ₹100', desc: 'When friend completes first booking' },
                { icon: 'fa-trophy', title: 'Milestone Bonus', value: '500 Extra Points', desc: 'Every 5 successful referrals' },
                { icon: 'fa-crown', title: 'Top Referrer', value: '₹5000 Voucher', desc: 'Monthly top referrer prize' }
              ].map((r, i) => (
                <div key={i} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3"><i className={`fas ${r.icon} text-white`}></i></div>
                  <h4 className="font-semibold text-slate-800">{r.title}</h4>
                  <p className="text-lg font-bold text-indigo-600 my-1">{r.value}</p>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm" style={{'--tier-color': getCurrentTier().color}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: getCurrentTier().color}}><i className="fas fa-medal text-white text-xl"></i></div>
                <div><p className="font-bold text-slate-800 uppercase">{rewards.tier}</p><p className="text-sm text-slate-500">{getCurrentTier().discount}% discount on all bookings</p></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all" style={{width: `${getNextTierProgress()}%`}}></div></div>
              {getCurrentTier().next && <p className="text-sm text-slate-500 mt-2">{tiers[getCurrentTier().next].min - rewards.points} points to {getCurrentTier().next.toUpperCase()}</p>}
            </div>
            <div className="flex gap-2">
              {Object.entries(tiers).map(([name, tier]) => (
                <div key={name} className={`flex-1 text-center p-2 rounded-lg ${rewards.tier === name ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50'}`}>
                  <div className="w-3 h-3 mx-auto rounded-full mb-1" style={{background: tier.color}}></div>
                  <p className="text-xs font-medium text-slate-700 capitalize">{name}</p>
                  <p className="text-xs text-slate-500">{tier.discount}% off</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ icon: 'fa-coins', value: rewards.points, label: 'Available Points', color: 'from-amber-500 to-orange-500' },
              { icon: 'fa-wallet', value: `₹${rewards.cashback}`, label: 'Cashback Earned', color: 'from-emerald-500 to-teal-500' },
              { icon: 'fa-users', value: referrals.filter(r => r.status === 'completed').length, label: 'Successful Referrals', color: 'from-indigo-500 to-purple-500' }
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}><i className={`fas ${p.icon} text-white text-lg`}></i></div>
                <div><p className="text-2xl font-bold text-slate-800">{p.value}</p><p className="text-sm text-slate-500">{p.label}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-user-friends text-indigo-500"></i> Your Referrals</h3>
            {referrals.length === 0 ? (
              <div className="text-center py-8"><div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3"><i className="fas fa-user-plus text-2xl text-slate-400"></i></div><p className="text-slate-500">No referrals yet. Start sharing your code!</p></div>
            ) : (
              <div className="space-y-3">
                {referrals.map(ref => (
                  <div key={ref.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">{ref.name?.charAt(0) || 'U'}</div>
                    <div className="flex-1"><h4 className="font-semibold text-slate-800">{ref.name}</h4><p className="text-sm text-slate-500">Joined {new Date(ref.joinedAt).toLocaleDateString()}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ref.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ref.status === 'completed' ? <><i className="fas fa-check-circle mr-1"></i>+200 pts</> : <><i className="fas fa-clock mr-1"></i>Pending</>}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Redeem */}
      {activeTab === 'redeem' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Redeem Your Points</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl"><i className="fas fa-coins text-amber-500"></i><span className="font-bold text-amber-700">{rewards.points} points available</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redeemOptions.map(option => (
                <div key={option.id} className={`rounded-2xl p-5 border-2 transition-all ${rewards.points >= option.points ? 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg cursor-pointer' : 'bg-slate-50 border-slate-100 opacity-60'}`} onClick={() => rewards.points >= option.points && redeemReward(option)}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4"><i className={`fas ${option.icon} text-white text-lg`}></i></div>
                  <h4 className="font-bold text-slate-800 mb-1">{option.name}</h4>
                  <p className="text-lg font-bold text-indigo-600 mb-2">{option.value}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-3"><i className="fas fa-coins text-amber-500"></i><span>{option.points} points</span></div>
                  {rewards.points >= option.points ? (
                    <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all">Redeem Now</button>
                  ) : (
                    <p className="text-sm text-slate-400 text-center">Need {option.points - rewards.points} more</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="fas fa-history text-indigo-500"></i> Reward History</h3>
          {rewardHistory.length === 0 ? (
            <div className="text-center py-8"><div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3"><i className="fas fa-receipt text-2xl text-slate-400"></i></div><p className="text-slate-500">No reward history yet</p></div>
          ) : (
            <div className="space-y-3">
              {rewardHistory.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'earned' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><i className={`fas fa-${item.type === 'earned' ? 'plus' : 'minus'}`}></i></div>
                  <div className="flex-1"><h4 className="font-semibold text-slate-800">{item.description}</h4><p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()}</p></div>
                  <span className={`font-bold ${item.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.points > 0 ? '+' : ''}{item.points} pts</span>
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

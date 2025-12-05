import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const LoyaltyPoints = ({ userId }) => {
  const [loyalty, setLoyalty] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  useEffect(() => { fetchLoyaltyData(); fetchRewards(); fetchLeaderboard(); }, [userId]);

  const fetchLoyaltyData = async () => {
    try { const r = await axios.get(`/api/loyalty/${userId}`); setLoyalty(r.data); }
    catch { setLoyalty({ totalPoints: 250, lifetimePoints: 500, tier: 'silver', transactions: [], nextTier: { name: 'gold', pointsNeeded: 250, progress: 50 } }); }
    finally { setLoading(false); }
  };

  const fetchRewards = async () => {
    try { const r = await axios.get('/api/loyalty/rewards/available'); setRewards(r.data); }
    catch { setRewards([
      { id: 1, name: '₹50 Off Consultation', points: 100, type: 'discount' },
      { id: 2, name: '₹100 Off Lab Test', points: 200, type: 'discount' },
      { id: 3, name: 'Free Health Tips', points: 50, type: 'service' },
      { id: 4, name: '₹200 Voucher', points: 400, type: 'voucher' },
    ]); }
  };

  const fetchLeaderboard = async () => {
    try { const r = await axios.get('/api/loyalty/leaderboard/top'); setLeaderboard(r.data); }
    catch { setLeaderboard([
      { rank: 1, name: 'Rahul S.', tier: 'platinum', points: 5200 },
      { rank: 2, name: 'Priya M.', tier: 'gold', points: 3800 },
      { rank: 3, name: 'Amit K.', tier: 'gold', points: 2900 },
    ]); }
  };

  const handleRedeem = async (reward) => {
    if ((loyalty?.totalPoints || 0) < reward.points) { toast.error('Not enough points!'); return; }
    setRedeeming(reward.id);
    try {
      await axios.post('/api/loyalty/redeem', { userId, points: reward.points, rewardType: reward.type, rewardDescription: reward.name });
      toast.success(`Redeemed: ${reward.name}`);
      fetchLoyaltyData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to redeem'); }
    finally { setRedeeming(null); }
  };

  const getTierConfig = (tier) => ({
    bronze: { icon: 'fa-medal', color: 'from-amber-600 to-orange-700', bg: 'bg-amber-100' },
    silver: { icon: 'fa-award', color: 'from-slate-400 to-slate-500', bg: 'bg-slate-100' },
    gold: { icon: 'fa-crown', color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-100' },
    platinum: { icon: 'fa-gem', color: 'from-slate-300 to-slate-400', bg: 'bg-slate-200' }
  }[tier] || { icon: 'fa-star', color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-100' });

  const getRewardIcon = (type) => ({ discount: 'fa-percent', service: 'fa-stethoscope', voucher: 'fa-ticket-alt', perk: 'fa-bolt' }[type] || 'fa-gift');

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500">Loading rewards...</p>
    </div>
  );

  const tierConfig = getTierConfig(loyalty?.tier);

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <div className={'relative overflow-hidden bg-gradient-to-br ' + tierConfig.color + ' rounded-2xl p-6 lg:p-8 text-white'}>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <i className={`fas ${tierConfig.icon} text-3xl`}></i>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Current Tier</p>
              <p className="text-2xl font-bold uppercase">{loyalty?.tier || 'Bronze'}</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-28 h-28 mx-auto rounded-full bg-white/20 backdrop-blur flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{loyalty?.totalPoints || 0}</span>
              <span className="text-sm text-white/80">Points</span>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{loyalty?.lifetimePoints || 0}</p>
              <p className="text-sm text-white/80">Lifetime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{loyalty?.transactions?.length || 0}</p>
              <p className="text-sm text-white/80">Transactions</p>
            </div>
          </div>
        </div>

        {loyalty?.nextTier && (
          <div className="relative mt-6 pt-6 border-t border-white/20">
            <div className="flex justify-between text-sm mb-2">
              <span>Next: {loyalty.nextTier.name.toUpperCase()}</span>
              <span>{loyalty.nextTier.pointsNeeded} pts needed</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${loyalty.nextTier.progress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {[
          { id: 'overview', icon: 'fa-gift', label: 'Rewards' },
          { id: 'history', icon: 'fa-history', label: 'History' },
          { id: 'leaderboard', icon: 'fa-trophy', label: 'Leaderboard' },
          { id: 'earn', icon: 'fa-coins', label: 'Earn More' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Rewards Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all
              ${(loyalty?.totalPoints || 0) >= reward.points ? 'border-slate-100 hover:border-indigo-200 hover:shadow-lg' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <i className={`fas ${getRewardIcon(reward.type)} text-white text-xl`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{reward.name}</h4>
                  <div className="flex items-center gap-1 text-amber-600 font-semibold mt-1">
                    <i className="fas fa-coins"></i> {reward.points} pts
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRedeem(reward)}
                disabled={(loyalty?.totalPoints || 0) < reward.points || redeeming === reward.id}
                className={`w-full mt-4 py-2.5 rounded-xl font-medium transition-all
                  ${(loyalty?.totalPoints || 0) >= reward.points 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {redeeming === reward.id ? <><i className="fas fa-spinner fa-spin mr-2"></i> Redeeming...</> :
                  (loyalty?.totalPoints || 0) >= reward.points ? 'Redeem Now' : `Need ${reward.points - (loyalty?.totalPoints || 0)} more`}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          {!loyalty?.transactions?.length ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-receipt text-2xl text-slate-400"></i>
              </div>
              <p className="text-slate-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loyalty.transactions.map((tx, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${tx.type === 'earned' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <i className={`fas fa-${tx.type === 'earned' ? 'plus' : 'minus'}-circle`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{tx.description}</p>
                    <p className="text-sm text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold ${tx.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'earned' ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="space-y-3">
            {leaderboard.map((user, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl transition-all
                ${user.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' : 'bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${user.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 
                    user.rank === 2 ? 'bg-slate-300 text-slate-700' : 
                    user.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {user.rank <= 3 ? <i className="fas fa-trophy"></i> : `#${user.rank}`}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-sm text-slate-500 capitalize flex items-center gap-1">
                    <i className={`fas ${getTierConfig(user.tier).icon}`}></i> {user.tier}
                  </p>
                </div>
                <span className="font-bold text-indigo-600">{user.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earn More Tab */}
      {activeTab === 'earn' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'fa-calendar-check', title: 'Book Appointment', desc: 'Earn 50 points per booking', color: 'from-blue-500 to-indigo-600' },
            { icon: 'fa-user-plus', title: 'Refer a Friend', desc: 'Earn 200 points per referral', color: 'from-emerald-500 to-teal-600' },
            { icon: 'fa-star', title: 'Leave a Review', desc: 'Earn 30 points per review', color: 'from-amber-500 to-orange-600' },
            { icon: 'fa-birthday-cake', title: 'Birthday Bonus', desc: 'Get 500 bonus points!', color: 'from-pink-500 to-rose-600' },
            { icon: 'fa-gem', title: 'Tier Multiplier', desc: 'Higher tiers earn up to 2x points!', color: 'from-purple-500 to-violet-600', highlight: true },
          ].map((item, idx) => (
            <div key={idx} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-lg
              ${item.highlight ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50' : 'border-slate-100'}`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-4`}>
                <i className={`fas ${item.icon} text-white text-xl`}></i>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoyaltyPoints;

import { useState, useEffect } from 'react';
import axios from '../api/config';

const TransactionHistory = ({ userId, appointments = [] }) => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTransactions();
  }, [userId]);

  const loadAllTransactions = async () => {
    setLoading(true);
    const allTransactions = [];

    // 1. Wallet transactions from localStorage
    const walletTxns = JSON.parse(localStorage.getItem(`wallet_transactions_${userId}`) || '[]');
    walletTxns.forEach(txn => {
      allTransactions.push({
        ...txn,
        category: 'wallet',
        icon: txn.type === 'credit' ? 'fa-arrow-down' : 'fa-arrow-up',
        color: txn.type === 'credit' ? 'emerald' : 'rose'
      });
    });

    // 2. Appointment payments
    appointments.filter(apt => apt.status !== 'cancelled').forEach(apt => {
      allTransactions.push({
        id: apt._id,
        type: 'debit',
        amount: apt.doctorId?.consultationFee || 500,
        description: `Appointment with Dr. ${apt.doctorId?.name || 'Unknown'}`,
        date: apt.createdAt || apt.date,
        status: apt.paymentStatus || 'completed',
        category: 'appointment',
        icon: 'fa-calendar-check',
        color: 'indigo'
      });
    });

    // 3. Try to get loyalty transactions
    try {
      const loyaltyRes = await axios.get(`/api/loyalty/${userId}`);
      if (loyaltyRes.data?.transactions) {
        loyaltyRes.data.transactions.forEach(txn => {
          allTransactions.push({
            id: txn._id || Date.now() + Math.random(),
            type: txn.type === 'earned' ? 'credit' : 'debit',
            amount: Math.abs(txn.points),
            description: txn.description || `${txn.type === 'earned' ? 'Earned' : 'Redeemed'} loyalty points`,
            date: txn.createdAt,
            status: 'completed',
            category: 'loyalty',
            icon: 'fa-coins',
            color: 'amber',
            isPoints: true
          });
        });
      }
    } catch (e) { /* No loyalty data */ }

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(allTransactions);
    setLoading(false);
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.category === filter);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', currency: 'INR', maximumFractionDigits: 0 
  }).format(amount);

  const totalSpent = transactions
    .filter(t => t.type === 'debit' && !t.isPoints)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAdded = transactions
    .filter(t => t.type === 'credit' && !t.isPoints)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="fas fa-arrow-down"></i>
            </div>
            <span className="text-emerald-100">Total Added</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalAdded)}</p>
        </div>
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="fas fa-arrow-up"></i>
            </div>
            <span className="text-rose-100">Total Spent</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="fas fa-receipt"></i>
            </div>
            <span className="text-indigo-100">Total Transactions</span>
          </div>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All', icon: 'fa-list' },
            { id: 'wallet', label: 'Wallet', icon: 'fa-wallet' },
            { id: 'appointment', label: 'Appointments', icon: 'fa-calendar-check' },
            { id: 'loyalty', label: 'Loyalty', icon: 'fa-coins' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-history text-indigo-500"></i> Transaction History
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <i className="fas fa-receipt text-2xl text-slate-400"></i>
            </div>
            <p className="text-slate-500">No transactions found</p>
            <p className="text-sm text-slate-400">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn, idx) => (
              <div key={txn.id || idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${txn.color}-100 text-${txn.color}-600`}>
                  <i className={`fas ${txn.icon}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{txn.description}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="capitalize">{txn.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {txn.type === 'credit' ? '+' : '-'}
                    {txn.isPoints ? `${txn.amount} pts` : formatCurrency(txn.amount)}
                  </span>
                  <p className={`text-xs ${txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {txn.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default TransactionHistory;
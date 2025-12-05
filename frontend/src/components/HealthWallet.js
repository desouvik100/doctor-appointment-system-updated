import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const HealthWallet = ({ userId, userName }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000];
  
  const subscriptionPlans = [
    { id: 'basic', name: 'Basic Care', price: 299, duration: 'month', features: ['2 Free Consultations', '10% off on medicines', 'Priority booking', 'Email support'], gradient: 'from-blue-500 to-cyan-600', popular: false },
    { id: 'family', name: 'Family Care', price: 599, duration: 'month', features: ['5 Free Consultations', '15% off on medicines', 'Priority booking', 'Up to 4 family members', '24/7 chat support', 'Free health checkup'], gradient: 'from-emerald-500 to-teal-600', popular: true },
    { id: 'premium', name: 'Premium Care', price: 999, duration: 'month', features: ['Unlimited Consultations', '20% off on medicines', 'VIP priority booking', 'Up to 6 family members', '24/7 phone support', 'Quarterly health checkup', 'Home sample collection', 'Dedicated health manager'], gradient: 'from-purple-500 to-violet-600', popular: false }
  ];

  useEffect(() => { loadWalletData(); }, []);

  const loadWalletData = () => {
    const savedBalance = localStorage.getItem(`wallet_balance_${userId}`);
    const savedTransactions = localStorage.getItem(`wallet_transactions_${userId}`);
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  };

  const saveWalletData = (newBalance, newTransactions) => {
    localStorage.setItem(`wallet_balance_${userId}`, newBalance.toString());
    localStorage.setItem(`wallet_transactions_${userId}`, JSON.stringify(newTransactions));
    setBalance(newBalance); setTransactions(newTransactions);
  };

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 100) { toast.error('Minimum amount is ₹100'); return; }
    setLoading(true);
    setTimeout(() => {
      const bonus = amount >= 2000 ? amount * 0.05 : 0;
      const totalCredit = amount + bonus;
      const newBalance = balance + totalCredit;
      const transaction = { id: Date.now(), type: 'credit', amount: totalCredit, description: bonus > 0 ? `Added ₹${amount} + ₹${bonus} bonus` : `Added ₹${amount}`, date: new Date().toISOString(), status: 'completed' };
      saveWalletData(newBalance, [transaction, ...transactions]);
      setAddAmount(''); setShowAddMoney(false); setLoading(false);
      toast.success(`₹${totalCredit} added to wallet!`);
    }, 1500);
  };

  const handleSubscribe = (plan) => {
    if (balance < plan.price) { toast.error('Insufficient balance. Please add money first.'); setShowAddMoney(true); return; }
    const newBalance = balance - plan.price;
    const transaction = { id: Date.now(), type: 'debit', amount: plan.price, description: `${plan.name} Subscription`, date: new Date().toISOString(), status: 'completed' };
    saveWalletData(newBalance, [transaction, ...transactions]);
    localStorage.setItem(`subscription_${userId}`, JSON.stringify({ planId: plan.id, planName: plan.name, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), features: plan.features }));
    toast.success(`Subscribed to ${plan.name}!`);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      {/* Wallet Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <i className="fas fa-wallet text-3xl"></i>
            </div>
            <div>
              <p className="text-indigo-100 text-sm font-medium">HealthSync Wallet</p>
              <p className="text-4xl font-bold">{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddMoney(!showAddMoney)} className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg transition-all">
              <i className="fas fa-plus"></i> Add Money
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all">
              <i className="fas fa-exchange-alt"></i> Transfer
            </button>
          </div>
        </div>

        {showAddMoney && (
          <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map(amt => (
                <button key={amt} onClick={() => setAddAmount(amt.toString())}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${addAmount === amt.toString() ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="number" placeholder="Enter amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} min="100"
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
              <button onClick={handleAddMoney} disabled={loading}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all">
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</> : <><i className="fas fa-arrow-right mr-2"></i> Add</>}
              </button>
            </div>
            <p className="text-indigo-100 text-sm flex items-center gap-2">
              <i className="fas fa-gift"></i> Get 5% bonus on adding ₹2000 or more!
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Why Use HealthSync Wallet?</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: 'fa-bolt', label: 'Instant Payments', color: 'from-amber-500 to-orange-600' },
            { icon: 'fa-percent', label: 'Extra Cashback', color: 'from-emerald-500 to-teal-600' },
            { icon: 'fa-undo', label: 'Easy Refunds', color: 'from-blue-500 to-cyan-600' },
            { icon: 'fa-shield-alt', label: '100% Secure', color: 'from-purple-500 to-violet-600' }
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center`}>
                <i className={`fas ${benefit.icon} text-white`}></i>
              </div>
              <span className="text-sm font-medium text-slate-700">{benefit.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-crown text-amber-500"></i> Health Subscription Plans
          </h3>
          <p className="text-slate-500 text-sm">Save more with monthly health plans</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subscriptionPlans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${plan.popular ? 'border-emerald-500' : 'border-slate-100'}`}>
              {plan.popular && <div className="bg-emerald-500 text-white text-center text-xs font-bold py-1">Most Popular</div>}
              <div className="p-5">
                <h4 className="font-bold text-slate-800 text-lg">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-bold text-slate-800">{formatCurrency(plan.price)}</span>
                  <span className="text-slate-500">/{plan.duration}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <i className="fas fa-check text-emerald-500"></i> {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSubscribe(plan)}
                  className={`w-full py-3 font-semibold rounded-xl transition-all ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  Subscribe Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-history text-indigo-500"></i> Transaction History
        </h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <i className="fas fa-receipt text-2xl text-slate-400"></i>
            </div>
            <p className="text-slate-500">No transactions yet</p>
            <p className="text-sm text-slate-400">Add money to your wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(txn => (
              <div key={txn.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  <i className={`fas fa-arrow-${txn.type === 'credit' ? 'down' : 'up'}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{txn.description}</p>
                  <p className="text-sm text-slate-500">{new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={`font-bold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthWallet;

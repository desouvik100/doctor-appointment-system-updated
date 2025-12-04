import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './HealthWallet.css';

const HealthWallet = ({ userId, userName }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000];
  
  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic Care',
      price: 299,
      duration: 'month',
      features: [
        '2 Free Consultations',
        '10% off on medicines',
        'Priority booking',
        'Email support'
      ],
      color: '#3b82f6',
      popular: false
    },
    {
      id: 'family',
      name: 'Family Care',
      price: 599,
      duration: 'month',
      features: [
        '5 Free Consultations',
        '15% off on medicines',
        'Priority booking',
        'Up to 4 family members',
        '24/7 chat support',
        'Free health checkup'
      ],
      color: '#10b981',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Care',
      price: 999,
      duration: 'month',
      features: [
        'Unlimited Consultations',
        '20% off on medicines',
        'VIP priority booking',
        'Up to 6 family members',
        '24/7 phone support',
        'Quarterly health checkup',
        'Home sample collection',
        'Dedicated health manager'
      ],
      color: '#8b5cf6',
      popular: false
    }
  ];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = () => {
    const savedBalance = localStorage.getItem(`wallet_balance_${userId}`);
    const savedTransactions = localStorage.getItem(`wallet_transactions_${userId}`);
    
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  };

  const saveWalletData = (newBalance, newTransactions) => {
    localStorage.setItem(`wallet_balance_${userId}`, newBalance.toString());
    localStorage.setItem(`wallet_transactions_${userId}`, JSON.stringify(newTransactions));
    setBalance(newBalance);
    setTransactions(newTransactions);
  };

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum amount is ₹100');
      return;
    }

    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const bonus = amount >= 2000 ? amount * 0.05 : 0; // 5% bonus on ₹2000+
      const totalCredit = amount + bonus;
      
      const newBalance = balance + totalCredit;
      const transaction = {
        id: Date.now(),
        type: 'credit',
        amount: totalCredit,
        description: bonus > 0 ? `Added ₹${amount} + ₹${bonus} bonus` : `Added ₹${amount}`,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      saveWalletData(newBalance, [transaction, ...transactions]);
      setAddAmount('');
      setShowAddMoney(false);
      setLoading(false);
      
      toast.success(`₹${totalCredit} added to wallet!`);
    }, 1500);
  };

  const handleSubscribe = (plan) => {
    if (balance < plan.price) {
      toast.error('Insufficient balance. Please add money first.');
      setShowAddMoney(true);
      return;
    }

    const newBalance = balance - plan.price;
    const transaction = {
      id: Date.now(),
      type: 'debit',
      amount: plan.price,
      description: `${plan.name} Subscription`,
      date: new Date().toISOString(),
      status: 'completed'
    };
    
    saveWalletData(newBalance, [transaction, ...transactions]);
    
    // Save subscription
    const subscription = {
      planId: plan.id,
      planName: plan.name,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: plan.features
    };
    localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
    
    toast.success(`Subscribed to ${plan.name}!`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="health-wallet">
      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="wallet-header">
          <div className="wallet-icon">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="wallet-info">
            <span className="wallet-label">HealthSync Wallet</span>
            <h2 className="wallet-balance">{formatCurrency(balance)}</h2>
          </div>
        </div>
        <div className="wallet-actions">
          <button className="add-money-btn" onClick={() => setShowAddMoney(!showAddMoney)}>
            <i className="fas fa-plus"></i> Add Money
          </button>
          <button className="transfer-btn">
            <i className="fas fa-exchange-alt"></i> Transfer
          </button>
        </div>
        
        {showAddMoney && (
          <div className="add-money-section">
            <div className="quick-amounts">
              {quickAmounts.map(amt => (
                <button 
                  key={amt}
                  className={addAmount === amt.toString() ? 'selected' : ''}
                  onClick={() => setAddAmount(amt.toString())}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="custom-amount">
              <input
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="100"
              />
              <button 
                className="proceed-btn"
                onClick={handleAddMoney}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fas fa-arrow-right"></i> Add Money</>
                )}
              </button>
            </div>
            <p className="bonus-info">
              <i className="fas fa-gift"></i> Get 5% bonus on adding ₹2000 or more!
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="wallet-benefits">
        <h3>Why Use HealthSync Wallet?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <i className="fas fa-bolt"></i>
            <span>Instant Payments</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-percent"></i>
            <span>Extra Cashback</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-undo"></i>
            <span>Easy Refunds</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-shield-alt"></i>
            <span>100% Secure</span>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="subscription-section">
        <div className="section-header">
          <h3><i className="fas fa-crown"></i> Health Subscription Plans</h3>
          <p>Save more with monthly health plans</p>
        </div>
        
        <div className="plans-grid">
          {subscriptionPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
              style={{'--plan-color': plan.color}}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <div className="plan-header">
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  <span className="price">{formatCurrency(plan.price)}</span>
                  <span className="duration">/{plan.duration}</span>
                </div>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <i className="fas fa-check"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className="subscribe-btn"
                onClick={() => handleSubscribe(plan)}
              >
                Subscribe Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="transactions-section">
        <h3><i className="fas fa-history"></i> Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <i className="fas fa-receipt"></i>
            <p>No transactions yet</p>
            <span>Add money to your wallet to get started</span>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map(txn => (
              <div key={txn.id} className={`transaction-item ${txn.type}`}>
                <div className="txn-icon">
                  <i className={`fas fa-${txn.type === 'credit' ? 'arrow-down' : 'arrow-up'}`}></i>
                </div>
                <div className="txn-info">
                  <h4>{txn.description}</h4>
                  <span>{new Date(txn.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className={`txn-amount ${txn.type}`}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthWallet;

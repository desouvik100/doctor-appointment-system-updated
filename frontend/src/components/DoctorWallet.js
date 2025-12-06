import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const DoctorWallet = ({ doctorId, doctorName }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: ''
  });

  useEffect(() => {
    if (doctorId) {
      fetchWallet();
    }
  }, [doctorId]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/wallet/doctor/${doctorId}`);
      if (response.data.success) {
        setWallet(response.data.wallet);
        if (response.data.wallet.bankDetails) {
          setBankForm(response.data.wallet.bankDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/wallet/doctor/${doctorId}/transactions`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleShowTransactions = () => {
    if (!showTransactions) {
      fetchTransactions();
    }
    setShowTransactions(!showTransactions);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/wallet/doctor/${doctorId}/bank-details`, bankForm);
      if (response.data.success) {
        toast.success('Bank details saved successfully');
        setShowBankModal(false);
        fetchWallet();
      }
    } catch (error) {
      toast.error('Failed to save bank details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-wallet">
      {/* Wallet Summary Card */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="card-title mb-1">
                <i className="fas fa-wallet me-2"></i>My Wallet
              </h5>
              <small className="opacity-75">Dr. {doctorName}</small>
            </div>
            <button 
              className="btn btn-light btn-sm"
              onClick={() => setShowBankModal(true)}
            >
              <i className="fas fa-university me-1"></i>Bank Details
            </button>
          </div>
          
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <h3 className="mb-0">{formatCurrency(wallet?.balance)}</h3>
                <small className="opacity-75">Current Balance</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <h3 className="mb-0">{formatCurrency(wallet?.pendingAmount)}</h3>
                <small className="opacity-75">Pending Payout</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <h3 className="mb-0">{formatCurrency(wallet?.totalEarnings)}</h3>
                <small className="opacity-75">Total Earnings</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <h3 className="mb-0">{formatCurrency(wallet?.totalPayouts)}</h3>
                <small className="opacity-75">Total Received</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 50, height: 50 }}>
                <i className="fas fa-users text-primary fs-5"></i>
              </div>
              <h4 className="mb-0">{wallet?.stats?.totalPatients || 0}</h4>
              <small className="text-muted">Total Patients</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 50, height: 50 }}>
                <i className="fas fa-calendar-check text-success fs-5"></i>
              </div>
              <h4 className="mb-0">{wallet?.stats?.completedAppointments || 0}</h4>
              <small className="text-muted">Completed</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-info bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 50, height: 50 }}>
                <i className="fas fa-video text-info fs-5"></i>
              </div>
              <h4 className="mb-0">{wallet?.stats?.onlineConsultations || 0}</h4>
              <small className="text-muted">Online</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 50, height: 50 }}>
                <i className="fas fa-hospital text-warning fs-5"></i>
              </div>
              <h4 className="mb-0">{wallet?.stats?.inClinicVisits || 0}</h4>
              <small className="text-muted">In-Clinic</small>
            </div>
          </div>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <h6 className="card-title mb-3">
            <i className="fas fa-chart-line me-2 text-primary"></i>This Month
          </h6>
          <div className="row">
            <div className="col-6">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="fas fa-rupee-sign text-success fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0">{formatCurrency(wallet?.stats?.thisMonthEarnings)}</h5>
                  <small className="text-muted">Earnings</small>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <i className="fas fa-user-plus text-primary fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0">{wallet?.stats?.thisMonthPatients || 0}</h5>
                  <small className="text-muted">Patients</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <i className="fas fa-history me-2"></i>Transaction History
          </h6>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={handleShowTransactions}
          >
            {showTransactions ? 'Hide' : 'Show'} Transactions
          </button>
        </div>
        {showTransactions && (
          <div className="card-body p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="fas fa-receipt fs-1 mb-2"></i>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {transactions.map((txn, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                        txn.type === 'earning' ? 'bg-success' : 
                        txn.type === 'payout' ? 'bg-danger' : 
                        txn.type === 'bonus' ? 'bg-warning' : 'bg-secondary'
                      } bg-opacity-10`} style={{ width: 40, height: 40 }}>
                        <i className={`fas ${
                          txn.type === 'earning' ? 'fa-arrow-down text-success' : 
                          txn.type === 'payout' ? 'fa-arrow-up text-danger' : 
                          txn.type === 'bonus' ? 'fa-gift text-warning' : 'fa-minus text-secondary'
                        }`}></i>
                      </div>
                      <div>
                        <p className="mb-0 fw-medium">{txn.description}</p>
                        <small className="text-muted">{formatDate(txn.createdAt)}</small>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className={`fw-bold ${txn.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </span>
                      <br />
                      <span className={`badge ${
                        txn.status === 'completed' ? 'bg-success' : 
                        txn.status === 'pending' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-university me-2"></i>Bank Details
                </h5>
                <button className="btn-close" onClick={() => setShowBankModal(false)}></button>
              </div>
              <form onSubmit={handleSaveBankDetails}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Account Holder Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})}
                      placeholder="Enter account holder name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value.toUpperCase()})}
                        placeholder="IFSC Code"
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                        placeholder="Bank Name"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">UPI ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankForm.upiId}
                      onChange={(e) => setBankForm({...bankForm, upiId: e.target.value})}
                      placeholder="yourname@upi"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBankModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save me-1"></i>Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWallet;

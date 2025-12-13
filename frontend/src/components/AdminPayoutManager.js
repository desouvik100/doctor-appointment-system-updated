import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AdminPayoutManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const AdminPayoutManager = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [revenueReport, setRevenueReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const params = filter !== 'all' ? { status: filter } : {};
      
      const [payoutsRes, revenueRes] = await Promise.all([
        axios.get(`${API_URL}/commission/payouts`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/commission/reports/admin/revenue`, {
          params: dateRange,
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPayouts(payoutsRes.data.data || []);
      setRevenueReport(revenueRes.data.data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  }, [filter, dateRange]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleApprovePayout = async (payoutId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put(`${API_URL}/commission/payouts/${payoutId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payout approved');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to approve payout');
    }
  };

  const handleProcessPayout = async () => {
    if (!transactionRef.trim()) {
      toast.error('Please enter transaction reference');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put(`${API_URL}/commission/payouts/${selectedPayout._id}/process`, {
        transactionReference: transactionRef
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payout processed successfully');
      setShowProcessModal(false);
      setSelectedPayout(null);
      setTransactionRef('');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to process payout');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkFailed = async (payoutId, reason) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put(`${API_URL}/commission/payouts/${payoutId}/fail`, {
        reason: reason || 'Payment failed'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.info('Payout marked as failed');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to update payout status');
    }
  };

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/commission/reports/admin/export`, {
        params: dateRange,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="payout-manager loading">Loading payout data...</div>;
  }

  return (
    <div className="payout-manager">
      <div className="manager-header">
        <h2>💳 Payout Management</h2>
        <div className="header-actions">
          <button onClick={handleExportReport} className="btn-export">
            📥 Export Revenue Report
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      {revenueReport && (
        <div className="revenue-summary">
          <div className="summary-card">
            <span className="label">Total Transactions</span>
            <span className="value">{revenueReport.totalTransactions}</span>
          </div>
          <div className="summary-card">
            <span className="label">Total Consultation Fees</span>
            <span className="value">{formatCurrency(revenueReport.totalConsultationFees)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Commission Earned</span>
            <span className="value highlight">{formatCurrency(revenueReport.totalCommissionEarned)}</span>
          </div>
          <div className="summary-card">
            <span className="label">GST Collected</span>
            <span className="value">{formatCurrency(revenueReport.totalGSTCollected)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Gateway Fees</span>
            <span className="value negative">-{formatCurrency(revenueReport.totalGatewayFees)}</span>
          </div>
          <div className="summary-card primary">
            <span className="label">Net Platform Revenue</span>
            <span className="value">{formatCurrency(revenueReport.netPlatformRevenue)}</span>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="filter-section">
        <div className="date-filter">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <div className="status-filter">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Payouts</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payouts List */}
      <div className="payouts-list">
        <h3>Payout Requests ({payouts.length})</h3>
        {payouts.length > 0 ? (
          <div className="payouts-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Doctor</th>
                  <th>Period</th>
                  <th>Appointments</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout._id}>
                    <td>{payout.invoiceNumber || `#${payout._id?.slice(-6)}`}</td>
                    <td>{payout.doctorId?.name || 'Unknown'}</td>
                    <td>
                      {new Date(payout.periodStart).toLocaleDateString('en-IN')} - 
                      {new Date(payout.periodEnd).toLocaleDateString('en-IN')}
                    </td>
                    <td>{payout.summary?.totalAppointments || 0}</td>
                    <td className="amount">{formatCurrency(payout.summary?.netPayoutAmount)}</td>
                    <td>
                      <span className={`status-badge ${payout.status}`}>{payout.status}</span>
                    </td>
                    <td className="actions">
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => handleApprovePayout(payout._id)}
                          className="btn-approve"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {payout.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedPayout(payout);
                            setShowProcessModal(true);
                          }}
                          className="btn-process"
                        >
                          💳 Process
                        </button>
                      )}
                      {(payout.status === 'pending' || payout.status === 'approved') && (
                        <button
                          onClick={() => handleMarkFailed(payout._id, 'Cancelled by admin')}
                          className="btn-fail"
                        >
                          ✕
                        </button>
                      )}
                      {payout.status === 'completed' && payout.transactionReference && (
                        <span className="ref-number">Ref: {payout.transactionReference}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-payouts">
            <span>📭</span>
            <p>No payouts found</p>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {showProcessModal && selectedPayout && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Process Payout</h3>
            <div className="modal-details">
              <p><strong>Doctor:</strong> {selectedPayout.doctorId?.name}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedPayout.summary?.netPayoutAmount)}</p>
              <p><strong>Method:</strong> {selectedPayout.paymentMethod}</p>
            </div>
            <div className="form-group">
              <label>Transaction Reference *</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter bank transaction reference"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowProcessModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleProcessPayout}
                disabled={processing}
                className="btn-confirm"
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayoutManager;

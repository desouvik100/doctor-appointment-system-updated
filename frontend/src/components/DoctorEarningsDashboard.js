import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DoctorEarningsDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const DoctorEarningsDashboard = ({ doctorId }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [earningsData, setEarningsData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [pendingPayout, setPendingPayout] = useState(null);

  const fetchEarningsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [earningsRes, payoutsRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/commission/reports/doctor/${doctorId}`, {
          params: dateRange,
          headers
        }),
        axios.get(`${API_URL}/commission/payouts/doctor/${doctorId}`, { headers }),
        axios.get(`${API_URL}/commission/pending/${doctorId}`, { headers })
      ]);

      setEarningsData(earningsRes.data.data);
      setPayouts(payoutsRes.data.data || []);
      setPendingPayout(pendingRes.data.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [doctorId, dateRange]);

  useEffect(() => {
    if (doctorId) {
      fetchEarningsData();
    }
  }, [doctorId, fetchEarningsData]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/commission/reports/doctor/${doctorId}/export`,
        {
          params: dateRange,
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earnings-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
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
    return (
      <div className="earnings-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading earnings data...</p>
      </div>
    );
  }

  return (
    <div className="earnings-dashboard">
      {/* Header */}
      <div className="earnings-header">
        <h2>💰 Earnings Dashboard</h2>
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
          <button onClick={fetchEarningsData} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="earnings-summary">
        <div className="summary-card total">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <span className="label">Total Earnings</span>
            <span className="value">{formatCurrency(earningsData?.summary?.grossEarnings)}</span>
          </div>
        </div>
        <div className="summary-card commission">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="label">Platform Commission</span>
            <span className="value negative">-{formatCurrency(earningsData?.summary?.totalCommission)}</span>
          </div>
        </div>
        <div className="summary-card net">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <span className="label">Net Earnings</span>
            <span className="value highlight">{formatCurrency(earningsData?.summary?.netEarnings)}</span>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <span className="label">Pending Payout</span>
            <span className="value">{formatCurrency(pendingPayout?.totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="earnings-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📋 Transactions
        </button>
        <button
          className={`tab ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          💳 Payouts
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Appointments</span>
                <span className="stat-value">{earningsData?.summary?.totalAppointments || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed Payouts</span>
                <span className="stat-value">{formatCurrency(earningsData?.summary?.completedPayout)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg. Per Consultation</span>
                <span className="stat-value">
                  {formatCurrency(
                    earningsData?.summary?.totalAppointments > 0
                      ? earningsData?.summary?.netEarnings / earningsData?.summary?.totalAppointments
                      : 0
                  )}
                </span>
              </div>
            </div>

            {/* Commission Breakdown Info */}
            <div className="commission-info">
              <h3>📌 How Your Earnings Work</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-icon">🏥</span>
                  <div>
                    <strong>Online Consultations</strong>
                    <p>15% platform commission</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏢</span>
                  <div>
                    <strong>In-Clinic Visits</strong>
                    <p>10% platform commission</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">📋</span>
                  <div>
                    <strong>GST (18%)</strong>
                    <p>Applied only on commission, not your fee</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">💳</span>
                  <div>
                    <strong>Gateway Fees</strong>
                    <p>Deducted from platform share, not yours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-content">
            <div className="transactions-header">
              <h3>Recent Transactions</h3>
              <button onClick={handleExportCSV} className="btn-export">
                📥 Export CSV
              </button>
            </div>
            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Consultation Fee</th>
                    <th>Commission</th>
                    <th>Your Earnings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData?.entries?.length > 0 ? (
                    earningsData.entries.map((entry, index) => (
                      <tr key={index}>
                        <td>{new Date(entry.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>{formatCurrency(entry.consultationFee)}</td>
                        <td className="negative">-{formatCurrency(entry.commission?.amount)}</td>
                        <td className="positive">{formatCurrency(entry.netDoctorPayout)}</td>
                        <td>
                          <span className={`status-badge ${entry.payoutStatus}`}>
                            {entry.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="payouts-content">
            <h3>Payout History</h3>
            <div className="payouts-list">
              {payouts.length > 0 ? (
                payouts.map((payout, index) => (
                  <div key={index} className={`payout-card ${payout.status}`}>
                    <div className="payout-header">
                      <span className="payout-id">{payout.invoiceNumber || `#${payout._id?.slice(-6)}`}</span>
                      <span className={`payout-status ${payout.status}`}>{payout.status}</span>
                    </div>
                    <div className="payout-details">
                      <div className="detail-row">
                        <span>Period:</span>
                        <span>
                          {new Date(payout.periodStart).toLocaleDateString('en-IN')} - 
                          {new Date(payout.periodEnd).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Appointments:</span>
                        <span>{payout.summary?.totalAppointments || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span>Gross Earnings:</span>
                        <span>{formatCurrency(payout.summary?.grossEarnings)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Commission Deducted:</span>
                        <span className="negative">-{formatCurrency(payout.summary?.totalCommissionDeducted)}</span>
                      </div>
                      <div className="detail-row highlight">
                        <span>Net Payout:</span>
                        <span className="positive">{formatCurrency(payout.summary?.netPayoutAmount)}</span>
                      </div>
                    </div>
                    {payout.transactionReference && (
                      <div className="payout-footer">
                        <span>Ref: {payout.transactionReference}</span>
                        <span>{new Date(payout.transactionDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-payouts">
                  <span>💸</span>
                  <p>No payouts yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};






export default DoctorEarningsDashboard;
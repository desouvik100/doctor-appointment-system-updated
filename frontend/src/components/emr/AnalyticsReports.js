/**
 * Analytics & Reports Screen
 * Patient statistics, revenue reports, visit trends
 * Advanced Plan Feature - Requirements: 5.3
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './AnalyticsReports.css';

const AnalyticsReports = ({ clinicId }) => {
  const [dateRange, setDateRange] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [visitTrends, setVisitTrends] = useState([]);
  const [patientStats, setPatientStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (clinicId) {
      fetchAnalytics();
    }
  }, [clinicId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const [overviewRes, trendsRes, patientsRes, revenueRes] = await Promise.all([
        axios.get(`/api/emr/analytics/${clinicId}/overview`, { params }),
        axios.get(`/api/emr/analytics/${clinicId}/visit-trends`, { params }),
        axios.get(`/api/emr/analytics/${clinicId}/patient-stats`, { params }),
        axios.get(`/api/emr/analytics/${clinicId}/revenue`, { params })
      ]);

      if (overviewRes.data.success) setStats(overviewRes.data.stats);
      if (trendsRes.data.success) setVisitTrends(trendsRes.data.trends || []);
      if (patientsRes.data.success) setPatientStats(patientsRes.data.stats);
      if (revenueRes.data.success) setRevenueStats(revenueRes.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const getPercentChange = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const renderOverviewTab = () => (
    <div className="analytics-overview">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon visits">🏥</div>
          <div className="card-content">
            <span className="card-value">{formatNumber(stats?.totalVisits)}</span>
            <span className="card-label">Total Visits</span>
            {stats?.previousPeriodVisits !== undefined && (
              <span className={`card-change ${getPercentChange(stats.totalVisits, stats.previousPeriodVisits).isPositive ? 'positive' : 'negative'}`}>
                {getPercentChange(stats.totalVisits, stats.previousPeriodVisits).isPositive ? '↑' : '↓'}
                {getPercentChange(stats.totalVisits, stats.previousPeriodVisits).value}%
              </span>
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon patients">👥</div>
          <div className="card-content">
            <span className="card-value">{formatNumber(stats?.newPatients)}</span>
            <span className="card-label">New Patients</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon revenue">💰</div>
          <div className="card-content">
            <span className="card-value">{formatCurrency(stats?.totalRevenue)}</span>
            <span className="card-label">Total Revenue</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon avg">📊</div>
          <div className="card-content">
            <span className="card-value">{(stats?.avgVisitsPerDay || 0).toFixed(1)}</span>
            <span className="card-label">Avg Visits/Day</span>
          </div>
        </div>
      </div>

      {/* Visit Trends Chart */}
      <div className="chart-section">
        <h3>📈 Visit Trends</h3>
        <div className="simple-chart">
          {visitTrends.length === 0 ? (
            <div className="no-data">No data available for selected period</div>
          ) : (
            <div className="bar-chart">
              {visitTrends.map((item, idx) => (
                <div key={idx} className="bar-item">
                  <div 
                    className="bar" 
                    style={{ 
                      height: `${Math.max(10, (item.count / Math.max(...visitTrends.map(t => t.count))) * 100)}%` 
                    }}
                  >
                    <span className="bar-value">{item.count}</span>
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visit Type Distribution */}
      <div className="distribution-section">
        <h3>📋 Visit Type Distribution</h3>
        <div className="distribution-grid">
          {stats?.visitTypeDistribution?.map((type, idx) => (
            <div key={idx} className="distribution-item">
              <div className="dist-header">
                <span className="dist-label">{type.type || 'Unknown'}</span>
                <span className="dist-value">{type.count}</span>
              </div>
              <div className="dist-bar">
                <div 
                  className="dist-fill" 
                  style={{ 
                    width: `${(type.count / (stats?.totalVisits || 1)) * 100}%`,
                    backgroundColor: getTypeColor(type.type)
                  }}
                ></div>
              </div>
              <span className="dist-percent">
                {((type.count / (stats?.totalVisits || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPatientsTab = () => (
    <div className="analytics-patients">
      <div className="patient-stats-grid">
        <div className="stat-box">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{formatNumber(patientStats?.totalPatients)}</span>
          <span className="stat-label">Total Patients</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🆕</span>
          <span className="stat-value">{formatNumber(patientStats?.newPatients)}</span>
          <span className="stat-label">New This Period</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🔄</span>
          <span className="stat-value">{formatNumber(patientStats?.returningPatients)}</span>
          <span className="stat-label">Returning Patients</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🚶</span>
          <span className="stat-value">{formatNumber(patientStats?.walkInPatients)}</span>
          <span className="stat-label">Walk-in Patients</span>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="chart-section">
        <h3>👤 Age Distribution</h3>
        <div className="age-distribution">
          {patientStats?.ageDistribution?.map((group, idx) => (
            <div key={idx} className="age-group">
              <span className="age-label">{group.range}</span>
              <div className="age-bar-container">
                <div 
                  className="age-bar" 
                  style={{ 
                    width: `${(group.count / (patientStats?.totalPatients || 1)) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="age-count">{group.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="chart-section">
        <h3>⚧ Gender Distribution</h3>
        <div className="gender-distribution">
          {patientStats?.genderDistribution?.map((gender, idx) => (
            <div key={idx} className="gender-item">
              <span className="gender-icon">
                {gender.gender === 'male' ? '👨' : gender.gender === 'female' ? '👩' : '🧑'}
              </span>
              <span className="gender-label">{gender.gender || 'Unknown'}</span>
              <span className="gender-count">{gender.count}</span>
              <span className="gender-percent">
                ({((gender.count / (patientStats?.totalPatients || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenueTab = () => (
    <div className="analytics-revenue">
      <div className="revenue-stats-grid">
        <div className="stat-box revenue-box">
          <span className="stat-icon">💰</span>
          <span className="stat-value">{formatCurrency(revenueStats?.totalRevenue)}</span>
          <span className="stat-label">Total Revenue</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">📅</span>
          <span className="stat-value">{formatCurrency(revenueStats?.avgRevenuePerDay)}</span>
          <span className="stat-label">Avg Revenue/Day</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">🏥</span>
          <span className="stat-value">{formatCurrency(revenueStats?.avgRevenuePerVisit)}</span>
          <span className="stat-label">Avg Revenue/Visit</span>
        </div>
        <div className="stat-box">
          <span className="stat-icon">📈</span>
          <span className="stat-value">{formatNumber(revenueStats?.totalTransactions)}</span>
          <span className="stat-label">Transactions</span>
        </div>
      </div>

      {/* Revenue by Source */}
      <div className="chart-section">
        <h3>💳 Revenue by Source</h3>
        <div className="revenue-sources">
          {revenueStats?.bySource?.map((source, idx) => (
            <div key={idx} className="source-item">
              <div className="source-info">
                <span className="source-name">{source.source || 'Other'}</span>
                <span className="source-amount">{formatCurrency(source.amount)}</span>
              </div>
              <div className="source-bar">
                <div 
                  className="source-fill" 
                  style={{ 
                    width: `${(source.amount / (revenueStats?.totalRevenue || 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="chart-section">
        <h3>📊 Revenue Trend</h3>
        <div className="simple-chart">
          {revenueStats?.trend?.length === 0 ? (
            <div className="no-data">No revenue data for selected period</div>
          ) : (
            <div className="bar-chart revenue-chart">
              {revenueStats?.trend?.map((item, idx) => (
                <div key={idx} className="bar-item">
                  <div 
                    className="bar revenue-bar" 
                    style={{ 
                      height: `${Math.max(10, (item.amount / Math.max(...(revenueStats?.trend?.map(t => t.amount) || [1]))) * 100)}%` 
                    }}
                  >
                    <span className="bar-value">{formatCurrency(item.amount)}</span>
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getTypeColor = (type) => {
    const colors = {
      walk_in: '#f59e0b',
      appointment: '#3b82f6',
      follow_up: '#10b981',
      emergency: '#ef4444'
    };
    return colors[type] || '#64748b';
  };

  if (loading) {
    return (
      <div className="analytics-reports">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-reports">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">📈</span>
            Analytics & Reports
          </h1>
          <p className="header-subtitle">Clinic performance insights</p>
        </div>
        <div className="date-range-picker">
          <div className="date-input">
            <label>From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="date-input">
            <label>To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <button className="btn-refresh" onClick={fetchAnalytics}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          👥 Patients
        </button>
        <button 
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Revenue
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'patients' && renderPatientsTab()}
        {activeTab === 'revenue' && renderRevenueTab()}
      </div>
    </div>
  );
};

export default AnalyticsReports;

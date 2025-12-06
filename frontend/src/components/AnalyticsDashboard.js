// frontend/src/components/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AnalyticsDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [specializationStats, setSpecializationStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, trendsRes, revenueRes, doctorsRes, specRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/overview`),
        axios.get(`${API_URL}/analytics/appointment-trends?days=${dateRange}`),
        axios.get(`${API_URL}/analytics/revenue-trends?days=${dateRange}`),
        axios.get(`${API_URL}/analytics/top-doctors?limit=5`),
        axios.get(`${API_URL}/analytics/specialization-stats`)
      ]);

      setOverview(overviewRes.data);
      setAppointmentTrends(trendsRes.data);
      setRevenueTrends(revenueRes.data);
      setTopDoctors(doctorsRes.data);
      setSpecializationStats(specRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthIndicator = (growth) => {
    if (growth > 0) return { icon: '↑', class: 'positive', text: `+${growth}%` };
    if (growth < 0) return { icon: '↓', class: 'negative', text: `${growth}%` };
    return { icon: '→', class: 'neutral', text: '0%' };
  };

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(d => d[key] || 0), 1);
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="analytics-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>
          <i className="fas fa-chart-line"></i>
          Analytics Dashboard
        </h2>
        <div className="date-range-selector">
          <button 
            className={dateRange === 7 ? 'active' : ''}
            onClick={() => setDateRange(7)}
          >
            7 Days
          </button>
          <button 
            className={dateRange === 30 ? 'active' : ''}
            onClick={() => setDateRange(30)}
          >
            30 Days
          </button>
          <button 
            className={dateRange === 90 ? 'active' : ''}
            onClick={() => setDateRange(90)}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card patients">
          <div className="card-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{overview?.overview?.totalPatients || 0}</span>
            <span className="card-label">Total Patients</span>
          </div>
        </div>

        <div className="overview-card doctors">
          <div className="card-icon">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{overview?.overview?.totalDoctors || 0}</span>
            <span className="card-label">Active Doctors</span>
          </div>
        </div>

        <div className="overview-card appointments">
          <div className="card-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{overview?.thisMonth?.appointments || 0}</span>
            <span className="card-label">This Month</span>
            {overview?.thisMonth?.appointmentGrowth !== undefined && (
              <span className={`growth-badge ${getGrowthIndicator(overview.thisMonth.appointmentGrowth).class}`}>
                {getGrowthIndicator(overview.thisMonth.appointmentGrowth).text}
              </span>
            )}
          </div>
        </div>

        <div className="overview-card revenue">
          <div className="card-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="card-content">
            <span className="card-value">{formatCurrency(overview?.thisMonth?.revenue || 0)}</span>
            <span className="card-label">Revenue</span>
            {overview?.thisMonth?.revenueGrowth !== undefined && (
              <span className={`growth-badge ${getGrowthIndicator(overview.thisMonth.revenueGrowth).class}`}>
                {getGrowthIndicator(overview.thisMonth.revenueGrowth).text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <i className="fas fa-clock"></i>
          <span className="stat-value">{overview?.overview?.pendingAppointments || 0}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-check-circle"></i>
          <span className="stat-value">{overview?.overview?.completedAppointments || 0}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-calendar-day"></i>
          <span className="stat-value">{overview?.overview?.todayAppointments || 0}</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-item">
          <i className="fas fa-hospital"></i>
          <span className="stat-value">{overview?.overview?.totalClinics || 0}</span>
          <span className="stat-label">Clinics</span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Appointment Trends Chart */}
        <div className="analytics-card chart-card">
          <h3>
            <i className="fas fa-chart-area"></i>
            Appointment Trends
          </h3>
          <div className="simple-chart">
            {appointmentTrends.length > 0 ? (
              <div className="bar-chart">
                {appointmentTrends.slice(-14).map((day, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar"
                      style={{ 
                        height: `${(day.total / getMaxValue(appointmentTrends, 'total')) * 100}%` 
                      }}
                      title={`${day._id}: ${day.total} appointments`}
                    >
                      <span className="bar-value">{day.total}</span>
                    </div>
                    <span className="bar-label">
                      {new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="analytics-card chart-card">
          <h3>
            <i className="fas fa-chart-bar"></i>
            Revenue Trends
          </h3>
          <div className="simple-chart">
            {revenueTrends.length > 0 ? (
              <div className="bar-chart revenue-chart">
                {revenueTrends.slice(-14).map((day, index) => (
                  <div key={index} className="bar-item">
                    <div 
                      className="bar"
                      style={{ 
                        height: `${(day.total / getMaxValue(revenueTrends, 'total')) * 100}%` 
                      }}
                      title={`${day._id}: ${formatCurrency(day.total)}`}
                    >
                      <span className="bar-value">₹{Math.round(day.total / 1000)}k</span>
                    </div>
                    <span className="bar-label">
                      {new Date(day._id).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No revenue data</div>
            )}
          </div>
        </div>

        {/* Top Doctors */}
        <div className="analytics-card">
          <h3>
            <i className="fas fa-trophy"></i>
            Top Performing Doctors
          </h3>
          <div className="top-doctors-list">
            {topDoctors.length > 0 ? (
              topDoctors.map((doctor, index) => (
                <div key={doctor._id} className="doctor-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="doctor-info">
                    <span className="doctor-name">{doctor.name}</span>
                    <span className="doctor-spec">{doctor.specialization}</span>
                  </div>
                  <div className="doctor-stats">
                    <span className="appointments-count">{doctor.appointmentCount}</span>
                    <span className="appointments-label">appointments</span>
                  </div>
                  {doctor.rating > 0 && (
                    <div className="doctor-rating">
                      <i className="fas fa-star"></i>
                      {doctor.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        {/* Specialization Distribution */}
        <div className="analytics-card">
          <h3>
            <i className="fas fa-stethoscope"></i>
            Specialization Distribution
          </h3>
          <div className="specialization-list">
            {specializationStats.slice(0, 6).map((spec, index) => (
              <div key={index} className="spec-item">
                <div className="spec-info">
                  <span className="spec-name">{spec._id}</span>
                  <span className="spec-count">{spec.count} doctors</span>
                </div>
                <div className="spec-bar-container">
                  <div 
                    className="spec-bar"
                    style={{ 
                      width: `${(spec.count / getMaxValue(specializationStats, 'count')) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="spec-appointments">{spec.appointments || 0} appts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <button onClick={() => window.open(`${API_URL}/analytics/export?type=appointments&format=json`, '_blank')}>
            <i className="fas fa-download"></i> Export Appointments
          </button>
          <button onClick={() => window.open(`${API_URL}/analytics/export?type=revenue&format=json`, '_blank')}>
            <i className="fas fa-download"></i> Export Revenue
          </button>
          <button onClick={() => window.open(`${API_URL}/analytics/export?type=patients&format=json`, '_blank')}>
            <i className="fas fa-download"></i> Export Patients
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

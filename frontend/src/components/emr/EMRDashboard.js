/**
 * EMR Dashboard Screen
 * Key clinic metrics, today's appointments, and quick actions
 * Advanced Plan Feature - Requirements: 5.2
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './EMRDashboard.css';

const EMRDashboard = ({ clinicId, onNavigate }) => {
  const [stats, setStats] = useState({
    todayVisits: 0,
    totalPatients: 0,
    pendingFollowUps: 0,
    completedToday: 0,
    waitingPatients: 0,
    monthlyVisits: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (clinicId) {
      fetchDashboardData();
    }
  }, [clinicId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, appointmentsRes, activityRes] = await Promise.all([
        axios.get(`/api/emr/dashboard/${clinicId}/stats`),
        axios.get(`/api/emr/dashboard/${clinicId}/today-appointments`),
        axios.get(`/api/emr/dashboard/${clinicId}/recent-activity`)
      ]);

      if (dashboardRes.data.success) {
        setStats(dashboardRes.data.stats || stats);
      }
      if (appointmentsRes.data.success) {
        setTodayAppointments(appointmentsRes.data.appointments || []);
      }
      if (activityRes.data.success) {
        setRecentActivity(activityRes.data.activities || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      waiting: 'status-waiting',
      in_progress: 'status-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return statusMap[status] || 'status-default';
  };

  const quickActions = [
    { id: 'patient_registration', icon: '📋', label: 'Register Patient', screen: 'patient_registration' },
    { id: 'visit_history', icon: '📅', label: 'Visit History', screen: 'visit_history' },
    { id: 'basic_prescription', icon: '💊', label: 'New Prescription', screen: 'basic_prescription' },
    { id: 'vitals_recorder', icon: '❤️', label: 'Record Vitals', screen: 'vitals_recorder' },
    { id: 'lab_orders', icon: '🧪', label: 'Lab Orders', screen: 'lab_orders' },
    { id: 'medical_history', icon: '📋', label: 'Medical History', screen: 'medical_history' },
    { id: 'diagnosis_coding', icon: '🏥', label: 'ICD-10 Coding', screen: 'diagnosis_coding' },
    { id: 'analytics_reports', icon: '📈', label: 'View Analytics', screen: 'analytics_reports' },
    { id: 'staff_management', icon: '👥', label: 'Manage Staff', screen: 'staff_management' },
    { id: 'data_export', icon: '📤', label: 'Export Data', screen: 'data_export' }
  ];

  // Clinical features for quick access
  const clinicalFeatures = [
    { id: 'vitals', icon: '❤️', label: 'Vitals Recording', screen: 'vitals_recorder', description: 'Record patient vital signs' },
    { id: 'vitals_trends', icon: '📈', label: 'Vitals Trends', screen: 'vitals_trends', description: 'View vital sign trends' },
    { id: 'lab_orders', icon: '🧪', label: 'Lab Orders', screen: 'lab_orders', description: 'Order and track lab tests' },
    { id: 'medical_history', icon: '📋', label: 'Medical History', screen: 'medical_history', description: 'Patient medical history' },
    { id: 'diagnosis_coding', icon: '🏥', label: 'ICD-10 Coding', screen: 'diagnosis_coding', description: 'Search and add diagnoses' },
    { id: 'drug_interactions', icon: '⚠️', label: 'Drug Interactions', screen: 'drug_interactions', description: 'Check drug interactions' }
  ];

  if (loading) {
    return (
      <div className="emr-dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emr-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">🏠</span>
            EMR Dashboard
          </h1>
          <p className="header-subtitle">Overview of your clinic's activity</p>
        </div>
        <button className="btn-refresh" onClick={fetchDashboardData}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.todayVisits}</span>
            <span className="stat-label">Today's Visits</span>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{stats.completedToday}</span>
            <span className="stat-label">Completed Today</span>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-value">{stats.waitingPatients}</span>
            <span className="stat-label">Waiting Now</span>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPatients}</span>
            <span className="stat-label">Total Patients</span>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingFollowUps}</span>
            <span className="stat-label">Pending Follow-ups</span>
          </div>
        </div>
        <div className="stat-card stat-teal">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{stats.monthlyVisits}</span>
            <span className="stat-label">This Month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <div className="dashboard-card appointments-card">
          <div className="card-header">
            <h3>📅 Today's Appointments</h3>
            <button 
              className="btn-view-all"
              onClick={() => onNavigate && onNavigate('visit_history')}
            >
              View All →
            </button>
          </div>
          <div className="card-content">
            {todayAppointments.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="appointments-list">
                {todayAppointments.slice(0, 8).map((apt, idx) => (
                  <div key={apt._id || idx} className="appointment-item">
                    <div className="apt-time">{formatTime(apt.appointmentTime || apt.visitDate)}</div>
                    <div className="apt-info">
                      <span className="apt-patient">{apt.patientName || apt.patientId?.name || 'Unknown'}</span>
                      <span className="apt-doctor">Dr. {apt.doctorName || apt.doctorId?.name || 'Unassigned'}</span>
                    </div>
                    <span className={`apt-status ${getStatusClass(apt.status)}`}>
                      {apt.status?.replace('_', ' ') || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              {quickActions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => onNavigate && onNavigate(action.screen)}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Features */}
        <div className="dashboard-card clinical-card">
          <div className="card-header">
            <h3>🩺 Clinical Features</h3>
          </div>
          <div className="card-content">
            <div className="clinical-features-grid">
              {clinicalFeatures.map((feature) => (
                <button
                  key={feature.id}
                  className="clinical-feature-btn"
                  onClick={() => onNavigate && onNavigate(feature.screen)}
                >
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-info">
                    <span className="feature-label">{feature.label}</span>
                    <span className="feature-desc">{feature.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3>🕐 Recent Activity</h3>
            <button 
              className="btn-view-all"
              onClick={() => onNavigate && onNavigate('audit_logs')}
            >
              View Logs →
            </button>
          </div>
          <div className="card-content">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.slice(0, 10).map((activity, idx) => (
                  <div key={activity._id || idx} className="activity-item">
                    <div className="activity-icon">
                      {activity.action === 'create' ? '➕' : 
                       activity.action === 'update' ? '✏️' : 
                       activity.action === 'view' ? '👁️' : '📌'}
                    </div>
                    <div className="activity-content">
                      <span className="activity-text">
                        <strong>{activity.userSnapshot?.name || 'User'}</strong>
                        {' '}{activity.action}{' '}
                        {activity.entityType?.toLowerCase()}
                      </span>
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMRDashboard;

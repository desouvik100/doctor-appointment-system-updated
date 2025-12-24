/**
 * Modern Mobile Patient Home
 * Startup-style mobile UI for patient dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import axios from '../api/config';
import toast from 'react-hot-toast';
import PullToRefresh from './PullToRefresh';

const MobilePatientHome = ({ user, onNavigate, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, prescriptions: 0 });
  const isNative = Capacitor.isNativePlatform();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes] = await Promise.all([
        axios.get('/api/appointments/user').catch(() => ({ data: [] }))
      ]);
      
      const appts = apptRes.data?.appointments || apptRes.data || [];
      setAppointments(appts.slice(0, 3));
      
      const upcoming = appts.filter(a => 
        new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled'
      ).length;
      const completed = appts.filter(a => a.status === 'completed').length;
      
      setStats({ upcoming, completed, prescriptions: 0 });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Pull to refresh handler - refreshes data from backend
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Pull to refresh triggered');
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    { icon: 'fa-calendar-plus', label: 'Book', color: 'primary', action: () => onNavigate?.('book') },
    { icon: 'fa-video', label: 'Consult', color: 'success', action: () => onNavigate?.('consult') },
    { icon: 'fa-file-medical', label: 'Records', color: 'info', action: () => onNavigate?.('records') },
    { icon: 'fa-pills', label: 'Medicine', color: 'warning', action: () => onNavigate?.('medicines') },
  ];


  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isNative}>
      <div className="m-app m-content-with-nav">
      {/* Header */}
      <header className="m-header">
        <div>
          <p className="m-hero-greeting">{getGreeting()}</p>
          <h1 className="m-header-title">{user?.name?.split(' ')[0] || 'User'} 👋</h1>
        </div>
        <div className="m-flex m-gap-sm">
          <button className="m-header-action" onClick={() => onNavigate?.('notifications')}>
            <i className="fas fa-bell"></i>
            <span className="m-notification-dot"></span>
          </button>
          <button className="m-header-action" onClick={() => onNavigate?.('profile')}>
            <i className="fas fa-user-circle"></i>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="m-search">
        <i className="fas fa-search m-search-icon"></i>
        <input 
          type="text" 
          className="m-search-input" 
          placeholder="Search doctors, specialties..."
          onClick={() => onNavigate?.('search')}
          readOnly
        />
      </div>

      {/* Quick Actions */}
      <div className="m-quick-actions m-stagger">
        {quickActions.map((action, idx) => (
          <button key={idx} className="m-quick-action m-animate-fade-up" onClick={action.action}>
            <div className={`m-quick-action-icon ${action.color}`}>
              <i className={`fas ${action.icon}`}></i>
            </div>
            <span className="m-quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="m-stats-grid m-mb-lg">
        <div className="m-stat-card">
          <div className="m-stat-icon m-gradient-primary" style={{ color: 'white' }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <p className="m-stat-value">{stats.upcoming}</p>
          <p className="m-stat-label">Upcoming</p>
        </div>
        <div className="m-stat-card">
          <div className="m-stat-icon m-gradient-success" style={{ color: 'white' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <p className="m-stat-value">{stats.completed}</p>
          <p className="m-stat-label">Completed</p>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <section className="m-section">
        <div className="m-section-header">
          <h2 className="m-section-title">Upcoming</h2>
          <button className="m-section-action" onClick={() => onNavigate?.('appointments')}>
            See All
          </button>
        </div>

        {loading ? (
          <div className="m-card">
            <div className="m-skeleton m-skeleton-card"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="m-stagger">
            {appointments.map((appt, idx) => (
              <div key={appt._id || idx} className="m-appointment-card m-mb-md m-animate-fade-up upcoming">
                <div className="m-appointment-time">
                  <i className="far fa-clock"></i>
                  {new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })} • {appt.appointmentTime || '10:00 AM'}
                </div>
                <div className="m-appointment-doctor">
                  <div className="m-card-avatar">
                    {appt.doctorId?.name?.[0] || 'D'}
                  </div>
                  <div className="m-appointment-info">
                    <h4>Dr. {appt.doctorId?.name || 'Doctor'}</h4>
                    <p>{appt.doctorId?.specialization || 'General Physician'}</p>
                  </div>
                </div>
                <div className="m-appointment-actions">
                  <button className="m-btn m-btn-secondary m-btn-sm">Reschedule</button>
                  <button className="m-btn m-btn-primary m-btn-sm">Join</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="m-empty">
            <div className="m-empty-icon">
              <i className="far fa-calendar"></i>
            </div>
            <h3 className="m-empty-title">No Appointments</h3>
            <p className="m-empty-text">Book your first appointment with a doctor</p>
            <button className="m-btn m-btn-primary" onClick={() => onNavigate?.('book')}>
              <i className="fas fa-plus"></i> Book Now
            </button>
          </div>
        )}
      </section>


      {/* Top Doctors Section */}
      <section className="m-section">
        <div className="m-section-header">
          <h2 className="m-section-title">Top Doctors</h2>
          <button className="m-section-action" onClick={() => onNavigate?.('doctors')}>
            See All
          </button>
        </div>

        <div className="m-doctors-scroll">
          {[1, 2, 3].map((_, idx) => (
            <div key={idx} className="m-doctor-card">
              <div className="m-doctor-header">
                <div className="m-doctor-avatar m-gradient-primary" style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' 
                }}>
                  <i className="fas fa-user-md"></i>
                </div>
                <div className="m-doctor-info">
                  <h4>Dr. Sharma</h4>
                  <p>Cardiologist</p>
                  <div className="m-doctor-rating">
                    <i className="fas fa-star"></i> 4.9 <span>(120)</span>
                  </div>
                </div>
              </div>
              <div className="m-doctor-tags">
                <span className="m-doctor-tag">15+ Years</span>
                <span className="m-doctor-tag">AIIMS</span>
              </div>
              <div className="m-doctor-footer">
                <div className="m-doctor-fee">₹500 <span>/ visit</span></div>
                <button className="m-btn m-btn-primary m-btn-sm">Book</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Health Metrics */}
      <section className="m-section m-mb-xl">
        <div className="m-section-header">
          <h2 className="m-section-title">Health Metrics</h2>
          <button className="m-section-action" onClick={() => onNavigate?.('health')}>
            Add Data
          </button>
        </div>

        <div className="m-health-grid">
          <div className="m-health-card">
            <div className="m-health-header">
              <div className="m-health-icon m-gradient-danger" style={{ color: 'white' }}>
                <i className="fas fa-heartbeat"></i>
              </div>
              <div className="m-health-status"></div>
            </div>
            <div className="m-health-value">72 <span>bpm</span></div>
            <div className="m-health-label">Heart Rate</div>
          </div>
          <div className="m-health-card">
            <div className="m-health-header">
              <div className="m-health-icon m-gradient-primary" style={{ color: 'white' }}>
                <i className="fas fa-tint"></i>
              </div>
              <div className="m-health-status"></div>
            </div>
            <div className="m-health-value">120/80</div>
            <div className="m-health-label">Blood Pressure</div>
          </div>
          <div className="m-health-card">
            <div className="m-health-header">
              <div className="m-health-icon m-gradient-warning" style={{ color: 'white' }}>
                <i className="fas fa-weight"></i>
              </div>
              <div className="m-health-status warning"></div>
            </div>
            <div className="m-health-value">68 <span>kg</span></div>
            <div className="m-health-label">Weight</div>
          </div>
          <div className="m-health-card">
            <div className="m-health-header">
              <div className="m-health-icon m-gradient-success" style={{ color: 'white' }}>
                <i className="fas fa-walking"></i>
              </div>
              <div className="m-health-status"></div>
            </div>
            <div className="m-health-value">8,432</div>
            <div className="m-health-label">Steps Today</div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="m-bottom-nav">
        <button className="m-nav-item active">
          <i className="fas fa-home"></i>
          <span>Home</span>
        </button>
        <button className="m-nav-item" onClick={() => onNavigate?.('appointments')}>
          <i className="fas fa-calendar-alt"></i>
          <span>Bookings</span>
          {stats.upcoming > 0 && <span className="m-nav-badge">{stats.upcoming}</span>}
        </button>
        <button className="m-nav-item" onClick={() => onNavigate?.('records')}>
          <i className="fas fa-file-medical-alt"></i>
          <span>Records</span>
        </button>
        <button className="m-nav-item" onClick={() => onNavigate?.('profile')}>
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </button>
      </nav>

      {/* Floating Action Button */}
      <button className="m-fab m-fab-extended" onClick={() => onNavigate?.('book')}>
        <i className="fas fa-plus"></i>
        Book
      </button>
    </div>
    </PullToRefresh>
  );
};

export default MobilePatientHome;

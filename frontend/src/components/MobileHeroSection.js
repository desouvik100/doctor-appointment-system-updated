import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { tapFeedback } from '../mobile/haptics';
import './MobileHeroSection.css';

const MobileHeroSection = ({ user, onVideoConsult, onClinicVisit, onSmartMatch, onSearch, doctorCounts = {} }) => {
  const [greeting, setGreeting] = useState('Good morning');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleTap = (callback) => {
    if (isNative) tapFeedback();
    callback?.();
  };

  const specialties = [
    { id: 'general', icon: 'fa-stethoscope', label: 'General', color: '#10b981', count: doctorCounts.general || 42 },
    { id: 'dental', icon: 'fa-tooth', label: 'Dental', color: '#3b82f6', count: doctorCounts.dental || 18 },
    { id: 'cardio', icon: 'fa-heartbeat', label: 'Heart', color: '#ef4444', count: doctorCounts.cardio || 12 },
    { id: 'ortho', icon: 'fa-bone', label: 'Ortho', color: '#f59e0b', count: doctorCounts.ortho || 15 },
    { id: 'skin', icon: 'fa-hand-sparkles', label: 'Skin', color: '#ec4899', count: doctorCounts.skin || 22 },
    { id: 'eye', icon: 'fa-eye', label: 'Eye', color: '#8b5cf6', count: doctorCounts.eye || 9 },
    { id: 'child', icon: 'fa-baby', label: 'Pediatric', color: '#06b6d4', count: doctorCounts.child || 14 },
    { id: 'neuro', icon: 'fa-brain', label: 'Neuro', color: '#6366f1', count: doctorCounts.neuro || 7 },
  ];

  const quickActions = [
    { id: 'video', icon: 'fa-video', label: 'Video Consult', subtitle: 'Talk to doctor now', colorClass: 'action-card-purple', action: onVideoConsult },
    { id: 'clinic', icon: 'fa-hospital', label: 'Book Visit', subtitle: 'In-clinic appointment', colorClass: 'action-card-green', action: onClinicVisit },
  ];

  return (
    <div className="swiggy-hero">
      {/* Gradient Header with Contextual Greeting */}
      <div className="swiggy-header">
        <div className="header-content">
          <div className="greeting-section">
            <p className="greeting-text">{greeting} 👋</p>
            <h1 className="user-name">{user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="greeting-subtitle">🩺 Book your appointment in under 30 seconds</p>
          </div>
        </div>
        
        {/* Search Bar with Helper Text */}
        <div className="search-bar" onClick={() => handleTap(() => onSearch?.(''))}>
          <i className="fas fa-search search-icon"></i>
          <span className="search-placeholder">Search doctors, specialties...</span>
          <div className="search-mic">
            <i className="fas fa-microphone"></i>
          </div>
        </div>
        <p className="search-hint">Try: fever, skin problem, dentist</p>
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <div 
            key={action.id}
            className={`action-card ${action.colorClass}`}
            onClick={() => handleTap(action.action)}
          >
            <div className="action-icon">
              <i className={`fas ${action.icon}`}></i>
            </div>
            <div className="action-text">
              <span className="action-label">{action.label}</span>
              <span className="action-subtitle">{action.subtitle}</span>
            </div>
            <i className="fas fa-chevron-right action-arrow"></i>
          </div>
        ))}
      </div>

      {/* AI Smart Match - Enhanced */}
      <div className="ai-banner" onClick={() => handleTap(onSmartMatch)}>
        <div className="ai-glow"></div>
        <div className="ai-content">
          <div className="ai-icon-wrap">
            <i className="fas fa-magic"></i>
            <span className="ai-badge">AI</span>
          </div>
          <div className="ai-text">
            <div className="ai-title-row">
              <span className="ai-title">Find Your Perfect Doctor</span>
              <span className="ai-time-badge">⚡ 1 min</span>
            </div>
            <span className="ai-desc">AI-powered matching · No signup · Free</span>
          </div>
        </div>
        <div className="ai-arrow pulse-arrow">
          <i className="fas fa-arrow-right"></i>
        </div>
      </div>

      {/* Specialties with Counts & Scroll Hint */}
      <div className="specialties-section">
        <div className="section-header">
          <h2>Browse by Specialty</h2>
          <span className="scroll-hint">Swipe →</span>
        </div>
        <div className="specialties-scroll">
          {specialties.map((spec) => (
            <div 
              key={spec.id} 
              className="specialty-chip"
              onClick={() => handleTap(() => onSearch?.(spec.label))}
            >
              <div className="specialty-icon" style={{ backgroundColor: `${spec.color}15`, color: spec.color }}>
                <i className={`fas ${spec.icon}`}></i>
              </div>
              <span className="specialty-label">{spec.label}</span>
              <span className="specialty-count">({spec.count})</span>
            </div>
          ))}
          <div className="scroll-fade"></div>
        </div>
      </div>

      {/* Enhanced Trust Indicators */}
      <div className="trust-strip">
        <div className="trust-item">
          <i className="fas fa-check-circle"></i>
          <span>Verified Doctors</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <i className="fas fa-clock"></i>
          <span>Available Today</span>
        </div>
        <div className="trust-divider"></div>
        <div className="trust-item">
          <i className="fas fa-star"></i>
          <span>Highly Rated</span>
        </div>
      </div>

      {/* Security Footer */}
      <div className="security-footer">
        <i className="fas fa-lock"></i>
        <span>Your data is secured & encrypted</span>
      </div>
    </div>
  );
};

export default MobileHeroSection;

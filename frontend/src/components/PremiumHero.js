import React from 'react';
import './PremiumHero.css';

const PremiumHero = ({ onGetStarted, onAdminLogin, onStaffLogin }) => {
  const features = [
    {
      icon: '📅',
      title: 'Easy Scheduling',
      description: 'Book appointments with top doctors in seconds',
      gradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
      iconBg: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)'
    },
    {
      icon: '📋',
      title: 'Medical Records',
      description: 'Access your health history anytime, anywhere',
      gradient: 'linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)',
      iconBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get instant health insights and recommendations',
      gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      iconBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    {
      icon: '💬',
      title: 'Secure Messaging',
      description: 'Chat directly with your healthcare providers',
      gradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
      iconBg: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
    }
  ];

  return (
    <div className="premium-hero">
      <div className="premium-hero-container">
        <div className="premium-hero-card">
          {/* Header */}
          <div className="premium-hero-header">
            <h1 className="premium-hero-title">
              Welcome to Patient Portal
            </h1>
            <p className="premium-hero-subtitle">
              Your complete healthcare management platform. Schedule appointments, 
              access medical records, and connect with healthcare professionals—all in one secure place.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="premium-features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="premium-feature-card"
                style={{ background: feature.gradient }}
              >
                <div 
                  className="premium-feature-icon"
                  style={{ background: feature.iconBg }}
                >
                  <span>{feature.icon}</span>
                </div>
                <h3 className="premium-feature-title">{feature.title}</h3>
                <p className="premium-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="premium-cta-section">
            <button 
              className="premium-cta-button"
              onClick={onGetStarted}
            >
              <i className="fas fa-user-circle"></i>
              <span>Sign In / Create Account</span>
            </button>
            
            {/* HIPAA Badge */}
            <div className="premium-hipaa-badge">
              <i className="fas fa-shield-alt"></i>
              <span>HIPAA Compliant – Secure & Private</span>
            </div>
          </div>
        </div>

        {/* Staff Access Buttons */}
        <div className="premium-staff-access">
          <button 
            className="premium-staff-button"
            onClick={onAdminLogin}
          >
            <i className="fas fa-user-shield"></i>
            <span>Admin Login</span>
          </button>
          <button 
            className="premium-staff-button"
            onClick={onStaffLogin}
          >
            <i className="fas fa-user-nurse"></i>
            <span>Staff Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumHero;

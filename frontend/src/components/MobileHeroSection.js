import { useState, useEffect } from 'react';
import './MobileHeroSection.css';

const MobileHeroSection = ({ onVideoConsult, onClinicVisit, onSmartMatch, onSearch }) => {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Attractive rotating taglines
  const taglines = [
    "Care that comes to you, anytime",
    "Expert doctors. Zero wait time.",
    "Healing made simple & fast",
    "Your wellness. Our priority.",
    "Book in seconds. Heal faster.",
    "Healthcare at your fingertips"
  ];
  
  // Smooth transition between taglines every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % taglines.length);
        setIsTransitioning(false);
      }, 500); // Half second for fade out, then change
    }, 3500);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <div className="mobile-hero-wrapper">
      {/* Header */}
      <div className="mobile-hero-header">
        <div className="hero-logo-animated">
          <div className="logo-pulse-ring"></div>
          <div className="logo-pulse-ring delay-1"></div>
          <div className="logo-inner">
            <i className="fas fa-heartbeat"></i>
          </div>
        </div>
        <button className="hero-search-btn" onClick={() => onSearch?.('')}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* Hero Text - Smooth Animated Tagline */}
      <div className="hero-tagline">
        <div className={`tagline-slider ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
          <h1>{taglines[taglineIndex]}</h1>
        </div>
      </div>

      {/* Service Cards */}
      <div className="hero-service-cards">
        <div className="hero-service-card" onClick={onVideoConsult}>
          <div className="hero-service-icon">
            <svg viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="28" r="16" fill="#b8d4ce"/>
              <rect x="24" y="44" width="32" height="32" rx="6" fill="#87bdb0"/>
              <circle cx="40" cy="26" r="8" fill="#fff"/>
              <rect x="36" y="24" width="8" height="4" rx="1" fill="#2d7a6d"/>
            </svg>
          </div>
          <span className="hero-service-label">Video<br/>Consultation</span>
        </div>
        
        <div className="hero-service-card" onClick={onClinicVisit}>
          <div className="hero-service-icon">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="16" y="28" width="48" height="44" rx="6" fill="#b8d4ce"/>
              <rect x="28" y="12" width="24" height="20" rx="4" fill="#87bdb0"/>
              <rect x="36" y="40" width="8" height="32" fill="#fff"/>
              <rect x="28" y="48" width="24" height="8" fill="#fff"/>
            </svg>
          </div>
          <span className="hero-service-label">Clinic<br/>Visit</span>
        </div>
      </div>

      {/* Smart Doctor Match */}
      <div className="hero-smart-match" onClick={onSmartMatch}>
        <div className="smart-match-icon-wrap">
          <i className="fas fa-robot"></i>
        </div>
        <span className="smart-match-text">Smart Doctor Match</span>
        <i className="fas fa-chevron-right smart-match-chevron"></i>
      </div>

      {/* Quick Stats */}
      <div className="hero-stats-row">
        <div className="hero-stat">
          <span className="stat-number">500+</span>
          <span className="stat-label">Doctors</span>
        </div>
        <div className="hero-stat">
          <span className="stat-number">10K+</span>
          <span className="stat-label">Patients</span>
        </div>
        <div className="hero-stat">
          <span className="stat-number">4.9</span>
          <span className="stat-label">Rating</span>
        </div>
      </div>
    </div>
  );
};

export default MobileHeroSection;

/**
 * Landing Page - Swiggy/Zomato Conversion Style
 * ACTION-FIRST: Search & Book above the fold
 * One goal: Make user book immediately
 */

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import './LandingPageSwiggy.css';

const LandingPageSwiggy = ({ onNavigate = () => {}, darkMode = false, toggleDarkMode = () => {} }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  // Auto-focus search on load
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const suggestions = [
    { icon: 'fa-thermometer-half', text: 'Fever', hot: true },
    { icon: 'fa-tooth', text: 'Dental', hot: true },
    { icon: 'fa-hand-sparkles', text: 'Skin Problem', hot: false },
    { icon: 'fa-baby', text: 'Child Specialist', hot: false },
    { icon: 'fa-eye', text: 'Eye Checkup', hot: false },
    { icon: 'fa-heartbeat', text: 'Heart', hot: false },
  ];

  const specialties = [
    { id: 'general', icon: 'fa-stethoscope', name: 'General', count: 120, color: '#10b981' },
    { id: 'dental', icon: 'fa-tooth', name: 'Dental', count: 60, color: '#3b82f6' },
    { id: 'pediatric', icon: 'fa-baby', name: 'Child', count: 40, color: '#f59e0b' },
    { id: 'skin', icon: 'fa-hand-sparkles', name: 'Skin', count: 35, color: '#ec4899' },
    { id: 'eye', icon: 'fa-eye', name: 'Eye', count: 28, color: '#8b5cf6' },
    { id: 'ortho', icon: 'fa-bone', name: 'Ortho', count: 22, color: '#06b6d4' },
  ];

  const handleSearch = () => {
    onNavigate('register');
  };

  const handleSuggestionClick = (text) => {
    setSearchQuery(text);
    setShowSuggestions(false);
    onNavigate('register');
  };

  return (
    <div className={`landing-swiggy ${darkMode ? 'dark' : ''}`}>
      {/* Minimal Header */}
      <header className={`swiggy-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
          <div className="nav-logo">
            <div className="logo-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
            <span className="logo-text">HealthSync</span>
          </div>
          
          <div className="nav-actions">
            <LanguageSelector darkMode={!scrolled} />
            <button className="nav-btn ghost" onClick={toggleDarkMode}>
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button className="nav-btn text" onClick={() => onNavigate('login')}>
              Sign In
            </button>
            <button className="nav-btn primary hide-mobile" onClick={() => onNavigate('register')}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero - ACTION FIRST */}
      <section className="swiggy-hero">
        <div className="hero-content">
          {/* Emotional Headline */}
          <h1 className="hero-headline">
            Skip the queue.<br/>
            <span className="highlight">Book instantly.</span>
          </h1>
          
          {/* Search Bar - THE MAIN ACTION */}
          <div className="search-container">
            <div className="search-box">
              <div className="search-input-group">
                <i className="fas fa-search search-icon"></i>
                <input
                  ref={searchRef}
                  type="text"
                  className="search-input"
                  placeholder="Search doctors, symptoms, clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
              </div>
              
              <select 
                className="specialty-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                <option value="general">General Physician</option>
                <option value="dental">Dentist</option>
                <option value="pediatric">Pediatrician</option>
                <option value="derma">Dermatologist</option>
                <option value="cardio">Cardiologist</option>
              </select>
              
              <button className="search-btn" onClick={handleSearch}>
                <i className="fas fa-calendar-check"></i>
                <span>Book Now</span>
              </button>
            </div>

            {/* Instant Suggestions */}
            {showSuggestions && (
              <div className="suggestions-dropdown">
                <div className="suggestions-label">Popular searches</div>
                <div className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      className={`suggestion-item ${s.hot ? 'hot' : ''}`}
                      onClick={() => handleSuggestionClick(s.text)}
                    >
                      <i className={`fas ${s.icon}`}></i>
                      <span>{s.text}</span>
                      {s.hot && <span className="hot-badge">🔥</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trust Signals - Immediately visible */}
          <div className="trust-signals">
            <div className="trust-item">
              <i className="fas fa-star"></i>
              <span><strong>4.8</strong> rating (2,000+ users)</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <i className="fas fa-hospital"></i>
              <span><strong>300+</strong> clinics</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <i className="fas fa-clock"></i>
              <span>Avg wait: <strong>8 mins</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Cards - Swipeable */}
      <section className="specialties-section">
        <div className="section-header">
          <h2>Browse by specialty</h2>
        </div>
        <div className="specialties-scroll">
          {specialties.map((spec) => (
            <button 
              key={spec.id}
              className="specialty-card"
              onClick={() => onNavigate('register')}
            >
              <div className="specialty-icon" style={{ backgroundColor: `${spec.color}15`, color: spec.color }}>
                <i className={`fas ${spec.icon}`}></i>
              </div>
              <span className="specialty-name">{spec.name}</span>
              <span className="specialty-count">{spec.count} doctors</span>
            </button>
          ))}
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="social-proof">
        <div className="proof-content">
          <div className="proof-item">
            <div className="proof-number">50,000+</div>
            <div className="proof-label">Appointments booked</div>
          </div>
          <div className="proof-item">
            <div className="proof-number">500+</div>
            <div className="proof-label">Verified doctors</div>
          </div>
          <div className="proof-item">
            <div className="proof-number">99.9%</div>
            <div className="proof-label">Uptime</div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimal */}
      <section className="how-it-works">
        <h2>Book in 3 simple steps</h2>
        <div className="steps-row">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon"><i className="fas fa-search"></i></div>
            <h3>Search</h3>
            <p>Find doctors by specialty or symptom</p>
          </div>
          <div className="step-arrow"><i className="fas fa-chevron-right"></i></div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon"><i className="fas fa-calendar-alt"></i></div>
            <h3>Select</h3>
            <p>Choose your preferred time slot</p>
          </div>
          <div className="step-arrow"><i className="fas fa-chevron-right"></i></div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon"><i className="fas fa-check-circle"></i></div>
            <h3>Confirm</h3>
            <p>Get instant confirmation</p>
          </div>
        </div>
      </section>

      {/* For Clinics - Secondary CTA */}
      <section className="for-clinics">
        <div className="clinics-content">
          <div className="clinics-text">
            <span className="clinics-badge">For Clinics</span>
            <h2>Grow your practice with HealthSync</h2>
            <p>Join 300+ clinics already using our platform</p>
          </div>
          <button className="clinics-btn" onClick={() => onNavigate('register')}>
            <i className="fas fa-hospital"></i>
            Register Your Clinic
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="swiggy-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon small">
              <i className="fas fa-heartbeat"></i>
            </div>
            <span>HealthSync</span>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </div>
          <div className="footer-copy">
            © 2024 HealthSync. Made with ❤️ in India
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA - Mobile */}
      <div className="sticky-cta">
        <button className="sticky-btn primary" onClick={() => onNavigate('register')}>
          <i className="fas fa-calendar-check"></i>
          Book Appointment
        </button>
        <button className="sticky-btn secondary" onClick={() => onNavigate('register')}>
          <i className="fas fa-video"></i>
          Video Consult
        </button>
      </div>
    </div>
  );
};

export default LandingPageSwiggy;

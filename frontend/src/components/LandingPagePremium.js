import React, { useState, useEffect, useRef } from 'react';
import '../styles/landing-page-premium-v2.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import toast from 'react-hot-toast';

const LandingPagePremium = ({ onNavigate = () => {}, darkMode = false, toggleDarkMode = () => {} }) => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const loginDropdownRef = useRef(null);

  // Click outside to close the login dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
    };
    if (loginDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [loginDropdownOpen]);

  useEffect(() => {
    setIsNativeApp(false); // Web-only app
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
    };
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (emailInput) {
      toast.success('Successfully subscribed to newsletter!');
      setEmailInput('');
    }
  };

  const dropdownItemStyle = {
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '500',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s ease',
  };

  const ECGLogo = ({ className = '' }) => (
    <svg viewBox="0 0 50 32" fill="none" className={className} style={{ width: 38, height: 28, minWidth: 38 }}>
      <path 
        d="M0 16 L12 16 L16 6 L20 26 L24 10 L28 22 L32 16 L50 16" 
        stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(9,9,11,0.08)"} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        className="logo-premium__ecg" 
        d="M0 16 L12 16 L16 6 L20 26 L24 10 L28 22 L32 16 L50 16" 
        stroke={darkMode ? "#fff" : "#0ea5e9"} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  const recommendedDoctors = [
    {
      name: 'Dr. Ananya Mukherjee',
      specialty: 'General Physician',
      experience: '12 Years Exp',
      rating: '4.9',
      reviews: '120 reviews',
      fee: '₹500',
      availability: 'Available Today',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'
    },
    {
      name: 'Dr. Sunil Patel',
      specialty: 'Cardiologist',
      experience: '15 Years Exp',
      rating: '4.8',
      reviews: '95 reviews',
      fee: '₹800',
      availability: 'Available Tomorrow',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face'
    },
    {
      name: 'Dr. Priya Sharma',
      specialty: 'Dermatologist',
      experience: '8 Years Exp',
      rating: '4.9',
      reviews: '150 reviews',
      fee: '₹600',
      availability: 'Available Today',
      image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=400&h=400&fit=crop&crop=face'
    },
    {
      name: 'Dr. Meera Krishnan',
      specialty: 'Pediatrician',
      experience: '10 Years Exp',
      rating: '4.7',
      reviews: '110 reviews',
      fee: '₹550',
      availability: 'Available Today',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Sharma',
      location: 'Kolkata, Patient',
      text: 'No more waiting in long queues! I book online, track my token number on my phone, and arrive just before my turn. Extremely convenient.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Priya Banerjee',
      location: 'Delhi, Patient',
      text: 'The online video consultation feature is a lifesaver. Consulted with a specialist during my lunch break, received my prescription instantly.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
    },
    {
      name: 'Amit Kumar',
      location: 'Pune, Patient',
      text: 'Very user-friendly portal. Real-time updates and SMS reminders ensure I never miss my appointment. Highly recommended for busy people.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const faqs = [
    { q: 'How do I book an appointment?', a: 'Simply sign up, browse doctors by specialty or location, select your preferred time slot, and confirm your booking. You\'ll receive instant confirmation via email and SMS.' },
    { q: 'Are the doctors verified?', a: 'Yes, all doctors on HealthSync are verified medical professionals. We verify their medical licenses, qualifications, and credentials before they can join our platform.' },
    { q: 'How do video consultations work?', a: 'After booking a video consultation, you\'ll receive a video meet link. At your appointment time, simply click the link to join the video call with your doctor.' },
    { q: 'Can I cancel or reschedule appointments?', a: 'Yes, you can cancel or reschedule appointments up to 2 hours before the scheduled time through your dashboard at no extra charge.' },
    { q: 'Is my health data secure?', a: 'Absolutely. We use bank-level encryption and are HIPAA compliant. Your health data is never shared without your explicit consent.' },
    { q: 'Do you offer refunds?', a: 'Yes, if a doctor cancels or doesn\'t show up, you\'ll receive a full refund. For other cases, please contact our support team.' },
  ];

  const pricingPlans = [
    { name: 'Basic', price: 'Free', period: 'forever', features: ['5 appointments/month', 'Video consultations', 'AI health assistant', 'Email support'], cta: 'Get Started', popular: false },
    { name: 'Pro', price: '₹299', period: '/month', features: ['Unlimited appointments', 'Priority booking', 'Health analytics', 'Family accounts (up to 5)', '24/7 support', 'Medicine reminders'], cta: 'Start Free Trial', popular: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Corporate wellness', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-site health camps'], cta: 'Contact Sales', popular: false },
  ];

  return (
    <div className={`landing-redesign ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sticky Navigation Bar */}
      <nav className="navbar-premium">
        <div className="nav-container">
          <a href="#home" className="nav-logo" onClick={scrollToTop}>
            <ECGLogo />
            <span>HealthSync</span>
          </a>

          <div className="nav-links">
            <a href="#home" className="nav-link">Home</a>
            <a href="#services" className="nav-link">{t('features')}</a>
            <a href="#doctors" className="nav-link">Doctors</a>
            <a href="#journey" className="nav-link">Appointments</a>
            <button onClick={() => onNavigate('about-us')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              About
            </button>
          </div>

          <div className="nav-actions">
            <LanguageSelector darkMode={darkMode} />
            
            <button
              onClick={toggleDarkMode}
              className="btn-shadcn-secondary"
              style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Toggle dark mode"
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <div ref={loginDropdownRef} style={{ position: 'relative', zIndex: 50 }}>
              <button 
                className="btn-shadcn-secondary"
                onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{t('signIn')}</span>
                <i className={`fas fa-chevron-${loginDropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '10px', opacity: 0.7 }}></i>
              </button>
              
              {loginDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e4e7',
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                    padding: '6px',
                    minWidth: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 100000
                  }}
                >
                  <button 
                    onClick={() => { onNavigate('login'); setLoginDropdownOpen(false); }} 
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f4f4f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-injured" style={{ color: '#0ea5e9', width: '16px' }}></i>
                    <span style={{ color: darkMode ? '#f1f5f9' : '#09090b' }}>Patient Portal</span>
                  </button>
                  <button 
                    onClick={() => { onNavigate('doctor-login'); setLoginDropdownOpen(false); }} 
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f4f4f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-md" style={{ color: '#22c55e', width: '16px' }}></i>
                    <span style={{ color: darkMode ? '#f1f5f9' : '#09090b' }}>Doctor Portal</span>
                  </button>
                  <button 
                    onClick={() => { onNavigate('receptionist-login'); setLoginDropdownOpen(false); }} 
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f4f4f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-tie" style={{ color: '#fbbf24', width: '16px' }}></i>
                    <span style={{ color: darkMode ? '#f1f5f9' : '#09090b' }}>Staff Portal</span>
                  </button>
                  <button 
                    onClick={() => { onNavigate('admin-login'); setLoginDropdownOpen(false); }} 
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f4f4f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-shield" style={{ color: '#ef4444', width: '16px' }}></i>
                    <span style={{ color: darkMode ? '#f1f5f9' : '#09090b' }}>Admin Portal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="grid-pattern"></div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="live-pulse" style={{ backgroundColor: '#22c55e' }}></span>
              <span>Healthcare, Unified</span>
            </div>
            
            <h1 className="hero-title" style={{ fontFamily: 'Geist, sans-serif' }}>
              Healthcare,<br />
              <span>Powered by AI.</span>
            </h1>
            
            <p className="hero-desc">
              HealthSync connects patients, doctors, clinics, diagnostics, prescriptions, appointments, and AI into one intelligent, unified platform.
            </p>
            
            <div className="hero-actions">
              <button onClick={() => onNavigate('register')} className="btn-shadcn-primary">
                Get Started
              </button>
              <button onClick={() => onNavigate('register')} className="btn-shadcn-secondary">
                Book Demo
              </button>
            </div>

            {/* Quick Search */}
            <div style={{
              background: darkMode ? '#1e293b' : '#ffffff',
              border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e4e4e7',
              borderRadius: '8px',
              padding: '6px 6px 6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
              maxWidth: '460px',
            }}>
              <i className="fas fa-search" style={{ color: '#a1a1aa', fontSize: '14px' }}></i>
              <select
                value={searchSpecialty}
                onChange={(e) => setSearchSpecialty(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '13.5px', color: searchSpecialty ? (darkMode ? '#f1f5f9' : '#09090b') : '#a1a1aa',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: '500',
                  appearance: 'none', WebkitAppearance: 'none',
                }}
              >
                <option value="" disabled style={{color: '#a1a1aa', backgroundColor: darkMode ? '#1e293b' : '#ffffff'}}>Find a specialty…</option>
                {['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Orthopedic', 'Gynecologist', 'Neurologist', 'Dentist'].map((s) => (
                  <option key={s} value={s} style={{color: darkMode ? '#f1f5f9' : '#09090b', backgroundColor: darkMode ? '#1e293b' : '#ffffff'}}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => onNavigate('register')}
                className="btn-shadcn-primary"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '6px' }}
              >
                Find Slots
              </button>
            </div>

            <div className="stats-row-minimal">
              <div className="stat-item-minimal">
                <span className="stat-val-minimal">500+</span>
                <span className="stat-lbl-minimal">Verified Experts</span>
              </div>
              <div className="stat-item-minimal">
                <span className="stat-val-minimal">50K+</span>
                <span className="stat-lbl-minimal">Happy Patients</span>
              </div>
              <div className="stat-item-minimal">
                <span className="stat-val-minimal">99.9%</span>
                <span className="stat-lbl-minimal">Uptime Core</span>
              </div>
            </div>
          </div>

          <div className="visualizer-container">
            {/* Centerpiece Vector lattice */}
            <svg viewBox="0 0 400 400" width="100%" height="100%" className="animate-breath" style={{ maxWidth: '380px', overflow: 'visible', zIndex: 1 }}>
              <circle cx="200" cy="200" r="160" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="1" fill="none" />
              <circle cx="200" cy="200" r="110" stroke="rgba(20, 184, 166, 0.07)" strokeWidth="1" fill="none" />
              <circle cx="200" cy="200" r="60" stroke="rgba(34, 197, 94, 0.09)" strokeWidth="1" fill="none" />

              <line x1="200" y1="200" x2="200" y2="70" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="200" y1="200" x2="310" y2="130" stroke="rgba(20, 184, 166, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="200" y1="200" x2="310" y2="270" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="200" y1="200" x2="200" y2="330" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="200" y1="200" x2="90" y2="270" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="200" y1="200" x2="90" y2="130" stroke="rgba(20, 184, 166, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />

              <circle cx="200" cy="200" r="120" stroke="rgba(14, 165, 233, 0.06)" strokeWidth="2" strokeDasharray="10,200" fill="none" className="animate-rotate" style={{ transformOrigin: '200px 200px' }} />
              <circle cx="200" cy="200" r="80" stroke="rgba(34, 197, 94, 0.07)" strokeWidth="1.5" strokeDasharray="15,120" fill="none" className="animate-rotate" style={{ transformOrigin: '200px 200px', animationDirection: 'reverse', animationDuration: '20s' }} />

              <circle cx="200" cy="70" r="7" fill="#0ea5e9" style={{ filter: 'drop-shadow(0 0 6px #0ea5e9)' }} />
              <circle cx="310" cy="130" r="7" fill="#14b8a6" style={{ filter: 'drop-shadow(0 0 6px #14b8a6)' }} />
              <circle cx="310" cy="270" r="7" fill="#06b6d4" style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }} />
              <circle cx="200" cy="330" r="7" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }} />
              <circle cx="90" cy="270" r="7" fill="#0ea5e9" style={{ filter: 'drop-shadow(0 0 6px #0ea5e9)' }} />
              <circle cx="90" cy="130" r="7" fill="#14b8a6" style={{ filter: 'drop-shadow(0 0 6px #14b8a6)' }} />

              <circle cx="200" cy="200" r="24" fill="url(#coreGradient)" style={{ filter: 'drop-shadow(0 0 16px rgba(14, 165, 233, 0.3))' }} />
              <circle cx="200" cy="200" r="10" fill={darkMode ? '#0b0f19' : '#ffffff'} />
              <circle cx="200" cy="200" r="5" fill="#0ea5e9" />

              <defs>
                <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </radialGradient>
              </defs>
            </svg>

            {/* 8 Floating Glass Cards */}
            <div className="glass-preview-card float-card-1" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-sky">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div>
                <div className="glass-card-title">Appointments</div>
                <div className="glass-card-desc">Zero wait booking</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-2" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-teal">
                <i className="fas fa-robot"></i>
              </div>
              <div>
                <div className="glass-card-title">AI Assistant</div>
                <div className="glass-card-desc">Symptom insights</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-3" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-green">
                <i className="fas fa-file-medical"></i>
              </div>
              <div>
                <div className="glass-card-title">Prescriptions</div>
                <div className="glass-card-desc">Instant digital Rx</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-4" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-cyan">
                <i className="fas fa-notes-medical"></i>
              </div>
              <div>
                <div className="glass-card-title">Reports</div>
                <div className="glass-card-desc">Diagnostic storage</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-5" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-sky">
                <i className="fas fa-user-md"></i>
              </div>
              <div>
                <div className="glass-card-title">Doctors</div>
                <div className="glass-card-desc">500+ Verified experts</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-6" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-teal">
                <i className="fas fa-video"></i>
              </div>
              <div>
                <div className="glass-card-title">Telemedicine</div>
                <div className="glass-card-desc">Instant video consults</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-7" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-green">
                <i className="fas fa-pills"></i>
              </div>
              <div>
                <div className="glass-card-title">Pharmacy</div>
                <div className="glass-card-desc">Doorstep delivery</div>
              </div>
            </div>

            <div className="glass-preview-card float-card-8" onClick={() => onNavigate('register')}>
              <div className="glass-card-icon accent-cyan">
                <i className="fas fa-chart-line"></i>
              </div>
              <div>
                <div className="glass-card-title">Analytics</div>
                <div className="glass-card-desc">Clinical insights</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Hospitals Section */}
      <section className="trust-banner">
        <div className="trust-title">Trusted by Top Medical Institutions</div>
        <div className="trust-logos">
          <div className="trust-logo-item">
            <i className="fas fa-hospital-alt" style={{ color: '#0ea5e9' }}></i>
            <span>Apollo Hospitals</span>
          </div>
          <div className="trust-logo-item">
            <i className="fas fa-plus-square" style={{ color: '#22c55e' }}></i>
            <span>Max Healthcare</span>
          </div>
          <div className="trust-logo-item">
            <i className="fas fa-heartbeat" style={{ color: '#06b6d4' }}></i>
            <span>Fortis Clinic</span>
          </div>
          <div className="trust-logo-item">
            <i className="fas fa-medkit" style={{ color: '#14b8a6' }}></i>
            <span>Manipal Group</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-premium light-bg">
        <div className="section-header">
          <span className="section-tag">Services</span>
          <h2 className="section-title">Comprehensive Care Solutions</h2>
          <p className="section-desc">
            Access a wide range of healthcare services designed around your convenience and medical needs.
          </p>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon-box accent-sky">
              <i className="fas fa-user-md"></i>
            </div>
            <h3 className="service-title">Specialist Doctors</h3>
            <p className="service-desc">
              Consult with verified specialists across various departments for expert medical care and diagnosis.
            </p>
            <a href="#doctors" className="service-link">
              <span>Find Doctor</span>
              <i className="fas fa-chevron-right"></i>
            </a>
          </div>

          <div className="service-card">
            <div className="service-icon-box accent-teal">
              <i className="fas fa-video"></i>
            </div>
            <h3 className="service-title">Online Consultation</h3>
            <p className="service-desc">
              Connect with top physicians online via high-quality video calls. Get diagnosis and prescription from comfort of home.
            </p>
            <button onClick={() => onNavigate('register')} className="service-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              <span>Start Consultation</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="service-card">
            <div className="service-icon-box accent-green">
              <i className="fas fa-prescription-bottle-alt"></i>
            </div>
            <h3 className="service-title">Prescriptions & Medicines</h3>
            <p className="service-desc">
              Receive digital prescriptions immediately after your consultation. Conveniently order medicines online.
            </p>
            <button onClick={() => onNavigate('register')} className="service-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              <span>Order Now</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="service-card">
            <div className="service-icon-box accent-cyan">
              <i className="fas fa-flask"></i>
            </div>
            <h3 className="service-title">Lab Tests & Diagnostics</h3>
            <p className="service-desc">
              Book lab tests and health checkup packages. Access digital diagnostic reports securely on your profile dashboard.
            </p>
            <button onClick={() => onNavigate('register')} className="service-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              <span>Book Lab Test</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="journey" className="section-premium">
        <div className="section-header">
          <span className="section-tag">How it works</span>
          <h2 className="section-title">Your Healthcare Journey</h2>
          <p className="section-desc">
            Get medical consultation in just 4 simple steps without any waiting confusion.
          </p>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
            <div className="service-card" style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-blue)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: '800' }}>1</div>
              <h3 className="service-title">Find Doctor</h3>
              <p className="service-desc">Browse verified doctors by specialty, ratings, and experience.</p>
            </div>
            <div className="service-card" style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-teal)', color: 'var(--primary-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: '800' }}>2</div>
              <h3 className="service-title">Choose Time</h3>
              <p className="service-desc">Select your preferred slot for in-person or video consultation.</p>
            </div>
            <div className="service-card" style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-cyan)', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: '800' }}>3</div>
              <h3 className="service-title">Confirm Slots</h3>
              <p className="service-desc">Receive booking token, SMS reminders, and queue notifications.</p>
            </div>
            <div className="service-card" style={{ textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-green)', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontWeight: '800' }}>4</div>
              <h3 className="service-title">Get Consulted</h3>
              <p className="service-desc">Meet your doctor with zero clinic wait time and get digital prescriptions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Doctors Section */}
      <section id="doctors" className="section-premium light-bg">
        <div className="section-header">
          <span className="section-tag">Doctors</span>
          <h2 className="section-title">Recommended Specialists</h2>
          <p className="section-desc">
            Consult with our top-rated medical experts with years of clinical experience.
          </p>
        </div>

        <div className="services-grid">
          {recommendedDoctors.map((doc, idx) => (
            <div key={idx} className="service-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '220px', background: '#f4f4f5', position: 'relative' }}>
                <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34, 197, 94, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>{doc.availability}</span>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>{doc.specialty}</div>
                <h3 className="service-title" style={{ fontSize: '17px', marginBottom: '8px' }}>{doc.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-slate)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}><i className="fas fa-briefcase" style={{ marginRight: '6px' }}></i>{doc.experience}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}><i className="fas fa-star" style={{ marginRight: '4px' }}></i>{doc.rating}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: darkMode ? '#f1f5f9' : '#09090b' }}>{doc.fee}</span>
                  <button onClick={() => onNavigate('register')} className="btn-shadcn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px' }}>
                    Book Slots
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section-premium">
        <div className="section-header">
          <span className="section-tag">Reviews</span>
          <h2 className="section-title">{t('lovedByThousands')}</h2>
          <p className="section-desc">
            Trusted by 500+ clinics and 50,000+ patients across India.
          </p>
        </div>

        <div className="services-grid">
          {testimonials.map((test, idx) => (
            <div key={idx} className="service-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  {[...Array(test.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star" style={{ color: '#fbbf24', marginRight: '4px', fontSize: '13px' }}></i>
                  ))}
                </div>
                <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '24px' }}>"{test.text}"</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={test.avatar} alt={test.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{test.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{test.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-premium light-bg">
        <div className="section-header">
          <span className="section-tag">{t('pricing')}</span>
          <h2 className="section-title">{t('pricingTitle')}</h2>
          <p className="section-desc">{t('pricingSubtitle')}</p>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{plan.name}</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800' }}>{plan.price}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                      <i className="fas fa-check" style={{ color: 'var(--primary-green)', fontSize: '12px' }}></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button 
                onClick={() => onNavigate('register')} 
                className="btn-shadcn-primary"
                style={{ width: '100%', background: plan.popular ? 'var(--text-dark)' : 'transparent', color: plan.popular ? '#ffffff' : 'var(--text-dark)', border: '1px solid var(--text-dark)' }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-premium">
        <div className="faq-container">
          <div className="section-header">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">{t('faqTitle')}</h2>
            <p className="section-desc">{t('faqSubtitle')}</p>
          </div>

          <div className="faq-container" style={{ width: '100%' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="faq-btn"
                >
                  <span>{faq.q}</span>
                  <i className={`fas fa-chevron-${activeFaq === index ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '12px' }}></i>
                </button>
                {activeFaq === index && (
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Banner */}
      <section className="section-premium" style={{ paddingBottom: '100px' }}>
        <div className="newsletter-banner">
          <h2 className="newsletter-title">Stay Informed on Your Health</h2>
          <p className="newsletter-desc">Subscribe to our newsletter for weekly health tips, expert medical advice, and exclusive updates.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="newsletter-input" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required 
            />
            <button type="submit" className="btn-shadcn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-premium">
        <div className="footer-container">
          <div>
            <div className="nav-logo" style={{ marginBottom: '16px' }}>
              <ECGLogo />
              <span>HealthSync</span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '280px' }}>
              HealthSync is a clinic-first healthcare platform for managing online and in-clinic doctor appointments with zero confusion.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-list">
              <li><a href="#home">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#doctors">Doctors</a></li>
              <li><a href="#journey">Appointments</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Company</h4>
            <ul className="footer-list">
              <li><button onClick={() => onNavigate('about-us')}>About Us</button></li>
              <li><button onClick={() => onNavigate('contact-us')}>Contact Us</button></li>
              <li><button onClick={() => onNavigate('pricing')}>Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-list">
              <li><button onClick={() => onNavigate('terms')}>Terms & Conditions</button></li>
              <li><button onClick={() => onNavigate('privacy')}>Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('refund')}>Refund Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} HealthSync. All rights reserved.</p>
          <div className="footer-bottom-links">
            <button onClick={() => onNavigate('terms')}>Terms</button>
            <button onClick={() => onNavigate('privacy')}>Privacy</button>
            <button onClick={() => onNavigate('refund')}>Refund</button>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            width: '40px',
            height: '40px',
            background: 'var(--text-dark)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 50,
            transition: 'var(--transition-smooth)'
          }}
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up" style={{ fontSize: '14px' }}></i>
        </button>
      )}
    </div>
  );
};

export default LandingPagePremium;

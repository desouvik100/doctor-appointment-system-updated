import React, { useState, useEffect, useCallback, Suspense } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/professional-design-system.css';
import './styles/enhanced-navigation.css';
import './styles/modern-cards.css';
import './styles/medical-theme-clean.css';
import './styles/enhanced-layout-fix.css';
import './styles/low-end-optimized.css';
import './styles/optimized-animations.css'; // Optimized GPU-accelerated animations
import './styles/unified-theme.css'; // Theme system
import './styles/mobile-navbar-fix.css'; // Mobile navbar fixes
import './styles/mobile-responsive.css'; // Complete mobile responsive styles
import './styles/auth-visibility-fix.css'; // Ensures all text is visible
import './styles/professional-navbar.css'; // Professional sticky navbar - MUST BE AFTER OTHER NAVBAR STYLES
import './styles/mobile-responsive-complete.css'; // COMPLETE MOBILE RESPONSIVE - MUST BE NEAR END
import './styles/growth-features-visibility.css'; // MUST BE LAST - Ensures new features are visible
import PerformanceMonitor from './components/PerformanceMonitor';
import OptimizedLoader from './components/OptimizedLoader';
import toast, { Toaster } from 'react-hot-toast';

// Import auth components
import Auth from "./components/Auth";
import AdminAuth from "./components/AdminAuth";
import ClinicAuth from "./components/ClinicAuth";
import AIAssistant from "./components/AIAssistant";
import MedicalHero from "./components/MedicalHero";
import SymptomChecker from "./components/SymptomChecker";
import FloatingChatBubble from "./components/FloatingChatBubble";
import LiveStatsDisplay from "./components/LiveStatsDisplay";
import ReviewsSection from "./components/ReviewsSection";

// Lazy load dashboard components
const DoctorList = React.lazy(() =>
  import("./components/DoctorList").catch(() => ({
    default: ({ user }) => (
      <div className="alert alert-info">
        <h4><i className="fas fa-user-md me-2"></i>Find Doctors</h4>
        <p>Welcome {user.name}! Doctor search functionality is loading...</p>
        <div className="d-grid gap-2">
          <button className="btn btn-primary" disabled>
            <i className="fas fa-search me-1"></i>Search Doctors</button>
        </div>
      </div>
    )
  }))
);

const MyAppointments = React.lazy(() =>
  import("./components/MyAppointments").catch(() => ({
    default: ({ user }) => (
      <div className="alert alert-info">
        <h4><i className="fas fa-calendar-check me-2"></i>My Appointments</h4>
        <p>Welcome {user.name}! Your appointments are loading...</p>
        <div className="d-grid gap-2">
          <button className="btn btn-primary" disabled>
            <i className="fas fa-calendar me-1"></i>View Appointments</button>
        </div>
      </div>
    )
  }))
);

const PaymentHistory = React.lazy(() =>
  import("./components/PaymentHistory").catch(() => ({
    default: ({ user }) => (
      <div className="alert alert-info">
        <h4><i className="fas fa-credit-card me-2"></i>Payment History</h4>
        <p>Welcome {user.name}! Your payment history is loading...</p>
        <div className="d-grid gap-2">
          <button className="btn btn-primary" disabled>
            <i className="fas fa-history me-1"></i>View Payments</button>
        </div>
      </div>
    )
  }))
);

const AdminDashboard = React.lazy(() =>
  import("./components/AdminDashboard").catch(() => ({
    default: () => (
      <div className="alert alert-success">
        <h4><i className="fas fa-cogs me-2"></i>Admin Dashboard</h4>
        <p>Admin panel is loading...</p>
        <div className="row g-3">
          <div className="col-md-6">
            <button className="btn btn-success w-100" disabled>
              <i className="fas fa-users me-1"></i>Manage Users</button>
          </div>
          <div className="col-md-6">
            <button className="btn btn-success w-100" disabled>
              <i className="fas fa-user-md me-1"></i>Manage Doctors</button>
          </div>
        </div>
      </div>
    )
  }))
);

const ClinicDashboard = React.lazy(() =>
  import("./components/ClinicDashboard").catch(() => ({
    default: ({ receptionist }) => (
      <div className="alert alert-warning">
        <h4><i className="fas fa-clinic-medical me-2"></i>Clinic Dashboard</h4>
        <p>Welcome {receptionist.name}! Clinic management is loading...</p>
        <div className="row g-3">
          <div className="col-md-6">
            <button className="btn btn-info w-100" disabled>
              <i className="fas fa-calendar-plus me-1"></i>Book Appointment</button>
          </div>
          <div className="col-md-6">
            <button className="btn btn-info w-100" disabled>
              <i className="fas fa-users me-1"></i>Manage Patients</button>
          </div>
        </div>
      </div>
    )
  }))
);

function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [page, setPage] = useState("doctors");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [receptionist, setReceptionist] = useState(null);
  const [loginType, setLoginType] = useState("patient");
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage to prevent flash
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [activeSection, setActiveSection] = useState("home");

  // Prevent FOUC - Add loaded class after initial render and apply theme
  useEffect(() => {
    // Apply initial theme to document root
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    
    // Add loaded class to enable transitions after initial render
    const timer = setTimeout(() => {
      document.documentElement.classList.add('loaded');
      document.body.classList.add('loaded');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [darkMode]);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.medical-nav');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const isValidObject = (obj, keys) => obj && typeof obj === "object" && keys.every((k) => k in obj);
    const parseAndSet = (key, setter, keys) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (isValidObject(parsed, keys)) {
          setter(parsed);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    };

    parseAndSet("user", setUser, ["name", "email"]);
    parseAndSet("admin", setAdmin, ["name", "email"]);
    parseAndSet("receptionist", setReceptionist, ["name", "email"]);
  }, []);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      // Apply theme to document root
      document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} mode`);
      return newMode;
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (user || admin || receptionist) {
      setCurrentView("dashboard");
    }

    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            if (user) setPage('doctors');
            break;
          case '2':
            e.preventDefault();
            if (user) setPage('appointments');
            break;
          case '3':
            e.preventDefault();
            if (user) setPage('ai-assistant');
            break;
          case '4':
            e.preventDefault();
            if (user) setPage('payments');
            break;
          case 'd':
            e.preventDefault();
            toggleDarkMode();
            break;
          default:
            // No action for other keys
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [user, admin, receptionist, darkMode, toggleDarkMode]);

  const handleLogin = (userData, userType) => {
    if (userType === 'admin') {
      setAdmin(userData);
    } else if (userType === 'receptionist') {
      setReceptionist(userData);
    } else {
      setUser(userData);
    }
    setCurrentView("dashboard");
    addNotification(`Welcome ${userData.name}!`, 'success');
  };

  const handleLogoutAll = () => {
    setUser(null);
    setAdmin(null);
    setReceptionist(null);
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("receptionist");
    setCurrentView("landing");
    toast.success('Logged out successfully');
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveSection(sectionId);
      
      // Close mobile menu after clicking
      const navbarCollapse = document.getElementById('navbarNav');
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = new window.bootstrap.Collapse(navbarCollapse, {
          toggle: false
        });
        bsCollapse.hide();
      }
    }
  };

  // Medical Landing Page Component
  const MedicalLandingPage = () => (
    <div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Beautiful Glassmorphism Navigation */}
      <nav 
        className="navbar navbar-expand-lg navbar-dark medical-nav fixed-top"
        role="navigation"
        aria-label="Main navigation"
        style={{
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
        <div className="container">
          <span className="navbar-brand mb-0 h1" 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} 
            onClick={() => scrollToSection('home')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <i className="fas fa-heartbeat me-2" style={{ 
              color: '#fbbf24',
              filter: 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.5))',
              fontSize: '2rem'
            }}></i>
            <span style={{ 
              fontWeight: '700', 
              letterSpacing: '-0.02em',
              color: '#ffffff',
              fontSize: '2rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>HealthSync</span>
          </span>

          <div className="navbar-content-always-visible" id="navbarNav">
            <ul className="navbar-nav me-auto ms-lg-4">
              {['home', 'features', 'about', 'contact'].map((section) => (
                <li className="nav-item" key={section}>
                  <a className={`nav-link ${activeSection === section ? 'active' : ''}`}
                    href={`#${section}`} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      scrollToSection(section);
                    }}
                    style={{ 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      background: activeSection === section ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '1rem',
                      fontWeight: activeSection === section ? '600' : '500',
                      boxShadow: activeSection === section ? '0 4px 20px rgba(255, 255, 255, 0.3)' : 'none',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== section) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== section) {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}>
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="d-flex flex-row gap-3 align-items-center mt-3 mt-lg-0 ms-lg-auto">
              {/* Theme Toggle Button */}
              <button
                className="btn navbar-theme-toggle flex-shrink-0"
                onClick={toggleDarkMode}
                title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
                aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1) rotate(15deg)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1) rotate(0deg)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>

              {/* Get Started Button */}
              <button
                className="btn btn-get-started flex-shrink-0"
                onClick={() => setCurrentView("auth")}
                style={{
                  borderRadius: '16px',
                  background: '#ffffff',
                  color: '#667eea',
                  border: '3px solid #ffffff',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  padding: '0.75rem 2rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 32px rgba(255, 255, 255, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)',
                  textShadow: 'none',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fbbf24';
                  e.target.style.color = '#1e293b';
                  e.target.style.transform = 'translateY(-3px) scale(1.05)';
                  e.target.style.boxShadow = '0 12px 48px rgba(251, 191, 36, 0.6), 0 6px 24px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.color = '#667eea';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)';
                }}
              >
                Get Started →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Medical Hero Section */}
      <main id="main-content" role="main">
      <section id="home" className="hero-section pt-5 mt-5" aria-labelledby="hero-heading">
        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1 id="hero-heading" className="display-3 fw-bold premium-title mb-4 fade-in-up">
                  The Future of
                  <span className="text-gradient"> Healthcare</span>
                  <br />Management
                </h1>
                <p className="lead premium-subtitle mb-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Streamline your healthcare operations with our intelligent platform.
                  Connect patients, doctors, and administrators in one seamless ecosystem.
                </p>

                <div className="hero-stats mb-4 fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <div className="row g-3">
                    <div className="col-4">
                      <div className="stat-item text-center">
                        <h3 className="stat-number">10K+</h3>
                        <small className="text-muted">Healthcare Providers</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stat-item text-center">
                        <h3 className="stat-number">500K+</h3>
                        <small className="text-muted">Patients Served</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stat-item text-center">
                        <h3 className="stat-number">99.9%</h3>
                        <small className="text-muted">Uptime</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-actions fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <button
                    className="btn btn-medical btn-xl px-5 py-3 me-3 mb-2"
                    onClick={() => setCurrentView("auth")}
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05) translateY(-2px)';
                      e.target.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.3)';
                    }}
                  >
                    <i className="fas fa-rocket me-2"></i>
                    Get Started
                  </button>
                  <button 
                    className="btn btn-outline-primary btn-lg mb-2"
                    onClick={() => {
                      addNotification('Demo video coming soon!', 'info');
                      window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                  >
                    <i className="fas fa-play me-2"></i>
                    Watch Demo
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="trust-indicators mt-4 fade-in-up" style={{ animationDelay: '0.8s' }}>
                  <div className="row g-2 align-items-center">
                    <div className="col-auto">
                      <small className="text-muted">Trusted by:</small>
                    </div>
                    <div className="col-auto">
                      <div className="trust-badge">
                        <i className="fas fa-shield-alt text-success me-1"></i>
                        <small>HIPAA Compliant</small>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="trust-badge">
                        <i className="fas fa-certificate text-primary me-1"></i>
                        <small>ISO 27001</small>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="trust-badge">
                        <i className="fas fa-lock text-warning me-1"></i>
                        <small>SOC 2 Type II</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="hero-image text-center">
                {/* Medical Dashboard Preview */}
                <div className="dashboard-preview medical-card p-4 position-relative">
                  <div className="medical-pattern-overlay"></div>

                  <div className="preview-header mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="preview-dots d-flex">
                        <span className="dot bg-danger me-1"></span>
                        <span className="dot bg-warning me-1"></span>
                        <span className="dot bg-success"></span>
                      </div>
                      <small className="text-muted">HealthSync Pro Dashboard</small>
                      <div className="medical-indicator">
                        <i className="fas fa-heartbeat text-danger"></i>
                      </div>
                    </div>
                  </div>

                  <div className="preview-content">
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="mini-card bg-primary bg-opacity-10 p-3 rounded position-relative">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-calendar-check text-primary fa-lg me-2"></i>
                            <div>
                              <small className="d-block fw-bold">Appointments</small>
                              <small className="text-muted">Today: 24</small>
                            </div>
                          </div>
                          <div className="pulse-indicator"></div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mini-card bg-success bg-opacity-10 p-3 rounded position-relative">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-user-md text-success fa-lg me-2"></i>
                            <div>
                              <small className="d-block fw-bold">Doctors</small>
                              <small className="text-muted">Online: 12</small>
                            </div>
                          </div>
                          <div className="pulse-indicator"></div>
                        </div>
                      </div>
                    </div>

                    <div className="preview-chart bg-light rounded p-3 position-relative">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="fw-bold">Patient Flow</small>
                        <small className="text-success">
                          <i className="fas fa-arrow-up me-1"></i>+12%
                        </small>
                      </div>
                      <div className="chart-bars d-flex align-items-end justify-content-between" style={{ height: '60px' }}>
                        <div className="bar bg-primary" style={{ height: '40%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '60%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '80%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '45%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '70%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '90%', width: '8px' }}></div>
                        <div className="bar bg-primary" style={{ height: '55%', width: '8px' }}></div>
                      </div>
                    </div>

                    <div className="quick-actions mt-3">
                      <div className="row g-2">
                        <div className="col-4">
                          <button className="btn btn-sm btn-outline-primary w-100">
                            <i className="fas fa-plus-circle mb-1"></i>
                            <small className="d-block">Book</small>
                          </button>
                        </div>
                        <div className="col-4">
                          <button className="btn btn-sm btn-outline-success w-100">
                            <i className="fas fa-video mb-1"></i>
                            <small className="d-block">Consult</small>
                          </button>
                        </div>
                        <div className="col-4">
                          <button className="btn btn-sm btn-outline-info w-100">
                            <i className="fas fa-robot mb-1"></i>
                            <small className="d-block">AI Help</small>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Medical Icons */}
                  <div className="floating-medical-icons">
                    <div className="floating-icon icon-1">
                      <i className="fas fa-stethoscope"></i>
                    </div>
                    <div className="floating-icon icon-2">
                      <i className="fas fa-heartbeat"></i>
                    </div>
                    <div className="floating-icon icon-3">
                      <i className="fas fa-pills"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Portal Section - Main Focus */}
      <section className="patient-portal-section py-5">
        <div className="container">
          <div className="row align-items-center">
            {/* Main Patient Portal Card - Large & Prominent */}
            <div className="col-lg-8 mx-auto">
              <div className="patient-portal-main medical-card text-center p-5 shadow-lg">
                <div className="portal-icon mb-4">
                  <i className="fas fa-user-injured fa-4x text-primary"></i>
                </div>
                <h2 className="fw-bold mb-3" style={{color: '#1e293b'}}>Welcome to Patient Portal</h2>
                <p className="lead text-muted mb-4">
                  Your complete healthcare management solution. Book appointments, access medical records, and connect with healthcare providers.
                </p>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="feature-item p-3 rounded" style={{background: 'rgba(59, 130, 246, 0.05)'}}>
                      <i className="fas fa-calendar-check text-primary fa-2x mb-2"></i>
                      <h6 className="fw-bold mb-1" style={{color: '#1e293b'}}>Easy Scheduling</h6>
                      <small className="text-muted">Book appointments 24/7</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item p-3 rounded" style={{background: 'rgba(16, 185, 129, 0.05)'}}>
                      <i className="fas fa-file-medical text-success fa-2x mb-2"></i>
                      <h6 className="fw-bold mb-1" style={{color: '#1e293b'}}>Medical Records</h6>
                      <small className="text-muted">Access your health history</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item p-3 rounded" style={{background: 'rgba(168, 85, 247, 0.05)'}}>
                      <i className="fas fa-robot text-secondary fa-2x mb-2"></i>
                      <h6 className="fw-bold mb-1" style={{color: '#1e293b'}}>AI Assistant</h6>
                      <small className="text-muted">24/7 health guidance</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feature-item p-3 rounded" style={{background: 'rgba(245, 158, 11, 0.05)'}}>
                      <i className="fas fa-comments text-warning fa-2x mb-2"></i>
                      <h6 className="fw-bold mb-1" style={{color: '#1e293b'}}>Secure Messaging</h6>
                      <small className="text-muted">Chat with your doctor</small>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-3">
                  <button
                    className="btn btn-primary btn-lg py-3"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      borderRadius: '15px',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                    }}
                    onClick={() => {
                      setLoginType("patient");
                      setCurrentView("auth");
                    }}
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In / Create Account
                  </button>
                  <p className="text-muted mb-0 small">
                    <i className="fas fa-shield-alt me-1"></i>
                    HIPAA Compliant • Secure • Private
                  </p>
                </div>
              </div>

              {/* Small Staff Access Links */}
              <div className="staff-access-links mt-4 text-center">
                <p className="text-white mb-2 small">
                  <i className="fas fa-user-lock me-1"></i>
                  Staff Access:
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button
                    className="btn btn-sm btn-outline-light"
                    style={{
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onClick={() => {
                      setLoginType("admin");
                      setCurrentView("auth");
                    }}
                  >
                    <i className="fas fa-user-shield me-1"></i>
                    Admin Login
                  </button>
                  <button
                    className="btn btn-sm btn-outline-light"
                    style={{
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onClick={() => {
                      setLoginType("receptionist");
                      setCurrentView("auth");
                    }}
                  >
                    <i className="fas fa-clinic-medical me-1"></i>
                    Staff Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Powerful Features for Modern Healthcare</h2>
            <p className="lead text-muted">Everything you need to manage healthcare operations efficiently</p>
          </div>

          <div className="row g-4">
            {/* AI-Powered Assistant */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-robot fa-3x text-primary"></i>
                </div>
                <h5 className="fw-bold mb-3">AI Health Assistant</h5>
                <p className="text-muted mb-3">
                  Get instant health insights and personalized recommendations with our advanced AI assistant.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>24/7 health guidance</li>
                  <li><i className="fas fa-check text-success me-2"></i>Symptom analysis</li>
                  <li><i className="fas fa-check text-success me-2"></i>Medication reminders</li>
                </ul>
              </div>
            </div>

            {/* Smart Scheduling */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-calendar-alt fa-3x text-success"></i>
                </div>
                <h5 className="fw-bold mb-3">Smart Scheduling</h5>
                <p className="text-muted mb-3">
                  Intelligent appointment booking with real-time availability and automated reminders.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>Real-time availability</li>
                  <li><i className="fas fa-check text-success me-2"></i>Automated reminders</li>
                  <li><i className="fas fa-check text-success me-2"></i>Conflict resolution</li>
                </ul>
              </div>
            </div>

            {/* Secure Payments */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-shield-alt fa-3x text-info"></i>
                </div>
                <h5 className="fw-bold mb-3">Secure Payments</h5>
                <p className="text-muted mb-3">
                  HIPAA-compliant payment processing with multiple payment options and insurance integration.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>HIPAA compliant</li>
                  <li><i className="fas fa-check text-success me-2"></i>Insurance integration</li>
                  <li><i className="fas fa-check text-success me-2"></i>Multiple payment methods</li>
                </ul>
              </div>
            </div>

            {/* Telemedicine */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-video fa-3x text-warning"></i>
                </div>
                <h5 className="fw-bold mb-3">Telemedicine</h5>
                <p className="text-muted mb-3">
                  High-quality video consultations with integrated health monitoring and file sharing.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>HD video calls</li>
                  <li><i className="fas fa-check text-success me-2"></i>Screen sharing</li>
                  <li><i className="fas fa-check text-success me-2"></i>Digital prescriptions</li>
                </ul>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-chart-line fa-3x text-danger"></i>
                </div>
                <h5 className="fw-bold mb-3">Analytics Dashboard</h5>
                <p className="text-muted mb-3">
                  Comprehensive insights and reporting tools for data-driven healthcare decisions.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>Real-time metrics</li>
                  <li><i className="fas fa-check text-success me-2"></i>Custom reports</li>
                  <li><i className="fas fa-check text-success me-2"></i>Performance tracking</li>
                </ul>
              </div>
            </div>

            {/* Mobile App */}
            <div className="col-lg-4 col-md-6">
              <div className="feature-card medical-card h-100 p-4 text-center">
                <div className="feature-icon mb-3">
                  <i className="fas fa-mobile-alt fa-3x text-purple"></i>
                </div>
                <h5 className="fw-bold mb-3">Mobile Ready</h5>
                <p className="text-muted mb-3">
                  Native mobile apps for iOS and Android with offline capabilities and push notifications.
                </p>
                <ul className="list-unstyled text-start">
                  <li><i className="fas fa-check text-success me-2"></i>iOS & Android apps</li>
                  <li><i className="fas fa-check text-success me-2"></i>Offline access</li>
                  <li><i className="fas fa-check text-success me-2"></i>Push notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Symptom Checker - HIGH VALUE FEATURE */}
      <SymptomChecker onBookAppointment={() => {
        setLoginType("patient");
        setCurrentView("auth");
      }} />

      {/* Live Stats Dashboard - Social Proof */}
      <LiveStatsDisplay />

      {/* Reviews & Success Stories */}
      <ReviewsSection />

      {/* About Us Section */}
      <section id="about" className="about-section py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="about-content">
                <h2 className="fw-bold mb-4">Revolutionizing Healthcare Management</h2>
                <p className="lead mb-4">
                  HealthSync Pro was founded with a simple mission: to make healthcare more accessible,
                  efficient, and patient-centered through innovative technology solutions.
                </p>
                <p className="mb-4">
                  Our team of healthcare professionals, software engineers, and UX designers work together
                  to create solutions that address real-world challenges in healthcare delivery. We believe
                  that technology should enhance the human connection between patients and providers, not replace it.
                </p>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="about-stat text-center">
                      <h3 className="text-primary fw-bold">5+</h3>
                      <small className="text-muted">Years Experience</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="about-stat text-center">
                      <h3 className="text-primary fw-bold">50+</h3>
                      <small className="text-muted">Healthcare Partners</small>
                    </div>
                  </div>
                </div>

                <div className="about-values">
                  <h5 className="fw-bold mb-3">Our Core Values</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="value-item d-flex align-items-start">
                        <i className="fas fa-heart text-danger me-3 mt-1"></i>
                        <div>
                          <h6 className="mb-1">Patient-Centered</h6>
                          <small className="text-muted">Every decision prioritizes patient care and experience</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="value-item d-flex align-items-start">
                        <i className="fas fa-lock text-success me-3 mt-1"></i>
                        <div>
                          <h6 className="mb-1">Security First</h6>
                          <small className="text-muted">HIPAA compliance and data protection are non-negotiable</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="value-item d-flex align-items-start">
                        <i className="fas fa-lightbulb text-warning me-3 mt-1"></i>
                        <div>
                          <h6 className="mb-1">Innovation</h6>
                          <small className="text-muted">Continuous improvement through cutting-edge technology</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="value-item d-flex align-items-start">
                        <i className="fas fa-users text-info me-3 mt-1"></i>
                        <div>
                          <h6 className="mb-1">Collaboration</h6>
                          <small className="text-muted">Building bridges between all healthcare stakeholders</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="about-image">
                <div className="medical-card p-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="stats-card text-center p-3">
                        <i className="fas fa-hospital fa-2x text-primary mb-2"></i>
                        <h4 className="stats-number">200+</h4>
                        <small className="stats-label">Hospitals</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stats-card text-center p-3">
                        <i className="fas fa-user-md fa-2x text-success mb-2"></i>
                        <h4 className="stats-number">5,000+</h4>
                        <small className="stats-label">Doctors</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stats-card text-center p-3">
                        <i className="fas fa-users fa-2x text-info mb-2"></i>
                        <h4 className="stats-number">1M+</h4>
                        <small className="stats-label">Patients</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stats-card text-center p-3">
                        <i className="fas fa-calendar-check fa-2x text-warning mb-2"></i>
                        <h4 className="stats-number">10M+</h4>
                        <small className="stats-label">Appointments</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="medical-card p-4 mt-4">
                  <h5 className="fw-bold mb-3">
                    <i className="fas fa-award text-primary me-2"></i>
                    Awards & Recognition
                  </h5>
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="award-item d-flex align-items-center p-2">
                        <i className="fas fa-trophy text-warning me-3"></i>
                        <div>
                          <small className="fw-bold">Best Healthcare Innovation 2024</small>
                          <br />
                          <small className="text-muted">Healthcare Technology Awards</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="award-item d-flex align-items-center p-2">
                        <i className="fas fa-medal text-success me-3"></i>
                        <div>
                          <small className="fw-bold">Top 10 Health Tech Startups</small>
                          <br />
                          <small className="text-muted">TechCrunch Disrupt 2024</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Get in Touch</h2>
            <p className="lead text-muted">Ready to transform your healthcare operations? Let's talk!</p>
          </div>

          <div className="row g-4">
            {/* Contact Information */}
            <div className="col-lg-4">
              <div className="contact-info">
                <h5 className="fw-bold mb-4">Contact Information</h5>

                <div className="contact-item d-flex align-items-start mb-3">
                  <div className="contact-icon me-3">
                    <i className="fas fa-map-marker-alt fa-lg text-primary"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Address</h6>
                    <p className="text-muted mb-0">
                      123 Healthcare Boulevard<br />
                      Medical District, MD 12345<br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="contact-item d-flex align-items-start mb-3">
                  <div className="contact-icon me-3">
                    <i className="fas fa-phone fa-lg text-success"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Phone</h6>
                    <p className="text-muted mb-0">
                      Sales: +1 (555) 123-4567<br />
                      Support: +1 (555) 987-6543<br />
                      Emergency: 911
                    </p>
                  </div>
                </div>

                <div className="contact-item d-flex align-items-start mb-3">
                  <div className="contact-icon me-3">
                    <i className="fas fa-envelope fa-lg text-info"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Email</h6>
                    <p className="text-muted mb-0">
                      General: info@healthsyncpro.com<br />
                      Sales: sales@healthsyncpro.com<br />
                      Support: support@healthsyncpro.com
                    </p>
                  </div>
                </div>

                <div className="contact-item d-flex align-items-start mb-4">
                  <div className="contact-icon me-3">
                    <i className="fas fa-clock fa-lg text-warning"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Business Hours</h6>
                    <p className="text-muted mb-0">
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 4:00 PM<br />
                      Sunday: Emergency Support Only
                    </p>
                  </div>
                </div>

                <div className="social-links">
                  <h6 className="fw-bold mb-3">Follow Us</h6>
                  <div className="d-flex gap-3">
                    <a href="#" className="text-primary" title="LinkedIn">
                      <i className="fab fa-linkedin fa-2x"></i>
                    </a>
                    <a href="#" className="text-info" title="Twitter">
                      <i className="fab fa-twitter fa-2x"></i>
                    </a>
                    <a href="#" className="text-primary" title="Facebook">
                      <i className="fab fa-facebook fa-2x"></i>
                    </a>
                    <a href="#" className="text-danger" title="YouTube">
                      <i className="fab fa-youtube fa-2x"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-8">
              <div className="contact-form medical-card p-4">
                <h5 className="fw-bold mb-4">Send us a Message</h5>
                <form>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input type="text" className="form-control" placeholder="Enter your first name" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input type="text" className="form-control" placeholder="Enter your last name" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address *</label>
                      <input type="email" className="form-control" placeholder="Enter your email" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input type="tel" className="form-control" placeholder="Enter your phone number" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Organization</label>
                      <input type="text" className="form-control" placeholder="Your healthcare organization" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Subject *</label>
                      <select className="form-select" required>
                        <option value="">Select a subject</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="demo">Request Demo</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Message *</label>
                      <textarea className="form-control" rows="5" placeholder="Tell us how we can help you..." required></textarea>
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="newsletter" />
                        <label className="form-check-label" htmlFor="newsletter">
                          Subscribe to our newsletter for healthcare technology updates
                        </label>
                      </div>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-medical btn-lg">
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Message
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Quick Contact Cards */}
          <div className="row g-4 mt-4">
            <div className="col-lg-4">
              <div className="quick-contact-card medical-card p-4 text-center h-100">
                <div className="contact-card-icon mb-3">
                  <i className="fas fa-calendar-check fa-2x text-primary"></i>
                </div>
                <h5 className="fw-bold mb-3">Schedule a Demo</h5>
                <p className="text-muted mb-3">
                  See HealthSync Pro in action with a personalized demo tailored to your needs.
                </p>
                <button className="btn btn-primary">
                  <i className="fas fa-video me-1"></i>
                  Book Demo
                </button>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="quick-contact-card medical-card p-4 text-center h-100">
                <div className="contact-card-icon mb-3">
                  <i className="fas fa-headset fa-2x text-success"></i>
                </div>
                <h5 className="fw-bold mb-3">24/7 Support</h5>
                <p className="text-muted mb-3">
                  Get immediate help from our healthcare technology experts anytime, anywhere.
                </p>
                <button className="btn btn-success">
                  <i className="fas fa-comments me-1"></i>
                  Live Chat
                </button>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="quick-contact-card medical-card p-4 text-center h-100">
                <div className="contact-card-icon mb-3">
                  <i className="fas fa-download fa-2x text-info"></i>
                </div>
                <h5 className="fw-bold mb-3">Resources</h5>
                <p className="text-muted mb-3">
                  Download whitepapers, case studies, and implementation guides.
                </p>
                <button className="btn btn-info">
                  <i className="fas fa-file-pdf me-1"></i>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>
      
      {/* Footer */}
      <footer className="footer py-5" role="contentinfo" aria-label="Site footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="footer-brand mb-4">
                <h5 className="navbar-brand mb-3">
                  <i className="fas fa-heartbeat me-2"></i>
                  HealthSync Pro
                </h5>
                <p className="mb-4">
                  Connecting patients with healthcare professionals through intelligent scheduling,
                  seamless communication, and comprehensive health management solutions.
                </p>
                <div className="emergency-contact">
                  <h6>Emergency Contact</h6>
                  <p>
                    <i className="fas fa-phone"></i> Emergency: 911<br />
                    <i className="fas fa-headset"></i> Support: 1-800-HEALTHSYNC
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5>Product</h5>
              <ul className="list-unstyled">
                <li><a href="#features">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Integrations</a></li>
                <li><a href="#">API</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5>Company</h5>
              <ul className="list-unstyled">
                <li><a href="#about">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5>Resources</h5>
              <ul className="list-unstyled">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Webinars</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-6">
              <h5>Legal</h5>
              <ul className="list-unstyled">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">HIPAA Compliance</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom" style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            paddingTop: '2rem',
            marginTop: '3rem'
          }}>
            <div className="row align-items-center">
              <div className="col-md-6">
                <div className="d-flex align-items-center mb-2">
                  <div className="me-3" style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-heartbeat" style={{ color: 'white', fontSize: '14px' }}></i>
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>HealthSync Pro</span>
                </div>
                <p className="mb-1">© 2024 HealthSync Pro, Inc. All rights reserved.</p>
                <small className="text-muted">
                  Transforming healthcare through intelligent technology solutions.
                </small>
              </div>
              <div className="col-md-6 text-md-end">
                <div className="social-links mb-3">
                  <a href="#" className="me-3" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i className="fab fa-linkedin"></i>
                  </a>
                  <a href="#" className="me-3" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="me-3" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i className="fab fa-github"></i>
                  </a>
                  <a href="#" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i className="fab fa-youtube"></i>
                  </a>
                </div>
                <div className="compliance-badges">
                  <span className="badge me-2" style={{ 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    color: '#10b981',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i className="fas fa-shield-alt me-1"></i>HIPAA Compliant
                  </span>
                  <span className="badge me-2" style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    color: '#3b82f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i className="fas fa-certificate me-1"></i>ISO 27001
                  </span>
                  <span className="badge" style={{ 
                    background: 'rgba(245, 158, 11, 0.2)', 
                    color: '#f59e0b',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i className="fas fa-lock me-1"></i>SOC 2 Type II
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat Bubble - Always Visible */}
      <FloatingChatBubble onOpenChat={() => {
        setLoginType("patient");
        setCurrentView("auth");
      }} />
    </div>
  );

  return (
    <div>
      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            fontWeight: '600',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '2px solid #10b981',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '2px solid #ef4444',
            },
          },
        }}
      />
      
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Notifications */}
      <div className="notification-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {notifications.map(notification => (
          <div key={notification.id} className={`alert alert-${notification.type} alert-dismissible fade show notification-slide`}>
            {notification.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            ></button>
          </div>
        ))}
      </div>

      {/* Render based on current view */}
      {currentView === "landing" && <MedicalLandingPage />}

      {currentView === "auth" && (
        <div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
          <nav className={`navbar navbar-expand-lg navbar-dark ${darkMode ? 'bg-dark' : 'medical-nav'}`}>
            <div className="container">
              <span className="navbar-brand mb-0 h1">
                <i className="fas fa-heartbeat me-2"></i>
                HealthSync Pro
              </span>
              <div className="navbar-nav ms-auto d-flex flex-row gap-2 align-items-center">
                <button
                  className="btn navbar-theme-toggle"
                  onClick={toggleDarkMode}
                  title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
                  aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setCurrentView("landing")}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Home
                </button>
              </div>
            </div>
          </nav>

          <div className="container mt-5 pt-4">
            <div className="row justify-content-center">
              <div className="col-lg-6 col-md-8">
                {loginType === "patient" && (
                  <div className="medical-card shadow-lg border-0">
                    <div className="card-header text-center py-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '20px 20px 0 0' }}>
                      <div className="medical-icon mx-auto mb-3" style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.2)' }}>
                        <i className="fas fa-user-injured" style={{ fontSize: '1.8rem' }}></i>
                      </div>
                      <h3 className="mb-0 fw-bold">Patient Portal</h3>
                      <p className="mb-0 mt-2 opacity-75">
                        <i className="fas fa-calendar-check me-1"></i>
                        Smart scheduling & comprehensive health management
                      </p>
                    </div>
                    <div className="card-body p-4 medical-form">
                      <Auth onLogin={(data) => handleLogin(data, 'patient')} />
                    </div>
                  </div>
                )}

                {loginType === "admin" && (
                  <div className="card shadow-lg border-0">
                    <div className="card-header bg-success text-white text-center py-4">
                      <h3 className="mb-0">
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Login
                      </h3>
                      <p className="mb-0 mt-2 opacity-75">Advanced healthcare operations management</p>
                    </div>
                    <div className="card-body p-4">
                      <AdminAuth onLogin={(data) => handleLogin(data, 'admin')} />
                    </div>
                  </div>
                )}

                {loginType === "receptionist" && (
                  <div className="card shadow-lg border-0">
                    <div className="card-header bg-info text-white text-center py-4">
                      <h3 className="mb-0">
                        <i className="fas fa-clinic-medical me-2"></i>
                        Reception Login
                      </h3>
                      <p className="mb-0 mt-2 opacity-75">Professional patient coordination platform</p>
                    </div>
                    <div className="card-body p-4">
                      <ClinicAuth onLogin={(data) => handleLogin(data, 'receptionist')} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === "dashboard" && (
        <div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
          <nav className={`navbar navbar-expand-lg navbar-dark ${darkMode ? 'bg-dark' : 'medical-nav'}`}>
            <div className="container">
              <span className="navbar-brand mb-0 h1">
                <i className="fas fa-heartbeat me-2"></i>
                HealthSync Pro
              </span>
              <div className="navbar-nav ms-auto d-flex flex-row gap-2 align-items-center">
                <button
                  className="btn navbar-theme-toggle"
                  onClick={toggleDarkMode}
                  title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
                  aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogoutAll}
                >
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Logout
                </button>
              </div>
            </div>
          </nav>

          {/* USER MODE */}
          {user && !admin && !receptionist && (
            <div className="container mt-4">
              <div className="row">
                <div className="col-12">
                  <div className="medical-card shadow-sm mb-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="user-avatar me-3">
                            <i className="fas fa-user-circle fa-3x text-primary"></i>
                          </div>
                          <div>
                            <h5 className="card-title mb-1 medical-title">Welcome back, {user?.name || "User"}!</h5>
                            <p className="text-muted mb-0">
                              <i className="fas fa-envelope me-1"></i>
                              {user?.email || ""}
                            </p>
                            <small className="text-success">
                              <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
                              Online
                            </small>
                          </div>
                        </div>
                        <button onClick={handleLogoutAll} className="btn btn-outline-danger">
                          <i className="fas fa-sign-out-alt me-1"></i>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="medical-card shadow-sm mb-4">
                    <div className="card-body">
                      <nav className="medical-tabs">
                        <div className="nav nav-pills justify-content-center" role="tablist">
                          <button
                            onClick={() => {
                              setPage("doctors");
                              scrollToTop();
                            }}
                            className={`nav-link ${page === "doctors" ? "active" : ""}`}
                          >
                            <i className="fas fa-user-md me-2"></i>
                            Find Doctors
                          </button>
                          <button
                            onClick={() => {
                              setPage("appointments");
                              scrollToTop();
                            }}
                            className={`nav-link ${page === "appointments" ? "active" : ""}`}
                          >
                            <i className="fas fa-calendar-check me-2"></i>
                            My Appointments
                          </button>
                          <button
                            onClick={() => {
                              setPage("ai-assistant");
                              scrollToTop();
                            }}
                            className={`nav-link ${page === "ai-assistant" ? "active" : ""}`}
                          >
                            <i className="fas fa-robot me-2"></i>
                            AI Assistant
                          </button>
                          <button
                            onClick={() => {
                              setPage("payments");
                              scrollToTop();
                            }}
                            className={`nav-link ${page === "payments" ? "active" : ""}`}
                          >
                            <i className="fas fa-credit-card me-2"></i>
                            Payments
                          </button>
                        </div>
                      </nav>
                    </div>
                  </div>

                  <div className="page-content fade-transition">
                    <React.Suspense fallback={
                      <div className="text-center py-5">
                        <div className="loading-spinner mx-auto mb-3"></div>
                        <p className="text-muted">Loading {page}...</p>
                      </div>
                    }>
                      {page === "doctors" && <DoctorList user={user} />}
                      {page === "appointments" && <MyAppointments user={user} />}
                      {page === "ai-assistant" && <AIAssistant user={user} />}
                      {page === "payments" && <PaymentHistory user={user} />}
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN MODE */}
          {admin && !user && !receptionist && (
            <div className="container mt-4" style={{ color: darkMode ? '#ffffff' : '#000000' }}>
              <div className="row">
                <div className="col-12">
                  <div className="medical-card shadow-sm mb-4" style={{ 
                    background: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#000000',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.15)' : '#dee2e6'}`
                  }}>
                    <div className="card-body" style={{ color: darkMode ? '#ffffff' : '#000000' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="card-title mb-1 medical-title" style={{ color: darkMode ? '#ffffff' : '#000000' }}>
                            <i className="fas fa-user-shield me-2"></i>
                            Admin Dashboard
                          </h5>
                          <p className="text-muted mb-0" style={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#6c757d' }}>
                            <i className="fas fa-user me-1"></i>
                            {admin?.name || "Admin"}
                            <span className="ms-2">
                              <i className="fas fa-envelope me-1"></i>
                              ({admin?.email || ""})
                            </span>
                          </p>
                        </div>
                        <button onClick={handleLogoutAll} className="btn btn-outline-danger">
                          <i className="fas fa-sign-out-alt me-1"></i>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ color: darkMode ? '#ffffff' : '#000000' }}>
                    <React.Suspense fallback={
                      <div className="text-center py-5">
                        <div className="loading-spinner mx-auto mb-3"></div>
                        <p className="text-muted" style={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#6c757d' }}>
                          Loading admin dashboard...
                        </p>
                      </div>
                    }>
                      <AdminDashboard />
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECEPTIONIST MODE */}
          {receptionist && !user && !admin && (
            <div className="container mt-4">
              <div className="row">
                <div className="col-12">
                  <div className="medical-card shadow-sm mb-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="card-title mb-1 medical-title">
                            <i className="fas fa-clinic-medical me-2"></i>
                            Clinic Reception
                          </h5>
                          <p className="text-muted mb-0">
                            <i className="fas fa-user me-1"></i>
                            {receptionist?.name || "Receptionist"}
                            <span className="ms-2">
                              <i className="fas fa-envelope me-1"></i>
                              ({receptionist?.email || ""})
                            </span>
                          </p>
                        </div>
                        <button onClick={handleLogoutAll} className="btn btn-outline-danger">
                          <i className="fas fa-sign-out-alt me-1"></i>
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>

                  <React.Suspense fallback={
                    <div className="text-center py-5">
                      <div className="loading-spinner mx-auto mb-3"></div>
                      <p className="text-muted">Loading clinic dashboard...</p>
                    </div>
                  }>
                    <ClinicDashboard receptionist={receptionist} />
                  </React.Suspense>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Theme Toggle Button - Always Visible */}
      <button
        className="theme-toggle-btn"
        onClick={toggleDarkMode}
        title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
        aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: darkMode ? '3px solid rgba(102, 126, 234, 0.5)' : '3px solid rgba(255, 255, 255, 0.5)',
          color: darkMode ? '#fbbf24' : '#667eea',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          transition: 'all 0.3s ease',
          border: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1) rotate(15deg)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2), 0 3px 10px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) rotate(0deg)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)';
        }}
      >
        <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>

      {/* Scroll to Top Button */}
      {(user || admin || receptionist) && (
        <button
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          title="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '6rem',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            color: darkMode ? '#fbbf24' : '#667eea',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      )}
    </div>
  );
}

export default App;
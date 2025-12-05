import React, { useState, useEffect, useCallback, Suspense } from "react";
import './index.css';
import './styles/premium-saas.css';
import './styles/landing-page-professional.css';
import './styles/landing-page-pro.css';
import './styles/admin-dashboard-professional.css';
import './styles/admin-dashboard-pro.css';
import toast, { Toaster } from 'react-hot-toast';

// Mobile/Capacitor initialization
import { useMobileInit } from './mobile/useMobileInit';

// Import auth components
import Auth from "./components/Auth";
import AdminAuth from "./components/AdminAuth";
import ClinicAuth from "./components/ClinicAuth";
import DoctorAuth from "./components/DoctorAuth";
import AIAssistant from "./components/AIAssistant";
import MedicalHero from "./components/MedicalHero";
import SymptomChecker from "./components/SymptomChecker";
import FloatingChatBubble from "./components/FloatingChatBubble";
import LiveStatsDisplay from "./components/LiveStatsDisplay";
import LandingPage from "./components/LandingPagePremium";
import AuthPremium from "./components/AuthPremium";
import CorporateWellness from "./components/CorporateWellness";

// Lazy load dashboard components
const PatientDashboard = React.lazy(() =>
  import("./components/PatientDashboardPro").catch(() => ({
    default: ({ user, onLogout }) => (
      <div className="dashboard-pro">
        <div className="dashboard-pro__content">
          <h4>Patient Dashboard</h4>
          <p>Welcome {user.name}! Dashboard is loading...</p>
        </div>
      </div>
    )
  }))
);

const AdminDashboard = React.lazy(() =>
  import("./components/AdminDashboard").catch(() => ({
    default: () => (
      <div >
        <h4><i ></i>Admin Dashboard</h4>
        <p>Admin panel is loading...</p>
        <div >
          <div >
            <button  disabled>
              <i ></i>Manage Users</button>
          </div>
          <div >
            <button  disabled>
              <i ></i>Manage Doctors</button>
          </div>
        </div>
      </div>
    )
  }))
);

const ClinicDashboard = React.lazy(() =>
  import("./components/ClinicDashboard").catch(() => ({
    default: ({ receptionist }) => (
      <div >
        <h4><i ></i>Clinic Dashboard</h4>
        <p>Welcome {receptionist.name}! Clinic management is loading...</p>
        <div >
          <div >
            <button  disabled>
              <i ></i>Book Appointment</button>
          </div>
          <div >
            <button  disabled>
              <i ></i>Manage Patients</button>
          </div>
        </div>
      </div>
    )
  }))
);

const DoctorDashboard = React.lazy(() =>
  import("./components/DoctorDashboard").catch(() => ({
    default: ({ doctor }) => (
      <div className="container py-4">
        <h4>Doctor Dashboard</h4>
        <p>Welcome Dr. {doctor?.name}! Dashboard is loading...</p>
      </div>
    )
  }))
);

function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [receptionist, setReceptionist] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loginType, setLoginType] = useState("patient");
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage to prevent flash
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [activeSection, setActiveSection] = useState("home");

  // Initialize mobile services (Capacitor)
  const userId = user?.id || user?._id;
  useMobileInit(userId);

  // ANTI-FLICKER: Prevent FOUC and ensure smooth theme transitions
  useEffect(() => {
    // Apply initial theme to document root and body
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', darkMode);
    
    // Ensure loaded class is present (may already be set by index.html)
    if (!document.documentElement.classList.contains('loaded')) {
      const timer = setTimeout(() => {
        document.documentElement.classList.remove('loading');
        document.documentElement.classList.add('loaded');
        document.body.classList.add('loaded');
      }, 50);
      
      return () => clearTimeout(timer);
    }
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
        let parsed = JSON.parse(raw);
        // Handle nested user object format: { token, user: {...} }
        if (parsed.user && typeof parsed.user === 'object') {
          parsed = { ...parsed.user, token: parsed.token };
          localStorage.setItem(key, JSON.stringify(parsed)); // Update to flat format
        }
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
      // Apply theme to document root and body
      document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      document.body.classList.toggle('dark-mode', newMode);
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
    } else if (userType === 'doctor') {
      setDoctor(userData);
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
    setDoctor(null);
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("receptionist");
    localStorage.removeItem("doctor");
    localStorage.removeItem("doctorToken");
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
    <div >
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" >
        Skip to main content
      </a>
      
      {/* Beautiful Glassmorphism Navigation */}
      <nav 
        
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
        <div >
          <span  
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} 
            onClick={() => scrollToSection('home')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <i  style={{ 
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

          <div  id="navbarNav">
            <ul >
              {['home', 'features', 'about', 'contact'].map((section) => (
                <li  key={section}>
                  <a 
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

            <div >
              {/* Get Started Button */}
              <button
                
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
      <section id="home"  aria-labelledby="hero-heading">
        <div >
          <div >
            <div >
              <div >
                <h1 id="hero-heading" >
                  The Future of
                  <span > Healthcare </span>
                  Management
                </h1>
                <p  style={{ animationDelay: '0.2s' }}>
                  Streamline your healthcare operations with our intelligent platform.
                  Connect patients, doctors, and administrators in one seamless ecosystem.
                </p>

                <div  style={{ animationDelay: '0.4s' }}>
                  <div >
                    <div >
                      <div >
                        <h3 >10K+</h3>
                        <small >Healthcare Providers</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <h3 >500K+</h3>
                        <small >Patients Served</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <h3 >99.9%</h3>
                        <small >Uptime</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div  style={{ animationDelay: '0.6s' }}>
                  <button
                    
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
                    <i ></i>
                    Get Started
                  </button>
                  <button 
                    
                    onClick={() => {
                      addNotification('Demo video coming soon!', 'info');
                      window.scrollTo({ top: document.getElementById('features')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                  >
                    <i ></i>
                    Watch Demo
                  </button>
                </div>

                {/* Trust Indicators */}
                <div  style={{ animationDelay: '0.8s' }}>
                  <div >
                    <div >
                      <small >Trusted by:</small>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <small>HIPAA Compliant</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <small>ISO 27001</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <small>SOC 2 Type II</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div >
              <div >
                {/* Medical Dashboard Preview */}
                <div >
                  <div ></div>

                  <div >
                    <div >
                      <div >
                        <span ></span>
                        <span ></span>
                        <span ></span>
                      </div>
                      <small >HealthSync Pro Dashboard</small>
                      <div >
                        <i ></i>
                      </div>
                    </div>
                  </div>

                  <div >
                    <div >
                      <div >
                        <div >
                          <div >
                            <i ></i>
                            <div>
                              <small >Appointments</small>
                              <small >Today: 24</small>
                            </div>
                          </div>
                          <div ></div>
                        </div>
                      </div>
                      <div >
                        <div >
                          <div >
                            <i ></i>
                            <div>
                              <small >Doctors</small>
                              <small >Online: 12</small>
                            </div>
                          </div>
                          <div ></div>
                        </div>
                      </div>
                    </div>

                    <div >
                      <div >
                        <small >Patient Flow</small>
                        <small >
                          <i ></i>+12%
                        </small>
                      </div>
                      <div  style={{ height: '60px' }}>
                        <div  style={{ height: '40%', width: '8px' }}></div>
                        <div  style={{ height: '60%', width: '8px' }}></div>
                        <div  style={{ height: '80%', width: '8px' }}></div>
                        <div  style={{ height: '45%', width: '8px' }}></div>
                        <div  style={{ height: '70%', width: '8px' }}></div>
                        <div  style={{ height: '90%', width: '8px' }}></div>
                        <div  style={{ height: '55%', width: '8px' }}></div>
                      </div>
                    </div>

                    <div >
                      <div >
                        <div >
                          <button >
                            <i ></i>
                            <small >Book</small>
                          </button>
                        </div>
                        <div >
                          <button >
                            <i ></i>
                            <small >Consult</small>
                          </button>
                        </div>
                        <div >
                          <button >
                            <i ></i>
                            <small >AI Help</small>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Medical Icons */}
                  <div >
                    <div >
                      <i ></i>
                    </div>
                    <div >
                      <i ></i>
                    </div>
                    <div >
                      <i ></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Portal Section - Main Focus */}
      <section >
        <div >
          <div >
            {/* Main Patient Portal Card - Large & Prominent */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h2  style={{color: '#1e293b'}}>Welcome to Patient Portal</h2>
                <p >
                  Your complete healthcare management solution. Book appointments, access medical records, and connect with healthcare providers.
                </p>
                
                <div >
                  <div >
                    <div  style={{background: 'rgba(59, 130, 246, 0.05)'}}>
                      <i ></i>
                      <h6  style={{color: '#1e293b'}}>Easy Scheduling</h6>
                      <small >Book appointments 24/7</small>
                    </div>
                  </div>
                  <div >
                    <div  style={{background: 'rgba(16, 185, 129, 0.05)'}}>
                      <i ></i>
                      <h6  style={{color: '#1e293b'}}>Medical Records</h6>
                      <small >Access your health history</small>
                    </div>
                  </div>
                  <div >
                    <div  style={{background: 'rgba(168, 85, 247, 0.05)'}}>
                      <i ></i>
                      <h6  style={{color: '#1e293b'}}>AI Assistant</h6>
                      <small >24/7 health guidance</small>
                    </div>
                  </div>
                  <div >
                    <div  style={{background: 'rgba(245, 158, 11, 0.05)'}}>
                      <i ></i>
                      <h6  style={{color: '#1e293b'}}>Secure Messaging</h6>
                      <small >Chat with your doctor</small>
                    </div>
                  </div>
                </div>

                <div >
                  <button
                    
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
                    <i ></i>
                    Sign In / Create Account
                  </button>
                  <p >
                    <i ></i>
                    HIPAA Compliant • Secure • Private
                  </p>
                </div>
              </div>

              {/* Small Staff Access Links */}
              <div >
                <p >
                  <i ></i>
                  Staff Access:
                </p>
                <div >
                  <button
                    
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
                    <i ></i>
                    Admin Login
                  </button>
                  <button
                    
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
                    <i ></i>
                    Staff Login
                  </button>
                  <button
                    
                    style={{
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                    onClick={() => {
                      setLoginType("doctor");
                      setCurrentView("auth");
                    }}
                  >
                    <i className="fas fa-user-md me-1"></i>
                    Doctor Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" >
        <div >
          <div >
            <h2 >Powerful Features for Modern Healthcare</h2>
            <p >Everything you need to manage healthcare operations efficiently</p>
          </div>

          <div >
            {/* AI-Powered Assistant */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >AI Health Assistant</h5>
                <p >
                  Get instant health insights and personalized recommendations with our advanced AI assistant.
                </p>
                <ul >
                  <li><i ></i>24/7 health guidance</li>
                  <li><i ></i>Symptom analysis</li>
                  <li><i ></i>Medication reminders</li>
                </ul>
              </div>
            </div>

            {/* Smart Scheduling */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Smart Scheduling</h5>
                <p >
                  Intelligent appointment booking with real-time availability and automated reminders.
                </p>
                <ul >
                  <li><i ></i>Real-time availability</li>
                  <li><i ></i>Automated reminders</li>
                  <li><i ></i>Conflict resolution</li>
                </ul>
              </div>
            </div>

            {/* Secure Payments */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Secure Payments</h5>
                <p >
                  HIPAA-compliant payment processing with multiple payment options and insurance integration.
                </p>
                <ul >
                  <li><i ></i>HIPAA compliant</li>
                  <li><i ></i>Insurance integration</li>
                  <li><i ></i>Multiple payment methods</li>
                </ul>
              </div>
            </div>

            {/* Telemedicine */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Telemedicine</h5>
                <p >
                  High-quality video consultations with integrated health monitoring and file sharing.
                </p>
                <ul >
                  <li><i ></i>HD video calls</li>
                  <li><i ></i>Screen sharing</li>
                  <li><i ></i>Digital prescriptions</li>
                </ul>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Analytics Dashboard</h5>
                <p >
                  Comprehensive insights and reporting tools for data-driven healthcare decisions.
                </p>
                <ul >
                  <li><i ></i>Real-time metrics</li>
                  <li><i ></i>Custom reports</li>
                  <li><i ></i>Performance tracking</li>
                </ul>
              </div>
            </div>

            {/* Mobile App */}
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Mobile Ready</h5>
                <p >
                  Native mobile apps for iOS and Android with offline capabilities and push notifications.
                </p>
                <ul >
                  <li><i ></i>iOS & Android apps</li>
                  <li><i ></i>Offline access</li>
                  <li><i ></i>Push notifications</li>
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

      {/* About Us Section */}
      <section id="about" >
        <div >
          <div >
            <div >
              <div >
                <h2 >Revolutionizing Healthcare Management</h2>
                <p >
                  HealthSync Pro was founded with a simple mission: to make healthcare more accessible,
                  efficient, and patient-centered through innovative technology solutions.
                </p>
                <p >
                  Our team of healthcare professionals, software engineers, and UX designers work together
                  to create solutions that address real-world challenges in healthcare delivery. We believe
                  that technology should enhance the human connection between patients and providers, not replace it.
                </p>

                <div >
                  <div >
                    <div >
                      <h3 >5+</h3>
                      <small >Years Experience</small>
                    </div>
                  </div>
                  <div >
                    <div >
                      <h3 >50+</h3>
                      <small >Healthcare Partners</small>
                    </div>
                  </div>
                </div>

                <div >
                  <h5 >Our Core Values</h5>
                  <div >
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <h6 >Patient-Centered</h6>
                          <small >Every decision prioritizes patient care and experience</small>
                        </div>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <h6 >Security First</h6>
                          <small >HIPAA compliance and data protection are non-negotiable</small>
                        </div>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <h6 >Innovation</h6>
                          <small >Continuous improvement through cutting-edge technology</small>
                        </div>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <h6 >Collaboration</h6>
                          <small >Building bridges between all healthcare stakeholders</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div >
              <div >
                <div >
                  <div >
                    <div >
                      <div >
                        <i ></i>
                        <h4 >200+</h4>
                        <small >Hospitals</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <h4 >5,000+</h4>
                        <small >Doctors</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <h4 >1M+</h4>
                        <small >Patients</small>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <h4 >10M+</h4>
                        <small >Appointments</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div >
                  <h5 >
                    <i ></i>
                    Awards & Recognition
                  </h5>
                  <div >
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <small >Best Healthcare Innovation 2024</small>
                          <br />
                          <small >Healthcare Technology Awards</small>
                        </div>
                      </div>
                    </div>
                    <div >
                      <div >
                        <i ></i>
                        <div>
                          <small >Top 10 Health Tech Startups</small>
                          <br />
                          <small >TechCrunch Disrupt 2024</small>
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
      <section id="contact" >
        <div >
          <div >
            <h2 >Get in Touch</h2>
            <p >Ready to transform your healthcare operations? Let's talk!</p>
          </div>

          <div >
            {/* Contact Information */}
            <div >
              <div >
                <h5 >Contact Information</h5>

                <div >
                  <div >
                    <i ></i>
                  </div>
                  <div>
                    <h6 >Address</h6>
                    <p >
                      123 Healthcare Boulevard<br />
                      Medical District, MD 12345<br />
                      United States
                    </p>
                  </div>
                </div>

                <div >
                  <div >
                    <i ></i>
                  </div>
                  <div>
                    <h6 >Phone</h6>
                    <p >
                      Support: +91 7001268485<br />
                      Available: Mon-Sat, 9AM-6PM IST
                    </p>
                  </div>
                </div>

                <div >
                  <div >
                    <i ></i>
                  </div>
                  <div>
                    <h6 >Email</h6>
                    <p >
                      Support: desouvik0000@gmail.com
                    </p>
                  </div>
                </div>

                <div >
                  <div >
                    <i ></i>
                  </div>
                  <div>
                    <h6 >Business Hours</h6>
                    <p >
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 4:00 PM<br />
                      Sunday: Emergency Support Only
                    </p>
                  </div>
                </div>

                <div >
                  <h6 >Follow Us</h6>
                  <div >
                    <a href="#"  title="LinkedIn">
                      <i ></i>
                    </a>
                    <a href="#"  title="Twitter">
                      <i ></i>
                    </a>
                    <a href="#"  title="Facebook">
                      <i ></i>
                    </a>
                    <a href="#"  title="YouTube">
                      <i ></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div >
              <div >
                <h5 >Send us a Message</h5>
                <form>
                  <div >
                    <div >
                      <label >First Name *</label>
                      <input type="text"  placeholder="Enter your first name" required />
                    </div>
                    <div >
                      <label >Last Name *</label>
                      <input type="text"  placeholder="Enter your last name" required />
                    </div>
                    <div >
                      <label >Email Address *</label>
                      <input type="email"  placeholder="Enter your email" required />
                    </div>
                    <div >
                      <label >Phone Number</label>
                      <input type="tel"  placeholder="Enter your phone number" />
                    </div>
                    <div >
                      <label >Organization</label>
                      <input type="text"  placeholder="Your healthcare organization" />
                    </div>
                    <div >
                      <label >Subject *</label>
                      <select  required>
                        <option value="">Select a subject</option>
                        <option value="sales">Sales Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="demo">Request Demo</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div >
                      <label >Message *</label>
                      <textarea  rows="5" placeholder="Tell us how we can help you..." required></textarea>
                    </div>
                    <div >
                      <div >
                        <input  type="checkbox" id="newsletter" />
                        <label  htmlFor="newsletter">
                          Subscribe to our newsletter for healthcare technology updates
                        </label>
                      </div>
                    </div>
                    <div >
                      <button type="submit" >
                        <i ></i>
                        Send Message
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Quick Contact Cards */}
          <div >
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Schedule a Demo</h5>
                <p >
                  See HealthSync Pro in action with a personalized demo tailored to your needs.
                </p>
                <button >
                  <i ></i>
                  Book Demo
                </button>
              </div>
            </div>
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >24/7 Support</h5>
                <p >
                  Get immediate help from our healthcare technology experts anytime, anywhere.
                </p>
                <button >
                  <i ></i>
                  Live Chat
                </button>
              </div>
            </div>
            <div >
              <div >
                <div >
                  <i ></i>
                </div>
                <h5 >Resources</h5>
                <p >
                  Download whitepapers, case studies, and implementation guides.
                </p>
                <button >
                  <i ></i>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>
      
      {/* Footer */}
      <footer  role="contentinfo" aria-label="Site footer">
        <div >
          <div >
            <div >
              <div >
                <h5 >
                  <i ></i>
                  HealthSync Pro
                </h5>
                <p >
                  Connecting patients with healthcare professionals through intelligent scheduling,
                  seamless communication, and comprehensive health management solutions.
                </p>
                <div >
                  <h6>Contact Us</h6>
                  <p>
                    <i ></i> Phone: +91 7001268485<br />
                    <i ></i> Email: desouvik0000@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <div >
              <h5>Product</h5>
              <ul >
                <li><a href="#features">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Integrations</a></li>
                <li><a href="#">API</a></li>
              </ul>
            </div>

            <div >
              <h5>Company</h5>
              <ul >
                <li><a href="#about">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>

            <div >
              <h5>Resources</h5>
              <ul >
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Webinars</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Community</a></li>
              </ul>
            </div>

            <div >
              <h5>Legal</h5>
              <ul >
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">HIPAA Compliance</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div  style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            paddingTop: '2rem',
            marginTop: '3rem'
          }}>
            <div >
              <div >
                <div >
                  <div  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i  style={{ color: 'white', fontSize: '14px' }}></i>
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>HealthSync Pro</span>
                </div>
                <p >© 2024 HealthSync Pro, Inc. All rights reserved.</p>
                <small >
                  Transforming healthcare through intelligent technology solutions.
                </small>
              </div>
              <div >
                <div >
                  <a href="#"  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i ></i>
                  </a>
                  <a href="#"  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i ></i>
                  </a>
                  <a href="#"  style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i ></i>
                  </a>
                  <a href="#" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    fontSize: '1.2rem',
                    transition: 'color 0.2s ease'
                  }}>
                    <i ></i>
                  </a>
                </div>
                <div >
                  <span  style={{ 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    color: '#10b981',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i ></i>HIPAA Compliant
                  </span>
                  <span  style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    color: '#3b82f6',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i ></i>ISO 27001
                  </span>
                  <span  style={{ 
                    background: 'rgba(245, 158, 11, 0.2)', 
                    color: '#f59e0b',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}>
                    <i ></i>SOC 2 Type II
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
      
      {/* Performance Monitor - Disabled by default to improve performance */}
      {/* Uncomment below to enable performance monitoring in development */}
      {/* <PerformanceMonitor enabled={true} /> */}
      
      {/* Notifications */}
      <div  style={{ zIndex: 1050 }}>
        {notifications.map(notification => (
          <div key={notification.id} >
            {notification.message}
            <button
              type="button"
              
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            ></button>
          </div>
        ))}
      </div>

      {/* Render based on current view */}
      {currentView === "landing" && (
        <LandingPage 
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onNavigate={(view) => {
            if (view === 'register') {
              setLoginType('patient');
              setCurrentView('auth');
            } else if (view === 'login') {
              setLoginType('patient');
              setCurrentView('auth');
            } else if (view === 'admin-login') {
              setLoginType('admin');
              setCurrentView('auth');
            } else if (view === 'receptionist-login') {
              setLoginType('receptionist');
              setCurrentView('auth');
            } else if (view === 'doctor-login') {
              setLoginType('doctor');
              setCurrentView('auth');
            } else if (view === 'corporate') {
              setCurrentView('corporate');
            }
          }}
        />
      )}

      {currentView === "corporate" && (
        <div style={{ paddingTop: '20px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
            <button 
              onClick={() => setCurrentView('landing')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '1rem'
              }}
            >
              <i className="fas fa-arrow-left"></i> Back to Home
            </button>
          </div>
          <CorporateWellness />
        </div>
      )}

      {currentView === "auth" && (
        <>
          {loginType === "patient" && (
            <AuthPremium 
              onLogin={(data) => handleLogin(data, 'patient')} 
              onBack={() => setCurrentView("landing")}
            />
          )}

          {loginType === "admin" && (
            <AdminAuth 
              onLogin={(data) => handleLogin(data, 'admin')}
              onBack={() => setCurrentView('landing')}
            />
          )}

          {loginType === "receptionist" && (
            <ClinicAuth 
              onLogin={(data) => handleLogin(data, 'receptionist')}
              onBack={() => setCurrentView('landing')}
            />
          )}

          {loginType === "doctor" && (
            <DoctorAuth 
              onLogin={(data) => handleLogin(data, 'doctor')}
              onBack={() => setCurrentView('landing')}
            />
          )}
        </>
      )}

      {currentView === "dashboard" && (
        <>
          {/* USER MODE - Patient Dashboard */}
          {user && !admin && !receptionist && (
            <Suspense fallback={
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary mb-3"></div>
                <p className="text-muted">Loading Patient Dashboard...</p>
              </div>
            }>
              <PatientDashboard user={user} onLogout={handleLogoutAll} />
            </Suspense>
          )}

          {/* ADMIN MODE */}
          {admin && !user && !receptionist && (
            <Suspense fallback={
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary mb-3"></div>
                <p className="text-muted">Loading Admin Dashboard...</p>
              </div>
            }>
              <AdminDashboard admin={admin} onLogout={handleLogoutAll} />
            </Suspense>
          )}

          {/* RECEPTIONIST MODE */}
          {receptionist && !user && !admin && !doctor && (
            <Suspense fallback={
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary mb-3"></div>
                <p className="text-muted">Loading Clinic Dashboard...</p>
              </div>
            }>
              <ClinicDashboard receptionist={receptionist} onLogout={handleLogoutAll} />
            </Suspense>
          )}

          {/* DOCTOR MODE */}
          {doctor && !user && !admin && !receptionist && (
            <Suspense fallback={
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary mb-3"></div>
                <p className="text-muted">Loading Doctor Dashboard...</p>
              </div>
            }>
              <DoctorDashboard doctor={doctor} onLogout={handleLogoutAll} />
            </Suspense>
          )}
        </>
      )}

      {/* Floating Theme Toggle Button - Only show when logged in (not on landing page) */}
      {(user || admin || receptionist || doctor) && (
        <button
          onClick={toggleDarkMode}
          title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
          aria-label={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: darkMode 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '3px solid ' + (darkMode ? '#fbbf24' : '#ffffff'),
            color: darkMode ? '#fbbf24' : '#ffffff',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)';
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5), 0 3px 12px rgba(0, 0, 0, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)';
          }}
        >
          <i className={darkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
        </button>
      )}

      {/* Scroll to Top Button */}
      {(user || admin || receptionist) && (
        <button
          onClick={scrollToTop}
          title="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '110px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            color: darkMode ? '#94a3b8' : '#667eea',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9998,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}
    </div>
  );
}

export default App;

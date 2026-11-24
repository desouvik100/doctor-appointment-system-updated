import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/medical-theme-clean.css';
// import './styles/dashboard-enhancements.css';

// Import only the working auth components first
import Auth from "./components/Auth";
import AdminAuth from "./components/AdminAuth";
import ClinicAuth from "./components/ClinicAuth";
import AIAssistant from "./components/AIAssistant";
// import PatientDashboard from "./components/PatientDashboard";

// Lazy load dashboard components
const DoctorList = React.lazy(() =>
  import("./components/DoctorList").catch(() => ({
    default: ({ user }) => (
      <div className="alert alert-info">
        <h4><i className="fas fa-user-md me-2"></i>Find Doctors</h4>
        <p>Welcome {user.name}! Doctor search functionality is loading...</p>
        <div className="d-grid gap-2">
          <button className="btn btn-primary" disabled>
            <i className="fas fa-search me-1"></i>
            Search Doctors
          </button>
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
            <i className="fas fa-calendar me-1"></i>
            View Appointments
          </button>
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
            <i className="fas fa-history me-1"></i>
            View Payments
          </button>
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
              <i className="fas fa-users me-1"></i>
              Manage Users
            </button>
          </div>
          <div className="col-md-6">
            <button className="btn btn-success w-100" disabled>
              <i className="fas fa-user-md me-1"></i>
              Manage Doctors
            </button>
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
              <i className="fas fa-calendar-plus me-1"></i>
              Book Appointment
            </button>
          </div>
          <div className="col-md-6">
            <button className="btn btn-info w-100" disabled>
              <i className="fas fa-users me-1"></i>
              Manage Patients
            </button>
          </div>
        </div>
      </div>
    )
  }))
);

function App() {
  const [currentView, setCurrentView] = useState("landing"); // "landing", "auth", "dashboard"
  const [page, setPage] = useState("doctors");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [receptionist, setReceptionist] = useState(null);
  const [loginType, setLoginType] = useState("patient"); // "patient", "admin", "receptionist"
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleAdminLogout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
  };

  const handleReceptionistLogout = () => {
    setReceptionist(null);
    localStorage.removeItem("receptionist");
  };

  const resetToPatientLogin = () => {
    setLoginType("patient");
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
    addNotification(`Switched to ${!darkMode ? 'Dark' : 'Light'} mode`, 'info');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    // Default to dark mode if no preference is saved
    setDarkMode(savedDarkMode === null ? true : savedDarkMode === 'true');

    // Check if user is already logged in
    if (user || admin || receptionist) {
      setCurrentView("dashboard");
    }

    // Keyboard shortcuts
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
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [user, admin, receptionist, darkMode]);

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
    addNotification('Logged out successfully', 'info');
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
      {/* Landing Navigation */}
      <nav className={`navbar navbar-expand-lg navbar-dark ${darkMode ? 'bg-dark' : 'medical-nav'} fixed-top`}>
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-heartbeat me-2"></i>
            HealthSync Pro
          </span>

          {/* Navigation Menu */}
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
                  href="#home" onClick={() => setActiveSection('home')}>Home</a>
              </li>
              <li className="nav-item">
                <a className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
                  href="#features" onClick={() => setActiveSection('features')}>Features</a>
              </li>
              <li className="nav-item">
                <a className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                  href="#about" onClick={() => setActiveSection('about')}>About Us</a>
              </li>
              <li className="nav-item">
                <a className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
                  href="#contact" onClick={() => setActiveSection('contact')}>Contact</a>
              </li>
            </ul>

            <div className="navbar-nav d-flex flex-row gap-2">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={toggleDarkMode}
                title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
              >
                <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button
                className="btn btn-primary btn-sm ms-2"
                onClick={() => setCurrentView("auth")}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section pt-5 mt-5">
        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6">
              <div className="hero-content">
                <h1 className="display-3 fw-bold premium-title mb-4 fade-in-up">
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
                    className="btn btn-medical btn-lg me-3 mb-2"
                    onClick={() => setCurrentView("auth")}
                  >
                    <i className="fas fa-rocket me-2"></i>
                    Start Free Trial
                  </button>
                  <button className="btn btn-outline-primary btn-lg mb-2">
                    <i className="fas fa-play me-2"></i>
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="hero-image text-center">
                <div className="dashboard-preview medical-card p-4">
                  <div className="preview-header mb-3">
                    <div className="d-flex align-items-center">
                      <div className="preview-dots">
                        <span className="dot bg-danger"></span>
                        <span className="dot bg-warning"></span>
                        <span className="dot bg-success"></span>
                      </div>
                      <small className="text-muted ms-3">HealthSync Pro Dashboard</small>
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="mini-card bg-primary bg-opacity-10 p-2 rounded">
                          <i className="fas fa-calendar-check text-primary"></i>
                          <small className="d-block">Appointments</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="mini-card bg-success bg-opacity-10 p-2 rounded">
                          <i className="fas fa-user-md text-success"></i>
                          <small className="d-block">Doctors</small>
                        </div>
                      </div>
                    </div>
                    <div className="preview-chart bg-light rounded p-3">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Panels Section */}
      <section className="login-panels-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Choose Your Access Portal</h2>
            <p className="lead text-muted">Select the appropriate login based on your role</p>
          </div>

          <div className="row g-4">
            {/* Patient Portal */}
            <div className="col-lg-4 col-md-6">
              <div className="login-panel-card medical-card h-100 text-center p-4">
                <div className="panel-icon mb-3">
                  <i className="fas fa-user-injured fa-3x text-primary"></i>
                </div>
                <h4 className="fw-bold mb-3">Patient Portal</h4>
                <p className="text-muted mb-4">
                  Book appointments, manage your health records, and connect with healthcare providers.
                </p>
                <ul className="list-unstyled text-start mb-4">
                  <li><i className="fas fa-check text-success me-2"></i>Schedule appointments</li>
                  <li><i className="fas fa-check text-success me-2"></i>View medical history</li>
                  <li><i className="fas fa-check text-success me-2"></i>AI health assistant</li>
                  <li><i className="fas fa-check text-success me-2"></i>Secure messaging</li>
                </ul>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setLoginType("patient");
                      setCurrentView("auth");
                    }}
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Portal */}
            <div className="col-lg-4 col-md-6">
              <div className="login-panel-card medical-card h-100 text-center p-4">
                <div className="panel-icon mb-3">
                  <i className="fas fa-user-shield fa-3x text-success"></i>
                </div>
                <h4 className="fw-bold mb-3">Administrator</h4>
                <p className="text-muted mb-4">
                  Comprehensive system management and healthcare operations oversight.
                </p>
                <ul className="list-unstyled text-start mb-4">
                  <li><i className="fas fa-check text-success me-2"></i>User management</li>
                  <li><i className="fas fa-check text-success me-2"></i>System analytics</li>
                  <li><i className="fas fa-check text-success me-2"></i>Security controls</li>
                  <li><i className="fas fa-check text-success me-2"></i>Compliance monitoring</li>
                </ul>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setLoginType("admin");
                      setCurrentView("auth");
                    }}
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            </div>

            {/* Receptionist Portal */}
            <div className="col-lg-4 col-md-6 mx-auto">
              <div className="login-panel-card medical-card h-100 text-center p-4">
                <div className="panel-icon mb-3">
                  <i className="fas fa-clinic-medical fa-3x text-info"></i>
                </div>
                <h4 className="fw-bold mb-3">Receptionist</h4>
                <p className="text-muted mb-4">
                  Efficient patient coordination and clinic management tools.
                </p>
                <ul className="list-unstyled text-start mb-4">
                  <li><i className="fas fa-check text-success me-2"></i>Patient check-in</li>
                  <li><i className="fas fa-check text-success me-2"></i>Appointment scheduling</li>
                  <li><i className="fas fa-check text-success me-2"></i>Insurance verification</li>
                  <li><i className="fas fa-check text-success me-2"></i>Payment processing</li>
                </ul>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-info"
                    onClick={() => {
                      setLoginType("receptionist");
                      setCurrentView("auth");
                    }}
                  >
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
              <div className="about-image text-center">
                <div className="team-showcase medical-card p-4">
                  <h5 className="mb-4">Meet Our Leadership Team</h5>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="team-member text-center">
                        <div className="member-avatar mb-2">
                          <i className="fas fa-user-circle fa-3x text-primary"></i>
                        </div>
                        <h6 className="mb-1">Dr. Sarah Johnson</h6>
                        <small className="text-muted">Chief Medical Officer</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="team-member text-center">
                        <div className="member-avatar mb-2">
                          <i className="fas fa-user-circle fa-3x text-success"></i>
                        </div>
                        <h6 className="mb-1">Michael Chen</h6>
                        <small className="text-muted">CTO & Co-Founder</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="team-member text-center">
                        <div className="member-avatar mb-2">
                          <i className="fas fa-user-circle fa-3x text-info"></i>
                        </div>
                        <h6 className="mb-1">Emily Rodriguez</h6>
                        <small className="text-muted">Head of Product</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="team-member text-center">
                        <div className="member-avatar mb-2">
                          <i className="fas fa-user-circle fa-3x text-warning"></i>
                        </div>
                        <h6 className="mb-1">David Kim</h6>
                        <small className="text-muted">VP of Engineering</small>
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
                      123 Healthcare Innovation Blvd<br />
                      Medical District, CA 90210
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
                      Support: +1 (555) 987-6543
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
                      hello@healthsyncpro.com<br />
                      support@healthsyncpro.com
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
                      Mon - Fri: 8:00 AM - 6:00 PM PST<br />
                      24/7 Emergency Support Available
                    </p>
                  </div>
                </div>

                <div className="social-links">
                  <h6 className="fw-bold mb-3">Follow Us</h6>
                  <div className="d-flex gap-3">
                    <a href="#" className="social-link">
                      <i className="fab fa-linkedin fa-lg text-primary"></i>
                    </a>
                    <a href="#" className="social-link">
                      <i className="fab fa-twitter fa-lg text-info"></i>
                    </a>
                    <a href="#" className="social-link">
                      <i className="fab fa-facebook fa-lg text-primary"></i>
                    </a>
                    <a href="#" className="social-link">
                      <i className="fab fa-youtube fa-lg text-danger"></i>
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
                        <option value="demo">Request a Demo</option>
                        <option value="pricing">Pricing Information</option>
                        <option value="support">Technical Support</option>
                        <option value="partnership">Partnership Opportunities</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Message *</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="Tell us about your healthcare needs and how we can help..."
                        required
                      ></textarea>
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
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          addNotification('Thank you! Your message has been sent successfully.', 'success');
                        }}
                      >
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
                <h6 className="fw-bold mb-2">Schedule a Demo</h6>
                <p className="text-muted mb-3">See HealthSync Pro in action with a personalized demo</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => addNotification('Demo scheduling form opened!', 'info')}
                >
                  Book Demo
                </button>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="quick-contact-card medical-card p-4 text-center h-100">
                <div className="contact-card-icon mb-3">
                  <i className="fas fa-headset fa-2x text-success"></i>
                </div>
                <h6 className="fw-bold mb-2">24/7 Support</h6>
                <p className="text-muted mb-3">Get immediate help from our healthcare technology experts</p>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => addNotification('Support chat initiated!', 'success')}
                >
                  Start Chat
                </button>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="quick-contact-card medical-card p-4 text-center h-100">
                <div className="contact-card-icon mb-3">
                  <i className="fas fa-download fa-2x text-info"></i>
                </div>
                <h6 className="fw-bold mb-2">Download Resources</h6>
                <p className="text-muted mb-3">Access whitepapers, case studies, and implementation guides</p>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => addNotification('Resource download started!', 'info')}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section bg-dark text-light py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="footer-brand">
                <h5 className="fw-bold mb-3">
                  <i className="fas fa-heartbeat me-2"></i>
                  HealthSync Pro
                </h5>
                <p className="text-muted mb-3">
                  Transforming healthcare through innovative technology solutions that connect
                  patients, providers, and administrators in one seamless ecosystem.
                </p>
                <div className="footer-social d-flex gap-3">
                  <a href="#" className="text-light">
                    <i className="fab fa-linkedin fa-lg"></i>
                  </a>
                  <a href="#" className="text-light">
                    <i className="fab fa-twitter fa-lg"></i>
                  </a>
                  <a href="#" className="text-light">
                    <i className="fab fa-facebook fa-lg"></i>
                  </a>
                  <a href="#" className="text-light">
                    <i className="fab fa-youtube fa-lg"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Product</h6>
              <ul className="list-unstyled">
                <li><a href="#features" className="text-muted text-decoration-none">Features</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Pricing</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Security</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Integrations</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Company</h6>
              <ul className="list-unstyled">
                <li><a href="#about" className="text-muted text-decoration-none">About Us</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Careers</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Press</a></li>
                <li><a href="#contact" className="text-muted text-decoration-none">Contact</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-muted text-decoration-none">Documentation</a></li>
                <li><a href="#" className="text-muted text-decoration-none">API Reference</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Case Studies</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Blog</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Support</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-muted text-decoration-none">Help Center</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Community</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Status</a></li>
                <li><a href="#" className="text-muted text-decoration-none">Training</a></li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="text-muted mb-0">
                © 2024 HealthSync Pro. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="footer-links">
                <a href="#" className="text-muted text-decoration-none me-3">Privacy Policy</a>
                <a href="#" className="text-muted text-decoration-none me-3">Terms of Service</a>
                <a href="#" className="text-muted text-decoration-none">HIPAA Compliance</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        className="scroll-to-top btn btn-primary"
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );

  return (
    <div>
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
      {currentView === "landing" && <LandingPage />}

      {currentView === "auth" && (
        <div className={`min-vh-100 ${darkMode ? 'dark-theme' : 'medical-bg'}`}>
          {/* Auth Navigation */}
          <nav className={`navbar navbar-expand-lg navbar-dark ${darkMode ? 'bg-dark' : 'medical-nav'}`}>
            <div className="container">
              <span className="navbar-brand mb-0 h1">
                <i className="fas fa-heartbeat me-2"></i>
                HealthSync Pro
              </span>
              <div className="navbar-nav ms-auto d-flex flex-row gap-2">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={() => setCurrentView("landing")}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Home
                </button>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={toggleDarkMode}
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
              </div>
            </div>
          </nav>

          {/* Auth Content */}
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
          {/* Dashboard Navigation */}
          <nav className={`navbar navbar-expand-lg navbar-dark ${darkMode ? 'bg-dark' : 'medical-nav'}`}>
            <div className="container">
              <span className="navbar-brand mb-0 h1">
                <i className="fas fa-heartbeat me-2"></i>
                HealthSync Pro
              </span>

              <div className="navbar-nav ms-auto d-flex flex-row gap-2">
                {(user || admin || receptionist) && (
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-light btn-sm dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      title="Help & Shortcuts"
                    >
                      <i className="fas fa-question-circle"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><h6 className="dropdown-header">Keyboard Shortcuts</h6></li>
                      <li><span className="dropdown-item-text small">Ctrl+1: Find Doctors</span></li>
                      <li><span className="dropdown-item-text small">Ctrl+2: Appointments</span></li>
                      <li><span className="dropdown-item-text small">Ctrl+3: AI Assistant</span></li>
                      <li><span className="dropdown-item-text small">Ctrl+4: Payments</span></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><span className="dropdown-item-text small">Ctrl+D: Toggle Theme</span></li>
                    </ul>
                  </div>
                )}
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={toggleDarkMode}
                  title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode (Ctrl+D)`}
                >
                  <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
              </div>
            </div>
          </nav>

          {/* ========== USER MODE ========== */}
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
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => addNotification('Profile updated successfully!', 'success')}
                            title="Edit Profile"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={handleLogoutAll} className="btn btn-outline-danger">
                            <i className="fas fa-sign-out-alt me-1"></i>
                            Logout
                          </button>
                        </div>
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
                              addNotification('Navigated to Find Doctors', 'info');
                            }}
                            className={`nav-link ${page === "doctors" ? "active" : ""}`}
                          >
                            <i className="fas fa-user-md me-2"></i>
                            Find Doctors
                            {page === "doctors" && <span className="badge bg-light text-dark ms-2">Active</span>}
                          </button>
                          <button
                            onClick={() => {
                              setPage("appointments");
                              scrollToTop();
                              addNotification('Navigated to My Appointments', 'info');
                            }}
                            className={`nav-link ${page === "appointments" ? "active" : ""}`}
                          >
                            <i className="fas fa-calendar-check me-2"></i>
                            My Appointments
                            <span className="badge bg-danger ms-2">3</span>
                          </button>
                          <button
                            onClick={() => {
                              setPage("ai-assistant");
                              scrollToTop();
                              addNotification('AI Assistant ready to help!', 'success');
                            }}
                            className={`nav-link ${page === "ai-assistant" ? "active" : ""}`}
                          >
                            <i className="fas fa-robot me-2"></i>
                            AI Assistant
                            <span className="pulse-dot ms-2"></span>
                          </button>
                          <button
                            onClick={() => {
                              setPage("payments");
                              scrollToTop();
                              addNotification('Navigated to Payment History', 'info');
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

          {/* ========== ADMIN MODE ========== */}
          {admin && !user && !receptionist && (
            <div className="container mt-4">
              <div className="row">
                <div className="col-12">
                  <div className="medical-card shadow-sm mb-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="card-title mb-1 medical-title">
                            <i className="fas fa-user-shield me-2"></i>
                            Admin Dashboard
                          </h5>
                          <p className="text-muted mb-0">
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

                  <React.Suspense fallback={
                    <div className="text-center py-5">
                      <div className="loading-spinner mx-auto mb-3"></div>
                      <p className="text-muted">Loading admin dashboard...</p>
                    </div>
                  }>
                    <AdminDashboard />
                  </React.Suspense>
                </div>
              </div>
            </div>
          )}

          {/* ========== RECEPTIONIST MODE ========== */}
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


      {/* Scroll to Top Button */}
      {(user || admin || receptionist) && (
        <button
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          title="Scroll to top"
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* Footer */}
      <footer className={`mt-5 py-4 ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3">
                <i className="fas fa-heartbeat me-2"></i>
                HealthSync Pro
              </h6>
              <p className="text-muted small mb-0">
                Connecting patients with healthcare professionals through intelligent scheduling,
                seamless communication, and comprehensive health management solutions.
              </p>
            </div>
            <div className="col-md-3">
              <h6 className="mb-3">Quick Links</h6>
              <ul className="list-unstyled small">
                <li><a href="#" className="text-decoration-none text-muted">Privacy Policy</a></li>
                <li><a href="#" className="text-decoration-none text-muted">Terms of Service</a></li>
                <li><a href="#" className="text-decoration-none text-muted">Help Center</a></li>
                <li><a href="#" className="text-decoration-none text-muted">Contact Support</a></li>
              </ul>
            </div>
            <div className="col-md-3">
              <h6 className="mb-3">Emergency</h6>
              <p className="small text-muted mb-2">
                <i className="fas fa-phone text-danger me-2"></i>
                Emergency: 911
              </p>
              <p className="small text-muted mb-0">
                <i className="fas fa-headset text-info me-2"></i>
                Support: 1-800-HEALTHSYNC
              </p>
            </div>
          </div>
          <hr className="my-4" />
          <div className="row align-items-center">
            <div className="col-md-6">
              <small className="text-muted">
                © 2024 HealthSync Pro. All rights reserved.
              </small>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                HIPAA Compliant •
                <i className="fas fa-lock ms-2 me-1"></i>
                SSL Secured
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
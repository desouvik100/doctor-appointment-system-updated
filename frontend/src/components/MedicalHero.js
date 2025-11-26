import React from 'react';

const MedicalHero = ({ onGetStarted, darkMode }) => {
  return (
    <section className="hero-section pt-5 mt-5">
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
                  className="btn btn-medical btn-xl px-5 py-3 me-3 mb-2"
                  onClick={onGetStarted}
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
                  onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
                >
                  <i className="fas fa-play me-2"></i>
                  Watch Demo
                </button>
              </div>

              {/* Medical Trust Indicators */}
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
              {/* Enhanced Medical Dashboard Preview */}
              <div className="dashboard-preview medical-card p-4 position-relative">
                {/* Medical Background Pattern */}
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
                  {/* Medical Stats Row */}
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
                        <div className="mini-pulse"></div>
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
                        <div className="mini-pulse success"></div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Chart */}
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
                    <div className="chart-labels d-flex justify-content-between mt-2">
                      <small className="text-muted">Mon</small>
                      <small className="text-muted">Tue</small>
                      <small className="text-muted">Wed</small>
                      <small className="text-muted">Thu</small>
                      <small className="text-muted">Fri</small>
                      <small className="text-muted">Sat</small>
                      <small className="text-muted">Sun</small>
                    </div>
                  </div>

                  {/* Medical Quick Actions */}
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

              {/* Medical Features Highlight */}
              <div className="medical-features-highlight mt-4">
                <div className="row g-3">
                  <div className="col-4">
                    <div className="feature-highlight text-center">
                      <div className="feature-icon-small bg-primary bg-opacity-10 rounded-circle p-2 mx-auto mb-2">
                        <i className="fas fa-shield-alt text-primary"></i>
                      </div>
                      <small className="fw-bold d-block">Secure</small>
                      <small className="text-muted">HIPAA Compliant</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="feature-highlight text-center">
                      <div className="feature-icon-small bg-success bg-opacity-10 rounded-circle p-2 mx-auto mb-2">
                        <i className="fas fa-clock text-success"></i>
                      </div>
                      <small className="fw-bold d-block">24/7</small>
                      <small className="text-muted">Always Available</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="feature-highlight text-center">
                      <div className="feature-icon-small bg-info bg-opacity-10 rounded-circle p-2 mx-auto mb-2">
                        <i className="fas fa-mobile-alt text-info"></i>
                      </div>
                      <small className="fw-bold d-block">Mobile</small>
                      <small className="text-muted">Any Device</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicalHero;
const MedicalHero = ({ onGetStarted }) => {
  return (
    <section className="hero-section" aria-label="HealthSync - Clinic Management Platform">
      <div className="container">
        <div className="row align-items-center min-vh-100">
          <div className="col-lg-6">
            <div className="hero-content">
              <h1 className="premium-title fade-in-up">
                Clinic-First
                <span className="text-gradient"> Doctor Appointment</span>
                <br />& Management Platform
              </h1>
              <p className="premium-subtitle fade-in-up">
                HealthSync is a clinic-first healthcare platform for managing online and in-clinic 
                doctor appointments with zero confusion. Book appointments, manage queues, and streamline operations.
              </p>

              <div className="hero-stats fade-in-up">
                <div className="row g-3">
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="stat-number">10K+</h3>
                      <small style={{ color: 'rgba(255,255,255,0.8)' }}>Healthcare Providers</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="stat-number">500K+</h3>
                      <small style={{ color: 'rgba(255,255,255,0.8)' }}>Patients Served</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="stat-item text-center">
                      <h3 className="stat-number">99.9%</h3>
                      <small style={{ color: 'rgba(255,255,255,0.8)' }}>Uptime</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-actions fade-in-up">
                <button
                  className="btn-medical"
                  onClick={onGetStarted}
                >
                  <i className="fas fa-rocket me-2"></i>
                  Get Started
                </button>
                <button
                  className="btn-outline-light"
                  style={{
                    padding: '16px 32px',
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fas fa-play-circle me-2"></i>
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6 d-none d-lg-block">
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <i className="fas fa-heartbeat" style={{ fontSize: '80px', marginBottom: '20px' }}></i>
                <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
                  HealthSync Pro
                </h3>
                <p style={{ fontSize: '16px', opacity: '0.9' }}>
                  Your complete healthcare management solution
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicalHero;

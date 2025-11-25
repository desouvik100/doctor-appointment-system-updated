import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [darkMode, setDarkMode] = useState(false);

  const LandingPage = () => (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-heartbeat me-2"></i>
            HealthSync Pro
          </span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setCurrentView("auth")}
          >
            Get Started
          </button>
        </div>
      </nav>

      <div className="container mt-5 pt-5">
        <div className="row align-items-center min-vh-75">
          <div className="col-lg-6">
            <h1 className="display-4 fw-bold mb-4">
              The Future of Healthcare Management
            </h1>
            <p className="lead mb-4">
              Streamline your healthcare operations with our intelligent platform.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setCurrentView("auth")}
            >
              Start Free Trial
            </button>
          </div>
          <div className="col-lg-6">
            <div className="card p-4">
              <h5>Dashboard Preview</h5>
              <div className="row g-2">
                <div className="col-6">
                  <div className="card bg-primary bg-opacity-10 p-2">
                    <i className="fas fa-calendar-check text-primary"></i>
                    <small>Appointments</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card bg-success bg-opacity-10 p-2">
                    <i className="fas fa-user-md text-success"></i>
                    <small>Doctors</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ position: 'fixed', top: '0', left: '0', background: 'red', color: 'white', padding: '10px', zIndex: 10000 }}>
        Test App Loaded - View: {currentView}
      </div>
      
      {currentView === "landing" && <LandingPage />}
      
      {currentView === "auth" && (
        <div className="min-vh-100 bg-light">
          <div className="container mt-5 pt-5">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-primary text-white text-center">
                    <h3>Patient Login</h3>
                  </div>
                  <div className="card-body">
                    <p>Auth component would go here</p>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setCurrentView("landing")}
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
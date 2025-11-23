import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import DoctorList from "./components/DoctorList";
import MyAppointments from "./components/MyAppointments";
import AdminDashboard from "./components/AdminDashboard";
import Auth from "./components/Auth";
import AdminAuth from "./components/AdminAuth";
import ClinicAuth from "./components/ClinicAuth";
import ClinicDashboard from "./components/ClinicDashboard";

function App() {
  const [page, setPage] = useState("doctors");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [receptionist, setReceptionist] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedAdmin = localStorage.getItem("admin");
    const savedReceptionist = localStorage.getItem("receptionist");

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdmin) setAdmin(JSON.parse(savedAdmin));
    if (savedReceptionist) setReceptionist(JSON.parse(savedReceptionist));
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

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <i className="fas fa-stethoscope me-2"></i>
            Doctor Appointment System
          </span>
        </div>
      </nav>

      {/* ========== USER MODE ========== */}
      {user && !admin && !receptionist && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title mb-1">Welcome, {user.name}!</h5>
                      <p className="text-muted mb-0">{user.email}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline-danger">
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="btn-group w-100" role="group">
                    <button
                      onClick={() => setPage("doctors")}
                      className={`btn ${page === "doctors" ? "btn-primary" : "btn-outline-primary"}`}
                    >
                      <i className="fas fa-user-md me-1"></i>
                      Find Doctors
                    </button>
                    <button
                      onClick={() => setPage("appointments")}
                      className={`btn ${page === "appointments" ? "btn-primary" : "btn-outline-primary"}`}
                    >
                      <i className="fas fa-calendar-check me-1"></i>
                      My Appointments
                    </button>
                  </div>
                </div>
              </div>

              {page === "doctors" && <DoctorList user={user} />}
              {page === "appointments" && <MyAppointments user={user} />}
            </div>
          </div>
        </div>
      )}

      {/* ========== ADMIN MODE ========== */}
      {admin && !user && !receptionist && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title mb-1">
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Dashboard
                      </h5>
                      <p className="text-muted mb-0">{admin.name} ({admin.email})</p>
                    </div>
                    <button onClick={handleAdminLogout} className="btn btn-outline-danger">
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <AdminDashboard />
            </div>
          </div>
        </div>
      )}

      {/* ========== RECEPTIONIST MODE ========== */}
      {receptionist && !user && !admin && (
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title mb-1">
                        <i className="fas fa-clinic-medical me-2"></i>
                        Clinic Reception
                      </h5>
                      <p className="text-muted mb-0">{receptionist.name} ({receptionist.email})</p>
                    </div>
                    <button onClick={handleReceptionistLogout} className="btn btn-outline-danger">
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <ClinicDashboard receptionist={receptionist} />
            </div>
          </div>
        </div>
      )}

      {/* ========== LOGIN PAGE ========== */}
      {!user && !admin && !receptionist && (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-12 text-center mb-5">
              <h1 className="display-4 text-primary mb-3">
                <i className="fas fa-stethoscope me-3"></i>
                Doctor Appointment System
              </h1>
              <p className="lead text-muted">Choose your login type to continue</p>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-primary text-white text-center">
                  <h4 className="mb-0">
                    <i className="fas fa-user me-2"></i>
                    Patient Login
                  </h4>
                </div>
                <div className="card-body">
                  <Auth onLogin={(data) => setUser(data)} />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-success text-white text-center">
                  <h4 className="mb-0">
                    <i className="fas fa-user-shield me-2"></i>
                    Admin Login
                  </h4>
                </div>
                <div className="card-body">
                  <AdminAuth onLogin={(data) => setAdmin(data)} />
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-12">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-info text-white text-center">
                  <h4 className="mb-0">
                    <i className="fas fa-clinic-medical me-2"></i>
                    Reception Login
                  </h4>
                </div>
                <div className="card-body">
                  <ClinicAuth onLogin={(data) => setReceptionist(data)} />
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
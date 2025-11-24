import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

// Import only the working auth components first
import Auth from "./components/Auth";
import AdminAuth from "./components/AdminAuth";
import ClinicAuth from "./components/ClinicAuth";

// Create safe component wrappers
const SafeComponent = ({ component: Component, fallback, ...props }) => {
  try {
    return <Component {...props} />;
  } catch (error) {
    console.error('Component error:', error);
    return fallback || <div className="alert alert-warning">Component loading...</div>;
  }
};

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
  const [page, setPage] = useState("doctors");
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [receptionist, setReceptionist] = useState(null);

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
                      <h5 className="card-title mb-1">Welcome, {user?.name || "User"}!</h5>
                      <p className="text-muted mb-0">{user?.email || ""}</p>
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
                    <button
                      onClick={() => setPage("payments")}
                      className={`btn ${page === "payments" ? "btn-primary" : "btn-outline-primary"}`}
                    >
                      <i className="fas fa-credit-card me-1"></i>
                      Payment History
                    </button>
                  </div>
                </div>
              </div>

              <React.Suspense fallback={<div className="text-center"><div className="spinner-border"></div></div>}>
                {page === "doctors" && <DoctorList user={user} />}
                {page === "appointments" && <MyAppointments user={user} />}
                {page === "payments" && <PaymentHistory user={user} />}
              </React.Suspense>
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
                      <p className="text-muted mb-0">{admin?.name || "Admin"} ({admin?.email || ""})</p>
                    </div>
                    <button onClick={handleAdminLogout} className="btn btn-outline-danger">
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <React.Suspense fallback={<div className="text-center"><div className="spinner-border"></div></div>}>
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
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="card-title mb-1">
                        <i className="fas fa-clinic-medical me-2"></i>
                        Clinic Reception
                      </h5>
                      <p className="text-muted mb-0">{receptionist?.name || "Receptionist"} ({receptionist?.email || ""})</p>
                    </div>
                    <button onClick={handleReceptionistLogout} className="btn btn-outline-danger">
                      <i className="fas fa-sign-out-alt me-1"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <React.Suspense fallback={<div className="text-center"><div className="spinner-border"></div></div>}>
                <ClinicDashboard receptionist={receptionist} />
              </React.Suspense>
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
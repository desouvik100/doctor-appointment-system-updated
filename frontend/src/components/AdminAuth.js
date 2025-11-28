import React, { useState } from "react";
import axios from "../api/config";
import "./AdminAuth.css";

function AdminAuth({ onLogin, onBack }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/admin/login", formData);
      localStorage.setItem("admin", JSON.stringify(response.data.user));
      onLogin(response.data.user, "admin");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      {/* Left Side - Branding */}
      <div className="admin-auth__left">
        <div className="admin-auth__branding">
          <div className="admin-auth__logo">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1>HealthSync Admin</h1>
          <p>Healthcare Operations Management</p>
        </div>

        <div className="admin-auth__features">
          <div className="admin-auth__feature">
            <i className="fas fa-chart-line"></i>
            <div>
              <h4>Real-time Analytics</h4>
              <p>Monitor system performance and metrics</p>
            </div>
          </div>
          <div className="admin-auth__feature">
            <i className="fas fa-users-cog"></i>
            <div>
              <h4>User Management</h4>
              <p>Control access and permissions</p>
            </div>
          </div>
          <div className="admin-auth__feature">
            <i className="fas fa-lock"></i>
            <div>
              <h4>Security First</h4>
              <p>Enterprise-grade security protocols</p>
            </div>
          </div>
        </div>

        <div className="admin-auth__footer-left">
          <p>Secure admin portal for healthcare professionals</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="admin-auth__right">
        <div className="admin-auth__form-container">
          {/* Header */}
          <div className="admin-auth__header">
            <button 
              className="admin-auth__back-btn"
              onClick={onBack}
              type="button"
              title="Back to home"
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <h2>Admin Login</h2>
            <p>Enter your credentials to access the admin dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-auth__form">
            {/* Email Field */}
            <div className="admin-auth__form-group">
              <label htmlFor="email" className="admin-auth__label">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="admin-auth__input"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@healthsync.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="admin-auth__form-group">
              <label htmlFor="password" className="admin-auth__label">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="admin-auth__password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="admin-auth__input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="admin-auth__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas fa-eye${showPassword ? "-slash" : ""}`}></i>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="admin-auth__error" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="admin-auth__submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="admin-auth__security-notice">
              <i className="fas fa-info-circle"></i>
              <p>This is a secure admin portal. Only authorized personnel should access.</p>
            </div>
          </form>

          {/* Footer */}
          <div className="admin-auth__form-footer">
            <p>
              <i className="fas fa-lock"></i>
              Secured with enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuth;


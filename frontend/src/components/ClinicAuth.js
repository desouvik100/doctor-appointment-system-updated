import React, { useState } from "react";
import axios from "axios";
import ReceptionistSignup from "./ReceptionistSignup";

function ClinicAuth({ onLogin }) {
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/receptionists/login", formData);
      localStorage.setItem("receptionist", JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || "Invalid receptionist credentials");
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return (
      <div>
        <ReceptionistSignup 
          onSignupSuccess={() => {
            setShowSignup(false);
            setError("");
          }}
        />
        <div className="mt-3 text-center">
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => {
              setShowSignup(false);
              setError("");
            }}
          >
            <i className="fas fa-arrow-left me-1"></i>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Receptionist Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="receptionist@clinic.com"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-1"></i>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-info w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1"></span>
              Logging in...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt me-1"></i>
              Reception Login
            </>
          )}
        </button>
      </form>

      <div className="mt-3 text-center">
        <button
          type="button"
          className="btn btn-link btn-sm"
          onClick={() => setShowSignup(true)}
        >
          <i className="fas fa-user-plus me-1"></i>
          New Receptionist? Sign Up
        </button>
      </div>

      <div className="mt-2">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Clinic staff access - Approved accounts only
        </small>
      </div>
    </div>
  );
}

export default ClinicAuth;
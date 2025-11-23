import React, { useState } from "react";
import axios from "../api/config";

function ReceptionistSignup({ onSignupSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    clinicName: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/receptionist/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        clinicName: formData.clinicName
      });

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        clinicName: ""
      });

      if (onSignupSuccess) {
        onSignupSuccess(response.data);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to register. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="alert alert-success" role="alert">
        <h5 className="alert-heading">
          <i className="fas fa-check-circle me-2"></i>
          Registration Submitted!
        </h5>
        <p>
          Your receptionist account has been submitted for approval. 
          An admin will review your request and you'll be notified once approved.
        </p>
        <hr />
        <p className="mb-0 small">
          You can check back later to see if your account has been approved.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email Address</label>
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
          <label className="form-label">Clinic Name</label>
          <input
            type="text"
            className="form-control"
            name="clinicName"
            value={formData.clinicName}
            onChange={handleChange}
            placeholder="Enter your clinic name"
            required
          />
          <small className="form-text text-muted">
            The clinic you work for or want to register
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91-98765-43210"
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
            placeholder="Enter password (min 6 characters)"
            required
            minLength={6}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            minLength={6}
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
              Submitting...
            </>
          ) : (
            <>
              <i className="fas fa-user-plus me-1"></i>
              Sign Up as Receptionist
            </>
          )}
        </button>
      </form>

      <div className="mt-3">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Your account will be pending until admin approval
        </small>
      </div>
    </div>
  );
}

export default ReceptionistSignup;


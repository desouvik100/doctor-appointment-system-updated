import React, { useState } from "react";
import axios from "../api/config";
import "../styles/theme-system.css";

function AdminAuth({ onLogin }) {
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
      const response = await axios.post("/api/auth/admin/login", formData);
      localStorage.setItem("admin", JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Admin Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
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
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-success w-100"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Admin Login"}
        </button>
      </form>

      <div className="mt-3">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Admin access required
        </small>
      </div>
    </div>
  );
}

export default AdminAuth;

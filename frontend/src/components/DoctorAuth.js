import React, { useState, useEffect } from "react";
import axios from "../api/config";
import "./ClinicAuth.css"; // Reuse clinic auth styles

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function DoctorAuth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    specialization: "",
    clinicName: "",
    experience: "",
    qualification: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [socialLoading, setSocialLoading] = useState(null);

  // Load Google Sign-In script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.getElementById('google-signin-script')) return;
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };
    loadGoogleScript();
  }, []);

  // Fetch clinics for dropdown
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await axios.get("/api/clinics");
        setClinics(response.data || []);
      } catch (err) {
        console.error("Failed to fetch clinics:", err);
      }
    };
    if (!isLogin) {
      fetchClinics();
    }
  }, [isLogin]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In not configured. Please use email/password login.');
      console.error('❌ REACT_APP_GOOGLE_CLIENT_ID is not set');
      return;
    }

    setSocialLoading('google');
    setError("");

    try {
      if (!window.google?.accounts?.oauth2) {
        setError('Google Sign-In is still loading. Please wait a moment and try again.');
        console.log('⏳ Google script not yet loaded');
        setSocialLoading(null);
        return;
      }

      console.log('🔐 Initiating Doctor Google Sign-In...');

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            console.log('✅ Access token received');
            await handleGoogleToken(tokenResponse.access_token);
          } else if (tokenResponse.error) {
            console.error('❌ Google OAuth error:', tokenResponse.error);
            setError(tokenResponse.error === 'access_denied' ? 'Google Sign-In was cancelled.' : 'Google Sign-In failed.');
            setSocialLoading(null);
          } else {
            setError('Google Sign-In was cancelled');
            setSocialLoading(null);
          }
        },
        error_callback: (error) => {
          console.error('❌ Google OAuth error:', error);
          if (error.type === 'popup_failed_to_open') {
            setError('Popup blocked! Please allow popups for this site.');
          } else if (error.type === 'popup_closed') {
            setError('Sign-in popup was closed. Please try again.');
          } else {
            setError('Google Sign-In failed. Please try again.');
          }
          setSocialLoading(null);
        }
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      setError('Google Sign-In failed. Please try again.');
      setSocialLoading(null);
    }
  };

  const handleGoogleToken = async (accessToken) => {
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Google');
      }
      
      const userInfo = await userInfoResponse.json();
      await processGoogleUser(userInfo);
    } catch (error) {
      console.error('Google token error:', error);
      setError('Failed to get user info from Google');
      setSocialLoading(null);
    }
  };

  const processGoogleUser = async (googleUser) => {
    try {
      const response = await axios.post('/api/auth/doctor/google-signin', {
        email: googleUser.email,
        name: googleUser.name || googleUser.given_name + ' ' + (googleUser.family_name || ''),
        googleId: googleUser.sub || googleUser.id,
        profilePhoto: googleUser.picture
      });

      localStorage.setItem("doctor", JSON.stringify(response.data.doctor));
      localStorage.setItem("doctorToken", response.data.token);
      setSuccess(`Welcome back, Dr. ${response.data.doctor.name?.split(' ')[0]}!`);
      setTimeout(() => onLogin(response.data.doctor), 500);
    } catch (error) {
      console.error('Doctor Google sign-in API error:', error);
      if (error.response?.data?.needsRegistration) {
        setError('No doctor account found. Please register first or use email/password login.');
      } else {
        setError(error.response?.data?.message || 'Google sign-in failed');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/doctor/login", formData);
      localStorage.setItem("doctor", JSON.stringify(response.data.doctor));
      localStorage.setItem("doctorToken", response.data.token);
      onLogin(response.data.doctor);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.suspended) {
        setError(`Account Suspended: ${error.response?.data?.reason || 'Contact admin for assistance'}`);
      } else if (error.response?.data?.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setSetupEmail(error.response.data.doctorEmail);
        setError("");
      } else {
        setError(error.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!selectedClinicId && !formData.clinicName) {
      setError("Please select a clinic or enter a new clinic name");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/doctors", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        clinicId: selectedClinicId || null,
        clinicName: formData.clinicName || null,
        experience: parseInt(formData.experience) || 0,
        qualification: formData.qualification || "MBBS",
        password: formData.password
      });

      setSuccess("Registration submitted successfully! Your application is pending admin approval. You will receive an email once approved.");
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
        specialization: "",
        clinicName: "",
        experience: "",
        qualification: ""
      });
      setSelectedClinicId("");
      
      // Switch to login after 3 seconds
      setTimeout(() => {
        setIsLogin(true);
        setSuccess("");
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/doctor/setup-password", {
        email: setupEmail,
        password: formData.password
      });
      setSuccess("Password set successfully! You can now login.");
      setNeedsPasswordSetup(false);
      setFormData({ ...formData, email: setupEmail });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clinic-auth-container">
      <div className="clinic-auth__left">
        <div className="clinic-auth__branding">
          <div className="clinic-auth__logo">
            <i className="fas fa-user-md"></i>
          </div>
          <h1>Doctor Portal</h1>
          <p>Healthcare Management System</p>
        </div>
        <div className="clinic-auth__features">
          <div className="clinic-auth__feature">
            <i className="fas fa-calendar-check"></i>
            <div>
              <h4>View Appointments</h4>
              <p>See your scheduled appointments</p>
            </div>
          </div>
          <div className="clinic-auth__feature">
            <i className="fas fa-users"></i>
            <div>
              <h4>Patient Management</h4>
              <p>Access patient records and history</p>
            </div>
          </div>
          <div className="clinic-auth__feature">
            <i className="fas fa-prescription"></i>
            <div>
              <h4>Prescriptions</h4>
              <p>Create and manage prescriptions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="clinic-auth__right">
        <div className="clinic-auth__form-container">
          <div className="clinic-auth__header">
            {onBack && (
              <button type="button" className="clinic-auth__back-btn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
            )}
            <h2>
              <i className="fas fa-user-md me-2"></i>
              {needsPasswordSetup ? "Set Up Password" : isLogin ? "Doctor Login" : "Doctor Registration"}
            </h2>
            <p>{needsPasswordSetup ? "Create your password to access the portal" : isLogin ? "Access your doctor dashboard" : "Join our network of healthcare professionals"}</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {needsPasswordSetup ? (
            <form onSubmit={handlePasswordSetup} className="clinic-auth__form">
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={setupEmail}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Create Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Setting up...</> : "Set Password"}
              </button>
              <button
                type="button"
                className="btn btn-link w-100 mt-2"
                onClick={() => setNeedsPasswordSetup(false)}
              >
                Back to Login
              </button>
            </form>
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="clinic-auth__form">
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="doctor@clinic.com"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="fas fa-lock"></i></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Logging in...</> : "Login"}
              </button>

              {/* Divider */}
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="px-3 text-muted small">or continue with</span>
                <hr className="flex-grow-1" />
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={socialLoading === 'google'}
                style={{ padding: '10px' }}
              >
                {socialLoading === 'google' ? (
                  <><span className="spinner-border spinner-border-sm"></span> Signing in...</>
                ) : (
                  <><i className="fab fa-google"></i> Sign in with Google</>
                )}
              </button>
              
              <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                <p style={{ color: '#1a202c', marginBottom: '12px' }}>New doctor? Join our network</p>
                <button
                  type="button"
                  className="btn btn-success px-4 py-2"
                  style={{ fontSize: '16px', fontWeight: '600' }}
                  onClick={() => setIsLogin(false)}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Sign Up as Doctor
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="clinic-auth__form">
              <h6 className="text-info mb-3"><i className="fas fa-user me-2"></i>Personal Information</h6>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Specialization <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Experience (years)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Qualification</label>
                <input
                  type="text"
                  className="form-control"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MD"
                />
              </div>

              <h6 className="text-info mb-3 mt-4"><i className="fas fa-hospital me-2"></i>Clinic Information</h6>
              
              <div className="mb-3">
                <label className="form-label">Select Existing Clinic</label>
                <select
                  className="form-select"
                  value={selectedClinicId}
                  onChange={(e) => {
                    setSelectedClinicId(e.target.value);
                    if (e.target.value) setFormData({ ...formData, clinicName: "" });
                  }}
                >
                  <option value="">-- Select a clinic --</option>
                  {clinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name} - {clinic.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Or Enter New Clinic Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value) setSelectedClinicId("");
                  }}
                  placeholder="New Clinic Name"
                  disabled={!!selectedClinicId}
                />
              </div>

              <h6 className="text-info mb-3 mt-4"><i className="fas fa-lock me-2"></i>Account Security</h6>

              <div className="mb-3">
                <label className="form-label">Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@example.com"
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100 py-2 mt-3" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                ) : (
                  <><i className="fas fa-user-md me-2"></i>Register as Doctor</>
                )}
              </button>

              <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                <p style={{ color: '#1a202c', marginBottom: '12px' }}>Already have an account?</p>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2"
                  style={{ fontSize: '16px', fontWeight: '600' }}
                  onClick={() => setIsLogin(true)}
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorAuth;

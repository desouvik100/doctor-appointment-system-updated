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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotLoading, setForgotLoading] = useState(false);

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

      // Store doctor with token for axios interceptor
      const doctorWithToken = { ...response.data.doctor, token: response.data.token };
      localStorage.setItem("doctor", JSON.stringify(doctorWithToken));
      localStorage.setItem("doctorToken", response.data.token);
      setSuccess(`Welcome back, Dr. ${response.data.doctor.name?.split(' ')[0]}!`);
      setTimeout(() => onLogin(doctorWithToken), 500);
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
      // Store doctor with token for axios interceptor
      const doctorWithToken = { ...response.data.doctor, token: response.data.token };
      localStorage.setItem("doctor", JSON.stringify(doctorWithToken));
      localStorage.setItem("doctorToken", response.data.token);
      onLogin(doctorWithToken);
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

    if (!agreedToTerms || !agreedToPrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy to register");
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
      setAgreedToTerms(false);
      setAgreedToPrivacy(false);
      
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

  // Forgot Password - Send OTP
  const handleForgotSendOtp = async () => {
    if (!forgotEmail) {
      setError("Please enter your email");
      return;
    }
    setForgotLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/auth/doctor/forgot-password", { email: forgotEmail });
      if (response.data.success) {
        setSuccess("OTP sent to your email!");
        setForgotStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password - Verify OTP
  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setForgotLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/auth/doctor/verify-reset-otp", { 
        email: forgotEmail, 
        otp: forgotOtp 
      });
      if (response.data.success) {
        setSuccess("OTP verified! Set your new password.");
        setForgotStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password - Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setForgotLoading(true);
    setError("");
    try {
      const response = await axios.post("/api/auth/doctor/reset-password", { 
        email: forgotEmail, 
        newPassword 
      });
      if (response.data.success) {
        setSuccess("Password reset successfully! You can now login.");
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
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

              {/* Forgot Password Link */}
              <div className="text-center mt-2">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-muted"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                    setSuccess("");
                  }}
                >
                  <i className="fas fa-key me-1"></i>
                  Forgot Password?
                </button>
              </div>

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
              
              <div className="text-center mt-4 pt-3 pb-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                <p style={{ color: '#1a202c', marginBottom: '12px' }}>New doctor? Join our network</p>
                <button
                  type="button"
                  className="btn px-4 py-2"
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    minWidth: '200px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.3)'
                  }}
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

              {/* Terms and Conditions Section */}
              <div className="mb-4 mt-4 p-3" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h6 className="text-info mb-3"><i className="fas fa-file-contract me-2"></i>Legal Agreements</h6>
                
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="termsCheckbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                  />
                  <label className="form-check-label" htmlFor="termsCheckbox">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      style={{ textDecoration: 'underline', verticalAlign: 'baseline' }}
                      onClick={() => setShowTermsModal(true)}
                    >
                      Terms of Service
                    </button>
                    <span className="text-danger"> *</span>
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="privacyCheckbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    required
                  />
                  <label className="form-check-label" htmlFor="privacyCheckbox">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      style={{ textDecoration: 'underline', verticalAlign: 'baseline' }}
                      onClick={() => setShowPrivacyModal(true)}
                    >
                      Privacy Policy
                    </button>
                    <span className="text-danger"> *</span>
                  </label>
                </div>

                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="credentialsCheckbox"
                    required
                  />
                  <label className="form-check-label" htmlFor="credentialsCheckbox">
                    I certify that all information provided is accurate and I hold valid medical credentials
                    <span className="text-danger"> *</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100 py-2 mt-3" disabled={loading || !agreedToTerms || !agreedToPrivacy}>
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

          {/* Terms Modal */}
          {showTermsModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title"><i className="fas fa-file-contract me-2"></i>Terms of Service</h5>
                    <button type="button" className="btn-close" onClick={() => setShowTermsModal(false)}></button>
                  </div>
                  <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <h6>1. Doctor Registration Agreement</h6>
                    <p>By registering as a healthcare provider on HealthSync Pro, you agree to:</p>
                    <ul>
                      <li>Provide accurate and verifiable professional credentials</li>
                      <li>Maintain valid medical licenses and certifications</li>
                      <li>Comply with all applicable healthcare regulations and laws</li>
                      <li>Provide quality healthcare services to patients</li>
                      <li>Maintain patient confidentiality and data privacy</li>
                    </ul>
                    
                    <h6>2. Platform Usage</h6>
                    <p>As a registered doctor, you agree to:</p>
                    <ul>
                      <li>Use the platform only for legitimate healthcare purposes</li>
                      <li>Respond to patient appointments in a timely manner</li>
                      <li>Keep your availability calendar updated</li>
                      <li>Not share your account credentials with others</li>
                    </ul>
                    
                    <h6>3. Fees and Payments</h6>
                    <p>Platform fees and payment terms:</p>
                    <ul>
                      <li>Platform charges a service fee on each consultation</li>
                      <li>Payments are processed securely through our payment partners</li>
                      <li>Payouts are made according to the agreed schedule</li>
                    </ul>
                    
                    <h6>4. Liability</h6>
                    <p>You acknowledge that:</p>
                    <ul>
                      <li>You are solely responsible for the medical advice you provide</li>
                      <li>HealthSync Pro is a technology platform and not a healthcare provider</li>
                      <li>You maintain appropriate professional liability insurance</li>
                    </ul>
                    
                    <h6>5. Termination</h6>
                    <p>Either party may terminate this agreement with notice. HealthSync Pro reserves the right to suspend or terminate accounts that violate these terms.</p>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowTermsModal(false)}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}>
                      <i className="fas fa-check me-2"></i>I Agree
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Modal */}
          {showPrivacyModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title"><i className="fas fa-shield-alt me-2"></i>Privacy Policy</h5>
                    <button type="button" className="btn-close" onClick={() => setShowPrivacyModal(false)}></button>
                  </div>
                  <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <h6>1. Information We Collect</h6>
                    <p>We collect the following information from healthcare providers:</p>
                    <ul>
                      <li>Personal identification (name, email, phone)</li>
                      <li>Professional credentials and qualifications</li>
                      <li>Clinic/practice information</li>
                      <li>Bank details for payment processing</li>
                    </ul>
                    
                    <h6>2. How We Use Your Information</h6>
                    <ul>
                      <li>To verify your professional credentials</li>
                      <li>To display your profile to patients</li>
                      <li>To process appointment bookings and payments</li>
                      <li>To communicate important platform updates</li>
                    </ul>
                    
                    <h6>3. Data Security</h6>
                    <p>We implement industry-standard security measures:</p>
                    <ul>
                      <li>256-bit SSL encryption</li>
                      <li>Secure data storage with encryption at rest</li>
                      <li>Regular security audits</li>
                      <li>Access controls and authentication</li>
                    </ul>
                    
                    <h6>4. Data Sharing</h6>
                    <p>Your information may be shared with:</p>
                    <ul>
                      <li>Patients who book appointments with you</li>
                      <li>Payment processors for transaction handling</li>
                      <li>Regulatory authorities when required by law</li>
                    </ul>
                    
                    <h6>5. Your Rights</h6>
                    <p>You have the right to:</p>
                    <ul>
                      <li>Access your personal data</li>
                      <li>Correct inaccurate information</li>
                      <li>Request deletion of your account</li>
                      <li>Export your data</li>
                    </ul>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPrivacyModal(false)}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={() => { setAgreedToPrivacy(true); setShowPrivacyModal(false); }}>
                      <i className="fas fa-check me-2"></i>I Agree
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="fas fa-key me-2"></i>
                      {forgotStep === 1 && "Reset Password"}
                      {forgotStep === 2 && "Verify OTP"}
                      {forgotStep === 3 && "Set New Password"}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotStep(1);
                        setForgotEmail("");
                        setForgotOtp("");
                        setNewPassword("");
                        setError("");
                        setSuccess("");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    {success && <div className="alert alert-success py-2">{success}</div>}

                    {forgotStep === 1 && (
                      <div>
                        <p className="text-muted mb-3">Enter your registered email to receive a verification code.</p>
                        <div className="mb-3">
                          <label className="form-label">Email Address</label>
                          <div className="input-group">
                            <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                            <input
                              type="email"
                              className="form-control"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="doctor@clinic.com"
                            />
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary w-100" 
                          onClick={handleForgotSendOtp}
                          disabled={forgotLoading}
                        >
                          {forgotLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                          ) : (
                            <><i className="fas fa-paper-plane me-2"></i>Send OTP</>
                          )}
                        </button>
                      </div>
                    )}

                    {forgotStep === 2 && (
                      <div>
                        <p className="text-muted mb-3">Enter the 6-digit OTP sent to {forgotEmail}</p>
                        <div className="mb-3">
                          <label className="form-label">OTP Code</label>
                          <div className="input-group">
                            <span className="input-group-text"><i className="fas fa-shield-alt"></i></span>
                            <input
                              type="text"
                              className="form-control"
                              value={forgotOtp}
                              onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="Enter 6-digit OTP"
                              maxLength={6}
                            />
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary w-100" 
                          onClick={handleForgotVerifyOtp}
                          disabled={forgotLoading}
                        >
                          {forgotLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</>
                          ) : (
                            <><i className="fas fa-check me-2"></i>Verify OTP</>
                          )}
                        </button>
                        <button 
                          className="btn btn-link w-100 mt-2" 
                          onClick={() => setForgotStep(1)}
                        >
                          <i className="fas fa-arrow-left me-1"></i>Back
                        </button>
                      </div>
                    )}

                    {forgotStep === 3 && (
                      <div>
                        <p className="text-muted mb-3">Create a new password for your account.</p>
                        <div className="mb-3">
                          <label className="form-label">New Password</label>
                          <div className="input-group">
                            <span className="input-group-text"><i className="fas fa-lock"></i></span>
                            <input
                              type={showPassword ? "text" : "password"}
                              className="form-control"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Min 6 characters"
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
                        <button 
                          className="btn btn-success w-100" 
                          onClick={handleResetPassword}
                          disabled={forgotLoading}
                        >
                          {forgotLoading ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Resetting...</>
                          ) : (
                            <><i className="fas fa-check me-2"></i>Reset Password</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorAuth;

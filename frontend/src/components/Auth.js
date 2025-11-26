import React, { useState } from "react";
import axios from "../api/config";
import "../styles/theme-system.css";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Simple notification fallback
  const addNotification = (message, type) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can add a toast notification library here if needed
  };
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    insurance: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // Real-time validation
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        if (!validateEmail(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
      case 'password':
        if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain uppercase, lowercase, and number';
        } else {
          delete errors.password;
        }
        setPasswordStrength(calculatePasswordStrength(value));
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
      case 'phone':
        if (!validatePhone(value)) {
          errors.phone = 'Please enter a valid phone number';
        } else {
          delete errors.phone;
        }
        break;
      case 'name':
        if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters long';
        } else {
          delete errors.name;
        }
        break;
      case 'dateOfBirth':
        const today = new Date();
        const birthDate = new Date(value);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13 || age > 120) {
          errors.dateOfBirth = 'Please enter a valid date of birth';
        } else {
          delete errors.dateOfBirth;
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    if (!isLogin) {
      validateField(name, value);
    }
  };

  // Send OTP for email verification
  const sendOtp = async () => {
    setOtpLoading(true);
    setError("");
    
    try {
      await axios.post("/api/auth/send-otp", { 
        email: formData.email,
        type: 'registration'
      });
      
      setOtpSent(true);
      setCanResendOtp(false);
      setOtpTimer(60); // 60 seconds countdown
      
      // Start countdown timer
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post("/api/auth/verify-otp", {
        email: formData.email,
        otp: otp,
        type: 'registration'
      });
      
      if (response.data.verified) {
        // OTP verified, now complete registration
        const registerResponse = await axios.post("/api/auth/register", {
          ...formData,
          emailVerified: true
        });
        
        localStorage.setItem("user", JSON.stringify(registerResponse.data.user));
        onLogin(registerResponse.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLogin) {
      // Login process
      try {
        const response = await axios.post("/api/auth/login", {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem("user", JSON.stringify(response.data.user));
        onLogin(response.data.user);
      } catch (error) {
        setError(error.response?.data?.message || "Invalid credentials");
      } finally {
        setLoading(false);
      }
    } else {
      // Registration process with OTP verification
      const errors = {};
      
      if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
      
      if (!agreedToTerms) {
        errors.terms = 'You must agree to the Terms of Service';
      }
      
      if (!agreedToPrivacy) {
        errors.privacy = 'You must agree to the Privacy Policy';
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }

      // Show OTP verification step
      setShowOtpVerification(true);
      setLoading(false);
      
      // Automatically send OTP
      if (!otpSent) {
        await sendOtp();
      }
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'danger';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        {!isLogin && (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                <i className="fas fa-user me-2"></i>Personal Information
              </h6>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                  {validationErrors.name && (
                    <div className="invalid-feedback">{validationErrors.name}</div>
                  )}
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Date of Birth <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${validationErrors.dateOfBirth ? 'is-invalid' : ''}`}
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                  {validationErrors.dateOfBirth && (
                    <div className="invalid-feedback">{validationErrors.dateOfBirth}</div>
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Gender <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${validationErrors.phone ? 'is-invalid' : ''}`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                  {validationErrors.phone && (
                    <div className="invalid-feedback">{validationErrors.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Account Information Section */}
        <div className="mb-4">
          {!isLogin && (
            <h6 className="text-primary mb-3">
              <i className="fas fa-lock me-2"></i>Account Security
            </h6>
          )}
          
          <div className="mb-3">
            <label className="form-label">
              Email Address <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <input
                type="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
              {validationErrors.email && (
                <div className="invalid-feedback">{validationErrors.email}</div>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">
              Password <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
              {validationErrors.password && (
                <div className="invalid-feedback">{validationErrors.password}</div>
              )}
            </div>
            
            {!isLogin && formData.password && (
              <div className="mt-2">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Password Strength:</small>
                  <small className={`text-${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </small>
                </div>
                <div className="progress" style={{ height: '4px' }}>
                  <div
                    className={`progress-bar bg-${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="mb-3">
              <label className="form-label">
                Confirm Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
                {validationErrors.confirmPassword && (
                  <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact & Medical Information */}
        {!isLogin && (
          <>
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                <i className="fas fa-phone-alt me-2"></i>Emergency Contact
              </h6>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Emergency Contact Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Full name of emergency contact"
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h6 className="text-primary mb-3">
                <i className="fas fa-notes-medical me-2"></i>Medical Information (Optional)
              </h6>
              
              <div className="mb-3">
                <label className="form-label">Insurance Provider</label>
                <input
                  type="text"
                  className="form-control"
                  name="insurance"
                  value={formData.insurance}
                  onChange={handleChange}
                  placeholder="e.g., Blue Cross Blue Shield, Aetna, etc."
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Known Allergies</label>
                <textarea
                  className="form-control"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows="2"
                  placeholder="List any known allergies (medications, food, environmental)"
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Medical History</label>
                <textarea
                  className="form-control"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief medical history, current medications, chronic conditions"
                ></textarea>
              </div>
            </div>

            {/* Terms and Privacy */}
            <div className="mb-4">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="termsCheck"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="termsCheck">
                  I agree to the <a href="#" className="text-primary">Terms of Service</a> <span className="text-danger">*</span>
                </label>
              </div>
              
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="privacyCheck"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="privacyCheck">
                  I agree to the <a href="#" className="text-primary">Privacy Policy</a> and HIPAA Notice <span className="text-danger">*</span>
                </label>
              </div>
              
              {(validationErrors.terms || validationErrors.privacy) && (
                <div className="alert alert-danger py-2">
                  {validationErrors.terms && <div>{validationErrors.terms}</div>}
                  {validationErrors.privacy && <div>{validationErrors.privacy}</div>}
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {!showOtpVerification && (
          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3"
            disabled={loading || (!isLogin && (!agreedToTerms || !agreedToPrivacy))}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} me-2`}></i>
                {isLogin ? "Sign In" : "Create Patient Account"}
              </>
            )}
          </button>
        )}
      </form>

      {/* OTP Verification Section */}
      {showOtpVerification && !isLogin && (
        <div className="mt-4">
          <div className="alert alert-info">
            <i className="fas fa-envelope me-2"></i>
            <strong>Email Verification Required</strong>
            <p className="mb-0 mt-2">
              We've sent a 6-digit verification code to <strong>{formData.email}</strong>. 
              Please check your email and enter the code below.
            </p>
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-key me-2"></i>
              Enter Verification Code
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control text-center"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                style={{ fontSize: '1.2rem', letterSpacing: '0.5rem' }}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="fas fa-check"></i>
                )}
              </button>
            </div>
            <small className="text-muted">Enter the 6-digit code sent to your email</small>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => {
                setShowOtpVerification(false);
                setOtp("");
                setOtpSent(false);
              }}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Back to Registration
            </button>

            <div className="text-end">
              {canResendOtp ? (
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={sendOtp}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-redo me-1"></i>
                      Resend Code
                    </>
                  )}
                </button>
              ) : (
                <small className="text-muted">
                  Resend in {otpTimer}s
                </small>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-success w-100"
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-shield-check me-2"></i>
                Verify & Complete Registration
              </>
            )}
          </button>

          <div className="mt-3 p-3 bg-light rounded">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              <strong>Didn't receive the code?</strong> Check your spam folder or try resending after {otpTimer > 0 ? `${otpTimer} seconds` : 'the timer expires'}.
            </small>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          className="btn btn-link"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setValidationErrors({});
            setFormData({
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
              phone: "",
              dateOfBirth: "",
              gender: "",
              emergencyContact: "",
              emergencyPhone: "",
              medicalHistory: "",
              allergies: "",
              insurance: ""
            });
          }}
        >
          {isLogin ? (
            <>
              <i className="fas fa-user-plus me-1"></i>
              Need an account? Register as Patient
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt me-1"></i>
              Already have an account? Sign In
            </>
          )}
        </button>
      </div>

      {isLogin && (
        <div className="text-center mt-2">
          <button 
            type="button" 
            className="btn btn-link btn-sm text-muted"
            onClick={() => setShowForgotPassword(true)}
          >
            <i className="fas fa-key me-1"></i>
            Forgot Password?
          </button>
        </div>
      )}

      {/* Forgot Password Modal - 3 Step Process */}
      {showForgotPassword && (
        <div className="modal show d-block" style={{background: 'rgba(0,0,0,0.5)'}} onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowForgotPassword(false);
            setResetStep(1);
            setResetEmail("");
            setResetOtp("");
            setNewPassword("");
            setConfirmNewPassword("");
            setError("");
          }
        }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{borderRadius: '20px', border: 'none'}}>
              <div className="modal-header" style={{borderBottom: '1px solid #e2e8f0'}}>
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-key text-primary me-2"></i>
                  Reset Password {resetStep > 1 && `- Step ${resetStep} of 3`}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetStep(1);
                    setResetEmail("");
                    setResetOtp("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setError("");
                  }}
                ></button>
              </div>
              <div className="modal-body p-4">
                {/* Step 1: Enter Email */}
                {resetStep === 1 && (
                  <>
                    <p className="text-muted mb-4">
                      Enter your email address and we'll send you a 6-digit OTP to reset your password.
                    </p>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        style={{borderRadius: '12px'}}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && resetEmail && !resetLoading) {
                            document.getElementById('send-otp-btn').click();
                          }
                        }}
                      />
                    </div>
                    <button
                      id="send-otp-btn"
                      className="btn btn-primary w-100 py-3"
                      style={{borderRadius: '12px', fontWeight: '600'}}
                      onClick={async () => {
                        if (!validateEmail(resetEmail)) {
                          setError("Please enter a valid email address");
                          return;
                        }
                        setResetLoading(true);
                        setError("");
                        try {
                          const response = await axios.post('/api/otp/send-otp', {
                            email: resetEmail,
                            type: 'password-reset'
                          });
                          
                          if (response.data.success) {
                            setResetStep(2);
                            addNotification('OTP sent to your email!', 'success');
                          } else {
                            setError(response.data.message || "Failed to send OTP");
                          }
                        } catch (err) {
                          console.error("Send OTP error:", err);
                          const errorMessage = err.response?.data?.message || 
                                             err.response?.data?.error ||
                                             "Failed to send OTP. Please try again.";
                          setError(errorMessage);
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                      disabled={resetLoading || !resetEmail}
                    >
                      {resetLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send OTP
                        </>
                      )}
                    </button>
                    {error && (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: Verify OTP */}
                {resetStep === 2 && (
                  <>
                    <div className="text-center mb-4">
                      <i className="fas fa-envelope-open-text text-primary" style={{fontSize: '3rem'}}></i>
                      <p className="text-muted mt-3 mb-2">
                        We've sent a 6-digit OTP to<br/>
                        <strong>{resetEmail}</strong>
                      </p>
                      <small className="text-muted">Check your inbox and spam folder</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Enter OTP</label>
                      <input
                        type="text"
                        className="form-control form-control-lg text-center"
                        placeholder="000000"
                        value={resetOtp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setResetOtp(value);
                        }}
                        style={{borderRadius: '12px', fontSize: '1.5rem', letterSpacing: '0.5rem'}}
                        maxLength={6}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && resetOtp.length === 6 && !resetLoading) {
                            document.getElementById('verify-otp-btn').click();
                          }
                        }}
                      />
                      <small className="text-muted">OTP is valid for 10 minutes</small>
                    </div>
                    <button
                      id="verify-otp-btn"
                      className="btn btn-primary w-100 py-3 mb-2"
                      style={{borderRadius: '12px', fontWeight: '600'}}
                      onClick={async () => {
                        if (resetOtp.length !== 6) {
                          setError("Please enter a valid 6-digit OTP");
                          return;
                        }
                        setResetLoading(true);
                        setError("");
                        try {
                          const response = await axios.post('/api/otp/verify-otp', {
                            email: resetEmail,
                            otp: resetOtp,
                            type: 'password-reset'
                          });
                          
                          if (response.data.success && response.data.verified) {
                            setResetStep(3);
                            addNotification('OTP verified successfully!', 'success');
                          } else {
                            setError(response.data.message || "Invalid OTP");
                          }
                        } catch (err) {
                          console.error("Verify OTP error:", err);
                          setError(err.response?.data?.message || "Invalid or expired OTP");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                      disabled={resetLoading || resetOtp.length !== 6}
                    >
                      {resetLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle me-2"></i>
                          Verify OTP
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={async () => {
                        setResetLoading(true);
                        setError("");
                        try {
                          await axios.post('/api/otp/send-otp', {
                            email: resetEmail,
                            type: 'password-reset'
                          });
                          setResetOtp("");
                          addNotification('New OTP sent!', 'info');
                        } catch (err) {
                          setError("Failed to resend OTP");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                      disabled={resetLoading}
                    >
                      <i className="fas fa-redo me-2"></i>
                      Resend OTP
                    </button>
                    {error && (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                      </div>
                    )}
                  </>
                )}

                {/* Step 3: Set New Password */}
                {resetStep === 3 && (
                  <>
                    <div className="text-center mb-4">
                      <i className="fas fa-lock text-success" style={{fontSize: '3rem'}}></i>
                      <p className="text-muted mt-3">
                        Create a strong new password for your account
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">New Password</label>
                      <div className="input-group">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="form-control form-control-lg"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{borderRadius: '12px 0 0 12px'}}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{borderRadius: '0 12px 12px 0'}}
                        >
                          <i className={`fas fa-eye${showNewPassword ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                      <small className="text-muted">Minimum 6 characters</small>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Confirm New Password</label>
                      <div className="input-group">
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          className="form-control form-control-lg"
                          placeholder="Confirm new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          style={{borderRadius: '12px 0 0 12px'}}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newPassword && confirmNewPassword && !resetLoading) {
                              document.getElementById('reset-password-btn').click();
                            }
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          style={{borderRadius: '0 12px 12px 0'}}
                        >
                          <i className={`fas fa-eye${showConfirmNewPassword ? '-slash' : ''}`}></i>
                        </button>
                      </div>
                    </div>
                    <button
                      id="reset-password-btn"
                      className="btn btn-success w-100 py-3"
                      style={{borderRadius: '12px', fontWeight: '600'}}
                      onClick={async () => {
                        if (newPassword.length < 6) {
                          setError("Password must be at least 6 characters");
                          return;
                        }
                        if (newPassword !== confirmNewPassword) {
                          setError("Passwords do not match");
                          return;
                        }
                        setResetLoading(true);
                        setError("");
                        try {
                          const response = await axios.post('/api/auth/reset-password', {
                            email: resetEmail,
                            newPassword: newPassword
                          });
                          
                          if (response.data.success) {
                            addNotification('Password reset successfully! Please login.', 'success');
                            setShowForgotPassword(false);
                            setResetStep(1);
                            setResetEmail("");
                            setResetOtp("");
                            setNewPassword("");
                            setConfirmNewPassword("");
                          } else {
                            setError(response.data.message || "Failed to reset password");
                          }
                        } catch (err) {
                          console.error("Reset password error:", err);
                          setError(err.response?.data?.message || "Failed to reset password");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                      disabled={resetLoading || !newPassword || !confirmNewPassword}
                    >
                      {resetLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Reset Password
                        </>
                      )}
                    </button>
                    {error && (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 p-3 bg-light rounded">
        <small className="text-muted">
          <i className="fas fa-shield-alt me-1 text-success"></i>
          <strong>Your privacy is protected:</strong> All medical information is encrypted and HIPAA compliant.
        </small>
      </div>
    </div>
  );
}

export default Auth;

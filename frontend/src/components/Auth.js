import React, { useState } from "react";
import axios from "../api/config";
import LocationSetupModal from './LocationSetupModal';
import { checkLocationStatus } from '../utils/locationService';
import toast from 'react-hot-toast';
import './Auth.css';
import './PatientAuth.css';

function Auth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
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
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);

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
      const response = await axios.post("/api/otp/send-otp", { 
        email: formData.email,
        type: 'registration'
      });
      
      if (response.data.success) {
        // Auto-fill OTP in development mode
        if (response.data.otp) {
          setOtp(response.data.otp);
          toast.success('OTP received (development mode)');
        }
        
        setOtpSent(true);
        setCanResendOtp(false);
        setOtpTimer(60);
        
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
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      const otpResponse = await axios.post("/api/otp/verify-otp", {
        email: formData.email,
        otp: otp,
        type: 'registration'
      });
      
      if (otpResponse.data.success && otpResponse.data.verified) {
        const registerResponse = await axios.post("/api/auth/register", {
          ...formData,
          emailVerified: true
        });
        
        if (registerResponse.data.user) {
          const user = registerResponse.data.user;
          
          // Store token if provided
          if (registerResponse.data.token) {
            localStorage.setItem("token", registerResponse.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${registerResponse.data.token}`;
          }
          
          // New registration - always show location setup
          setLoggedInUserId(user.id || user._id);
          setPendingUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          setShowOtpVerification(false);
          setShowLocationSetup(true);
        }
      } else {
        setError(otpResponse.data.message || "Invalid OTP");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle location setup complete (mandatory for first-time users)
  const handleLocationComplete = (location) => {
    setShowLocationSetup(false);
    
    // Now complete the login with the pending user
    if (pendingUser) {
      // Update user in localStorage with location captured flag
      const updatedUser = { ...pendingUser, locationCaptured: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onLogin(updatedUser);
      setPendingUser(null);
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
        
        // Store token and user data together
        const user = {
          ...response.data.user,
          token: response.data.token
        };
        
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        }
        
        setLoggedInUserId(user.id);
        setLoading(false);
        
        // Check if user needs location setup (first-time login)
        const locationStatus = await checkLocationStatus(user.id);
        
        if (locationStatus.needsLocationSetup) {
          // Store user temporarily and show location setup modal
          setPendingUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          setShowLocationSetup(true);
        } else {
          // Location already captured, proceed to dashboard
          localStorage.setItem("user", JSON.stringify(user));
          onLogin(user);
        }
      } catch (error) {
        setError(error.response?.data?.message || "Invalid credentials");
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

      // Show OTP verification
      setShowOtpVerification(true);
      setLoading(false);
      
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

  // Handle forgot password - Send OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/forgot-password", {
        email: resetEmail
      });

      if (response.data.success) {
        toast.success("Password reset code sent to your email!");
        // Show OTP verification for password reset
        setShowOtpVerification(true);
        setOtpSent(true);
        setFormData({ ...formData, email: resetEmail });
        
        // Auto-fill OTP in development mode
        if (response.data.otp) {
          console.log('🔐 Development Mode - OTP:', response.data.otp);
          setOtp(response.data.otp);
          toast.success(`Dev Mode: OTP is ${response.data.otp}`, { duration: 5000 });
        }
      } else {
        setError(response.data.message || "Failed to send reset code");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send reset code. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Handle password reset with OTP
  const handleResetPasswordWithOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/reset-password", {
        email: resetEmail || formData.email,
        otp: otp,
        newPassword: formData.password
      });

      if (response.data.success) {
        toast.success("Password reset successfully! You can now login.");
        // Reset all states
        setShowOtpVerification(false);
        setShowForgotPassword(false);
        setOtpSent(false);
        setOtp("");
        setResetEmail("");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          dateOfBirth: "",
          gender: "",
        });
        setIsLogin(true);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-auth-container">
      {/* Left Side - Branding */}
      <div className="patient-auth__left">
        <div className="patient-auth__branding">
          <div className="patient-auth__logo">
            <i className="fas fa-heart"></i>
          </div>
          <h1>HealthSync Patient</h1>
          <p>Your Personal Health Portal</p>
        </div>

        <div className="patient-auth__benefits">
          <div className="patient-auth__benefit">
            <i className="fas fa-calendar-check"></i>
            <div>
              <h4>Easy Booking</h4>
              <p>Schedule appointments with just a few clicks</p>
            </div>
          </div>
          <div className="patient-auth__benefit">
            <i className="fas fa-video"></i>
            <div>
              <h4>Online Consultations</h4>
              <p>Connect with doctors via secure video calls</p>
            </div>
          </div>
          <div className="patient-auth__benefit">
            <i className="fas fa-file-medical"></i>
            <div>
              <h4>Medical Records</h4>
              <p>Access your health history anytime, anywhere</p>
            </div>
          </div>
        </div>

        <div className="patient-auth__footer-left">
          <p>
            <i className="fas fa-shield-alt"></i>
            Your health data is encrypted and HIPAA compliant
          </p>
        </div>
      </div>

      {/* Right Side - Login/Register Form */}
      <div className="patient-auth__right">
        <div className="patient-auth__form-container">
          {/* Header */}
          <div className="patient-auth__header">
            <button 
              className="patient-auth__back-btn"
              onClick={onBack || (() => window.history.back())}
              type="button"
              title="Back to home"
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <h2>
              {isLogin ? (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Welcome Back
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Your Account
                </>
              )}
            </h2>
            <p>
              {isLogin 
                ? "Sign in to access your health portal" 
                : "Join thousands of patients managing their health"}
            </p>
          </div>

          {/* Form */}
          {!showOtpVerification ? (
            <form onSubmit={handleSubmit} className="patient-auth__form">
              {/* Email Field */}
              <div className="patient-auth__form-group">
                <label className="patient-auth__label">
                  <i className="fas fa-envelope"></i>
                  Email Address
                </label>
                <input
                  type="email"
                  className="patient-auth__input"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
                {validationErrors.email && (
                  <div className="patient-auth__error">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="patient-auth__form-group">
                <label className="patient-auth__label">
                  <i className="fas fa-lock"></i>
                  Password
                </label>
                <div className="patient-auth__password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="patient-auth__input"
                    name="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="patient-auth__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas fa-eye${showPassword ? "-slash" : ""}`}></i>
                  </button>
                </div>
                {validationErrors.password && (
                  <div className="patient-auth__error">
                    <i className="fas fa-exclamation-circle"></i>
                    {validationErrors.password}
                  </div>
                )}
              </div>

              {/* Registration Fields */}
              {!isLogin && (
                <>
                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-user"></i>
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="patient-auth__input"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      disabled={loading}
                    />
                    {validationErrors.name && (
                      <div className="patient-auth__error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-phone"></i>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="patient-auth__input"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      required
                      disabled={loading}
                    />
                    {validationErrors.phone && (
                      <div className="patient-auth__error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.phone}
                      </div>
                    )}
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-calendar"></i>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      className="patient-auth__input"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    {validationErrors.dateOfBirth && (
                      <div className="patient-auth__error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.dateOfBirth}
                      </div>
                    )}
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-venus-mars"></i>
                      Gender
                    </label>
                    <select
                      className="patient-auth__input"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-check-circle"></i>
                      Confirm Password
                    </label>
                    <div className="patient-auth__password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="patient-auth__input"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="patient-auth__password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`fas fa-eye${showConfirmPassword ? "-slash" : ""}`}></i>
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <div className="patient-auth__error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <div className="patient-auth__form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={loading}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#718096' }}>
                        I agree to the Terms of Service
                      </span>
                    </label>
                  </div>

                  <div className="patient-auth__form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={agreedToPrivacy}
                        onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                        disabled={loading}
                      />
                      <span style={{ fontSize: '0.9rem', color: '#718096' }}>
                        I agree to the Privacy Policy
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="patient-auth__error">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="patient-auth__submit-btn"
                disabled={loading || (!isLogin && (!agreedToTerms || !agreedToPrivacy))}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    <i className={`fas fa-${isLogin ? "sign-in-alt" : "user-plus"}`}></i>
                    {isLogin ? "Sign In" : "Create Patient Account"}
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="patient-auth__security-notice">
                <i className="fas fa-lock"></i>
                <p>Your data is encrypted and HIPAA compliant</p>
              </div>
            </form>
          ) : (
            // OTP Verification
            <div style={{ marginTop: '24px' }}>
              <div style={{ padding: '12px 16px', background: '#dbeafe', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                  <i className="fas fa-envelope"></i> We've sent a verification code to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="patient-auth__form-group">
                <label className="patient-auth__label">
                  <i className="fas fa-key"></i>
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  className="patient-auth__input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  style={{ fontSize: '1.2rem', letterSpacing: '0.5rem', textAlign: 'center' }}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="patient-auth__error">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="patient-auth__submit-btn"
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Verify Code
                  </>
                )}
              </button>

              {canResendOtp ? (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px',
                    background: 'transparent',
                    border: '2px solid #3b82f6',
                    color: '#3b82f6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  onClick={sendOtp}
                  disabled={otpLoading}
                >
                  Resend Code
                </button>
              ) : (
                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#718096' }}>
                  Resend code in {otpTimer}s
                </p>
              )}
            </div>
          )}

          {/* Toggle Mode */}
          {!showOtpVerification && (
            <div className="patient-auth__toggle-mode">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                type="button"
                className="patient-auth__toggle-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setValidationErrors({});
                }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          )}

          {/* Forgot Password Link */}
          {isLogin && !showOtpVerification && (
            <div className="patient-auth__forgot-password">
              <button
                type="button"
                className="patient-auth__forgot-password-btn"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Form Footer */}
          <div className="patient-auth__form-footer">
            <p>
              <i className="fas fa-shield-alt"></i>
              Secured with enterprise-grade encryption
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a202c' }}>
                <i className="fas fa-key" style={{ marginRight: '8px' }}></i>
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setError("");
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#718096', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {!showOtpVerification 
                ? "Enter your email address and we'll send you a verification code to reset your password."
                : "Enter the verification code sent to your email and your new password."
              }
            </p>

            <form onSubmit={showOtpVerification ? handleResetPasswordWithOtp : handleForgotPassword}>
              {!showOtpVerification && (
                <div className="patient-auth__form-group">
                  <label className="patient-auth__label">
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="patient-auth__input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    disabled={resetLoading}
                  />
                </div>
              )}

              {showOtpVerification && (
                <>
                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-shield-alt"></i>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      className="patient-auth__input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                      required
                      disabled={loading}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      style={{ letterSpacing: '0.5em', fontSize: '1.2rem', textAlign: 'center' }}
                    />
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-lock"></i>
                      New Password
                    </label>
                    <input
                      type="password"
                      className="patient-auth__input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter new password"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="patient-auth__form-group">
                    <label className="patient-auth__label">
                      <i className="fas fa-lock"></i>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="patient-auth__input"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="patient-auth__error" style={{ marginBottom: '1rem' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (showOtpVerification) {
                      // Go back to email input
                      setShowOtpVerification(false);
                      setOtpSent(false);
                      setOtp("");
                      setError("");
                    } else {
                      // Close modal
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setError("");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: '#f0f4f8',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#718096',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f0f4f8';
                  }}
                  disabled={resetLoading || loading}
                >
                  {showOtpVerification ? 'Back' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    opacity: resetLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!resetLoading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                  disabled={resetLoading || loading}
                >
                  {(resetLoading || loading) ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {' '}{showOtpVerification ? 'Resetting...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <i className={showOtpVerification ? "fas fa-check" : "fas fa-paper-plane"}></i>
                      {' '}{showOtpVerification ? 'Reset Password' : 'Send Code'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Location Setup Modal for First-Time Users */}
      {showLocationSetup && (
        <LocationSetupModal
          userId={loggedInUserId}
          userName={pendingUser?.name}
          onComplete={handleLocationComplete}
          onBackToHome={() => {
            // Clear pending user and go back to home
            setShowLocationSetup(false);
            setPendingUser(null);
            setLoggedInUserId(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            if (onBack) onBack();
          }}
        />
      )}
    </div>
  );
}

export default Auth;

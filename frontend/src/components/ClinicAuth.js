import React, { useState } from "react";
import axios from "../api/config";
import "../styles/theme-system.css";
import "./ClinicAuth.css";

function ClinicAuth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    licenseNumber: "",
    npiNumber: "",
    specialization: "",
    yearsExperience: "",
    position: "",
    workSchedule: "",
    emergencyContact: "",
    emergencyPhone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [verifiedCredentials, setVerifiedCredentials] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [forgotLoading, setForgotLoading] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateNPI = (npi) => {
    // NPI is 10 digits
    const npiRegex = /^\d{10}$/;
    return npiRegex.test(npi);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

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
      case 'clinicPhone':
      case 'emergencyPhone':
        if (value && !validatePhone(value)) {
          errors[name] = 'Please enter a valid phone number';
        } else {
          delete errors[name];
        }
        break;
      case 'npiNumber':
        if (value && !validateNPI(value)) {
          errors.npiNumber = 'NPI must be exactly 10 digits';
        } else {
          delete errors.npiNumber;
        }
        break;
      case 'name':
        if (value.length < 2) {
          errors.name = 'Name must be at least 2 characters long';
        } else {
          delete errors.name;
        }
        break;
      case 'clinicName':
        if (value.length < 2) {
          errors.clinicName = 'Clinic name must be at least 2 characters long';
        } else {
          delete errors.clinicName;
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

    // Real-time validation for registration
    if (!isLogin) {
      validateField(name, value);
    }
  };

  // Send OTP for email verification
  const sendOtp = async () => {
    setOtpLoading(true);
    setError("");
    
    try {
      await axios.post("/api/otp/send-otp", { 
        email: formData.email,
        type: 'staff-registration'
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

  // Forgot Password - Send OTP
  const handleForgotSendOtp = async () => {
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setForgotLoading(true);
    setError("");
    
    try {
      await axios.post("/api/otp/send-otp", {
        email: forgotEmail,
        type: 'password-reset'
      });
      setForgotStep(2);
      setSuccess("OTP sent to your email");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP");
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
      const response = await axios.post("/api/otp/verify-otp", {
        email: forgotEmail,
        otp: forgotOtp,
        type: 'password-reset'
      });
      
      if (response.data.verified) {
        setForgotStep(3);
        setSuccess("OTP verified. Please set your new password.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
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
    
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setForgotLoading(true);
    setError("");
    
    try {
      // Use the receptionist-specific reset endpoint
      const response = await axios.post("/api/receptionists/reset-password", {
        email: forgotEmail.toLowerCase().trim(),
        newPassword: newPassword
      });
      
      console.log('Password reset response:', response.data);
      
      if (response.data.success) {
        setSuccess("Password reset successfully! You can now login with your new password.");
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error('Password reset error:', error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post("/api/otp/verify-otp", {
        email: formData.email,
        otp: otp,
        type: 'staff-registration'
      });
      
      if (response.data.verified) {
        // OTP verified, now complete registration
        const registerResponse = await axios.post("/api/auth/receptionist/register", {
          ...formData,
          emailVerified: true
        });
        
        setSuccess("Registration submitted successfully! Your email has been verified. Please wait for admin approval. You will receive an email confirmation within 24-48 hours.");
        
        // Reset form and OTP state
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          clinicName: "",
          clinicAddress: "",
          clinicPhone: "",
          licenseNumber: "",
          npiNumber: "",
          specialization: "",
          yearsExperience: "",
          position: "",
          workSchedule: "",
          emergencyContact: "",
          emergencyPhone: ""
        });
        setAgreedToTerms(false);
        setAgreedToPrivacy(false);
        setVerifiedCredentials(false);
        setShowOtpVerification(false);
        setOtp("");
        setOtpSent(false);
        
        // Switch back to login after successful registration
        setTimeout(() => {
          setIsLogin(true);
          setSuccess("");
        }, 5000);
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
    setSuccess("");

    // Validation for registration
    if (!isLogin) {
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

      if (!validatePhone(formData.clinicPhone)) {
        errors.clinicPhone = 'Please enter a valid clinic phone number';
      }

      if (formData.npiNumber && !validateNPI(formData.npiNumber)) {
        errors.npiNumber = 'NPI must be exactly 10 digits';
      }

      if (!agreedToTerms) {
        errors.terms = 'You must agree to the Terms of Service';
      }

      if (!agreedToPrivacy) {
        errors.privacy = 'You must agree to the Privacy Policy';
      }

      if (!verifiedCredentials) {
        errors.credentials = 'You must verify your professional credentials';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Login existing receptionist
        const response = await axios.post("/api/auth/clinic/login", {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem("receptionist", JSON.stringify(response.data.user));
        onLogin(response.data.user);
      } else {
        // Show OTP verification step instead of direct registration
        setShowOtpVerification(true);
        setLoading(false);
        
        // Automatically send OTP
        if (!otpSent) {
          await sendOtp();
        }
        return;
      }
    } catch (error) {
      setError(error.response?.data?.message || (isLogin ? "Invalid staff credentials" : "Registration failed"));
    } finally {
      setLoading(false);
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

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess("");
    setValidationErrors({});
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      clinicName: "",
      clinicAddress: "",
      clinicPhone: "",
      licenseNumber: "",
      npiNumber: "",
      specialization: "",
      yearsExperience: "",
      position: "",
      workSchedule: "",
      emergencyContact: "",
      emergencyPhone: ""
    });
    setAgreedToTerms(false);
    setAgreedToPrivacy(false);
    setVerifiedCredentials(false);
  };

  return (
    <div className="clinic-auth-container">
      <div className="clinic-auth__left">
        <div className="clinic-auth__branding">
          <div className="clinic-auth__logo">
            <i className="fas fa-hospital-user"></i>
          </div>
          <h1>Staff Portal</h1>
          <p>Healthcare Management System</p>
        </div>
        <div className="clinic-auth__features">
          <div className="clinic-auth__feature">
            <i className="fas fa-calendar-check"></i>
            <div>
              <h4>Appointment Management</h4>
              <p>Manage patient appointments efficiently</p>
            </div>
          </div>
          <div className="clinic-auth__feature">
            <i className="fas fa-users"></i>
            <div>
              <h4>Patient Records</h4>
              <p>Access and update patient information</p>
            </div>
          </div>
          <div className="clinic-auth__feature">
            <i className="fas fa-chart-line"></i>
            <div>
              <h4>Analytics Dashboard</h4>
              <p>Track clinic performance metrics</p>
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
              <i className="fas fa-hospital-user me-2"></i>
              {isLogin ? 'Staff Login' : 'Staff Registration'}
            </h2>
            <p>{isLogin ? 'Access your clinic dashboard' : 'Apply for a staff position'}</p>
          </div>

      <form onSubmit={handleSubmit} className="clinic-auth__form">
        {/* Personal Information Section */}
        {!isLogin && (
          <>
            <div className="mb-4">
              <h6 className="text-info mb-3">
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
                    Position <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Position</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="medical-assistant">Medical Assistant</option>
                    <option value="nurse">Nurse</option>
                    <option value="office-manager">Office Manager</option>
                    <option value="billing-specialist">Billing Specialist</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="row">
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

                <div className="col-md-6 mb-3">
                  <label className="form-label">Years of Experience</label>
                  <select
                    className="form-select"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                  >
                    <option value="">Select Experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-15">11-15 years</option>
                    <option value="16+">16+ years</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Account Security Section */}
        <div className="mb-4">
          {!isLogin && (
            <h6 className="text-info mb-3">
              <i className="fas fa-lock me-2"></i>Account Security
            </h6>
          )}

          <div className="mb-3">
            <label className="form-label">
              Work Email Address <span className="text-danger">*</span>
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
                placeholder={isLogin ? "staff@clinic.com" : "your.email@clinic.com"}
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

        {/* Clinic Information Section */}
        {!isLogin && (
          <>
            <div className="mb-4">
              <h6 className="text-info mb-3">
                <i className="fas fa-clinic-medical me-2"></i>Clinic Information
              </h6>

              <div className="mb-3">
                <label className="form-label">
                  Clinic Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.clinicName ? 'is-invalid' : ''}`}
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="Enter clinic name"
                  required
                />
                {validationErrors.clinicName && (
                  <div className="invalid-feedback">{validationErrors.clinicName}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Clinic Address <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  name="clinicAddress"
                  value={formData.clinicAddress}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Full clinic address including city, state, and ZIP"
                  required
                ></textarea>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Clinic Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${validationErrors.clinicPhone ? 'is-invalid' : ''}`}
                    name="clinicPhone"
                    value={formData.clinicPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 987-6543"
                    required
                  />
                  {validationErrors.clinicPhone && (
                    <div className="invalid-feedback">{validationErrors.clinicPhone}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                  >
                    <option value="">Select Specialization</option>
                    <option value="family-medicine">Family Medicine</option>
                    <option value="internal-medicine">Internal Medicine</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="psychiatry">Psychiatry</option>
                    <option value="urgent-care">Urgent Care</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Credentials Section */}
            <div className="mb-4">
              <h6 className="text-info mb-3">
                <i className="fas fa-certificate me-2"></i>Professional Credentials
              </h6>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">License Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="Professional license number"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">NPI Number</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.npiNumber ? 'is-invalid' : ''}`}
                    name="npiNumber"
                    value={formData.npiNumber}
                    onChange={handleChange}
                    placeholder="10-digit NPI number"
                  />
                  {validationErrors.npiNumber && (
                    <div className="invalid-feedback">{validationErrors.npiNumber}</div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Work Schedule</label>
                <textarea
                  className="form-control"
                  name="workSchedule"
                  value={formData.workSchedule}
                  onChange={handleChange}
                  rows="2"
                  placeholder="e.g., Monday-Friday 8:00 AM - 5:00 PM, Saturday 9:00 AM - 1:00 PM"
                ></textarea>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="mb-4">
              <h6 className="text-info mb-3">
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
                    className={`form-control ${validationErrors.emergencyPhone ? 'is-invalid' : ''}`}
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                  {validationErrors.emergencyPhone && (
                    <div className="invalid-feedback">{validationErrors.emergencyPhone}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification and Terms */}
            <div className="mb-4">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="credentialsCheck"
                  checked={verifiedCredentials}
                  onChange={(e) => setVerifiedCredentials(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="credentialsCheck">
                  I certify that all professional credentials and information provided are accurate and current <span className="text-danger">*</span>
                </label>
              </div>

              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="termsCheck"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="termsCheck">
                  I agree to the <a href="#" className="text-info">Terms of Service</a> <span className="text-danger">*</span>
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
                  I agree to the <a href="#" className="text-info">Privacy Policy</a> and HIPAA Compliance <span className="text-danger">*</span>
                </label>
              </div>

              {(validationErrors.terms || validationErrors.privacy || validationErrors.credentials) && (
                <div className="alert alert-danger py-2">
                  {validationErrors.credentials && <div>{validationErrors.credentials}</div>}
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

        {success && (
          <div className="alert alert-success" role="alert">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </div>
        )}

        {!showOtpVerification && (
          <button
            type="submit"
            className="btn btn-info w-100"
            disabled={loading || (!isLogin && (!agreedToTerms || !agreedToPrivacy || !verifiedCredentials))}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                {isLogin ? "Signing in..." : "Submitting application..."}
              </>
            ) : (
              <>
                <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} me-2`}></i>
                {isLogin ? "Staff Login" : "Apply for Staff Position"}
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
              Please check your email and enter the code below to verify your professional email address.
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
                className="btn btn-outline-info"
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
            <small className="text-muted">Enter the 6-digit code sent to your professional email</small>
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
              Back to Application
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
                Verifying & Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-shield-check me-2"></i>
                Verify Email & Submit Application
              </>
            )}
          </button>

          <div className="mt-3 p-3 bg-light rounded">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              <strong>Professional Verification:</strong> Email verification is required for all healthcare staff applications. 
              Check your spam folder if you don't see the code within a few minutes.
            </small>
          </div>
        </div>
      )}

      <div className="mt-3 text-center">
        <button
          type="button"
          className="btn btn-link text-info p-0"
          onClick={toggleMode}
        >
          {isLogin ? (
            <>
              <i className="fas fa-user-plus me-1"></i>
              New staff member? Apply here
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
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="clinic-auth__modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="clinic-auth__modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-auth__modal-header">
              <h4><i className="fas fa-key"></i> Reset Password</h4>
              <button 
                className="clinic-auth__modal-close"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotStep(1);
                  setForgotEmail("");
                  setForgotOtp("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setError("");
                  setSuccess("");
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="clinic-auth__modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              {/* Step 1: Enter Email */}
              {forgotStep === 1 && (
                <div>
                  <p className="text-muted mb-3">Enter your registered email address to receive a verification code.</p>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleForgotSendOtp}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : "Send OTP"}
                  </button>
                </div>
              )}
              
              {/* Step 2: Enter OTP */}
              {forgotStep === 2 && (
                <div>
                  <p className="text-muted mb-3">Enter the 6-digit code sent to {forgotEmail}</p>
                  <div className="mb-3">
                    <label className="form-label">Verification Code</label>
                    <input
                      type="text"
                      className="form-control text-center"
                      placeholder="000000"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '0.5em', fontSize: '1.25rem' }}
                    />
                  </div>
                  <button 
                    className="btn btn-primary w-100"
                    onClick={handleForgotVerifyOtp}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : "Verify OTP"}
                  </button>
                  <button 
                    className="btn btn-link w-100 mt-2"
                    onClick={() => setForgotStep(1)}
                  >
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                </div>
              )}
              
              {/* Step 3: New Password */}
              {forgotStep === 3 && (
                <div>
                  <p className="text-muted mb-3">Create a new password for your account.</p>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    className="btn btn-success w-100"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : "Reset Password"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="clinic-auth__security-notice">
        <i className="fas fa-shield-alt"></i>
        <p>
          <strong>Secure & Compliant:</strong> {isLogin ? "Staff access with role-based permissions" : "All applications are reviewed within 24-48 hours."}
        </p>
      </div>
        </div>
      </div>
    </div>
  );
}

export default ClinicAuth;
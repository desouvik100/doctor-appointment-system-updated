import React, { useState, useEffect } from "react";
import axios from "../api/config";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const Input = ({ icon, rightEl, error, ...props }) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none z-10">
        <i className={`fas fa-${icon}`}></i>
      </span>
    )}
    <input
      {...props}
      className={[
        "w-full h-12 rounded-xl border bg-slate-50 text-slate-800 text-sm transition-all duration-200",
        "focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500",
        "placeholder:text-slate-400",
        icon ? "pl-10" : "px-4",
        rightEl ? "pr-12" : "pr-4",
        error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"
      ].join(" ")}
    />
    {rightEl && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10">{rightEl}</span>
    )}
  </div>
);

const SelectField = ({ error, children, ...props }) => (
  <select
    {...props}
    className={[
      "w-full h-12 rounded-xl border bg-slate-50 text-slate-800 text-sm px-4 transition-all duration-200",
      "focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500",
      error ? "border-red-400" : "border-slate-200 hover:border-slate-300"
    ].join(" ")}
  >
    {children}
  </select>
);

const SectionHeading = ({ icon, children }) => (
  <h6 className="flex items-center gap-2 text-sm font-semibold text-sky-600 mb-4 pb-2 border-b border-slate-100">
    <i className={`fas fa-${icon} text-sky-500`}></i>
    {children}
  </h6>
);

function ClinicAuth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", clinicName: "", clinicAddress: "", clinicPhone: "",
    licenseNumber: "", npiNumber: "", specialization: "",
    yearsExperience: "", position: "", workSchedule: "",
    emergencyContact: "", emergencyPhone: ""
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  useEffect(() => {
    if (!document.getElementById('google-signin-script')) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  const validateNPI = (npi) => /^\d{10}$/.test(npi);
  const calcStrength = (p) => [p.length >= 8, /[a-z]/.test(p), /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  const getStrengthColor = () => passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500';
  const getStrengthText = () => passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';
  const getStrengthTextColor = () => passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600';

  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    switch (name) {
      case 'email': !validateEmail(value) ? errors.email = 'Invalid email' : delete errors.email; break;
      case 'password':
        if (value.length < 8) errors.password = 'At least 8 characters required';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) errors.password = 'Must contain uppercase, lowercase, and number';
        else delete errors.password;
        setPasswordStrength(calcStrength(value));
        break;
      case 'confirmPassword': value !== formData.password ? errors.confirmPassword = 'Passwords do not match' : delete errors.confirmPassword; break;
      case 'phone': case 'clinicPhone': case 'emergencyPhone':
        value && !validatePhone(value) ? errors[name] = 'Invalid phone number' : delete errors[name]; break;
      case 'npiNumber': value && !validateNPI(value) ? errors.npiNumber = 'NPI must be 10 digits' : delete errors.npiNumber; break;
      default: break;
    }
    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (!isLogin) validateField(name, value);
  };

  const resetForm = () => {
    setFormData({ name:"",email:"",password:"",confirmPassword:"",phone:"",clinicName:"",clinicAddress:"",clinicPhone:"",licenseNumber:"",npiNumber:"",specialization:"",yearsExperience:"",position:"",workSchedule:"",emergencyContact:"",emergencyPhone:"" });
    setAgreedToTerms(false); setAgreedToPrivacy(false); setVerifiedCredentials(false);
    setValidationErrors({}); setError(""); setSuccess("");
  };

  const toggleMode = () => { setIsLogin(!isLogin); resetForm(); };

  const sendOtp = async () => {
    setOtpLoading(true); setError(""); setSuccess("");
    setOtpSent(false); // reset so stale state never bypasses validation
    try {
      const res = await axios.post("/api/otp/send-otp", 
        { email: formData.email.toLowerCase().trim(), type: 'staff-registration' },
        { timeout: 15000 } // 15s timeout — never hang forever
      );
      setOtpSent(true); setCanResendOtp(false); setOtpTimer(60); setOtp("");
      setError("");
      // Backend returns OTP directly when email may not work — show it as fallback
      if (res.data?.otp) {
        setSuccess(`OTP sent to your email. If not received, use: ${res.data.otp}`);
      } else {
        setSuccess("OTP sent to your email.");
      }
      const timer = setInterval(() => setOtpTimer(p => { if (p <= 1) { clearInterval(timer); setCanResendOtp(true); return 0; } return p - 1; }), 1000);
    } catch (e) { 
      const data = e.response?.data;
      setSuccess("");
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setError("Request timed out. Please check your connection and try again.");
      } else if (data?.pending) {
        setError('⏳ ' + (data?.message || 'Your registration is already submitted and pending admin approval.'));
      } else if (data?.alreadyActive) {
        setError('ℹ️ ' + (data?.message || 'Account already exists. Please sign in instead.'));
        setTimeout(() => setIsLogin(true), 2000);
      } else if (data?.rejected) {
        setError('❌ ' + (data?.message || 'Your previous registration was rejected. Contact admin.'));
      } else {
        setError(data?.message || "Failed to send OTP. Please try again.");
      }
      setCanResendOtp(true);
      throw e; // re-throw so handleSubmit knows not to show OTP screen
    }
    finally { setOtpLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await axios.post("/api/otp/verify-otp", { email: formData.email.toLowerCase().trim(), otp: otp.toString().trim(), type: 'staff-registration' });
      if (res.data.verified) {
        try {
          await axios.post("/api/auth/receptionist/register", { ...formData, emailVerified: true });
          setSuccess("Registration submitted! Please wait for admin approval within 24-48 hours.");
          resetForm(); setShowOtpVerification(false); setOtp(""); setOtpSent(false);
          setTimeout(() => { setIsLogin(true); setSuccess(""); }, 5000);
        } catch (regErr) {
          const data = regErr.response?.data;
          if (data?.pending) {
            // Account already exists and is pending — this is actually fine, just show status
            setSuccess("");
            setError("⏳ Your registration was already submitted and is pending admin approval. Please wait 24–48 hours for a confirmation email. You do NOT need to register again.");
            setShowOtpVerification(false);
            setTimeout(() => setIsLogin(true), 4000);
          } else if (data?.alreadyActive) {
            setSuccess("");
            setError("ℹ️ " + (data?.message || "An active account already exists. Please sign in."));
            setShowOtpVerification(false);
            setTimeout(() => setIsLogin(true), 2500);
          } else if (data?.rejected) {
            setSuccess("");
            setError("❌ " + (data?.message || "Your registration was rejected. Contact admin."));
            setShowOtpVerification(false);
          } else {
            setSuccess("");
            setError(data?.message || "Registration failed. Please try again.");
          }
        }
      }
    } catch (e) { 
      setError(e.response?.data?.message || "Invalid OTP. Please check and try again.");
    }
    finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) { setError('Google Sign-In not configured.'); return; }
    setSocialLoading('google'); setError("");
    try {
      if (!window.google?.accounts?.oauth2) { setError('Google Sign-In is still loading.'); setSocialLoading(null); return; }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: 'email profile openid',
        callback: async (r) => {
          if (r.access_token) {
            try {
              const info = await (await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${r.access_token}` } })).json();
              const res = await axios.post('/api/auth/clinic/google-signin', { email: info.email, name: info.name, googleId: info.sub || info.id, profilePhoto: info.picture });
              const userData = { ...res.data.user, token: res.data.token };
              localStorage.setItem("receptionist", JSON.stringify(userData));
              setSuccess(`Welcome, ${res.data.user.name?.split(' ')[0]}!`);
              setTimeout(() => onLogin(userData), 500);
            } catch (e) { setError(e.response?.data?.message || 'Google sign-in failed'); }
          } else { setError('Google Sign-In was cancelled.'); }
          setSocialLoading(null);
        },
        error_callback: (e) => { setError(e.type === 'popup_blocked' ? 'Popup blocked!' : 'Google Sign-In failed.'); setSocialLoading(null); }
      });
      client.requestAccessToken();
    } catch (e) { setError('Google Sign-In failed.'); setSocialLoading(null); }
  };

  const handleForgotSendOtp = async () => {
    if (!validateEmail(forgotEmail)) { setError("Enter a valid email"); return; }
    setForgotLoading(true); setError("");
    try {
      const res = await axios.post("/api/otp/send-otp", { email: forgotEmail, type: 'password-reset' });
      setForgotStep(2); setSuccess("OTP sent to your email");
    } catch (e) { setError(e.response?.data?.message || "Failed to send OTP."); }
    finally { setForgotLoading(false); }
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) { setError("Enter a valid 6-digit OTP"); return; }
    setForgotLoading(true); setError("");
    try {
      const res = await axios.post("/api/otp/verify-otp", { email: forgotEmail, otp: forgotOtp, type: 'password-reset' });
      if (res.data.verified) { setForgotStep(3); setSuccess("OTP verified. Set your new password."); }
    } catch (e) { setError(e.response?.data?.message || "Invalid OTP"); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match"); return; }
    setForgotLoading(true); setError("");
    try {
      const res = await axios.post("/api/auth/clinic/reset-password", { email: forgotEmail.toLowerCase().trim(), newPassword });
      if (res.data.success) {
        setSuccess("Password reset! You can now login."); setShowForgotPassword(false); setForgotStep(1);
        setForgotEmail(""); setForgotOtp(""); setNewPassword(""); setConfirmNewPassword("");
      } else { setError(res.data.message || "Failed to reset password"); }
    } catch (e) { setError(e.response?.data?.message || "Failed to reset password."); }
    finally { setForgotLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    if (!isLogin) {
      const errors = {};
      if (!validateEmail(formData.email)) errors.email = 'Invalid email';
      if (formData.password.length < 8) errors.password = 'At least 8 characters required';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
      if (!validatePhone(formData.phone)) errors.phone = 'Invalid phone number';
      if (!validatePhone(formData.clinicPhone)) errors.clinicPhone = 'Invalid clinic phone';
      if (formData.npiNumber && !validateNPI(formData.npiNumber)) errors.npiNumber = 'NPI must be 10 digits';
      if (!agreedToTerms) errors.terms = 'Must agree to Terms of Service';
      if (!agreedToPrivacy) errors.privacy = 'Must agree to Privacy Policy';
      if (!verifiedCredentials) errors.credentials = 'Must verify professional credentials';
      if (Object.keys(errors).length > 0) { setValidationErrors(errors); setLoading(false); return; }
    }

    // Show "waking up" hint after 8 seconds
    const wakeUpTimer = setTimeout(() => {
      if (isLogin) setError("⏳ Server is waking up from sleep, please wait up to 60 seconds...");
    }, 8000);

    try {
      if (isLogin) {
        const res = await axios.post("/api/auth/clinic/login", { email: formData.email, password: formData.password });
        clearTimeout(wakeUpTimer);
        const userData = { ...res.data.user, token: res.data.token };
        localStorage.setItem("receptionist", JSON.stringify(userData));
        onLogin(userData);
      } else {
        clearTimeout(wakeUpTimer);
        // ALWAYS validate email with backend before showing OTP screen.
        // Never skip based on cached otpSent — the email status may have changed.
        await sendOtp(); // throws + sets error if email already exists/pending/rejected
        setShowOtpVerification(true); setLoading(false);
        return;
      }
    } catch (e) {
      clearTimeout(wakeUpTimer);
      // If sendOtp already set the error message, don't overwrite it
      // sendOtp re-throws after setting error, so we only handle login errors here
      if (isLogin) {
        const data = e.response?.data;
        const status = e.response?.status;
        if (status === 403 && data?.suspended) {
          setError(`Account Suspended: ${data?.reason || 'Contact admin'}`);
        } else if (data?.pending) {
          setError('⏳ ' + (data?.message || 'Your account is pending admin approval. Please wait 24–48 hours.'));
        } else if (data?.rejected) {
          setError('❌ ' + (data?.message || 'Your account was rejected. Contact admin.'));
        } else if (data?.wrongRole) {
          setError('⚠️ ' + (data?.message || 'This email is not registered as a staff account.'));
        } else if (data?.alreadyActive) {
          setError('ℹ️ ' + (data?.message || 'Account already exists. Please sign in instead.'));
        } else if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
          setError('Server is taking too long. It may be starting up — please try again in 30 seconds.');
        } else if (!e.response) {
          setError('Cannot reach server. Check your internet connection or try again shortly.');
        } else {
          setError(data?.message || "Invalid credentials. Please check your email and password.");
        }
      }
      // For registration flow: sendOtp() already set the error, nothing to do here
    } finally { setLoading(false); }
  };

  const EyeToggle = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} className="text-slate-400 hover:text-sky-500 transition-colors p-1 rounded-lg">
      <i className={`fas fa-${show ? 'eye-slash' : 'eye'} text-sm`}></i>
    </button>
  );

  // ── Forgot Password Modal ──────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-fade-in-up">
          <button onClick={() => { setShowForgotPassword(false); setForgotStep(1); setError(""); setSuccess(""); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all mb-6">
            <i className="fas fa-arrow-left text-xs"></i> Back to Login
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-2xl text-sky-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
            <p className="text-slate-500 text-sm mt-1">
              {forgotStep === 1 ? "Enter your work email to receive a reset code" : forgotStep === 2 ? "Enter the 6-digit code sent to your email" : "Create your new password"}
            </p>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4"><i className="fas fa-exclamation-circle"></i>{error}</div>}
          {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm mb-4"><i className="fas fa-check-circle"></i>{success}</div>}
          {forgotStep === 1 && (
            <div className="flex flex-col gap-4">
              <Field label="Work Email Address" required>
                <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="staff@clinic.com" icon="envelope" />
              </Field>
              <button onClick={handleForgotSendOtp} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Reset Code</>}
              </button>
            </div>
          )}
          {forgotStep === 2 && (
            <div className="flex flex-col gap-4">
              <Field label="Verification Code" required>
                <Input type="text" value={forgotOtp} onChange={e => setForgotOtp(e.target.value)} placeholder="Enter 6-digit code" maxLength={6} icon="shield-alt" />
              </Field>
              <button onClick={handleForgotVerifyOtp} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check"></i> Verify Code</>}
              </button>
            </div>
          )}
          {forgotStep === 3 && (
            <div className="flex flex-col gap-4">
              <Field label="New Password" required>
                <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" icon="lock"
                  rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
              </Field>
              <Field label="Confirm New Password" required>
                <Input type={showConfirmPassword ? "text" : "password"} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" icon="lock"
                  rightEl={<EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />} />
              </Field>
              <button onClick={handleResetPassword} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : <><i className="fas fa-save"></i> Reset Password</>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── OTP Verification Screen ────────────────────────────────────────────────
  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-fade-in-up">
          <button onClick={() => { setShowOtpVerification(false); setOtp(""); setOtpSent(false); setError(""); setSuccess(""); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all mb-6">
            <i className="fas fa-arrow-left text-xs"></i> Back
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-envelope-open-text text-2xl text-sky-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Verify Your Email</h2>
            <p className="text-slate-500 text-sm mt-1">Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{formData.email}</span></p>
          </div>
          {/* Only show error if it's NOT a stale "already exists" error — those should never reach this screen */}
          {error && !error.includes('already exists') && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
              <i className="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm mb-4">
              <i className="fas fa-check-circle flex-shrink-0"></i>
              <span>{success}</span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <Field label="Verification Code" required>
              <Input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} icon="shield-alt" />
            </Field>
            <button onClick={verifyOtp} disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check-circle"></i> Verify & Register</>}
            </button>
            <button onClick={sendOtp} disabled={!canResendOtp || otpLoading}
              className="w-full h-10 border border-slate-200 hover:border-sky-300 text-slate-600 hover:text-sky-600 font-medium rounded-xl transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {otpLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : otpTimer > 0 ? `Resend in ${otpTimer}s` : <><i className="fas fa-redo"></i> Resend OTP</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Login / Registration ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-center w-[45%] p-10 bg-gradient-to-br from-teal-600 via-sky-600 to-teal-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <i className="fas fa-hospital-user text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold mb-2">Staff Portal</h1>
          <p className="text-white/80 text-lg mb-10">Healthcare Management System</p>
          <div className="flex flex-col gap-4">
            {[
              { icon: 'calendar-check', title: 'Appointment Management', desc: 'Manage patient appointments efficiently' },
              { icon: 'users', title: 'Patient Records', desc: 'Access and update patient information' },
              { icon: 'chart-line', title: 'Analytics Dashboard', desc: 'Track clinic performance metrics' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/15 transition-all duration-300 hover:translate-x-1">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas fa-${f.icon} text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{f.title}</h4>
                  <p className="text-white/75 text-sm mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 my-8">
          {/* Header */}
          <div className="mb-8 text-center">
            {onBack && (
              <button type="button" onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all mb-6">
                <i className="fas fa-arrow-left text-xs"></i> Back
              </button>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <i className="fas fa-hospital-user text-2xl text-teal-600"></i>
              <h2 className="text-2xl font-bold text-slate-800">{isLogin ? 'Staff Login' : 'Staff Registration'}</h2>
            </div>
            <p className="text-slate-500 text-sm">{isLogin ? 'Access your clinic dashboard' : 'Apply for a staff position'}</p>
          </div>

          {/* Alerts */}
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-5"><i className="fas fa-exclamation-circle flex-shrink-0"></i><span>{error}</span></div>}
          {success && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm mb-5"><i className="fas fa-check-circle flex-shrink-0"></i><span>{success}</span></div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Personal Info (Registration only) */}
            {!isLogin && (
              <div>
                <SectionHeading icon="user">Personal Information</SectionHeading>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" required error={validationErrors.name}>
                    <Input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Your full name" required error={validationErrors.name} />
                  </Field>
                  <Field label="Position" required>
                    <SelectField name="position" value={formData.position} onChange={handleChange} required>
                      <option value="">Select Position</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="medical-assistant">Medical Assistant</option>
                      <option value="nurse">Nurse</option>
                      <option value="office-manager">Office Manager</option>
                      <option value="billing-specialist">Billing Specialist</option>
                      <option value="other">Other</option>
                    </SelectField>
                  </Field>
                  <Field label="Phone Number" required error={validationErrors.phone}>
                    <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required error={validationErrors.phone} />
                  </Field>
                  <Field label="Years of Experience">
                    <SelectField name="yearsExperience" value={formData.yearsExperience} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="0-1">0–1 years</option>
                      <option value="2-5">2–5 years</option>
                      <option value="6-10">6–10 years</option>
                      <option value="11-15">11–15 years</option>
                      <option value="16+">16+ years</option>
                    </SelectField>
                  </Field>
                </div>
              </div>
            )}

            {/* Account Security */}
            <div>
              {!isLogin && <SectionHeading icon="lock">Account Security</SectionHeading>}
              <div className="flex flex-col gap-4">
                <Field label="Work Email Address" required error={validationErrors.email}>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange}
                    placeholder={isLogin ? "staff@clinic.com" : "your.email@clinic.com"}
                    icon="envelope" required error={validationErrors.email} />
                </Field>
                <Field label="Password" required error={validationErrors.password}>
                  <Input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                    onChange={handleChange} placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    icon="lock" required error={validationErrors.password}
                    rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
                  {!isLogin && formData.password && (
                    <div className="mt-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500">Password Strength</span>
                        <span className={`text-xs font-semibold ${getStrengthTextColor()}`}>{getStrengthText()}</span>
                      </div>
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  )}
                </Field>
                {!isLogin && (
                  <Field label="Confirm Password" required error={validationErrors.confirmPassword}>
                    <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password"
                      icon="lock" required error={validationErrors.confirmPassword}
                      rightEl={<EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />} />
                  </Field>
                )}
              </div>
            </div>

            {/* Clinic Information (Registration only) */}
            {!isLogin && (
              <div>
                <SectionHeading icon="clinic-medical">Clinic Information</SectionHeading>
                <div className="flex flex-col gap-4">
                  <Field label="Clinic Name" required error={validationErrors.clinicName}>
                    <Input name="clinicName" type="text" value={formData.clinicName} onChange={handleChange} placeholder="Enter clinic name" required error={validationErrors.clinicName} />
                  </Field>
                  <Field label="Clinic Address" required>
                    <Input name="clinicAddress" type="text" value={formData.clinicAddress} onChange={handleChange} placeholder="Full clinic address" required />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Clinic Phone" required error={validationErrors.clinicPhone}>
                      <Input name="clinicPhone" type="tel" value={formData.clinicPhone} onChange={handleChange} placeholder="+91 98765 43210" required error={validationErrors.clinicPhone} />
                    </Field>
                    <Field label="License Number">
                      <Input name="licenseNumber" type="text" value={formData.licenseNumber} onChange={handleChange} placeholder="License #" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="NPI Number" error={validationErrors.npiNumber}>
                      <Input name="npiNumber" type="text" value={formData.npiNumber} onChange={handleChange} placeholder="10-digit NPI" maxLength={10} error={validationErrors.npiNumber} />
                    </Field>
                    <Field label="Specialization">
                      <Input name="specialization" type="text" value={formData.specialization} onChange={handleChange} placeholder="e.g. Cardiology" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact (Registration only) */}
            {!isLogin && (
              <div>
                <SectionHeading icon="phone-alt">Emergency Contact</SectionHeading>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contact Name">
                    <Input name="emergencyContact" type="text" value={formData.emergencyContact} onChange={handleChange} placeholder="Contact name" />
                  </Field>
                  <Field label="Contact Phone" error={validationErrors.emergencyPhone}>
                    <Input name="emergencyPhone" type="tel" value={formData.emergencyPhone} onChange={handleChange} placeholder="+91 98765 43210" error={validationErrors.emergencyPhone} />
                  </Field>
                </div>
              </div>
            )}

            {/* Agreements (Registration only) */}
            {!isLogin && (
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <SectionHeading icon="file-contract">Agreements</SectionHeading>
                {[
                  { key: 'terms', state: agreedToTerms, setter: setAgreedToTerms, label: 'I agree to the Terms of Service', error: validationErrors.terms },
                  { key: 'privacy', state: agreedToPrivacy, setter: setAgreedToPrivacy, label: 'I agree to the Privacy Policy', error: validationErrors.privacy },
                  { key: 'creds', state: verifiedCredentials, setter: setVerifiedCredentials, label: 'I verify my professional credentials are accurate', error: validationErrors.credentials },
                ].map(({ key, state, setter, label, error: err }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 flex-shrink-0" />
                    <span className={`text-sm ${err ? 'text-red-500' : 'text-slate-600'} group-hover:text-slate-800 transition-colors`}>{label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm">
              {loading
                ? <><i className="fas fa-spinner fa-spin"></i> {isLogin ? 'Signing in...' : 'Submitting...'}</>
                : <><i className={`fas fa-${isLogin ? 'sign-in-alt' : 'user-plus'}`}></i> {isLogin ? 'Staff Login' : 'Submit Application'}</>
              }
            </button>

            {/* Google Sign-In */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <button type="button" onClick={handleGoogleSignIn} disabled={socialLoading === 'google'}
              className="w-full h-12 border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-sm disabled:opacity-60">
              {socialLoading === 'google'
                ? <><i className="fas fa-spinner fa-spin text-slate-400"></i> Signing in...</>
                : <><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google</>
              }
            </button>

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <button type="button" onClick={() => { setShowForgotPassword(true); setError(""); setSuccess(""); }}
                className="text-center text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors">
                Forgot your password?
              </button>
            )}

            {/* Toggle Login/Register */}
            <p className="text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={toggleMode} className="text-sky-600 hover:text-sky-700 font-semibold transition-colors">
                {isLogin ? 'Apply for Staff Access' : 'Sign In'}
              </button>
            </p>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <i className="fas fa-shield-alt text-teal-500 text-sm"></i>
              <p className="text-xs text-teal-700 font-medium">256-bit SSL encrypted · HIPAA compliant</p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default ClinicAuth;

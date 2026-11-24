import React, { useState, useEffect } from "react";
import axios from "../api/config";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// ── Shared UI primitives (Tailwind-only, same pattern as ClinicAuth) ─────────

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
        "focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
        "placeholder:text-slate-400",
        icon ? "pl-10" : "px-4",
        rightEl ? "pr-12" : "pr-4",
        error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300",
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
      "focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
      error ? "border-red-400" : "border-slate-200 hover:border-slate-300",
    ].join(" ")}
  >
    {children}
  </select>
);

const SectionHeading = ({ icon, children }) => (
  <h6 className="flex items-center gap-2 text-sm font-semibold text-teal-600 mb-4 pb-2 border-b border-slate-100">
    <i className={`fas fa-${icon} text-teal-500`}></i>
    {children}
  </h6>
);

const EyeToggle = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle} className="text-slate-400 hover:text-teal-500 transition-colors p-1 rounded-lg">
    <i className={`fas fa-${show ? "eye-slash" : "eye"} text-sm`}></i>
  </button>
);

// ── Modal wrapper ─────────────────────────────────────────────────────────────
const Modal = ({ title, icon, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
    <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh]">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
        <h5 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
          <i className={`fas fa-${icon} text-teal-600`}></i> {title}
        </h5>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
      <div className="overflow-y-auto px-5 sm:px-6 py-4 flex-1">{children}</div>
      {footer && <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">{footer}</div>}
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
function DoctorAuth({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "",
    name: "", phone: "", specialization: "",
    clinicName: "", experience: "", qualification: "",
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
  const [certifiedCredentials, setCertifiedCredentials] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (!document.getElementById("google-signin-script")) {
      const s = document.createElement("script");
      s.id = "google-signin-script";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!isLogin) {
      axios.get("/api/clinics").then(r => setClinics(r.data || [])).catch(() => {});
    }
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const resetForgot = () => {
    setShowForgotPassword(false); setForgotStep(1);
    setForgotEmail(""); setForgotOtp(""); setNewPassword("");
    setError(""); setSuccess("");
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) { setError("Google Sign-In not configured."); return; }
    setSocialLoading("google"); setError("");
    try {
      if (!window.google?.accounts?.oauth2) {
        setError("Google Sign-In is still loading. Please try again."); setSocialLoading(null); return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: "email profile openid",
        callback: async (r) => {
          if (r.access_token) {
            try {
              const info = await (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${r.access_token}` },
              })).json();
              const res = await axios.post("/api/auth/doctor/google-signin", {
                email: info.email, name: info.name,
                googleId: info.sub || info.id, profilePhoto: info.picture,
              });
              const d = { ...res.data.doctor, token: res.data.token };
              localStorage.setItem("doctor", JSON.stringify(d));
              localStorage.setItem("doctorToken", res.data.token);
              setSuccess(`Welcome, Dr. ${res.data.doctor.name?.split(" ")[0]}!`);
              setTimeout(() => onLogin(d), 500);
            } catch (e) { setError(e.response?.data?.message || "Google sign-in failed"); }
          } else { setError("Google Sign-In was cancelled."); }
          setSocialLoading(null);
        },
        error_callback: (e) => {
          setError(e.type === "popup_blocked" ? "Popup blocked!" : "Google Sign-In failed.");
          setSocialLoading(null);
        },
      });
      client.requestAccessToken();
    } catch { setError("Google Sign-In failed."); setSocialLoading(null); }
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError("");

    // Show "waking up" hint after 8 seconds
    const wakeUpTimer = setTimeout(() => {
      setError("⏳ Server is waking up from sleep, please wait up to 60 seconds...");
    }, 8000);

    try {
      const res = await axios.post("/api/auth/doctor/login", formData);
      clearTimeout(wakeUpTimer);
      const d = { ...res.data.doctor, token: res.data.token };
      localStorage.setItem("doctor", JSON.stringify(d));
      localStorage.setItem("doctorToken", res.data.token);
      onLogin(d);
    } catch (e) {
      clearTimeout(wakeUpTimer);
      if (e.response?.status === 403 && e.response?.data?.suspended)
        setError(`Account Suspended: ${e.response?.data?.reason || "Contact admin"}`);
      else if (e.response?.data?.needsPasswordSetup) {
        setNeedsPasswordSetup(true); setSetupEmail(e.response.data.doctorEmail);
      } else if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setError("Server is taking too long to respond. It may be starting up — please try again in 30 seconds.");
      } else if (!e.response) {
        setError("Cannot reach server. Check your internet connection or try again shortly.");
      } else {
        setError(e.response?.data?.message || "Login failed");
      }
    } finally { setLoading(false); }
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    if (!selectedClinicId && !formData.clinicName) { setError("Please select a clinic or enter a new clinic name"); setLoading(false); return; }
    if (!agreedToTerms || !agreedToPrivacy) { setError("You must agree to the Terms of Service and Privacy Policy"); setLoading(false); return; }
    try {
      await axios.post("/api/doctors", {
        name: formData.name, email: formData.email, phone: formData.phone,
        specialization: formData.specialization, clinicId: selectedClinicId || null,
        clinicName: formData.clinicName || null, experience: parseInt(formData.experience) || 0,
        qualification: formData.qualification || "MBBS", password: formData.password,
      });
      setSuccess("Registration submitted! Pending admin approval. You'll receive an email once approved.");
      setFormData({ email:"",password:"",confirmPassword:"",name:"",phone:"",specialization:"",clinicName:"",experience:"",qualification:"" });
      setSelectedClinicId(""); setAgreedToTerms(false); setAgreedToPrivacy(false); setCertifiedCredentials(false);
      setTimeout(() => { setIsLogin(true); setSuccess(""); }, 5000);
    } catch (e) { setError(e.response?.data?.message || "Registration failed. Please try again."); }
    finally { setLoading(false); }
  };

  // ── Password Setup ──────────────────────────────────────────────────────────
  const handlePasswordSetup = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    if (formData.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    try {
      await axios.post("/api/auth/doctor/setup-password", { email: setupEmail, password: formData.password });
      setSuccess("Password set! You can now login.");
      setNeedsPasswordSetup(false); setFormData({ ...formData, email: setupEmail });
    } catch (e) { setError(e.response?.data?.message || "Failed to set password"); }
    finally { setLoading(false); }
  };

  // ── Forgot Password ─────────────────────────────────────────────────────────
  const handleForgotSendOtp = async () => {
    if (!forgotEmail) { setError("Please enter your email"); return; }
    setForgotLoading(true); setError("");
    try {
      const r = await axios.post("/api/auth/doctor/forgot-password", { email: forgotEmail });
      if (r.data.success) { setSuccess("OTP sent to your email!"); setForgotStep(2); }
    } catch (e) { setError(e.response?.data?.message || "Failed to send OTP"); }
    finally { setForgotLoading(false); }
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) { setError("Enter a valid 6-digit OTP"); return; }
    setForgotLoading(true); setError("");
    try {
      const r = await axios.post("/api/auth/doctor/verify-reset-otp", { email: forgotEmail, otp: forgotOtp });
      if (r.data.success) { setSuccess("OTP verified! Set your new password."); setForgotStep(3); }
    } catch (e) { setError(e.response?.data?.message || "Invalid OTP"); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setForgotLoading(true); setError("");
    try {
      const r = await axios.post("/api/auth/doctor/reset-password", { email: forgotEmail, newPassword });
      if (r.data.success) { setSuccess("Password reset! You can now login."); resetForgot(); }
    } catch (e) { setError(e.response?.data?.message || "Failed to reset password"); }
    finally { setForgotLoading(false); }
  };

  // ── Shared alert helpers ────────────────────────────────────────────────────
  const AlertError = ({ msg }) => msg ? (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
      <i className="fas fa-exclamation-circle flex-shrink-0"></i><span>{msg}</span>
    </div>
  ) : null;

  const AlertSuccess = ({ msg }) => msg ? (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm mb-4">
      <i className="fas fa-check-circle flex-shrink-0"></i><span>{msg}</span>
    </div>
  ) : null;

  // ── Forgot Password overlay ─────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 p-4 sm:p-6 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-8">
          <button onClick={resetForgot}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all mb-6">
            <i className="fas fa-arrow-left text-xs"></i> Back to Login
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-key text-2xl text-teal-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
            <p className="text-slate-500 text-sm mt-1">
              {forgotStep === 1 ? "Enter your registered email" : forgotStep === 2 ? "Enter the 6-digit code sent to your email" : "Create your new password"}
            </p>
          </div>
          <AlertError msg={error} />
          <AlertSuccess msg={success} />

          {forgotStep === 1 && (
            <div className="flex flex-col gap-4">
              <Field label="Email Address" required>
                <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="doctor@clinic.com" icon="envelope" />
              </Field>
              <button onClick={handleForgotSendOtp} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Reset Code</>}
              </button>
            </div>
          )}
          {forgotStep === 2 && (
            <div className="flex flex-col gap-4">
              <Field label="Verification Code" required>
                <Input type="text" value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="Enter 6-digit code" maxLength={6} icon="shield-alt" />
              </Field>
              <button onClick={handleForgotVerifyOtp} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : <><i className="fas fa-check"></i> Verify Code</>}
              </button>
              <button onClick={() => setForgotStep(1)} className="text-sm text-slate-500 hover:text-teal-600 transition-colors text-center">
                <i className="fas fa-arrow-left mr-1"></i> Back
              </button>
            </div>
          )}
          {forgotStep === 3 && (
            <div className="flex flex-col gap-4">
              <Field label="New Password" required>
                <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" icon="lock"
                  rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
              </Field>
              <button onClick={handleResetPassword} disabled={forgotLoading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {forgotLoading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : <><i className="fas fa-save"></i> Reset Password</>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-teal-50">

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex flex-col justify-center w-[45%] min-w-[340px] p-10 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 text-white relative overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <i className="fas fa-user-md text-3xl text-white"></i>
          </div>
          <h1 className="text-4xl font-bold mb-2">Doctor Portal</h1>
          <p className="text-white/80 text-lg mb-10">Healthcare Management System</p>
          <div className="flex flex-col gap-4">
            {[
              { icon: "calendar-check", title: "View Appointments", desc: "See your scheduled appointments" },
              { icon: "users", title: "Patient Management", desc: "Access patient records and history" },
              { icon: "prescription", title: "Prescriptions", desc: "Create and manage prescriptions" },
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

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-8 my-4 sm:my-8">

          {/* Header */}
          <div className="mb-8 text-center">
            {onBack && (
              <button type="button" onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-all mb-6">
                <i className="fas fa-arrow-left text-xs"></i> Back
              </button>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <i className="fas fa-user-md text-xl sm:text-2xl text-teal-600"></i>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {needsPasswordSetup ? "Set Up Password" : isLogin ? "Doctor Login" : "Doctor Registration"}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              {needsPasswordSetup ? "Create your password to access the portal" : isLogin ? "Access your doctor dashboard" : "Join our network of healthcare professionals"}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-5">
              <i className="fas fa-exclamation-circle flex-shrink-0"></i><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm mb-5">
              <i className="fas fa-check-circle flex-shrink-0"></i><span>{success}</span>
            </div>
          )}

          {/* ── Password Setup Form ── */}
          {needsPasswordSetup && (
            <form onSubmit={handlePasswordSetup} className="flex flex-col gap-5">
              <Field label="Email">
                <Input type="email" value={setupEmail} disabled icon="envelope" />
              </Field>
              <Field label="Create Password" required>
                <Input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                  onChange={handleChange} placeholder="Enter new password (min 6 characters)" icon="lock" required
                  rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
              </Field>
              <button type="submit" disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Setting up...</> : <><i className="fas fa-key"></i> Set Password</>}
              </button>
              <button type="button" onClick={() => setNeedsPasswordSetup(false)}
                className="text-sm text-slate-500 hover:text-teal-600 transition-colors text-center">
                <i className="fas fa-arrow-left mr-1"></i> Back to Login
              </button>
            </form>
          )}

          {/* ── Login Form ── */}
          {!needsPasswordSetup && isLogin && (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <Field label="Email Address" required>
                <Input name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="doctor@clinic.com" icon="envelope" required />
              </Field>
              <Field label="Password" required>
                <Input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={handleChange} placeholder="Enter your password" icon="lock" required
                  rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Logging in...</> : <><i className="fas fa-sign-in-alt"></i> Login</>}
              </button>

              <button type="button" onClick={() => { setShowForgotPassword(true); setError(""); setSuccess(""); }}
                className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mx-auto">
                <i className="fas fa-key text-xs"></i> Forgot Password?
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Google Sign-In */}
              <button type="button" onClick={handleGoogleSignIn} disabled={socialLoading === "google"}
                className="w-full h-12 border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60">
                {socialLoading === "google"
                  ? <><i className="fas fa-spinner fa-spin text-teal-500"></i> Signing in...</>
                  : <><i className="fab fa-google text-red-500"></i> Sign in with Google</>}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 mb-3">New doctor? Join our network</p>
                <button type="button" onClick={() => setIsLogin(false)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/25">
                  <i className="fas fa-user-plus"></i> Sign Up as Doctor
                </button>
              </div>
            </form>
          )}

          {/* ── Registration Form ── */}
          {!needsPasswordSetup && !isLogin && (
            <form onSubmit={handleRegister} className="flex flex-col gap-5">

              <div>
                <SectionHeading icon="user">Personal Information</SectionHeading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required>
                    <Input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Dr. John Smith" required />
                  </Field>
                  <Field label="Phone" required>
                    <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 9876543210" required />
                  </Field>
                  <Field label="Specialization" required>
                    <SelectField name="specialization" value={formData.specialization} onChange={handleChange} required>
                      <option value="">Select Specialization</option>
                      {["General Physician","Cardiologist","Dermatologist","Orthopedic","Pediatrician","Gynecologist","Neurologist","Psychiatrist","ENT Specialist","Ophthalmologist","Dentist","Other"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </SelectField>
                  </Field>
                  <Field label="Experience (years)">
                    <Input name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="5" min="0" />
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Qualification">
                    <Input name="qualification" type="text" value={formData.qualification} onChange={handleChange} placeholder="MBBS, MD" />
                  </Field>
                </div>
              </div>

              <div>
                <SectionHeading icon="hospital">Clinic Information</SectionHeading>
                <div className="flex flex-col gap-4">
                  <Field label="Select Existing Clinic">
                    <SelectField value={selectedClinicId} onChange={e => { setSelectedClinicId(e.target.value); if (e.target.value) setFormData({ ...formData, clinicName: "" }); }}>
                      <option value="">-- Select a clinic --</option>
                      {clinics.map(c => <option key={c._id} value={c._id}>{c.name} - {c.city}</option>)}
                    </SelectField>
                  </Field>
                  <Field label="Or Enter New Clinic Name">
                    <Input name="clinicName" type="text" value={formData.clinicName}
                      onChange={e => { handleChange(e); if (e.target.value) setSelectedClinicId(""); }}
                      placeholder="New Clinic Name" disabled={!!selectedClinicId} />
                  </Field>
                </div>
              </div>

              <div>
                <SectionHeading icon="lock">Account Security</SectionHeading>
                <div className="flex flex-col gap-4">
                  <Field label="Email Address" required>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="doctor@example.com" icon="envelope" required />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Password" required>
                      <Input name="password" type={showPassword ? "text" : "password"} value={formData.password}
                        onChange={handleChange} placeholder="Min 6 characters" icon="lock" required
                        rightEl={<EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
                    </Field>
                    <Field label="Confirm Password" required>
                      <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword}
                        onChange={handleChange} placeholder="Confirm password" icon="lock" required
                        rightEl={<EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Legal Agreements */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <SectionHeading icon="file-contract">Legal Agreements</SectionHeading>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "terms", checked: agreedToTerms, setter: setAgreedToTerms, label: "Terms of Service", onView: () => setShowTermsModal(true) },
                    { id: "privacy", checked: agreedToPrivacy, setter: setAgreedToPrivacy, label: "Privacy Policy", onView: () => setShowPrivacyModal(true) },
                  ].map(({ id, checked, setter, label, onView }) => (
                    <label key={id} className="flex items-start gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-teal-500 border-teal-500" : "border-slate-300 group-hover:border-teal-400"}`}
                        onClick={() => setter(!checked)}>
                        {checked && <i className="fas fa-check text-white text-xs"></i>}
                      </div>
                      <span className="text-sm text-slate-600">
                        I agree to the{" "}
                        <button type="button" onClick={onView} className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2">{label}</button>
                        <span className="text-red-500"> *</span>
                      </span>
                    </label>
                  ))}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${certifiedCredentials ? "bg-teal-500 border-teal-500" : "border-slate-300 group-hover:border-teal-400"}`}
                      onClick={() => setCertifiedCredentials(!certifiedCredentials)}>
                      {certifiedCredentials && <i className="fas fa-check text-white text-xs"></i>}
                    </div>
                    <span className="text-sm text-slate-600">
                      I certify that all information provided is accurate and I hold valid medical credentials
                      <span className="text-red-500"> *</span>
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading || !agreedToTerms || !agreedToPrivacy || !certifiedCredentials}
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-user-md"></i> Register as Doctor</>}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 mb-3">Already have an account?</p>
                <button type="button" onClick={() => setIsLogin(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-teal-500/25">
                  <i className="fas fa-sign-in-alt"></i> Sign In
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ── Terms Modal ── */}
      {showTermsModal && (
        <Modal title="Terms of Service" icon="file-contract" onClose={() => setShowTermsModal(false)}
          footer={
            <>
              <button onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all">Close</button>
              <button onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-all flex items-center gap-2">
                <i className="fas fa-check"></i> I Agree
              </button>
            </>
          }>
          <div className="prose prose-sm text-slate-600 space-y-4">
            <div><h6 className="font-bold text-slate-800 mb-1">1. Doctor Registration Agreement</h6>
              <p>By registering as a healthcare provider on HealthSync Pro, you agree to provide accurate and verifiable professional credentials, maintain valid medical licenses, comply with all applicable healthcare regulations, provide quality healthcare services, and maintain patient confidentiality.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">2. Platform Usage</h6>
              <p>Use the platform only for legitimate healthcare purposes, respond to patient appointments in a timely manner, keep your availability calendar updated, and do not share your account credentials.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">3. Fees and Payments</h6>
              <p>Platform charges a service fee on each consultation. Payments are processed securely through our payment partners and payouts are made according to the agreed schedule.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">4. Liability</h6>
              <p>You are solely responsible for the medical advice you provide. HealthSync Pro is a technology platform and not a healthcare provider. You must maintain appropriate professional liability insurance.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">5. Termination</h6>
              <p>Either party may terminate this agreement with notice. HealthSync Pro reserves the right to suspend or terminate accounts that violate these terms.</p></div>
          </div>
        </Modal>
      )}

      {/* ── Privacy Modal ── */}
      {showPrivacyModal && (
        <Modal title="Privacy Policy" icon="shield-alt" onClose={() => setShowPrivacyModal(false)}
          footer={
            <>
              <button onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all">Close</button>
              <button onClick={() => { setAgreedToPrivacy(true); setShowPrivacyModal(false); }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-all flex items-center gap-2">
                <i className="fas fa-check"></i> I Agree
              </button>
            </>
          }>
          <div className="prose prose-sm text-slate-600 space-y-4">
            <div><h6 className="font-bold text-slate-800 mb-1">1. Information We Collect</h6>
              <p>We collect personal identification (name, email, phone), professional credentials and qualifications, clinic/practice information, and bank details for payment processing.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">2. How We Use Your Information</h6>
              <p>To verify your professional credentials, display your profile to patients, process appointment bookings and payments, and communicate important platform updates.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">3. Data Security</h6>
              <p>We implement 256-bit SSL encryption, secure data storage with encryption at rest, regular security audits, and access controls and authentication.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">4. Data Sharing</h6>
              <p>Your information may be shared with patients who book appointments with you, payment processors for transaction handling, and regulatory authorities when required by law.</p></div>
            <div><h6 className="font-bold text-slate-800 mb-1">5. Your Rights</h6>
              <p>You have the right to access your personal data, correct inaccurate information, request deletion of your account, and export your data.</p></div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default DoctorAuth;

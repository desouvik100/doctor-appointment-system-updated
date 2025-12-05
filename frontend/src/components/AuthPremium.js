// frontend/src/components/AuthPremium.js
// Premium SaaS Auth Page - Stripe/Notion inspired
import { useState } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import '../styles/premium-saas.css';

// Inline styles for ECG animation
const ecgAnimationStyle = document.createElement('style');
ecgAnimationStyle.textContent = `
  @keyframes ecgPulse {
    0% { stroke-dashoffset: 80; opacity: 0.4; }
    50% { stroke-dashoffset: 0; opacity: 1; }
    100% { stroke-dashoffset: -80; opacity: 0.4; }
  }
`;
if (!document.head.querySelector('#ecg-animation-style')) {
  ecgAnimationStyle.id = 'ecg-animation-style';
  document.head.appendChild(ecgAnimationStyle);
}

function AuthPremium({ onLogin, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ECG Logo SVG with animation
  const ECGLogo = () => (
    <svg viewBox="0 0 50 32" fill="none" style={{ width: 28, height: 20 }}>
      <path d="M0 16 L8 16 L12 16" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
      <path 
        d="M12 16 L16 6 L20 26 L24 10 L28 22 L32 16" 
        stroke="#fff" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{
          strokeDasharray: 80,
          animation: 'ecgPulse 1.5s ease-in-out infinite'
        }}
      />
      <path d="M32 16 L40 16 L50 16" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post("/api/auth/login", {
          email: formData.email,
          password: formData.password
        });
        // Combine token with user data for proper storage
        const userData = {
          ...response.data.user,
          token: response.data.token
        };
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Welcome back!");
        onLogin(userData, "patient");
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match");
          setLoading(false);
          return;
        }
        const response = await axios.post("/api/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: 'patient'
        });
        // Combine token with user data for proper storage
        const userData = {
          ...response.data.user,
          token: response.data.token
        };
        localStorage.setItem("user", JSON.stringify(userData));
        toast.success("Account created successfully!");
        onLogin(userData, "patient");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-premium">
      {/* Left Side - Form */}
      <div className="auth-premium__left">
        <div className="auth-premium__form-container">
          {/* Back Button */}
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '8px 0',
              marginBottom: '24px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#6366f1'}
            onMouseLeave={(e) => e.target.style.color = '#64748b'}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>

          {/* Logo */}
          <div className="auth-premium__logo" onClick={onBack} style={{ cursor: 'pointer' }}>
            <div className="auth-premium__logo-icon">
              <ECGLogo />
            </div>
            <span className="auth-premium__logo-text">HealthSync</span>
          </div>

          {/* Title */}
          <h1 className="auth-premium__title">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="auth-premium__subtitle">
            {isLogin 
              ? 'Sign in to access your healthcare dashboard' 
              : 'Start your journey to better healthcare'}
          </p>

          {/* Form */}
          <form className="auth-premium__form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-premium__field">
                <label className="auth-premium__label">Full Name</label>
                <div className="input-group-premium">
                  <span className="input-icon"><i className="fas fa-user"></i></span>
                  <input
                    type="text"
                    name="name"
                    className="input-premium"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-premium__field">
              <label className="auth-premium__label">Email Address</label>
              <div className="input-group-premium">
                <span className="input-icon"><i className="fas fa-envelope"></i></span>
                <input
                  type="email"
                  name="email"
                  className="input-premium"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="auth-premium__field">
                <label className="auth-premium__label">Phone Number</label>
                <div className="input-group-premium">
                  <span className="input-icon"><i className="fas fa-phone"></i></span>
                  <input
                    type="tel"
                    name="phone"
                    className="input-premium"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-premium__field">
              <label className="auth-premium__label">Password</label>
              <div className="input-group-premium">
                <span className="input-icon"><i className="fas fa-lock"></i></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-premium"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="auth-premium__field">
                <label className="auth-premium__label">Confirm Password</label>
                <div className="input-group-premium">
                  <span className="input-icon"><i className="fas fa-lock"></i></span>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="input-premium"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                <button type="button" style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--premium-primary)',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn-premium btn-premium-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', padding: '14px' }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Please wait...</>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-premium__divider">
            <span>or continue with</span>
          </div>

          {/* Social Login */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
              <i className="fab fa-google"></i> Google
            </button>
            <button className="btn-premium btn-premium-secondary" style={{ flex: 1 }}>
              <i className="fab fa-apple"></i> Apple
            </button>
          </div>

          {/* Footer */}
          <div className="auth-premium__footer">
            {isLogin ? (
              <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Sign up</a></>
            ) : (
              <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Sign in</a></>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="auth-premium__right">
        <div style={{ maxWidth: '480px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '20px', lineHeight: '1.2' }}>
            Your health journey starts here
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginBottom: '40px', lineHeight: '1.7' }}>
            Book appointments with verified doctors, get AI-powered health insights, and manage your healthcare seamlessly.
          </p>
          
          {/* Feature List */}
          <div style={{ textAlign: 'left' }}>
            {[
              { icon: 'fa-video', text: 'Video consultations from home' },
              { icon: 'fa-hospital', text: 'In-clinic appointments' },
              { icon: 'fa-robot', text: 'AI health assistant 24/7' },
              { icon: 'fa-shield-alt', text: 'Secure & HIPAA compliant' },
            ].map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginBottom: '16px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className={`fas ${item.icon}`} style={{ color: 'white' }}></i>
                </div>
                <span style={{ color: 'white', fontSize: '15px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPremium;
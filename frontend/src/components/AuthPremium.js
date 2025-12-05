// frontend/src/components/AuthPremium.js
// Premium SaaS Auth Page - Stripe/Notion inspired
import { useState, useEffect } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import '../styles/premium-saas.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

// Google Client ID - Replace with your actual client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

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
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      script.onload = () => {
        console.log('Google Sign-In script loaded');
      };
      document.body.appendChild(script);
    };
    loadGoogleScript();
  }, []);

  // Handle Google Sign-In using OAuth2 popup
  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In not configured. Please contact support.');
      return;
    }

    setSocialLoading('google');
    
    try {
      // Check if Google script is loaded
      if (!window.google?.accounts?.oauth2) {
        toast.error('Google Sign-In is loading. Please try again.');
        setSocialLoading(null);
        return;
      }

      // Use OAuth2 token client for popup-based sign-in
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            await handleGoogleToken(tokenResponse.access_token);
          } else {
            toast.error('Google Sign-In was cancelled');
            setSocialLoading(null);
          }
        },
        error_callback: (error) => {
          console.error('Google OAuth error:', error);
          toast.error('Google Sign-In failed. Please try again.');
          setSocialLoading(null);
        }
      });

      // Request access token (opens popup)
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast.error('Google Sign-In failed. Please try again.');
      setSocialLoading(null);
    }
  };

  // Handle Google access token
  const handleGoogleToken = async (accessToken) => {
    try {
      // Get user info from Google
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
      toast.error('Failed to get user info from Google');
      setSocialLoading(null);
    }
  };

  // Process Google user data
  const processGoogleUser = async (googleUser) => {
    try {
      // Try to login or register with Google
      const response = await axios.post('/api/auth/google-signin', {
        email: googleUser.email,
        name: googleUser.name || googleUser.given_name + ' ' + (googleUser.family_name || ''),
        googleId: googleUser.sub || googleUser.id,
        profilePhoto: googleUser.picture
      });

      const userData = {
        ...response.data.user,
        token: response.data.token
      };
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success(`Welcome${response.data.isNewUser ? '' : ' back'}, ${userData.name?.split(' ')[0]}!`);
      onLogin(userData, "patient");
    } catch (error) {
      console.error('Google sign-in API error:', error);
      toast.error(error.response?.data?.message || 'Google sign-in failed');
    } finally {
      setSocialLoading(null);
    }
  };

  // Handle Apple Sign-In (placeholder - requires Apple Developer account)
  const handleAppleSignIn = () => {
    toast('Apple Sign-In requires Apple Developer account setup', { icon: 'ℹ️' });
  };

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
            {t('backToHome')}
          </button>

          {/* Logo */}
          <div className="auth-premium__logo" onClick={onBack} style={{ cursor: 'pointer' }}>
            <div className="auth-premium__logo-icon">
              <ECGLogo />
            </div>
            <span className="auth-premium__logo-text">HealthSync</span>
          </div>

          {/* Language Selector */}
          <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
            <LanguageSelector />
          </div>

          {/* Title */}
          <h1 className="auth-premium__title">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </h1>
          <p className="auth-premium__subtitle">
            {isLogin 
              ? t('signInAccess')
              : t('startJourney')}
          </p>

          {/* Form */}
          <form className="auth-premium__form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-premium__field">
                <label className="auth-premium__label">{t('fullName')}</label>
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
              <label className="auth-premium__label">{t('emailAddress')}</label>
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
                <label className="auth-premium__label">{t('phoneNumber')}</label>
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
              <label className="auth-premium__label">{t('password')}</label>
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
                <label className="auth-premium__label">{t('confirmPassword')}</label>
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
                  {t('forgotPassword')}
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
                <><i className="fas fa-spinner fa-spin"></i> {t('loading')}</>
              ) : (
                isLogin ? t('signIn') : t('createAccount')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-premium__divider">
            <span>{t('orContinueWith')}</span>
          </div>

          {/* Social Login */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-premium btn-premium-secondary" 
              style={{ flex: 1 }}
              onClick={handleGoogleSignIn}
              disabled={socialLoading === 'google'}
            >
              {socialLoading === 'google' ? (
                <><i className="fas fa-spinner fa-spin"></i> {t('signingIn')}</>
              ) : (
                <><i className="fab fa-google"></i> Google</>
              )}
            </button>
            <button 
              className="btn-premium btn-premium-secondary" 
              style={{ flex: 1 }}
              onClick={handleAppleSignIn}
              disabled={socialLoading === 'apple'}
            >
              <i className="fab fa-apple"></i> Apple
            </button>
          </div>

          {/* Footer */}
          <div className="auth-premium__footer">
            {isLogin ? (
              <>{t('dontHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>{t('signUp')}</a></>
            ) : (
              <>{t('alreadyHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>{t('signIn')}</a></>
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
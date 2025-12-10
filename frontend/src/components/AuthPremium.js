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

// Debug: Log Google Client ID status (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('Google Client ID configured:', GOOGLE_CLIENT_ID ? 'Yes (ID: ' + GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : 'No');
}

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
  
  // OTP verification states
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1=email, 2=otp+password

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Send OTP for registration
  const handleSendOtp = async () => {
    if (!formData.email) {
      toast.error("Please enter your email first");
      return;
    }
    
    setOtpSending(true);
    try {
      const response = await axios.post("/api/auth/send-registration-otp", {
        email: formData.email
      });
      
      if (response.data.success) {
        toast.success("OTP sent to your email!");
        setShowOtpStep(true);
        setOtpTimer(60); // 60 second cooldown
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-registration-otp", {
        email: formData.email,
        otp: otp
      });
      
      if (response.data.success) {
        toast.success("Email verified successfully!");
        setOtpVerified(true);
        setShowOtpStep(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Send OTP
  const handleForgotPasswordSendOtp = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setOtpSending(true);
    try {
      const response = await axios.post("/api/auth/forgot-password", { email: resetEmail });
      if (response.data.success) {
        toast.success("OTP sent to your email!");
        setResetStep(2);
        setOtpTimer(60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  // Forgot Password - Reset with OTP
  const handleResetPassword = async () => {
    if (!resetOtp || resetOtp.length !== 6) {
      toast.error("Please enter valid 6-digit OTP");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/reset-password", {
        email: resetEmail,
        otp: resetOtp,
        newPassword: newPassword
      });
      if (response.data.success) {
        toast.success("Password reset successfully! Please login.");
        setShowForgotPassword(false);
        setResetStep(1);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Google script loading state
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleScriptError, setGoogleScriptError] = useState(null);

  // Load Google Sign-In script
  useEffect(() => {
    const loadGoogleScript = () => {
      // Check if already loaded
      if (window.google?.accounts?.oauth2) {
        console.log('✅ Google Sign-In already available');
        setGoogleScriptLoaded(true);
        return;
      }

      if (document.getElementById('google-signin-script')) {
        // Script tag exists, wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            console.log('✅ Google Sign-In script loaded (delayed)');
            setGoogleScriptLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.google?.accounts?.oauth2) {
            console.error('❌ Google Sign-In script timeout');
            setGoogleScriptError('Google Sign-In failed to load. Please refresh the page.');
          }
        }, 10000);
        return;
      }
      
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Sign-In script loaded');
        // Give it a moment to initialize
        setTimeout(() => {
          if (window.google?.accounts?.oauth2) {
            setGoogleScriptLoaded(true);
          } else {
            console.error('❌ Google Sign-In not initialized after script load');
            setGoogleScriptError('Google Sign-In initialization failed.');
          }
        }, 500);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Google Sign-In script:', error);
        setGoogleScriptError('Failed to load Google Sign-In. Check your internet connection.');
      };
      document.body.appendChild(script);
    };
    
    if (GOOGLE_CLIENT_ID) {
      loadGoogleScript();
    } else {
      console.warn('⚠️ Google Client ID not configured');
      setGoogleScriptError('Google Sign-In not configured.');
    }
  }, []);

  // Handle Google Sign-In using OAuth2 popup
  const handleGoogleSignIn = async () => {
    // Check configuration
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In not configured. Please use email/password login.');
      console.error('❌ REACT_APP_GOOGLE_CLIENT_ID is not set in .env');
      return;
    }

    // Check for script errors
    if (googleScriptError) {
      toast.error(googleScriptError);
      return;
    }

    setSocialLoading('google');
    
    try {
      // Check if Google script is loaded
      if (!window.google?.accounts?.oauth2) {
        if (!googleScriptLoaded) {
          toast.error('Google Sign-In is still loading. Please wait a moment and try again.');
          console.log('⏳ Google script not yet loaded, googleScriptLoaded:', googleScriptLoaded);
        } else {
          toast.error('Google Sign-In failed to initialize. Please refresh the page.');
          console.error('❌ Google script loaded but oauth2 not available');
        }
        setSocialLoading(null);
        return;
      }

      console.log('🔐 Initiating Google Sign-In with Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');

      // Use OAuth2 token client for popup-based sign-in
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          console.log('📥 Google OAuth callback received');
          if (tokenResponse.access_token) {
            console.log('✅ Access token received');
            await handleGoogleToken(tokenResponse.access_token);
          } else if (tokenResponse.error) {
            console.error('❌ Google OAuth error:', tokenResponse.error, tokenResponse.error_description);
            if (tokenResponse.error === 'access_denied') {
              toast.error('Google Sign-In was cancelled.');
            } else if (tokenResponse.error === 'popup_closed_by_user') {
              toast.error('Sign-in popup was closed. Please try again.');
            } else {
              toast.error(`Google Sign-In error: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            setSocialLoading(null);
          } else {
            toast.error('Google Sign-In was cancelled');
            setSocialLoading(null);
          }
        },
        error_callback: (error) => {
          console.error('❌ Google OAuth error_callback:', error);
          // Provide more specific error messages
          if (error.type === 'popup_failed_to_open') {
            toast.error('Popup blocked! Please allow popups for this site.');
          } else if (error.type === 'popup_closed') {
            toast.error('Sign-in popup was closed. Please try again.');
          } else {
            toast.error('Google Sign-In failed. Please try again or use email/password.');
          }
          setSocialLoading(null);
        }
      });

      // Request access token (opens popup)
      console.log('🚀 Requesting access token...');
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('❌ Google Sign-In exception:', error);
      toast.error('Google Sign-In failed. Please try email/password login.');
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
        // Registration flow - require OTP verification
        if (!otpVerified) {
          toast.error("Please verify your email with OTP first");
          setLoading(false);
          return;
        }
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
          role: 'patient',
          otpVerified: true
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
      // Handle suspended account
      if (error.response?.status === 403 && error.response?.data?.suspended) {
        toast.error(`Account Suspended: ${error.response?.data?.reason || 'Contact admin for assistance'}`);
      } else {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
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
                  onChange={(e) => {
                    handleChange(e);
                    // Reset OTP verification if email changes
                    if (!isLogin && otpVerified) {
                      setOtpVerified(false);
                      setShowOtpStep(false);
                      setOtp("");
                    }
                  }}
                  required
                  disabled={!isLogin && otpVerified}
                />
                {!isLogin && otpVerified && (
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }}>
                    <i className="fas fa-check-circle"></i>
                  </span>
                )}
              </div>
            </div>

            {/* OTP Verification Section for Registration */}
            {!isLogin && !otpVerified && (
              <div className="auth-premium__field">
                {!showOtpStep ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !formData.email || otpTimer > 0}
                    className="btn-premium btn-premium-secondary"
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {otpSending ? (
                      <><i className="fas fa-spinner fa-spin"></i> Sending OTP...</>
                    ) : otpTimer > 0 ? (
                      `Resend OTP in ${otpTimer}s`
                    ) : (
                      <><i className="fas fa-paper-plane"></i> Send OTP to verify email</>
                    )}
                  </button>
                ) : (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px' }}>
                    <label className="auth-premium__label" style={{ color: '#166534', marginBottom: '8px', display: 'block' }}>
                      <i className="fas fa-shield-alt"></i> Enter 6-digit OTP sent to your email
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="input-premium"
                        style={{ flex: 1, textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: '600' }}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length !== 6}
                        className="btn-premium btn-premium-primary"
                        style={{ padding: '12px 20px' }}
                      >
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Verify'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setShowOtpStep(false); setOtp(""); }}
                        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Change email
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending || otpTimer > 0}
                        style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show verified badge */}
            {!isLogin && otpVerified && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '18px' }}></i>
                <span style={{ color: '#166534', fontWeight: '500' }}>Email verified successfully!</span>
              </div>
            )}

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
                <button type="button" onClick={() => setShowForgotPassword(true)} style={{
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                <i className="fas fa-key" style={{ marginRight: '8px', color: '#6366f1' }}></i>
                Reset Password
              </h3>
              <button onClick={() => { setShowForgotPassword(false); setResetStep(1); setResetEmail(""); setResetOtp(""); setNewPassword(""); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {resetStep === 1 ? (
              <>
                <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Enter your email to receive a verification code.</p>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Enter your email" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }} />
                <button onClick={handleForgotPasswordSendOtp} disabled={otpSending} style={{ width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {otpSending ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Enter the OTP sent to {resetEmail} and your new password.</p>
                <input type="text" value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength={6} style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', letterSpacing: '4px', textAlign: 'center' }} />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }} />
                <button onClick={handleResetPassword} disabled={loading} style={{ width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {loading ? <><i className="fas fa-spinner fa-spin"></i> Resetting...</> : 'Reset Password'}
                </button>
                <button onClick={() => setResetStep(1)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#6366f1', fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}>← Back to email</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthPremium;
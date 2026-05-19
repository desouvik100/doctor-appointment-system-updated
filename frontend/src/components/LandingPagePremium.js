// frontend/src/components/LandingPagePremium.js
// Premium SaaS Landing Page - Stripe/Notion/Linear inspired
import { useState, useEffect } from 'react';
import '../styles/premium-saas.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { Capacitor } from '@capacitor/core';
import HeroSection from './HeroSection';

const LandingPagePremium = ({ onNavigate = () => {}, darkMode = false, toggleDarkMode = () => {} }) => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 769 : false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  // Detect native Android/iOS app
  useEffect(() => {
    try {
      const platform = Capacitor.getPlatform();
      setIsNativeApp(platform === 'android' || platform === 'ios');
    } catch (e) {
      setIsNativeApp(false);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
    };
    const handleResize = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ECG Logo SVG Component
  const ECGLogo = ({ className = '' }) => (
    <svg viewBox="0 0 50 32" fill="none" className={className} style={{ width: 28, height: 20 }}>
      <path d="M0 16 L8 16 L12 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"/>
      <path 
        className="logo-premium__ecg" 
        d="M12 16 L16 6 L20 26 L24 10 L28 22 L32 16" 
        stroke="#fff" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path d="M32 16 L40 16 L50 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  const features = [
    { icon: 'fa-video', titleKey: 'videoConsultations', descKey: 'videoConsultationsDesc' },
    { icon: 'fa-hospital', titleKey: 'inClinicVisits', descKey: 'inClinicVisitsDesc' },
    { icon: 'fa-calendar-check', titleKey: 'smartScheduling', descKey: 'smartSchedulingDesc' },
    { icon: 'fa-x-ray', titleKey: 'medicalImagingFeature', descKey: 'medicalImagingFeatureDesc' },
    { icon: 'fa-robot', titleKey: 'aiHealthAssistant', descKey: 'aiHealthAssistantDesc' },
    { icon: 'fa-shield-alt', titleKey: 'securePrivate', descKey: 'securePrivateDesc' },
  ];

  const pricingPlans = [
    { name: 'Basic', price: 'Free', period: 'forever', features: ['5 appointments/month', 'Video consultations', 'AI health assistant', 'Email support'], cta: 'Get Started', popular: false },
    { name: 'Pro', price: '₹299', period: '/month', features: ['Unlimited appointments', 'Priority booking', 'Health analytics', 'Family accounts (up to 5)', '24/7 support', 'Medicine reminders'], cta: 'Start Free Trial', popular: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Corporate wellness', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-site health camps'], cta: 'Contact Sales', popular: false },
  ];

  const faqs = [
    { q: 'How do I book an appointment?', a: 'Simply sign up, browse doctors by specialty or location, select your preferred time slot, and confirm your booking. You\'ll receive instant confirmation via email and SMS.' },
    { q: 'Are the doctors verified?', a: 'Yes, all doctors on HealthSync are verified medical professionals. We verify their medical licenses, qualifications, and credentials before they can join our platform.' },
    { q: 'How do video consultations work?', a: 'After booking a video consultation, you\'ll receive a Google Meet link. At your appointment time, simply click the link to join the video call with your doctor.' },
    { q: 'Can I cancel or reschedule appointments?', a: 'Yes, you can cancel or reschedule appointments up to 2 hours before the scheduled time through your dashboard at no extra charge.' },
    { q: 'Is my health data secure?', a: 'Absolutely. We use bank-level encryption and are HIPAA compliant. Your health data is never shared without your explicit consent.' },
    { q: 'Do you offer refunds?', a: 'Yes, if a doctor cancels or doesn\'t show up, you\'ll receive a full refund. For other cases, please contact our support team.' },
  ];

  return (
    <div className={`landing-premium ${darkMode ? 'dark-mode' : ''}`}>
      {/* Navigation */}
      <nav className={`nav-premium ${scrolled ? 'scrolled' : ''}`} style={{ position: 'fixed', zIndex: 10000 }}>
        <div className="nav-premium__container">
          <div className="logo-premium">
            <div className="logo-premium__icon">
              <ECGLogo />
            </div>
            <span className="logo-premium__text logo-premium__text--gradient">HealthSync</span>
          </div>

          <div className="nav-premium__links">
            <a href="#features" className="nav-premium__link">{t('features')}</a>
            <a href="#how-it-works" className="nav-premium__link">{t('howItWorks')}</a>
            <button
              className="nav-premium__link"
              onClick={() => onNavigate('pricing')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >{t('pricing')}</button>
            <a href="#security" className="nav-premium__link">{t('security')}</a>
            <a href="#faq" className="nav-premium__link">{t('faq')}</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Selector - Always visible */}
            <LanguageSelector darkMode={!scrolled} />
            
            <button
              onClick={toggleDarkMode}
              className="btn-premium btn-premium-ghost"
              style={{ padding: '8px', borderRadius: '8px' }}
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <button 
              className="btn-premium hide-mobile"
              onClick={() => onNavigate('login')}
              style={{
                background: scrolled ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
                color: scrolled ? '#4f46e5' : '#6366f1',
                border: scrolled ? '2px solid #4f46e5' : '2px solid transparent',
                fontWeight: '700',
                minWidth: '90px',
                textShadow: 'none',
                boxShadow: scrolled ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {t('signIn')}
            </button>
            <button 
              className="btn-premium btn-premium-primary hide-mobile"
              onClick={() => onNavigate('register')}
            >
              {t('getStarted')}
            </button>
            
            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ 
                background: scrolled ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                border: 'none', 
                color: scrolled ? '#6366f1' : '#ffffff',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '10px 12px',
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu - Only render on mobile */}
        {isMobile && mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 100000
              }}
            />
            <div 
              className="mobile-menu-dropdown"
              style={{
                position: 'fixed',
                top: scrolled ? '56px' : '64px',
                left: 0,
                right: 0,
                background: darkMode ? '#0f172a' : '#ffffff',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                padding: '20px 24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                zIndex: 100001,
                maxHeight: 'calc(100vh - 70px)',
                overflowY: 'auto'
              }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('features')}</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('howItWorks')}</a>
                <button onClick={() => { onNavigate('pricing'); setMobileMenuOpen(false); }} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>{t('pricing')}</button>
                <a href="#security" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('security')}</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('faq')}</a>
                <div style={{ height: '1px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '12px 0' }} />
                <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} style={{ padding: '14px', background: 'transparent', border: '2px solid #6366f1', color: '#6366f1', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>{t('signIn')}</button>
                <button onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }} style={{ padding: '14px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>{t('getStarted')}</button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Mobile Menu Portal - Rendered outside nav for proper z-index */}
      {isMobile && mobileMenuOpen && (
        <div 
          id="mobile-menu-portal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999999,
            pointerEvents: 'auto',
            isolation: 'isolate'
          }}
        >
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1
            }}
          />
          {/* Menu Content */}
          <div 
            style={{
              position: 'fixed',
              top: '70px',
              left: '16px',
              right: '16px',
              background: darkMode ? '#1e293b' : '#ffffff',
              padding: '24px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
              borderRadius: '20px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              animation: 'slideDown 0.25s ease-out',
              zIndex: 2
            }}
          >
            <style>{`
              @keyframes slideDown {
                from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: darkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                color: darkMode ? '#fff' : '#64748b',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ padding: '16px 20px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '17px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', display: 'block' }}>{t('features')}</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ padding: '16px 20px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '17px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', display: 'block' }}>{t('howItWorks')}</a>
              <button onClick={() => { onNavigate('pricing'); setMobileMenuOpen(false); }} style={{ padding: '16px 20px', color: darkMode ? '#f1f5f9' : '#1f2937', fontWeight: '600', fontSize: '17px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', display: 'block', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>{t('pricing')}</button>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} style={{ padding: '16px 20px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '17px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', display: 'block' }}>{t('security')}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ padding: '16px 20px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '17px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', display: 'block' }}>{t('faq')}</a>
              <div style={{ height: '1px', background: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', margin: '16px 0' }} />
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} style={{ padding: '16px', background: 'transparent', border: '2px solid #6366f1', color: '#6366f1', borderRadius: '12px', fontWeight: '700', fontSize: '17px', cursor: 'pointer', width: '100%' }}>{t('signIn')}</button>
              <button onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }} style={{ padding: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: '700', fontSize: '17px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)', width: '100%' }}>{t('getStarted')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection onNavigate={onNavigate} darkMode={darkMode} />


      {/* Features Section */}
      <section id="features" className="features-premium" style={{ background: darkMode ? '#000000' : '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div className="features-premium__header">
          <h2 style={{ 
            color: darkMode ? '#ffffff' : '#0f172a', 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            {t('everythingYouNeed')}
          </h2>
          <p style={{ 
            color: darkMode ? '#a3a3a3' : '#475569', 
            fontSize: '18px', 
            lineHeight: '1.7',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('powerfulFeatures')}
          </p>
        </div>
        
        <div className="features-premium__grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card-premium animate-slide-up" 
              style={{ 
                animationDelay: `${index * 50}ms`,
                background: darkMode ? '#0a0a0a' : '#ffffff',
                border: darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '32px'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
              }}>
                <i className={`fas ${feature.icon}`} style={{ color: '#ffffff', fontSize: '22px' }}></i>
              </div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: darkMode ? '#ffffff' : '#0f172a', 
                marginBottom: '12px' 
              }}>
                {t(feature.titleKey)}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: darkMode ? '#a3a3a3' : '#64748b', 
                lineHeight: '1.6',
                margin: 0
              }}>
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Imaging Benefits Section */}
      <section style={{ padding: '100px 24px', background: darkMode ? '#0a0a0a' : '#ffffff', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ 
              display: 'inline-block',
              padding: '8px 16px',
              background: darkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.1)',
              color: '#0ea5e9',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              <i className="fas fa-x-ray" style={{ marginRight: '8px' }}></i>
              NEW FEATURE
            </span>
            <h2 style={{ 
              fontSize: isMobile ? '1.75rem' : '2.5rem', 
              fontWeight: '700', 
              color: darkMode ? '#ffffff' : '#0f172a',
              marginBottom: '16px'
            }}>
              Medical Imaging Made Simple
            </h2>
            <p style={{ 
              color: darkMode ? '#a3a3a3' : '#64748b', 
              fontSize: '18px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Store all your CT, MRI, X-Ray scans in one place. Share with any doctor instantly.
            </p>
          </div>

          {/* Benefits Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: '24px',
            marginBottom: '48px'
          }}>
            {[
              { icon: 'fa-cloud-upload-alt', title: 'All Scans in One Place', desc: 'Upload CT, MRI, X-Ray from any hospital. Access anytime, anywhere.' },
              { icon: 'fa-share-alt', title: 'Share Instantly', desc: 'Share your scans with specialists for second opinions in seconds.' },
              { icon: 'fa-compact-disc', title: 'No More Lost CDs', desc: 'Say goodbye to physical CDs and films. Everything is digital and secure.' },
              { icon: 'fa-history', title: 'Complete History', desc: 'Your imaging history preserved forever, even if you change hospitals.' },
              { icon: 'fa-rupee-sign', title: 'Save Money', desc: 'Avoid unnecessary repeat scans. Doctors can view your previous images.' },
              { icon: 'fa-shield-alt', title: 'Secure & Private', desc: 'HIPAA compliant. You control who sees your medical images.' }
            ].map((benefit, index) => (
              <div 
                key={index}
                style={{
                  padding: '32px',
                  background: darkMode ? '#111111' : '#f8fafc',
                  borderRadius: '16px',
                  border: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <i className={`fas ${benefit.icon}`} style={{ fontSize: '24px', color: '#fff' }}></i>
                </div>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: darkMode ? '#ffffff' : '#0f172a',
                  marginBottom: '8px'
                }}>
                  {benefit.title}
                </h4>
                <p style={{ 
                  color: darkMode ? '#a3a3a3' : '#64748b', 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Before/After Comparison */}
          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: '24px',
            padding: isMobile ? '32px 24px' : '48px',
            color: '#fff'
          }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', marginBottom: '32px' }}>
              See the Difference
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', 
              gap: '32px',
              alignItems: 'center'
            }}>
              {/* Before */}
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: '16px', 
                padding: '24px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <h4 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-times-circle"></i> Without HealthSync
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'Carry CDs to every doctor',
                    'CDs get lost or damaged',
                    'Repeat scans at new hospitals',
                    'Pay ₹5000+ for repeat MRI',
                    'Extra radiation exposure'
                  ].map((item, i) => (
                    <li key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '12px',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '14px'
                    }}>
                      <i className="fas fa-minus" style={{ color: '#ef4444', fontSize: '10px' }}></i>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow */}
              {!isMobile && (
                <div style={{ textAlign: 'center' }}>
                  <i className="fas fa-arrow-right" style={{ fontSize: '32px', color: '#0ea5e9' }}></i>
                </div>
              )}

              {/* After */}
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: '16px', 
                padding: '24px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <h4 style={{ color: '#22c55e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-check-circle"></i> With HealthSync
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'All scans in your pocket',
                    'Share with any doctor instantly',
                    'No repeat scans needed',
                    'Save thousands of rupees',
                    'Complete imaging history'
                  ].map((item, i) => (
                    <li key={i} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '12px',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '14px'
                    }}>
                      <i className="fas fa-check" style={{ color: '#22c55e', fontSize: '10px' }}></i>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Badges */}
      <section style={{ padding: '80px 24px', background: darkMode ? '#0a0a0a' : '#ffffff', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginBottom: '12px' }}>
              Your Data is Safe With Us
            </h3>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '16px' }}>
              Enterprise-grade security for your health information
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {[
              { icon: 'fa-shield-alt', title: 'SSL Encrypted', desc: '256-bit encryption' },
              { icon: 'fa-lock', title: 'HIPAA Compliant', desc: 'Healthcare standard' },
              { icon: 'fa-user-shield', title: 'Data Privacy', desc: 'GDPR compliant' },
              { icon: 'fa-server', title: '99.9% Uptime', desc: 'Always available' },
              { icon: 'fa-key', title: '2FA Security', desc: 'Two-factor auth' },
            ].map((badge, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 32px',
                background: darkMode ? '#0f172a' : '#f8fafc',
                borderRadius: '16px',
                border: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
                minWidth: '140px',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <i className={`fas ${badge.icon}`} style={{ color: '#ffffff', fontSize: '20px' }}></i>
                </div>
                <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', fontSize: '14px', marginBottom: '4px' }}>{badge.title}</div>
                <div style={{ fontSize: '12px', color: darkMode ? '#a3a3a3' : '#64748b' }}>{badge.desc}</div>
              </div>
            ))}
          </div>
          
          {/* Partner Logos */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: darkMode ? '#64748b' : '#94a3b8', fontSize: '13px', marginBottom: '20px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trusted by leading healthcare providers</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
              {['Apollo Clinics', 'Fortis', 'Max Healthcare', 'Medanta', 'AIIMS'].map((partner, i) => (
                <div key={i} style={{
                  padding: '12px 24px',
                  background: darkMode ? '#0f172a' : '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  opacity: 0.8
                }}>{partner}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '120px 24px', background: darkMode ? '#0a0a0a' : '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#ede9fe', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#6366f1', marginBottom: '16px' }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>Book Your Appointment in 3 Simple Steps</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px' }}>
              No registration required for first booking. Get started in under 60 seconds.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {[
              { step: '1', title: 'Search & Select Doctor', desc: 'Browse doctors by specialty, location, or name. View ratings, experience, and available slots.', icon: 'fa-search', color: '#6366f1' },
              { step: '2', title: 'Choose Consultation Type', desc: 'Select In-Clinic visit or Online Video consultation. Each has separate queues for faster service.', icon: 'fa-hand-pointer', color: '#8b5cf6' },
              { step: '3', title: 'Pick Date & Confirm', desc: 'Select your preferred date, get instant queue number and estimated time. Pay online or at clinic.', icon: 'fa-calendar-check', color: '#a855f7' },
            ].map((item, index) => (
              <div key={index} style={{ 
                textAlign: 'center', 
                padding: '32px 24px', 
                background: darkMode ? '#0f172a' : '#ffffff', 
                borderRadius: '20px', 
                border: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                {/* Step Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '32px',
                  height: '32px',
                  background: item.color,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '700',
                  boxShadow: `0 4px 12px ${item.color}40`
                }}>{item.step}</div>
                
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '16px auto 20px',
                }}>
                  <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '28px' }}></i>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: darkMode ? '#ffffff' : '#0f172a' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: darkMode ? '#a3a3a3' : '#64748b', lineHeight: '1.7', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <button 
              onClick={() => onNavigate('register')}
              style={{
                padding: '16px 40px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4)'; }}
            >
              <i className="fas fa-calendar-plus" style={{ marginRight: '10px' }}></i>
              Book Your First Appointment
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '120px 24px', background: darkMode ? '#000000' : '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#059669', marginBottom: '16px' }}>TESTIMONIALS</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t('lovedByThousands')}</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px' }}>
              Trusted by 500+ clinics and 50,000+ patients across India
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {[
              { 
                name: 'Dr. Ananya Mukherjee', 
                role: 'General Physician, Bankura', 
                text: 'HealthSync transformed my clinic. Queue management is seamless - patients know their exact time, reducing wait complaints by 80%.', 
                image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
              { 
                name: 'Rajesh Sharma', 
                role: 'Patient, Kolkata', 
                text: 'No more waiting in long queues! I book online, get my token number, and arrive just before my turn. The video consultation feature is a lifesaver.', 
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
              { 
                name: 'Dr. Sunil Patel', 
                role: 'Cardiologist, Mumbai', 
                text: 'Managing both online and in-clinic appointments from one dashboard saves me 2 hours daily. The separate queues feature is brilliant.', 
                image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
              { 
                name: 'Priya Banerjee', 
                role: 'Working Professional, Delhi', 
                text: 'As a busy professional, booking a doctor appointment used to be stressful. HealthSync lets me book in 30 seconds and consult via video during lunch break.', 
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
              { 
                name: 'Dr. Meera Krishnan', 
                role: 'Pediatrician, Chennai', 
                text: 'Parents love the real-time queue updates. They can track their position from home and arrive just in time. My clinic runs smoother than ever.', 
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
              { 
                name: 'Amit Kumar', 
                role: 'Clinic Manager, Pune', 
                text: 'We reduced no-shows by 60% with automated SMS reminders. The receptionist dashboard is intuitive - our staff learned it in one day.', 
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                rating: 5
              },
            ].map((testimonial, index) => (
              <div key={index} style={{ 
                padding: '28px', 
                background: darkMode ? '#0a0a0a' : '#ffffff', 
                borderRadius: '20px', 
                border: darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)'; }}
              >
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: darkMode ? '#d4d4d4' : '#475569', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: darkMode ? '2px solid #1a1a1a' : '2px solid #e2e8f0'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' }}>{testimonial.name}</div>
                    <div style={{ fontSize: '13px', color: darkMode ? '#a3a3a3' : '#64748b' }}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 24px', background: darkMode ? '#0a0a0a' : '#ffffff', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', background: darkMode ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#7c3aed', marginBottom: '16px' }}>{t('pricing').toUpperCase()}</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t('pricingTitle')}</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>{t('pricingSubtitle')}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            {pricingPlans.map((plan, index) => (
              <div key={index} style={{ 
                padding: '32px', 
                background: plan.popular ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : (darkMode ? '#0a0a0a' : '#ffffff'), 
                borderRadius: '24px', 
                border: plan.popular ? 'none' : (darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0'),
                boxShadow: plan.popular ? '0 20px 40px rgba(99, 102, 241, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                position: 'relative',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)'
              }}>
                {plan.popular && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#fbbf24', color: '#0f172a', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>MOST POPULAR</div>}
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: plan.popular ? '#fff' : (darkMode ? '#ffffff' : '#0f172a'), marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '700', color: plan.popular ? '#fff' : (darkMode ? '#ffffff' : '#0f172a') }}>{plan.price}</span>
                  <span style={{ fontSize: '16px', color: plan.popular ? 'rgba(255,255,255,0.8)' : (darkMode ? '#a3a3a3' : '#64748b') }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: plan.popular ? 'rgba(255,255,255,0.9)' : (darkMode ? '#d4d4d4' : '#475569') }}>
                      <i className="fas fa-check" style={{ color: plan.popular ? '#fff' : '#22c55e', fontSize: '12px' }}></i>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate('register')} style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: plan.popular ? '#fff' : '#6366f1', 
                  color: plan.popular ? '#6366f1' : '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '15px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
                >{plan.cta}</button>
              </div>
            ))}
          </div>

          {/* Pricing Comparison Table */}
          <div style={{ marginTop: '80px' }}>
            <h3 style={{ textAlign: 'center', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginBottom: '32px' }}>
              Compare All Features
            </h3>
            {/* Mobile scroll hint */}
            {isMobile && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', marginBottom: '12px' }}>
                <i className="fas fa-arrows-alt-h" style={{ marginRight: '6px' }}></i>
                Scroll horizontally to see all plans
              </p>
            )}
            <div style={{ 
              background: darkMode ? '#0a0a0a' : '#ffffff', 
              borderRadius: '20px', 
              border: darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0',
              overflow: 'hidden',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '500px' : 'auto' }}>
                <thead>
                  <tr style={{ background: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'left', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', position: 'sticky', left: 0, background: darkMode ? '#0f172a' : '#f8fafc', zIndex: 1 }}>Feature</th>
                    <th style={{ padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>Basic</th>
                    <th style={{ padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: '#6366f1', borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0', background: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }}>Pro ⭐</th>
                    <th style={{ padding: isMobile ? '12px 16px' : '16px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Appointments/month', basic: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Video Consultations', basic: true, pro: true, enterprise: true },
                    { feature: 'AI Health Assistant', basic: true, pro: true, enterprise: true },
                    { feature: 'Queue Tracking', basic: true, pro: true, enterprise: true },
                    { feature: 'Priority Booking', basic: false, pro: true, enterprise: true },
                    { feature: 'Health Analytics', basic: false, pro: true, enterprise: true },
                    { feature: 'Family Accounts', basic: false, pro: 'Up to 5', enterprise: 'Unlimited' },
                    { feature: 'Medicine Reminders', basic: false, pro: true, enterprise: true },
                    { feature: 'Account Manager', basic: false, pro: false, enterprise: true },
                    { feature: 'Custom Integrations', basic: false, pro: false, enterprise: true },
                    { feature: 'SLA Guarantee', basic: false, pro: false, enterprise: true },
                    { feature: 'Support', basic: 'Email', pro: '24/7', enterprise: 'Priority' },
                  ].map((row, index) => (
                    <tr key={index} style={{ borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: isMobile ? '10px 16px' : '14px 24px', fontSize: isMobile ? '12px' : '14px', color: darkMode ? '#d4d4d4' : '#475569', position: 'sticky', left: 0, background: darkMode ? '#0a0a0a' : '#ffffff', zIndex: 1 }}>{row.feature}</td>
                      <td style={{ padding: isMobile ? '10px 16px' : '14px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', color: darkMode ? '#d4d4d4' : '#475569' }}>
                        {typeof row.basic === 'boolean' ? (
                          row.basic ? <i className="fas fa-check" style={{ color: '#22c55e' }}></i> : <i className="fas fa-times" style={{ color: '#94a3b8' }}></i>
                        ) : row.basic}
                      </td>
                      <td style={{ padding: isMobile ? '10px 16px' : '14px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', color: darkMode ? '#d4d4d4' : '#475569', background: darkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)' }}>
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <i className="fas fa-check" style={{ color: '#22c55e' }}></i> : <i className="fas fa-times" style={{ color: '#94a3b8' }}></i>
                        ) : <span style={{ fontWeight: '500', color: '#6366f1' }}>{row.pro}</span>}
                      </td>
                      <td style={{ padding: isMobile ? '10px 16px' : '14px 24px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px', color: darkMode ? '#d4d4d4' : '#475569' }}>
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? <i className="fas fa-check" style={{ color: '#22c55e' }}></i> : <i className="fas fa-times" style={{ color: '#94a3b8' }}></i>
                        ) : row.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section id="security" style={{ padding: '120px 24px', background: darkMode ? 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)' : 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '24px', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <i className="fas fa-shield-alt" style={{ color: '#22c55e', fontSize: '16px' }}></i>
              <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', letterSpacing: '0.05em' }}>{t('securityFirst').toUpperCase()}</span>
            </div>
            <h2 style={{ fontSize: '2.75rem', fontWeight: '700', color: '#fff', marginBottom: '20px', lineHeight: '1.2' }}>{t('yourPrivacyMatters')}</h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.7' }}>{t('securityDesc')}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: 'fa-lock', titleKey: 'encryption', descKey: 'encryptionDesc' },
              { icon: 'fa-user-shield', titleKey: 'hipaaCompliant', descKey: 'hipaaDesc' },
              { icon: 'fa-database', titleKey: 'secureStorage', descKey: 'secureStorageDesc' },
              { icon: 'fa-eye-slash', titleKey: 'noDataSelling', descKey: 'noDataSellingDesc' },
            ].map((item, index) => (
              <div key={index} style={{ 
                padding: '32px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '20px', 
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)' }}>
                  <i className={`fas ${item.icon}`} style={{ color: '#fff', fontSize: '22px' }}></i>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>{t(item.titleKey)}</h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.7', margin: 0 }}>{t(item.descKey)}</p>
              </div>
            ))}
          </div>
          
          {/* Certification Badges */}
          <div style={{ marginTop: '64px', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', fontWeight: '500' }}>{t('certifiedCompliant')}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {['ISO 27001', 'SOC 2', 'HIPAA', 'GDPR'].map((cert, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  padding: '14px 24px', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'; }}
                >
                  <i className="fas fa-certificate" style={{ color: '#22c55e', fontSize: '16px' }}></i>
                  <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '120px 24px', background: darkMode ? '#000000' : '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t('faqTitle')}</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px' }}>{t('faqSubtitle')}</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{ 
                background: darkMode ? '#0a0a0a' : '#ffffff', 
                borderRadius: '16px', 
                border: darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                <button 
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  style={{ 
                    width: '100%', 
                    padding: '20px 24px', 
                    background: 'transparent', 
                    border: 'none', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a' }}>{faq.q}</span>
                  <i className={`fas fa-chevron-${activeFaq === index ? 'up' : 'down'}`} style={{ color: '#6366f1', fontSize: '14px' }}></i>
                </button>
                {activeFaq === index && (
                  <div style={{ padding: '0 24px 20px', color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '15px', lineHeight: '1.7' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section style={{ padding: '100px 24px', background: darkMode ? '#000000' : '#0f172a', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '48px' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>{t('getTheApp')}</h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.7', marginBottom: '32px' }}>{t('downloadAppDesc')}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', background: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                <i className="fab fa-apple" style={{ fontSize: '28px', color: '#0f172a' }}></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Download on the</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>App Store</div>
                </div>
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', background: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                <i className="fab fa-google-play" style={{ fontSize: '24px', color: '#0f172a' }}></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Get it on</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '220px', height: '440px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '36px', padding: '8px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ width: '100%', height: '100%', background: darkMode ? '#0a0a0a' : '#1e293b', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 50 32" fill="none" style={{ width: 32, height: 24 }}>
                      <path d="M0 16 L8 16 L12 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 16 L16 6 L20 26 L24 10 L28 22 L32 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M32 16 L40 16 L50 16" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>{t('appName')}</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>{t('yourHealthSimplified')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '100px 24px', 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }}></div>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>
            {t('readyToTransform')}
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', lineHeight: '1.7' }}>
            {t('joinThousands')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-premium btn-premium-lg"
              onClick={() => onNavigate('register')}
              style={{ 
                background: '#ffffff', 
                color: '#6366f1',
                fontWeight: '600',
                border: 'none'
              }}
            >
              {t('getStartedFree')}
              <i className="fas fa-arrow-right"></i>
            </button>
            <button 
              className="btn-premium btn-premium-lg"
              onClick={() => onNavigate('login')}
              style={{ 
                background: 'rgba(255,255,255,0.15)', 
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              {t('contactSales')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '64px 24px 32px', 
        background: darkMode ? '#000000' : '#0f172a',
        color: '#94a3b8'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
            <div>
              <div className="logo-premium" style={{ marginBottom: '16px' }}>
                <div className="logo-premium__icon">
                  <ECGLogo />
                </div>
                <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>HealthSync</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.7', maxWidth: '280px', color: '#94a3b8' }}>
                HealthSync is a clinic-first healthcare platform for managing online and in-clinic doctor appointments with zero confusion.
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                <strong>HealthSync</strong> | healthsyncpro.in | Clinic Management Software
              </p>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>{t('product')}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Features', 'Pricing', 'Security'].map((link, i) => (
                  <li key={i} style={{ marginBottom: '10px' }}>
                    <a href={`#${link.toLowerCase()}`} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
                       onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                       onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                    >{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>{t('company')}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '10px' }}>
                  <button onClick={() => onNavigate('about-us')} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                     onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                     onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >About Us</button>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <button onClick={() => onNavigate('contact-us')} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                     onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                     onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >Contact Us</button>
                </li>
              </ul>
            </div>
            
            {/* Legal Links - PayU Required */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '10px' }}>
                  <button onClick={() => onNavigate('terms')} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                     onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                     onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >Terms & Conditions</button>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <button onClick={() => onNavigate('privacy')} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                     onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                     onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >Privacy Policy</button>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <button onClick={() => onNavigate('refund')} style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                     onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                     onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >Refund Policy</button>
                </li>
              </ul>
            </div>
            
            {/* Staff Portal Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>{t('staffPortal')}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '10px' }}>
                  <button 
                    onClick={() => onNavigate('admin-login')}
                    style={{ 
                      color: '#94a3b8', 
                      fontSize: '14px', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >{t('adminLogin')}</button>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <button 
                    onClick={() => onNavigate('doctor-login')}
                    style={{ 
                      color: '#94a3b8', 
                      fontSize: '14px', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >{t('doctorLogin')}</button>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <button 
                    onClick={() => onNavigate('receptionist-login')}
                    style={{ 
                      color: '#94a3b8', 
                      fontSize: '14px', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >{t('staffLogin')}</button>
                </li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid #1e293b', 
            paddingTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>© 2025 {t('appName')}. {t('allRightsReserved')}</p>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => onNavigate('terms')} style={{ fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                   onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                   onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >Terms & Conditions</button>
                <button onClick={() => onNavigate('privacy')} style={{ fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                   onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                   onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >Privacy Policy</button>
                <button onClick={() => onNavigate('refund')} style={{ fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                   onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                   onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >Refund Policy</button>
                <button onClick={() => onNavigate('contact-us')} style={{ fontSize: '13px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                   onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                   onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                >Contact Us</button>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['twitter', 'linkedin', 'github', 'instagram'].map((social) => (
                  <a key={social} href="#" style={{ color: '#94a3b8', fontSize: '18px' }}>
                    <i className={`fab fa-${social}`}></i>
                  </a>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: 0 }}>
              <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
              Secure payments powered by PayU | HIPAA Compliant | SSL Encrypted
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Staff Login Dropdown - Bottom Right */}
      <div 
        className="staff-dropdown"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 50
        }}
      >
        <style>{`
          .staff-dropdown .staff-menu {
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.2s ease;
          }
          .staff-dropdown:hover .staff-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          .staff-dropdown:hover .staff-btn {
            background: rgba(99, 102, 241, 0.9) !important;
            color: #ffffff !important;
            border-color: #6366f1 !important;
          }
          .staff-menu-item:hover {
            background: #f1f5f9 !important;
          }
        `}</style>
        
        {/* Dropdown Menu - Shows on Hover */}
        <div 
          className="staff-menu"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: '0',
            marginBottom: '8px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            minWidth: '160px'
          }}
        >
          <button 
            className="staff-menu-item"
            onClick={() => onNavigate('admin-login')}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              background: '#ffffff',
              color: '#334155',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
          >
            <i className="fas fa-user-shield" style={{ color: '#6366f1', width: '16px' }}></i> Admin
          </button>
          <button 
            className="staff-menu-item"
            onClick={() => onNavigate('doctor-login')}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              background: '#ffffff',
              color: '#334155',
              border: 'none',
              borderTop: '1px solid #f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
          >
            <i className="fas fa-user-md" style={{ color: '#10b981', width: '16px' }}></i> Doctor
          </button>
          <button 
            className="staff-menu-item"
            onClick={() => onNavigate('receptionist-login')}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              background: '#ffffff',
              color: '#334155',
              border: 'none',
              borderTop: '1px solid #f1f5f9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
          >
            <i className="fas fa-user-tie" style={{ color: '#f59e0b', width: '16px' }}></i> Staff
          </button>
        </div>

        {/* Main Button */}
        <button 
          className="staff-btn"
          style={{
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '500',
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-user-lock" style={{ fontSize: '11px' }}></i> 
          Staff Portal
          <i className="fas fa-chevron-up" style={{ fontSize: '9px', marginLeft: '2px' }}></i>
        </button>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            zIndex: 50,
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.3s ease'
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.5)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)'; }}
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up" style={{ fontSize: '16px' }}></i>
        </button>
      )}
    </div>
  );
};

export default LandingPagePremium;

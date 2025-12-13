// frontend/src/components/LandingPagePremium.js
// Premium SaaS Landing Page - Stripe/Notion/Linear inspired
import { useState, useEffect } from 'react';
import '../styles/premium-saas.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

const LandingPagePremium = ({ onNavigate = () => {}, darkMode = false, toggleDarkMode = () => {} }) => {
  const { t, language } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 769 : false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [isTaglineTransitioning, setIsTaglineTransitioning] = useState(false);

  // Attractive rotating taglines
  const taglines = [
    { en: "Your Health, Your Time, Your Choice", hi: "आपका स्वास्थ्य, आपका समय, आपकी पसंद", bn: "আপনার স্বাস্থ্য, আপনার সময়, আপনার পছন্দ" },
    { en: "Care that comes to you, anytime", hi: "देखभाल जो आपके पास आती है, कभी भी", bn: "যত্ন যা আপনার কাছে আসে, যেকোনো সময়" },
    { en: "Expert doctors. Zero wait time.", hi: "विशेषज्ञ डॉक्टर। शून्य प्रतीक्षा समय।", bn: "বিশেষজ্ঞ ডাক্তার। শূন্য অপেক্ষার সময়।" },
    { en: "Healing made simple & fast", hi: "उपचार को सरल और तेज़ बनाया", bn: "নিরাময় সহজ এবং দ্রুত করা হয়েছে" },
    { en: "Your wellness. Our priority.", hi: "आपकी सेहत। हमारी प्राथमिकता।", bn: "আপনার সুস্থতা। আমাদের অগ্রাধিকার।" },
    { en: "Book in seconds. Heal faster.", hi: "सेकंड में बुक करें। तेज़ी से ठीक हों।", bn: "সেকেন্ডে বুক করুন। দ্রুত সুস্থ হন।" },
    { en: "Healthcare at your fingertips", hi: "आपकी उंगलियों पर स्वास्थ्य सेवा", bn: "আপনার আঙুলের ডগায় স্বাস্থ্যসেবা" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
    };
    const handleResize = () => {
      const mobile = window.innerWidth < 769;
      setIsMobile(mobile);
      // Close mobile menu on larger screens
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    // Check on mount
    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Smooth tagline rotation every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTaglineTransitioning(true);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % taglines.length);
        setIsTaglineTransitioning(false);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, [taglines.length]);

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
    { icon: 'fa-robot', titleKey: 'aiHealthAssistant', descKey: 'aiHealthAssistantDesc' },
    { icon: 'fa-shield-alt', titleKey: 'securePrivate', descKey: 'securePrivateDesc' },
    { icon: 'fa-mobile-alt', titleKey: 'mobileReady', descKey: 'mobileReadyDesc' },
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
            <a href="#pricing" className="nav-premium__link">{t('pricing')}</a>
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
                background: scrolled ? 'transparent' : 'rgba(255, 255, 255, 0.15)',
                color: scrolled ? '#6366f1' : '#ffffff',
                border: scrolled ? '2px solid #6366f1' : '2px solid rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
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
                color: scrolled ? '#6366f1' : '#0f172a',
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
              zIndex: 99999,
              maxHeight: 'calc(100vh - 70px)',
              overflowY: 'auto'
            }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('features')}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('pricing')}</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('security')}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ padding: '14px 16px', color: darkMode ? '#f1f5f9' : '#1f2937', textDecoration: 'none', fontWeight: '600', fontSize: '16px', borderRadius: '10px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>{t('faq')}</a>
              <div style={{ height: '1px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '12px 0' }} />
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} style={{ padding: '14px', background: 'transparent', border: '2px solid #6366f1', color: '#6366f1', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>{t('signIn')}</button>
              <button onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }} style={{ padding: '14px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>{t('getStarted')}</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-premium">
        <div className="hero-premium__container">
          <div className="hero-premium__content animate-slide-up">
            <div className="hero-premium__badge">
              <i className="fas fa-sparkles" style={{ fontSize: '12px' }}></i>
              {t('aiHealthAssistant')}
            </div>
            
            {/* Rotating Hero Title */}
            <div style={{ minHeight: '140px' }}>
              <h1 
                className="hero-premium__title"
                style={{
                  transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isTaglineTransitioning ? 0 : 1,
                  transform: isTaglineTransitioning ? 'translateY(-15px)' : 'translateY(0)',
                  color: '#ffffff'
                }}
              >
                {taglines[taglineIndex][language] || taglines[taglineIndex].en}
              </h1>
            </div>
            
            <div className="hero-premium__actions">
              <button 
                className="btn-premium btn-premium-lg"
                onClick={() => onNavigate('register')}
                style={{ 
                  background: '#ffffff', 
                  color: '#6366f1',
                  fontWeight: '600'
                }}
              >
                {t('startForFree')}
                <i className="fas fa-arrow-right"></i>
              </button>
              <button 
                className="btn-premium btn-premium-lg"
                onClick={() => onNavigate('register')}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  color: '#ffffff',
                  border: 'none'
                }}
              >
                <i className="fas fa-robot"></i>
                {language === 'bn' ? 'ডাক্তার খুঁজুন' : language === 'hi' ? 'डॉक्टर खोजें' : 'Find My Doctor'}
              </button>
            </div>
            
            <div className="hero-premium__stats">
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">500+</div>
                <div className="hero-premium__stat-label">{t('verifiedDoctors')}</div>
              </div>
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">50K+</div>
                <div className="hero-premium__stat-label">{t('happyPatients')}</div>
              </div>
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">99.9%</div>
                <div className="hero-premium__stat-label">{t('uptime')}</div>
              </div>
            </div>

            {/* Trust Badges */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.15)'
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Trusted by:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {['Apollo', 'Fortis', 'Max', 'AIIMS'].map((name, i) => (
                  <div key={i} style={{
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.8)'
                  }}>{name}</div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="hero-premium__visual animate-slide-up stagger-2">
            {/* Doctor Image with Floating Elements */}
            <div style={{ 
              position: 'relative', 
              width: '480px',
              height: '520px',
              margin: '0 auto'
            }}>
              {/* Main Doctor Image */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Background Glow */}
                <div style={{
                  position: 'absolute',
                  width: '350px',
                  height: '350px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}></div>

                {/* Doctor Image Container */}
                <div style={{
                  position: 'relative',
                  width: '320px',
                  height: '400px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                  border: '4px solid rgba(255,255,255,0.3)'
                }}>
                  <img 
                    src="https://media.istockphoto.com/id/2187596922/photo/portrait-of-happy-smiling-healthcare-team-looking-at-camera.jpg?s=2048x2048&w=is&k=20&c=qqyAW8F9M4bSbfmtfCPPQOGh-rtREBn7RvBlGr9ZS0k="
                    alt="Medical Team"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center center'
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '150px',
                    background: 'linear-gradient(to top, rgba(99, 102, 241, 0.9), transparent)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '20px'
                  }}>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '18px' }}>Our Medical Team</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Expert Healthcare Professionals</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        {[1,2,3,4,5].map(i => (
                          <i key={i} className="fas fa-star" style={{ color: '#fbbf24', fontSize: '12px' }}></i>
                        ))}
                        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginLeft: '6px' }}>4.9 (200+ reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge - Top Right */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#ffffff',
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                animation: 'floatCard 4s ease-in-out infinite',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-check" style={{ color: '#ffffff', fontSize: '14px' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Verified</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Licensed Doctor</div>
                </div>
              </div>

              {/* Floating Badge - Bottom Left */}
              <div style={{
                position: 'absolute',
                bottom: '60px',
                left: '0px',
                background: '#ffffff',
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                animation: 'floatCard 3.5s ease-in-out infinite 0.5s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-video" style={{ color: '#ffffff', fontSize: '14px' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Video Consult</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Available Now</div>
                </div>
              </div>

              {/* Floating Badge - Top Left */}
              <div style={{
                position: 'absolute',
                top: '80px',
                left: '0px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                animation: 'floatCard 4.5s ease-in-out infinite 1s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#22c55e',
                  borderRadius: '50%'
                }}></div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>Online Now</span>
              </div>            </div>
          </div>
        </div>
      </section>


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

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '120px 24px', background: darkMode ? '#0a0a0a' : '#ffffff', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t('howItWorksTitle')}</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px' }}>
              {t('getStartedMinutes')}
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {[
              { step: '1', titleKey: 'findDoctor', descKey: 'findDoctorDesc', icon: 'fa-search' },
              { step: '2', titleKey: 'chooseType', descKey: 'chooseTypeDesc', icon: 'fa-hand-pointer' },
              { step: '3', titleKey: 'bookSlot', descKey: 'bookSlotDesc', icon: 'fa-calendar-alt' },
              { step: '4', titleKey: 'getCare', descKey: 'getCareDesc', icon: 'fa-heart' },
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center', padding: '24px', background: darkMode ? '#0a0a0a' : '#f8fafc', borderRadius: '16px', border: darkMode ? '1px solid #1a1a1a' : 'none' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#ffffff',
                  fontSize: '24px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
                }}>
                  <i className={`fas ${item.icon}`} style={{ color: '#ffffff' }}></i>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6366f1',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>{t('step')} {item.step}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t(item.titleKey)}</h3>
                <p style={{ fontSize: '14px', color: darkMode ? '#a3a3a3' : '#64748b', lineHeight: '1.6' }}>{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '120px 24px', background: darkMode ? '#000000' : '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>{t('lovedByThousands')}</h2>
            <p style={{ color: darkMode ? '#a3a3a3' : '#64748b', fontSize: '18px' }}>
              {t('seeWhatUsers')}
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { 
                name: 'Sarah Johnson', 
                role: 'Patient', 
                text: 'The video consultation feature is amazing. I can see my doctor from home without waiting in queues.', 
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'
              },
              { 
                name: 'Dr. Rajesh Kumar', 
                role: 'Cardiologist', 
                text: 'Managing both online and in-clinic appointments from one platform is a game-changer for my practice.', 
                image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face'
              },
              { 
                name: 'Priya Sharma', 
                role: 'Patient', 
                text: 'Booking appointments is so easy now. The AI assistant helped me find the right specialist quickly.', 
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
              },
            ].map((testimonial, index) => (
              <div key={index} style={{ 
                padding: '28px', 
                background: darkMode ? '#0a0a0a' : '#ffffff', 
                borderRadius: '20px', 
                border: darkMode ? '1px solid #1a1a1a' : '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: darkMode ? '#d4d4d4' : '#475569', lineHeight: '1.7', marginBottom: '20px' }}>
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
                Making quality healthcare accessible to everyone through technology and innovation.
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
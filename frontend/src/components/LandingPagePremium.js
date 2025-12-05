// frontend/src/components/LandingPagePremium.js
// Premium SaaS Landing Page - Stripe/Notion/Linear inspired
import React, { useState, useEffect } from 'react';
import '../styles/premium-saas.css';

const LandingPagePremium = ({ onNavigate = () => {}, darkMode = false, toggleDarkMode = () => {} }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { icon: 'fa-video', title: 'Video Consultations', desc: 'HD video calls with automatic Google Meet links' },
    { icon: 'fa-hospital', title: 'In-Clinic Visits', desc: 'Book in-person appointments with queue management' },
    { icon: 'fa-calendar-check', title: 'Smart Scheduling', desc: 'Real-time availability with 1-minute precision' },
    { icon: 'fa-robot', title: 'AI Health Assistant', desc: '24/7 symptom checker and health guidance' },
    { icon: 'fa-shield-alt', title: 'Secure & Private', desc: 'HIPAA compliant with end-to-end encryption' },
    { icon: 'fa-mobile-alt', title: 'Mobile Ready', desc: 'Book appointments anywhere, anytime' },
  ];

  return (
    <div className={`landing-premium ${darkMode ? 'dark-mode' : ''}`}>
      {/* Navigation */}
      <nav className={`nav-premium ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-premium__container">
          <div className="logo-premium">
            <div className="logo-premium__icon">
              <ECGLogo />
            </div>
            <span className="logo-premium__text logo-premium__text--gradient">HealthSync</span>
          </div>

          <div className="nav-premium__links">
            <a href="#features" className="nav-premium__link">Features</a>
            <a href="#how-it-works" className="nav-premium__link">How it Works</a>
            <a href="#testimonials" className="nav-premium__link">Testimonials</a>
            <button 
              className="nav-premium__link"
              onClick={() => onNavigate('corporate')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              For Business
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={toggleDarkMode}
              className="btn-premium btn-premium-ghost"
              style={{ padding: '8px', borderRadius: '8px' }}
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            
            <button 
              className="btn-premium btn-premium-secondary"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
            <button 
              className="btn-premium btn-premium-primary"
              onClick={() => onNavigate('register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-premium">
        <div className="hero-premium__container">
          <div className="hero-premium__content animate-slide-up">
            <div className="hero-premium__badge">
              <i className="fas fa-sparkles" style={{ fontSize: '12px' }}></i>
              Now with AI-powered health insights
            </div>
            
            <h1 className="hero-premium__title">
              Healthcare appointments,<br />
              <span>simplified.</span>
            </h1>
            
            <p className="hero-premium__subtitle">
              Book video consultations or in-clinic visits with verified doctors. 
              Get AI-powered health guidance, smart scheduling, and seamless care management.
            </p>
            
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
                Start for free
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
                <i className="fas fa-play-circle"></i>
                Watch demo
              </button>
            </div>
            
            <div className="hero-premium__stats">
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">500+</div>
                <div className="hero-premium__stat-label">Verified Doctors</div>
              </div>
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">50K+</div>
                <div className="hero-premium__stat-label">Happy Patients</div>
              </div>
              <div className="hero-premium__stat">
                <div className="hero-premium__stat-value">99.9%</div>
                <div className="hero-premium__stat-label">Uptime</div>
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
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop&crop=face"
                    alt="Smiling Doctor"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top'
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
                      <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '18px' }}>Dr. Sarah Mitchell</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Senior Cardiologist</div>
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
      <section id="features" className="features-premium" style={{ background: '#f8fafc', position: 'relative', zIndex: 10 }}>
        <div className="features-premium__header">
          <h2 style={{ 
            color: '#0f172a', 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            Everything you need for<br />modern healthcare
          </h2>
          <p style={{ 
            color: '#475569', 
            fontSize: '18px', 
            lineHeight: '1.7',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Powerful features designed to make healthcare accessible and efficient
          </p>
        </div>
        
        <div className="features-premium__grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card-premium animate-slide-up" 
              style={{ 
                animationDelay: `${index * 50}ms`,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
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
                color: '#0f172a', 
                marginBottom: '12px' 
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#64748b', 
                lineHeight: '1.6',
                margin: 0
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '120px 24px', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>How it works</h2>
            <p style={{ color: '#64748b', fontSize: '18px' }}>
              Get started in minutes with our simple process
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {[
              { step: '1', title: 'Find a Doctor', desc: 'Browse verified doctors by specialty, location, or availability', icon: 'fa-search' },
              { step: '2', title: 'Choose Type', desc: 'Select video consultation or in-clinic visit based on your preference', icon: 'fa-hand-pointer' },
              { step: '3', title: 'Book Slot', desc: 'Pick your preferred date and time with real-time availability', icon: 'fa-calendar-alt' },
              { step: '4', title: 'Get Care', desc: 'Attend your appointment and receive quality healthcare', icon: 'fa-heart' },
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
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
                }}>Step {item.step}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: '120px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '16px', color: '#0f172a' }}>Loved by thousands</h2>
            <p style={{ color: '#64748b', fontSize: '18px' }}>
              See what our users have to say about HealthSync
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
                background: '#ffffff', 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fas fa-star" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', marginBottom: '20px' }}>
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
                      border: '2px solid #e2e8f0'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{testimonial.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
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
            Ready to transform your healthcare experience?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px', lineHeight: '1.7' }}>
            Join thousands of patients and doctors using HealthSync for seamless healthcare management.
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
              Get started free
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
              Contact sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '64px 24px 32px', 
        background: '#0f172a',
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
            
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security', 'Enterprise'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
              { title: 'Resources', links: ['Documentation', 'Help Center', 'API', 'Status'] },
            ].map((section, index) => (
              <div key={index}>
                <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>{section.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {section.links.map((link, i) => (
                    <li key={i} style={{ marginBottom: '10px' }}>
                      <a href="#" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}
                         onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                         onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                      >{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {/* Staff Portal Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Staff Portal</h4>
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
                  >Admin Login</button>
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
                  >Doctor Login</button>
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
                  >Staff Login</button>
                </li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid #1e293b', 
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>© 2024 HealthSync. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['twitter', 'linkedin', 'github', 'instagram'].map((social) => (
                <a key={social} href="#" style={{ color: '#94a3b8', fontSize: '18px' }}>
                  <i className={`fab fa-${social}`}></i>
                </a>
              ))}
            </div>
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
    </div>
  );
};

export default LandingPagePremium;
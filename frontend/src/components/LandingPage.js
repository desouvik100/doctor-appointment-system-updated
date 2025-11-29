// frontend/src/components/LandingPage.js
import React, { useState, useEffect } from 'react';
import '../styles/landing-page-pro.css';

const LandingPage = ({ onNavigate = () => {} }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '🎥',
      title: 'Online Video Consultations',
      description: 'Connect with doctors from home via Google Meet. Automatic video links generated before your appointment for seamless virtual visits.',
      color: '#10b981'
    },
    {
      icon: '🏥',
      title: 'In-Clinic Appointments',
      description: 'Prefer face-to-face consultations? Book in-person visits at your nearest clinic with smart queue management and wait time estimates.',
      color: '#3b82f6'
    },
    {
      icon: '⏰',
      title: 'Flexible Scheduling',
      description: 'Book appointments with 1-minute precision. Real-time availability checking ensures you get the slot that works best for you.',
      color: '#f59e0b'
    },
    {
      icon: '👨‍⚕️',
      title: 'Expert Doctors',
      description: 'Access verified healthcare professionals across multiple specializations. Choose between online or in-clinic based on your preference.',
      color: '#8b5cf6'
    },
    {
      icon: '📧',
      title: 'Smart Notifications',
      description: 'Get email reminders with appointment details, clinic directions for in-person visits, or meeting links for online consultations.',
      color: '#ec4899'
    },
    {
      icon: '📱',
      title: 'Book Anywhere',
      description: 'Fully responsive design works on all devices. Schedule online or offline appointments on the go, anytime, anywhere.',
      color: '#06b6d4'
    },
    {
      icon: '🤖',
      title: 'AI Health Assistant',
      description: 'Get instant health guidance with our AI-powered chatbot. Check symptoms, get recommendations, and find the right specialist for your needs.',
      color: '#14b8a6'
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Pay consultation fees securely online with multiple payment options. Transparent pricing with no hidden charges.',
      color: '#f43f5e'
    }
  ];

  const stats = [
    { number: '500+', label: 'Expert Doctors', icon: '👨‍⚕️' },
    { number: '50K+', label: 'Happy Patients', icon: '😊' },
    { number: '100K+', label: 'Appointments', icon: '📅' },
    { number: '24/7', label: 'Support', icon: '🎧' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      text: 'I love having the choice! When I\'m busy, I book online consultations. For detailed checkups, I visit the clinic. HealthSync makes both so easy!',
      avatar: '👩‍🦰'
    },
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Cardiologist',
      text: 'Managing both online and in-clinic appointments from one platform is a game-changer. My patients appreciate the flexibility.',
      avatar: '👨‍⚕️'
    },
    {
      name: 'Priya Sharma',
      role: 'Patient',
      text: 'Booked an online consultation for a quick follow-up and an in-clinic visit for my annual checkup. The whole process was seamless!',
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav__container">
          <div className="landing-nav__logo">
            <div className="landing-nav__logo-icon heartbeat-logo">
              <svg viewBox="0 0 50 40" className="bpm-logo">
                <path 
                  d="M5 20 L12 20 L16 8 L22 32 L28 14 L32 20 L45 20" 
                  stroke="#ef4444" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="bpm-line"
                />
              </svg>
            </div>
            <span>HealthSync</span>
          </div>
          <div className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#stats" className="landing-nav__link">Stats</a>
            <a href="#testimonials" className="landing-nav__link">Testimonials</a>
            <a href="#contact" className="landing-nav__link">Contact</a>
          </div>
          <div className="landing-nav__actions">
            <div className="landing-nav__dropdown">
              <button className="landing-nav__btn landing-nav__btn--secondary">
                Login ▼
              </button>
              <div className="landing-nav__dropdown-menu">
                <button 
                  className="landing-nav__dropdown-item"
                  onClick={() => onNavigate('login')}
                >
                  Patient Login
                </button>
                <button 
                  className="landing-nav__dropdown-item"
                  onClick={() => onNavigate('admin-login')}
                >
                  Admin Login
                </button>
                <button 
                  className="landing-nav__dropdown-item"
                  onClick={() => onNavigate('receptionist-login')}
                >
                  Receptionist Login
                </button>
              </div>
            </div>
            <button 
              className="landing-nav__btn landing-nav__btn--primary"
              onClick={() => onNavigate('register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__background">
          <div className="landing-hero__gradient"></div>
          <div className="landing-hero__shapes">
            <div className="landing-hero__shape landing-hero__shape--1"></div>
            <div className="landing-hero__shape landing-hero__shape--2"></div>
            <div className="landing-hero__shape landing-hero__shape--3"></div>
          </div>
        </div>

        <div className="landing-hero__container">
          <div className="landing-hero__content">
            <div className="landing-hero__badge">
              <span className="landing-hero__badge-dot"></span>
              Online & In-Clinic Appointments Available
            </div>

            <h1 className="landing-hero__title">
              Book Doctor Appointments
              <span className="landing-hero__title-gradient"> Online & In-Clinic</span>
            </h1>

            <p className="landing-hero__subtitle">
              Choose how you want to consult - visit the clinic in person or connect via video call from home. 
              Book appointments with expert doctors, get automatic Google Meet links for online consultations, 
              or schedule in-clinic visits with smart queue management.
            </p>

            <div className="landing-hero__features-list">
              <div className="landing-hero__feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Online Video Consultations</span>
              </div>
              <div className="landing-hero__feature-item">
                <i className="fas fa-check-circle"></i>
                <span>In-Clinic Appointments</span>
              </div>
              <div className="landing-hero__feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Real-Time Doctor Availability</span>
              </div>
            </div>

            <div className="landing-hero__actions">
              <button 
                className="landing-hero__btn landing-hero__btn--primary"
                onClick={() => onNavigate('register')}
              >
                <i className="fas fa-arrow-right"></i>
                Start Booking Now
              </button>
              <button className="landing-hero__btn landing-hero__btn--secondary">
                <i className="fas fa-play-circle"></i>
                Watch Demo
              </button>
            </div>

            <div className="landing-hero__stats-mini">
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-number">500+</span>
                <span className="landing-hero__stat-label">Doctors</span>
              </div>
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-number">50K+</span>
                <span className="landing-hero__stat-label">Patients</span>
              </div>
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-number">100K+</span>
                <span className="landing-hero__stat-label">Appointments</span>
              </div>
            </div>
          </div>

          <div className="landing-hero__visual">
            {/* Healthcare Illustration */}
            <div className="landing-hero__illustration">
              <svg viewBox="0 0 500 500" className="hero-illustration">
                {/* Background Circle */}
                <circle cx="250" cy="250" r="200" fill="url(#bgGradient)" className="hero-illustration__bg"/>
                
                {/* Hospital Building */}
                <g className="hero-illustration__hospital">
                  <rect x="150" y="200" width="200" height="180" rx="10" fill="#ffffff" stroke="#667eea" strokeWidth="3"/>
                  <rect x="220" y="320" width="60" height="60" fill="#667eea"/>
                  <rect x="170" y="230" width="40" height="50" rx="5" fill="#e0e7ff"/>
                  <rect x="230" y="230" width="40" height="50" rx="5" fill="#e0e7ff"/>
                  <rect x="290" y="230" width="40" height="50" rx="5" fill="#e0e7ff"/>
                  <rect x="170" y="290" width="40" height="50" rx="5" fill="#e0e7ff"/>
                  <rect x="290" y="290" width="40" height="50" rx="5" fill="#e0e7ff"/>
                  {/* Cross */}
                  <rect x="235" y="180" width="30" height="10" fill="#ef4444"/>
                  <rect x="245" y="170" width="10" height="30" fill="#ef4444"/>
                </g>
                
                {/* Doctor Character */}
                <g className="hero-illustration__doctor">
                  <circle cx="100" cy="280" r="30" fill="#fcd5ce"/>
                  <path d="M70 310 Q100 350 130 310" fill="#ffffff" stroke="#667eea" strokeWidth="2"/>
                  <rect x="75" y="310" width="50" height="70" rx="10" fill="#667eea"/>
                  <circle cx="90" cy="275" r="4" fill="#1a202c"/>
                  <circle cx="110" cy="275" r="4" fill="#1a202c"/>
                  <path d="M95 290 Q100 295 105 290" stroke="#1a202c" strokeWidth="2" fill="none"/>
                  <rect x="85" y="250" width="30" height="15" rx="5" fill="#667eea"/>
                  {/* Stethoscope */}
                  <circle cx="120" cy="340" r="8" fill="#10b981" stroke="#059669" strokeWidth="2"/>
                </g>
                
                {/* Patient Character */}
                <g className="hero-illustration__patient">
                  <circle cx="400" cy="300" r="25" fill="#fcd5ce"/>
                  <rect x="375" y="325" width="50" height="55" rx="10" fill="#3b82f6"/>
                  <circle cx="390" cy="295" r="3" fill="#1a202c"/>
                  <circle cx="410" cy="295" r="3" fill="#1a202c"/>
                  <path d="M395 308 Q400 312 405 308" stroke="#1a202c" strokeWidth="2" fill="none"/>
                </g>
                
                {/* Video Call Icon */}
                <g className="hero-illustration__video">
                  <rect x="360" y="180" width="80" height="60" rx="10" fill="#10b981"/>
                  <polygon points="420,195 450,210 420,225" fill="#ffffff"/>
                  <circle cx="440" cy="180" r="12" fill="#ef4444"/>
                  <text x="440" y="184" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">LIVE</text>
                </g>
                
                {/* Calendar Icon */}
                <g className="hero-illustration__calendar">
                  <rect x="60" y="150" width="60" height="50" rx="8" fill="#f59e0b"/>
                  <rect x="60" y="150" width="60" height="15" rx="8" fill="#d97706"/>
                  <text x="90" y="185" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">15</text>
                  <circle cx="75" y="145" r="4" fill="#1a202c"/>
                  <circle cx="105" y="145" r="4" fill="#1a202c"/>
                </g>
                
                {/* Heart Rate */}
                <g className="hero-illustration__heartrate">
                  <path d="M50 420 L80 420 L90 400 L100 440 L110 410 L120 420 L150 420" 
                        stroke="#ef4444" strokeWidth="3" fill="none" className="heartrate-line"/>
                </g>
                
                {/* Pills */}
                <g className="hero-illustration__pills">
                  <ellipse cx="420" cy="400" rx="20" ry="10" fill="#ec4899"/>
                  <ellipse cx="450" cy="410" rx="15" ry="8" fill="#8b5cf6"/>
                </g>
                
                {/* Floating Plus Signs */}
                <text x="80" y="120" fill="#667eea" fontSize="24" opacity="0.5" className="float-element">+</text>
                <text x="420" cy="130" fill="#10b981" fontSize="20" opacity="0.5" className="float-element">+</text>
                <text x="350" y="420" fill="#f59e0b" fontSize="18" opacity="0.5" className="float-element">+</text>
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Floating Badges */}
              <div className="hero-illustration__badge hero-illustration__badge--1">
                <i className="fas fa-check-circle"></i>
                <span>Verified Doctors</span>
              </div>
              <div className="hero-illustration__badge hero-illustration__badge--2">
                <i className="fas fa-shield-alt"></i>
                <span>Secure & Private</span>
              </div>
              <div className="hero-illustration__badge hero-illustration__badge--3">
                <i className="fas fa-clock"></i>
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="landing-features__container">
          <div className="landing-features__header">
            <h2>Powerful Features</h2>
            <p>Everything you need for seamless healthcare appointments</p>
          </div>

          <div className="landing-features__grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="landing-feature-card"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="landing-feature-card__icon" style={{ color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="landing-feature-card__title">{feature.title}</h3>
                <p className="landing-feature-card__description">{feature.description}</p>
                <div className="landing-feature-card__accent" style={{ backgroundColor: feature.color }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-how-it-works">
        <div className="landing-how-it-works__container">
          <h2>How It Works</h2>
          
          <div className="landing-how-it-works__steps">
            <div className="landing-how-it-works__step">
              <div className="landing-how-it-works__step-number">1</div>
              <h3>Find a Doctor</h3>
              <p>Browse through our network of verified healthcare professionals across all specializations and clinics.</p>
              <div className="landing-how-it-works__step-icon">🔍</div>
            </div>

            <div className="landing-how-it-works__connector"></div>

            <div className="landing-how-it-works__step">
              <div className="landing-how-it-works__step-number">2</div>
              <h3>Choose Consultation Type</h3>
              <p>Select Online for video consultation from home, or In-Clinic for face-to-face visit at the doctor's clinic.</p>
              <div className="landing-how-it-works__step-icon">🏥</div>
            </div>

            <div className="landing-how-it-works__connector"></div>

            <div className="landing-how-it-works__step">
              <div className="landing-how-it-works__step-number">3</div>
              <h3>Pick Your Time</h3>
              <p>Choose your preferred date and time. For in-clinic visits, see estimated wait times. For online, get your Meet link.</p>
              <div className="landing-how-it-works__step-icon">⏰</div>
            </div>

            <div className="landing-how-it-works__connector"></div>

            <div className="landing-how-it-works__step">
              <div className="landing-how-it-works__step-number">4</div>
              <h3>Attend Your Appointment</h3>
              <p>Visit the clinic in person or join the video call from home. Get reminders and all details via email.</p>
              <div className="landing-how-it-works__step-icon">✅</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="landing-stats">
        <div className="landing-stats__container">
          <h2>Trusted by Thousands</h2>
          
          <div className="landing-stats__grid">
            {stats.map((stat, index) => (
              <div key={index} className="landing-stat-card">
                <div className="landing-stat-card__icon">{stat.icon}</div>
                <div className="landing-stat-card__number">{stat.number}</div>
                <div className="landing-stat-card__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="landing-testimonials">
        <div className="landing-testimonials__container">
          <h2>What Our Users Say</h2>
          
          <div className="landing-testimonials__grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="landing-testimonial-card">
                <div className="landing-testimonial-card__header">
                  <div className="landing-testimonial-card__avatar">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
                <p className="landing-testimonial-card__text">"{testimonial.text}"</p>
                <div className="landing-testimonial-card__stars">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="landing-contact">
        <div className="landing-contact__container">
          <div className="landing-contact__header">
            <h2>Get In Touch</h2>
            <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>
          
          <div className="landing-contact__grid">
            <div className="landing-contact__info">
              <div className="landing-contact__info-item">
                <div className="landing-contact__info-icon">📍</div>
                <div>
                  <h4>Our Location</h4>
                  <p>123 Healthcare Avenue, Medical District<br />Kolkata, West Bengal 700001</p>
                </div>
              </div>
              
              <div className="landing-contact__info-item">
                <div className="landing-contact__info-icon">📞</div>
                <div>
                  <h4>Phone Number</h4>
                  <p>+91 98765 43210<br />+91 87654 32109</p>
                </div>
              </div>
              
              <div className="landing-contact__info-item">
                <div className="landing-contact__info-icon">📧</div>
                <div>
                  <h4>Email Address</h4>
                  <p>support@healthsync.com<br />info@healthsync.com</p>
                </div>
              </div>
              
              <div className="landing-contact__info-item">
                <div className="landing-contact__info-icon">⏰</div>
                <div>
                  <h4>Working Hours</h4>
                  <p>Mon - Sat: 9:00 AM - 8:00 PM<br />Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
            
            <div className="landing-contact__form-wrapper">
              <form className="landing-contact__form" onSubmit={(e) => e.preventDefault()}>
                <div className="landing-contact__form-row">
                  <div className="landing-contact__form-group">
                    <label>Your Name</label>
                    <input type="text" placeholder="John Doe" />
                  </div>
                  <div className="landing-contact__form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="john@example.com" />
                  </div>
                </div>
                
                <div className="landing-contact__form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="+91 98765 43210" />
                </div>
                
                <div className="landing-contact__form-group">
                  <label>Subject</label>
                  <select>
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="booking">Booking Help</option>
                    <option value="feedback">Feedback</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>
                
                <div className="landing-contact__form-group">
                  <label>Your Message</label>
                  <textarea rows="4" placeholder="How can we help you?"></textarea>
                </div>
                
                <button type="submit" className="landing-contact__submit">
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta__container">
          <h2>Ready to Book Your Appointment?</h2>
          <p>Join thousands of patients using HealthSync for hassle-free doctor appointments - online video consultations or in-clinic visits.</p>
          
          <div className="landing-cta__actions">
            <button 
              className="landing-cta__btn landing-cta__btn--primary"
              onClick={() => onNavigate('register')}
            >
              Get Started Free
            </button>
            <button className="landing-cta__btn landing-cta__btn--secondary">
              Schedule a Demo
            </button>
          </div>

          <div className="landing-cta__features">
            <div className="landing-cta__feature">
              <i className="fas fa-check"></i>
              <span>No credit card required</span>
            </div>
            <div className="landing-cta__feature">
              <i className="fas fa-check"></i>
              <span>Free for first 3 appointments</span>
            </div>
            <div className="landing-cta__feature">
              <i className="fas fa-check"></i>
              <span>24/7 customer support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="landing-footer__content">
            <div className="landing-footer__section">
              <h4>HealthSync</h4>
              <p>Transforming healthcare appointments with technology and innovation.</p>
              <div className="landing-footer__social">
                <a href="#" title="Facebook"><i className="fab fa-facebook"></i></a>
                <a href="#" title="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="#" title="LinkedIn"><i className="fab fa-linkedin"></i></a>
                <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
              </div>
            </div>

            <div className="landing-footer__section">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#roadmap">Roadmap</a></li>
              </ul>
            </div>

            <div className="landing-footer__section">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>

            <div className="landing-footer__section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p>&copy; 2024 HealthSync. All rights reserved.</p>
            <p>Made with ❤️ for better healthcare</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

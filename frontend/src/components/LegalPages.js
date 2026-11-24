// frontend/src/components/LegalPages.js
// Legal pages required for PayU compliance
import '../styles/legal-pages.css';

// Company Information - Update these with your actual details
const COMPANY_INFO = {
  name: 'HealthSync Pro',
  legalName: 'HealthSync Healthcare Solutions',
  address: 'Bankura, West Bengal, India - 722101',
  email: 'info@healthsyncpro.in',
  phone: '+91-7001268485',
  website: 'https://healthsyncpro.in',
  lastUpdated: 'December 6, 2025'
};

export const TermsAndConditions = ({ onBack }) => (
  <div className="legal-page">
    <div className="legal-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>Terms and Conditions</h1>
      <p className="legal-page__updated">Last Updated: {COMPANY_INFO.lastUpdated}</p>
      
      <section>
        <h2>1. Introduction</h2>
        <p>Welcome to {COMPANY_INFO.name} ("{COMPANY_INFO.website}"). These Terms and Conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.</p>
        <p>{COMPANY_INFO.name} is operated by {COMPANY_INFO.legalName}, a company registered in India.</p>
      </section>

      <section>
        <h2>2. Services</h2>
        <p>{COMPANY_INFO.name} provides an online healthcare platform that enables:</p>
        <ul>
          <li>Online doctor appointment booking</li>
          <li>Video consultations with verified healthcare professionals</li>
          <li>In-clinic appointment scheduling</li>
          <li>AI-powered health assistance</li>
          <li>Secure messaging with healthcare providers</li>
          <li>Health records management</li>
        </ul>
      </section>

      <section>
        <h2>3. User Registration</h2>
        <p>To use our services, you must:</p>
        <ul>
          <li>Be at least 18 years of age or have parental consent</li>
          <li>Provide accurate and complete registration information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorized access</li>
        </ul>
      </section>

      <section>
        <h2>4. Appointment Booking & Payments</h2>
        <p>When booking appointments through our platform:</p>
        <ul>
          <li>All consultation fees are displayed before booking confirmation</li>
          <li>Payments are processed securely through PayU payment gateway</li>
          <li>You will receive confirmation via email and SMS</li>
          <li>Appointment times are subject to doctor availability</li>
        </ul>
      </section>

      <section>
        <h2>5. Cancellation & Rescheduling</h2>
        <p>You may cancel or reschedule appointments:</p>
        <ul>
          <li>Free cancellation up to 2 hours before the scheduled appointment</li>
          <li>Cancellations within 2 hours may be subject to charges</li>
          <li>Refunds are processed within 5-7 business days</li>
          <li>See our Refund Policy for complete details</li>
        </ul>
      </section>

      <section>
        <h2>6. Medical Disclaimer</h2>
        <p><strong>Important:</strong> {COMPANY_INFO.name} is a technology platform that connects patients with healthcare providers. We do not:</p>
        <ul>
          <li>Provide medical advice, diagnosis, or treatment</li>
          <li>Replace in-person medical consultations for emergencies</li>
          <li>Guarantee specific medical outcomes</li>
        </ul>
        <p>Always seek immediate medical attention for emergencies by calling emergency services or visiting the nearest hospital.</p>
      </section>

      <section>
        <h2>7. User Conduct</h2>
        <p>Users agree not to:</p>
        <ul>
          <li>Provide false or misleading information</li>
          <li>Misuse the platform for non-medical purposes</li>
          <li>Harass or abuse healthcare providers</li>
          <li>Attempt to circumvent platform security</li>
          <li>Share account credentials with others</li>
        </ul>
      </section>

      <section>
        <h2>8. Intellectual Property</h2>
        <p>All content on {COMPANY_INFO.name}, including logos, text, graphics, and software, is the property of {COMPANY_INFO.legalName} and protected by intellectual property laws.</p>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <p>{COMPANY_INFO.name} shall not be liable for:</p>
        <ul>
          <li>Medical outcomes resulting from consultations</li>
          <li>Technical issues beyond our reasonable control</li>
          <li>Third-party service interruptions</li>
          <li>Indirect or consequential damages</li>
        </ul>
      </section>

      <section>
        <h2>10. Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bankura, West Bengal.</p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>For questions about these Terms and Conditions:</p>
        <ul>
          <li>Email: {COMPANY_INFO.email}</li>
          <li>Phone: {COMPANY_INFO.phone}</li>
          <li>Address: {COMPANY_INFO.address}</li>
        </ul>
      </section>
    </div>
  </div>
);

export const PrivacyPolicy = ({ onBack }) => (
  <div className="legal-page">
    <div className="legal-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>Privacy Policy</h1>
      <p className="legal-page__updated">Last Updated: {COMPANY_INFO.lastUpdated}</p>
      
      <section>
        <h2>1. Introduction</h2>
        <p>{COMPANY_INFO.legalName} ("we", "us", "our") operates {COMPANY_INFO.name}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <h3>Personal Information:</h3>
        <ul>
          <li>Name, email address, phone number</li>
          <li>Date of birth, gender</li>
          <li>Address and location data</li>
          <li>Government ID (for verification purposes)</li>
        </ul>
        <h3>Health Information:</h3>
        <ul>
          <li>Medical history and symptoms</li>
          <li>Prescriptions and medications</li>
          <li>Lab reports and medical records</li>
          <li>Consultation notes</li>
        </ul>
        <h3>Technical Information:</h3>
        <ul>
          <li>Device information and IP address</li>
          <li>Browser type and version</li>
          <li>Usage patterns and preferences</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our services</li>
          <li>To process appointments and payments</li>
          <li>To communicate with you about appointments</li>
          <li>To improve our platform and services</li>
          <li>To comply with legal obligations</li>
          <li>To send health reminders and notifications (with consent)</li>
        </ul>
      </section>

      <section>
        <h2>4. Data Security</h2>
        <p>We implement industry-standard security measures:</p>
        <ul>
          <li>256-bit SSL encryption for data transmission</li>
          <li>Encrypted storage of sensitive health data</li>
          <li>Regular security audits and penetration testing</li>
          <li>Access controls and authentication protocols</li>
          <li>HIPAA-compliant data handling practices</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Sharing</h2>
        <p>We may share your information with:</p>
        <ul>
          <li><strong>Healthcare Providers:</strong> Doctors you consult with</li>
          <li><strong>Payment Processors:</strong> PayU for secure payment processing</li>
          <li><strong>Service Providers:</strong> Cloud hosting, email services</li>
          <li><strong>Legal Authorities:</strong> When required by law</li>
        </ul>
        <p>We never sell your personal or health information to third parties.</p>
      </section>

      <section>
        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for marketing communications</li>
          <li>Export your health records</li>
        </ul>
      </section>

      <section>
        <h2>7. Cookies</h2>
        <p>We use cookies to enhance your experience. You can control cookie preferences through your browser settings.</p>
      </section>

      <section>
        <h2>8. Data Retention</h2>
        <p>We retain your data for:</p>
        <ul>
          <li>Account information: Until account deletion</li>
          <li>Health records: As required by medical regulations (typically 7-10 years)</li>
          <li>Transaction records: As required by tax laws</li>
        </ul>
      </section>

      <section>
        <h2>9. Children's Privacy</h2>
        <p>Our services are not intended for children under 18 without parental consent. Parents/guardians can create accounts for minors.</p>
      </section>

      <section>
        <h2>10. Contact Us</h2>
        <p>For privacy-related inquiries:</p>
        <ul>
          <li>Email: {COMPANY_INFO.email}</li>
          <li>Phone: {COMPANY_INFO.phone}</li>
          <li>Address: {COMPANY_INFO.address}</li>
        </ul>
      </section>
    </div>
  </div>
);

export const RefundPolicy = ({ onBack }) => (
  <div className="legal-page">
    <div className="legal-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>Refund & Cancellation Policy</h1>
      <p className="legal-page__updated">Last Updated: {COMPANY_INFO.lastUpdated}</p>
      
      <section>
        <h2>1. Cancellation Policy</h2>
        <h3>Patient-Initiated Cancellations:</h3>
        <ul>
          <li><strong>More than 24 hours before appointment:</strong> Full refund</li>
          <li><strong>2-24 hours before appointment:</strong> 90% refund</li>
          <li><strong>Less than 2 hours before appointment:</strong> 50% refund</li>
          <li><strong>No-show:</strong> No refund</li>
        </ul>
        
        <h3>Doctor-Initiated Cancellations:</h3>
        <ul>
          <li>Full refund will be processed automatically</li>
          <li>Option to reschedule with the same or different doctor</li>
          <li>Priority booking for rescheduled appointments</li>
        </ul>
      </section>

      <section>
        <h2>2. Refund Process</h2>
        <ul>
          <li>Refunds are initiated within 24-48 hours of cancellation</li>
          <li>Amount will be credited to the original payment method</li>
          <li>Bank processing time: 5-7 business days</li>
          <li>UPI refunds: 1-3 business days</li>
          <li>Credit/Debit cards: 5-7 business days</li>
        </ul>
      </section>

      <section>
        <h2>3. Eligible Refund Scenarios</h2>
        <ul>
          <li>Doctor unavailability or cancellation</li>
          <li>Technical issues preventing consultation</li>
          <li>Duplicate payment</li>
          <li>Service not rendered as described</li>
          <li>Platform errors during booking</li>
        </ul>
      </section>

      <section>
        <h2>4. Non-Refundable Scenarios</h2>
        <ul>
          <li>Completed consultations</li>
          <li>Patient no-show without prior cancellation</li>
          <li>Cancellation after consultation has started</li>
          <li>Dissatisfaction with medical advice (not a valid refund reason)</li>
        </ul>
      </section>

      <section>
        <h2>5. How to Request a Refund</h2>
        <ol>
          <li>Log in to your {COMPANY_INFO.name} account</li>
          <li>Go to "My Appointments" section</li>
          <li>Select the appointment and click "Cancel/Request Refund"</li>
          <li>Or contact us at {COMPANY_INFO.email}</li>
        </ol>
      </section>

      <section>
        <h2>6. Rescheduling</h2>
        <p>Instead of cancellation, you can reschedule:</p>
        <ul>
          <li>Free rescheduling up to 2 hours before appointment</li>
          <li>Subject to doctor availability</li>
          <li>One free reschedule per booking</li>
        </ul>
      </section>

      <section>
        <h2>7. Disputes</h2>
        <p>For refund disputes, please contact our support team:</p>
        <ul>
          <li>Email: {COMPANY_INFO.email}</li>
          <li>Phone: {COMPANY_INFO.phone}</li>
          <li>Response time: Within 24-48 hours</li>
        </ul>
      </section>
    </div>
  </div>
);

export const ContactUs = ({ onBack }) => (
  <div className="legal-page contact-page">
    <div className="legal-page__container contact-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>Contact Us</h1>
      
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero__icon">
          <i className="fas fa-headset"></i>
        </div>
        <h2>We'd Love to Hear From You</h2>
        <p>Have questions about our services? Need help with an appointment? Our team is here to assist you 24/7.</p>
      </section>

      {/* Contact Cards */}
      <div className="contact-grid">
        <div className="contact-card contact-card--primary">
          <div className="contact-card__icon">
            <i className="fas fa-phone-alt"></i>
          </div>
          <h3>Call Us</h3>
          <p className="contact-card__subtitle">Speak directly with our team</p>
          <a href={`tel:${COMPANY_INFO.phone}`} className="contact-card__link">{COMPANY_INFO.phone}</a>
          <span className="contact-card__badge">
            <i className="fas fa-clock"></i> Mon-Sat: 9AM - 8PM IST
          </span>
        </div>

        <div className="contact-card contact-card--secondary">
          <div className="contact-card__icon">
            <i className="fas fa-envelope"></i>
          </div>
          <h3>Email Us</h3>
          <p className="contact-card__subtitle">Get response within 24 hours</p>
          <a href={`mailto:${COMPANY_INFO.email}`} className="contact-card__link">{COMPANY_INFO.email}</a>
          <span className="contact-card__badge">
            <i className="fas fa-reply"></i> Quick Response
          </span>
        </div>

        <div className="contact-card contact-card--accent">
          <div className="contact-card__icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3>Visit Us</h3>
          <p className="contact-card__subtitle">Our office location</p>
          <p className="contact-card__address">{COMPANY_INFO.address}</p>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_INFO.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card__map-link"
          >
            <i className="fas fa-directions"></i> Get Directions
          </a>
        </div>

        <div className="contact-card contact-card--info">
          <div className="contact-card__icon">
            <i className="fab fa-whatsapp"></i>
          </div>
          <h3>WhatsApp</h3>
          <p className="contact-card__subtitle">Quick chat support</p>
          <a 
            href={`https://wa.me/917001268485?text=Hi, I need help with HealthSync Pro`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card__link"
          >
            Chat on WhatsApp
          </a>
          <span className="contact-card__badge">
            <i className="fas fa-bolt"></i> Instant Reply
          </span>
        </div>
      </div>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="contact-form-header">
          <h2><i className="fas fa-paper-plane"></i> Send Us a Message</h2>
          <p>Fill out the form below and we'll get back to you as soon as possible.</p>
        </div>
        
        <form className="contact-form" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const submitBtn = e.target.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          
          try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5005'}/api/contact/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message')
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('✅ ' + data.message);
              e.target.reset();
            } else {
              alert('❌ ' + (data.message || 'Failed to send message'));
            }
          } catch (error) {
            console.error('Contact form error:', error);
            // Fallback to mailto
            const mailtoLink = `mailto:${COMPANY_INFO.email}?subject=${encodeURIComponent(formData.get('subject'))}&body=${encodeURIComponent(`Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\nPhone: ${formData.get('phone')}\n\nMessage:\n${formData.get('message')}`)}`;
            window.location.href = mailtoLink;
          } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
          }
        }}>
          <div className="contact-form__row">
            <div className="contact-form__group">
              <label htmlFor="name">
                <i className="fas fa-user"></i> Full Name *
              </label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Enter your full name"
                required 
              />
            </div>
            <div className="contact-form__group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i> Email Address *
              </label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter your email"
                required 
              />
            </div>
          </div>
          
          <div className="contact-form__row">
            <div className="contact-form__group">
              <label htmlFor="phone">
                <i className="fas fa-phone"></i> Phone Number
              </label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                placeholder="Enter your phone number"
              />
            </div>
            <div className="contact-form__group">
              <label htmlFor="subject">
                <i className="fas fa-tag"></i> Subject *
              </label>
              <select id="subject" name="subject" required>
                <option value="">Select a subject</option>
                <option value="Appointment Help">Appointment Help</option>
                <option value="Payment & Refund">Payment & Refund</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Doctor Registration">Doctor Registration</option>
                <option value="Partnership Inquiry">Partnership Inquiry</option>
                <option value="Feedback">Feedback</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="contact-form__group contact-form__group--full">
            <label htmlFor="message">
              <i className="fas fa-comment-alt"></i> Your Message *
            </label>
            <textarea 
              id="message" 
              name="message" 
              rows="5" 
              placeholder="Tell us how we can help you..."
              required
            ></textarea>
          </div>
          
          <button type="submit" className="contact-form__submit">
            <i className="fas fa-paper-plane"></i> Send Message
          </button>
        </form>
      </section>

      {/* Support Categories */}
      <section className="support-categories">
        <h2><i className="fas fa-life-ring"></i> How Can We Help?</h2>
        <div className="support-grid">
          <div className="support-item">
            <div className="support-item__icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h4>Appointment Issues</h4>
            <p>Help with booking, rescheduling, or cancelling appointments</p>
          </div>
          <div className="support-item">
            <div className="support-item__icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <h4>Payment & Refunds</h4>
            <p>Questions about payments, refunds, or billing</p>
          </div>
          <div className="support-item">
            <div className="support-item__icon">
              <i className="fas fa-user-md"></i>
            </div>
            <h4>Doctor Registration</h4>
            <p>Join our platform as a healthcare provider</p>
          </div>
          <div className="support-item">
            <div className="support-item__icon">
              <i className="fas fa-cog"></i>
            </div>
            <h4>Technical Support</h4>
            <p>App issues, login problems, or technical help</p>
          </div>
        </div>
      </section>

      {/* Business Info */}
      <section className="business-info">
        <div className="business-info__card">
          <h2><i className="fas fa-building"></i> Business Information</h2>
          <div className="business-info__grid">
            <div className="business-info__item">
              <span className="business-info__label">Company Name</span>
              <span className="business-info__value">{COMPANY_INFO.legalName}</span>
            </div>
            <div className="business-info__item">
              <span className="business-info__label">Registered Address</span>
              <span className="business-info__value">{COMPANY_INFO.address}</span>
            </div>
            <div className="business-info__item">
              <span className="business-info__label">Email</span>
              <span className="business-info__value">{COMPANY_INFO.email}</span>
            </div>
            <div className="business-info__item">
              <span className="business-info__label">Phone</span>
              <span className="business-info__value">{COMPANY_INFO.phone}</span>
            </div>
            <div className="business-info__item">
              <span className="business-info__label">Website</span>
              <span className="business-info__value">{COMPANY_INFO.website}</span>
            </div>
            <div className="business-info__item">
              <span className="business-info__label">Business Hours</span>
              <span className="business-info__value">Mon-Sat: 9:00 AM - 8:00 PM IST</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grievance Officer - Required by Indian IT Act */}
      <section className="grievance-section">
        <h2><i className="fas fa-gavel"></i> Grievance Officer</h2>
        <p>In accordance with Information Technology Act 2000 and Consumer Protection Act 2019:</p>
        <div className="grievance-card">
          <div className="grievance-card__icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="grievance-card__info">
            <h4>Grievance Redressal Officer</h4>
            <p><i className="fas fa-envelope"></i> {COMPANY_INFO.email}</p>
            <p><i className="fas fa-phone"></i> {COMPANY_INFO.phone}</p>
            <p><i className="fas fa-map-marker-alt"></i> {COMPANY_INFO.address}</p>
            <p className="grievance-card__note">
              <i className="fas fa-info-circle"></i> Complaints will be acknowledged within 48 hours and resolved within 30 days.
            </p>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="social-section">
        <h2>Connect With Us</h2>
        <div className="social-links">
          <a href="#" className="social-link social-link--facebook" title="Facebook">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#" className="social-link social-link--twitter" title="Twitter">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#" className="social-link social-link--instagram" title="Instagram">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="social-link social-link--linkedin" title="LinkedIn">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a href="#" className="social-link social-link--youtube" title="YouTube">
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </section>
    </div>
  </div>
);

export const AboutUs = ({ onBack }) => (
  <div className="legal-page">
    <div className="legal-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>About Us</h1>
      
      <section className="about-hero">
        <div className="about-hero__icon">
          <i className="fas fa-heartbeat"></i>
        </div>
        <h2>Making Healthcare Accessible for Everyone</h2>
        <p>{COMPANY_INFO.name} is a comprehensive healthcare platform connecting patients with verified doctors across India.</p>
      </section>

      <section>
        <h2>Our Mission</h2>
        <p>To democratize healthcare access by leveraging technology, making quality medical consultations available to everyone, anywhere, anytime.</p>
      </section>

      <section>
        <h2>What We Offer</h2>
        <div className="features-grid">
          <div className="feature-item">
            <i className="fas fa-video"></i>
            <h4>Video Consultations</h4>
            <p>Connect with doctors from the comfort of your home through secure video calls.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-hospital"></i>
            <h4>In-Clinic Appointments</h4>
            <p>Book appointments at clinics and hospitals near you with real-time availability.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-robot"></i>
            <h4>AI Health Assistant</h4>
            <p>Get instant health guidance and symptom analysis powered by advanced AI.</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-shield-alt"></i>
            <h4>Secure & Private</h4>
            <p>Your health data is encrypted and protected with industry-leading security.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Our Numbers</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Verified Doctors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50,000+</span>
            <span className="stat-label">Happy Patients</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100+</span>
            <span className="stat-label">Specialties</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Why Choose Us</h2>
        <ul>
          <li><strong>Verified Doctors:</strong> All healthcare providers are verified with valid medical licenses</li>
          <li><strong>Transparent Pricing:</strong> No hidden fees, clear consultation charges</li>
          <li><strong>Easy Booking:</strong> Book appointments in under 2 minutes</li>
          <li><strong>Secure Payments:</strong> Safe transactions through PayU payment gateway</li>
          <li><strong>24/7 Support:</strong> Round-the-clock customer support</li>
          <li><strong>Multi-language:</strong> Available in English, Hindi, and Bengali</li>
        </ul>
      </section>

      <section>
        <h2>Company Information</h2>
        <ul>
          <li><strong>Company Name:</strong> {COMPANY_INFO.legalName}</li>
          <li><strong>Registered Address:</strong> {COMPANY_INFO.address}</li>
          <li><strong>Email:</strong> {COMPANY_INFO.email}</li>
          <li><strong>Phone:</strong> {COMPANY_INFO.phone}</li>
          <li><strong>Website:</strong> {COMPANY_INFO.website}</li>
        </ul>
      </section>
    </div>
  </div>
);

export default {
  TermsAndConditions,
  PrivacyPolicy,
  RefundPolicy,
  ContactUs,
  AboutUs
};

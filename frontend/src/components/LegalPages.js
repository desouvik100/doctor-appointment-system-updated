// frontend/src/components/LegalPages.js
// Legal pages required for PayU compliance
import '../styles/legal-pages.css';

// Company Information - Update these with your actual details
const COMPANY_INFO = {
  name: 'HealthSync Pro',
  legalName: 'HealthSync Healthcare Solutions',
  address: 'Bankura, West Bengal, India - 722101',
  email: 'desouvik0000@gmail.com',
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
  <div className="legal-page">
    <div className="legal-page__container">
      <button className="legal-page__back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>
      
      <h1>Contact Us</h1>
      
      <section className="contact-hero">
        <p>We're here to help! Reach out to us through any of the following channels.</p>
      </section>

      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-card__icon">
            <i className="fas fa-envelope"></i>
          </div>
          <h3>Email Support</h3>
          <p>For general inquiries and support</p>
          <a href={`mailto:${COMPANY_INFO.email}`}>{COMPANY_INFO.email}</a>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon">
            <i className="fas fa-phone-alt"></i>
          </div>
          <h3>Phone Support</h3>
          <p>Mon-Sat: 9:00 AM - 8:00 PM IST</p>
          <a href={`tel:${COMPANY_INFO.phone}`}>{COMPANY_INFO.phone}</a>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3>Office Address</h3>
          <p>{COMPANY_INFO.legalName}</p>
          <p>{COMPANY_INFO.address}</p>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon">
            <i className="fas fa-clock"></i>
          </div>
          <h3>Business Hours</h3>
          <p>Monday - Saturday</p>
          <p>9:00 AM - 8:00 PM IST</p>
        </div>
      </div>

      <section>
        <h2>Quick Links</h2>
        <ul>
          <li><strong>Appointment Issues:</strong> {COMPANY_INFO.email}</li>
          <li><strong>Payment & Refunds:</strong> {COMPANY_INFO.email}</li>
          <li><strong>Technical Support:</strong> {COMPANY_INFO.email}</li>
          <li><strong>Doctor Registration:</strong> {COMPANY_INFO.email}</li>
        </ul>
      </section>

      <section>
        <h2>Response Time</h2>
        <ul>
          <li>Email: Within 24 hours</li>
          <li>Phone: Immediate during business hours</li>
          <li>In-app chat: Within 2 hours</li>
        </ul>
      </section>

      <section>
        <h2>Grievance Officer</h2>
        <p>In accordance with Information Technology Act 2000 and rules made thereunder:</p>
        <ul>
          <li><strong>Name:</strong> Grievance Officer</li>
          <li><strong>Email:</strong> {COMPANY_INFO.email}</li>
          <li><strong>Phone:</strong> {COMPANY_INFO.phone}</li>
          <li><strong>Address:</strong> {COMPANY_INFO.address}</li>
        </ul>
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

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './CorporateWellness.css';

const CorporateWellness = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    employeeCount: '',
    message: ''
  });

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      employees: '10-50',
      price: '₹199',
      perEmployee: true,
      features: [
        'Annual health checkups',
        'Doctor consultations (2/month)',
        'Health awareness sessions',
        'Basic health analytics',
        'Email support'
      ],
      color: '#3b82f6'
    },
    {
      id: 'business',
      name: 'Business',
      employees: '51-200',
      price: '₹149',
      perEmployee: true,
      popular: true,
      features: [
        'Comprehensive health checkups',
        'Unlimited doctor consultations',
        'Mental health support',
        'On-site health camps',
        'Advanced analytics dashboard',
        'Dedicated account manager',
        'Priority support'
      ],
      color: '#10b981'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      employees: '200+',
      price: 'Custom',
      perEmployee: false,
      features: [
        'Everything in Business',
        'On-site clinic setup',
        'Custom wellness programs',
        'Executive health packages',
        'Family coverage options',
        'API integration',
        '24/7 dedicated support',
        'Quarterly health reports'
      ],
      color: '#8b5cf6'
    }
  ];

  const benefits = [
    { icon: 'fa-chart-line', title: 'Reduce Absenteeism', desc: 'Up to 30% reduction in sick leaves' },
    { icon: 'fa-heart', title: 'Boost Productivity', desc: 'Healthier employees perform better' },
    { icon: 'fa-users', title: 'Attract Talent', desc: 'Stand out as an employer of choice' },
    { icon: 'fa-piggy-bank', title: 'Lower Healthcare Costs', desc: 'Preventive care saves money' },
    { icon: 'fa-smile', title: 'Improve Morale', desc: 'Show employees you care' },
    { icon: 'fa-shield-alt', title: 'Risk Management', desc: 'Early detection of health issues' }
  ];

  const services = [
    { icon: 'fa-stethoscope', name: 'Health Checkups', desc: 'Comprehensive annual health screenings' },
    { icon: 'fa-video', name: 'Teleconsultations', desc: 'Unlimited video consultations with doctors' },
    { icon: 'fa-brain', name: 'Mental Wellness', desc: 'Counseling and stress management programs' },
    { icon: 'fa-dumbbell', name: 'Fitness Programs', desc: 'Yoga, meditation, and fitness sessions' },
    { icon: 'fa-apple-alt', name: 'Nutrition Guidance', desc: 'Diet plans and nutrition counseling' },
    { icon: 'fa-hospital', name: 'On-site Clinics', desc: 'Set up health centers at your office' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Simulate form submission
    toast.success('Thank you! Our team will contact you within 24 hours.');
    setShowContactForm(false);
    setFormData({
      companyName: '', contactPerson: '', email: '',
      phone: '', employeeCount: '', message: ''
    });
  };

  return (
    <div className="corporate-wellness">
      {/* Hero Section */}
      <section className="cw-hero">
        <div className="cw-hero__content">
          <span className="cw-hero__badge">
            <i className="fas fa-building"></i> For Businesses
          </span>
          <h1>Corporate Wellness Programs</h1>
          <p>Invest in your employees' health. Boost productivity, reduce absenteeism, and create a healthier workplace.</p>
          <div className="cw-hero__stats">
            <div className="stat">
              <span className="value">500+</span>
              <span className="label">Companies Trust Us</span>
            </div>
            <div className="stat">
              <span className="value">1M+</span>
              <span className="label">Employees Covered</span>
            </div>
            <div className="stat">
              <span className="value">30%</span>
              <span className="label">Avg. Cost Savings</span>
            </div>
          </div>
          <button className="cw-hero__cta" onClick={() => setShowContactForm(true)}>
            <i className="fas fa-phone"></i> Get a Free Consultation
          </button>
        </div>
        <div className="cw-hero__visual">
          <div className="cw-hero__card">
            <div className="card-header">
              <i className="fas fa-building"></i>
              <span>Corporate Dashboard</span>
            </div>
            <div className="card-stats">
              <div className="mini-stat">
                <span className="num">2,450</span>
                <span className="lbl">Employees</span>
              </div>
              <div className="mini-stat">
                <span className="num">98%</span>
                <span className="lbl">Satisfaction</span>
              </div>
            </div>
            <div className="card-chart">
              <div className="bar" style={{height: '40%'}}></div>
              <div className="bar" style={{height: '60%'}}></div>
              <div className="bar" style={{height: '80%'}}></div>
              <div className="bar" style={{height: '55%'}}></div>
              <div className="bar" style={{height: '90%'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="cw-benefits">
        <h2>Why Corporate Wellness?</h2>
        <div className="benefits-grid">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-icon">
                <i className={`fas ${benefit.icon}`}></i>
              </div>
              <h4>{benefit.title}</h4>
              <p>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="cw-services">
        <h2>Our Services</h2>
        <div className="services-grid">
          {services.map((service, idx) => (
            <div key={idx} className="service-card">
              <i className={`fas ${service.icon}`}></i>
              <h4>{service.name}</h4>
              <p>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="cw-pricing">
        <h2>Flexible Plans for Every Business</h2>
        <p className="pricing-subtitle">Choose a plan that fits your organization's needs</p>
        
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`} style={{'--plan-color': plan.color}}>
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <h3>{plan.name}</h3>
              <p className="employee-range">{plan.employees} employees</p>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                {plan.perEmployee && <span className="per">/employee/month</span>}
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <i className="fas fa-check"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="plan-btn" onClick={() => setShowContactForm(true)}>
                {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="cw-testimonials">
        <h2>Trusted by Leading Companies</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="quote">"HealthSync's corporate wellness program has transformed our workplace. Employee satisfaction is at an all-time high."</div>
            <div className="author">
              <div className="avatar">RS</div>
              <div>
                <strong>Rahul Sharma</strong>
                <span>HR Director, TechCorp India</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="quote">"We've seen a 25% reduction in sick leaves since implementing the wellness program. The ROI is incredible."</div>
            <div className="author">
              <div className="avatar">PM</div>
              <div>
                <strong>Priya Mehta</strong>
                <span>CEO, StartupHub</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="quote">"The on-site health camps and mental wellness sessions have been a game-changer for our team's morale."</div>
            <div className="author">
              <div className="avatar">AK</div>
              <div>
                <strong>Amit Kumar</strong>
                <span>COO, FinanceFirst</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cw-cta">
        <h2>Ready to Transform Your Workplace?</h2>
        <p>Join 500+ companies that trust HealthSync for their employee wellness needs</p>
        <button onClick={() => setShowContactForm(true)}>
          <i className="fas fa-calendar-check"></i> Schedule a Demo
        </button>
      </section>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="modal-overlay" onClick={() => setShowContactForm(false)}>
          <div className="contact-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowContactForm(false)}>
              <i className="fas fa-times"></i>
            </button>
            <h3><i className="fas fa-building"></i> Get Corporate Wellness Quote</h3>
            <p>Fill in your details and our team will contact you within 24 hours</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Your company name"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="work@company.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Number of Employees</label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({...formData, employeeCount: e.target.value})}
                >
                  <option value="">Select range</option>
                  <option value="10-50">10-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us about your requirements..."
                  rows="3"
                />
              </div>
              <button type="submit" className="submit-btn">
                <i className="fas fa-paper-plane"></i> Submit Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateWellness;

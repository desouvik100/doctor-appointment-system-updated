import React, { useState } from 'react';
import './ReviewsSection.css';

const ReviewsSection = () => {
  const [activeReview, setActiveReview] = useState(0);

  const reviews = [
    {
      name: 'Sarah Johnson',
      role: 'Patient',
      avatar: '👩‍⚕️',
      rating: 5,
      text: 'HealthSync transformed how I manage my healthcare. Booking appointments is so easy, and the AI assistant helped me understand my symptoms before my visit.',
      stats: { before: 'Waited 2 weeks', after: 'Same day appointment' }
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Cardiologist',
      avatar: '👨‍⚕️',
      rating: 5,
      text: 'As a doctor, this platform has streamlined my practice. Patient management is effortless, and the analytics help me provide better care.',
      stats: { before: '20 patients/day', after: '35 patients/day' }
    },
    {
      name: 'Emily Rodriguez',
      role: 'Clinic Manager',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Our clinic efficiency increased by 60% after implementing HealthSync. The scheduling system alone saved us countless hours.',
      stats: { before: '60% efficiency', after: '96% efficiency' }
    },
    {
      name: 'James Wilson',
      role: 'Patient',
      avatar: '👨',
      rating: 5,
      text: 'The telemedicine feature is a game-changer. I can consult with my doctor from home, and the AI symptom checker gives me peace of mind.',
      stats: { before: '3 hour commute', after: '5 min video call' }
    },
    {
      name: 'Dr. Lisa Park',
      role: 'General Practitioner',
      avatar: '👩‍⚕️',
      rating: 5,
      text: 'The patient portal has improved communication dramatically. My patients are more engaged and informed about their health.',
      stats: { before: '40% engagement', after: '92% engagement' }
    }
  ];

  const successStats = [
    { value: '98%', label: 'Patient Satisfaction', icon: 'smile' },
    { value: '500K+', label: 'Happy Patients', icon: 'users' },
    { value: '4.9/5', label: 'Average Rating', icon: 'star' },
    { value: '95%', label: 'Would Recommend', icon: 'thumbs-up' }
  ];

  const nextReview = () => {
    setActiveReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setActiveReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section className="reviews-section">
      <div className="container">
        <div className="reviews-header">
          <h2 className="reviews-title">
            What Our Users Say
          </h2>
          <p className="reviews-subtitle">
            Real stories from real people who transformed their healthcare experience
          </p>
        </div>

        {/* Success Stats */}
        <div className="success-stats">
          {successStats.map((stat, idx) => (
            <div key={idx} className="success-stat-item">
              <div className="success-stat-icon">
                <i className={`fas fa-${stat.icon}`}></i>
              </div>
              <div className="success-stat-value">{stat.value}</div>
              <div className="success-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Review Carousel */}
        <div className="review-carousel">
          <button className="carousel-btn prev" onClick={prevReview}>
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="review-cards-container">
            {reviews.map((review, idx) => (
              <div
                key={idx}
                className={`review-card ${idx === activeReview ? 'active' : ''} ${
                  idx === (activeReview - 1 + reviews.length) % reviews.length ? 'prev' : ''
                } ${idx === (activeReview + 1) % reviews.length ? 'next' : ''}`}
              >
                <div className="review-header">
                  <div className="reviewer-avatar">{review.avatar}</div>
                  <div className="reviewer-info">
                    <h4 className="reviewer-name">{review.name}</h4>
                    <p className="reviewer-role">{review.role}</p>
                  </div>
                  <div className="review-rating">
                    {[...Array(review.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                </div>

                <p className="review-text">{review.text}</p>

                <div className="review-stats">
                  <div className="review-stat before">
                    <span className="stat-label">Before</span>
                    <span className="stat-value">{review.stats.before}</span>
                  </div>
                  <div className="stat-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                  <div className="review-stat after">
                    <span className="stat-label">After</span>
                    <span className="stat-value">{review.stats.after}</span>
                  </div>
                </div>

                <div className="verified-badge">
                  <i className="fas fa-check-circle"></i>
                  Verified Patient
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-btn next" onClick={nextReview}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              className={`indicator ${idx === activeReview ? 'active' : ''}`}
              onClick={() => setActiveReview(idx)}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="reviews-cta">
          <h3>Join Thousands of Satisfied Users</h3>
          <p>Experience the future of healthcare management today</p>
          <button className="cta-button">
            <i className="fas fa-rocket me-2"></i>
            Get Started Free
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

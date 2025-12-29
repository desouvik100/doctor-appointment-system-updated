// frontend/src/components/RefundPolicy.js
// Displays refund policy information

import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import './RefundPolicy.css';

const RefundPolicy = ({ showAsModal = false, onClose }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await axios.get('/api/refunds/policy');
      if (response.data.success) {
        setPolicy(response.data.policy);
      }
    } catch (error) {
      console.error('Error fetching refund policy:', error);
      // Set default policy if API fails
      setPolicy({
        patientCancellation: {
          moreThan6Hours: {
            refundPercentage: 100,
            description: '100% refund (payment gateway fee of 2.5% may be deducted)'
          },
          lessThan6Hours: {
            refundPercentage: 50,
            description: '50% refund - doctor slot was blocked'
          }
        },
        doctorCancellation: {
          refundPercentage: 100,
          walletCredit: 50,
          description: '100% refund + ₹50 wallet credit as compensation'
        },
        noShow: {
          refundPercentage: 0,
          description: 'No refund for missed appointments'
        },
        fullRefundWindowHours: 6
      });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="refund-policy">
      <div className="refund-policy__header">
        <div className="refund-policy__icon">
          <i className="fas fa-shield-alt"></i>
        </div>
        <h2>Refund Policy</h2>
        <p>Transparent and fair cancellation policy</p>
      </div>

      {loading ? (
        <div className="refund-policy__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading policy...</span>
        </div>
      ) : policy ? (
        <div className="refund-policy__content">
          {/* Patient Cancellation */}
          <div className="refund-policy__section">
            <div className="refund-policy__section-header">
              <i className="fas fa-user"></i>
              <h3>Patient Cancellation</h3>
            </div>

            <div className="refund-policy__card refund-policy__card--green">
              <div className="refund-policy__card-header">
                <span className="refund-policy__badge refund-policy__badge--green">
                  <i className="fas fa-check-circle"></i>
                  100% Refund
                </span>
                <span className="refund-policy__time">
                  <i className="fas fa-clock"></i>
                  More than {policy.fullRefundWindowHours} hours before
                </span>
              </div>
              <p className="refund-policy__description">
                {policy.patientCancellation.moreThan6Hours.description}
              </p>
              <div className="refund-policy__example">
                <strong>Example:</strong> Appointment at 3:00 PM → Cancel before 9:00 AM for full refund
              </div>
            </div>

            <div className="refund-policy__card refund-policy__card--orange">
              <div className="refund-policy__card-header">
                <span className="refund-policy__badge refund-policy__badge--orange">
                  <i className="fas fa-exclamation-circle"></i>
                  50% Refund
                </span>
                <span className="refund-policy__time">
                  <i className="fas fa-clock"></i>
                  Less than {policy.fullRefundWindowHours} hours before
                </span>
              </div>
              <p className="refund-policy__description">
                {policy.patientCancellation.lessThan6Hours.description}
              </p>
              <div className="refund-policy__reason">
                <i className="fas fa-info-circle"></i>
                <span>The doctor's slot was blocked and couldn't be given to another patient</span>
              </div>
            </div>
          </div>

          {/* Doctor Cancellation */}
          <div className="refund-policy__section">
            <div className="refund-policy__section-header">
              <i className="fas fa-user-md"></i>
              <h3>Doctor/Clinic Cancellation</h3>
            </div>

            <div className="refund-policy__card refund-policy__card--blue">
              <div className="refund-policy__card-header">
                <span className="refund-policy__badge refund-policy__badge--green">
                  <i className="fas fa-check-circle"></i>
                  100% Refund
                </span>
                <span className="refund-policy__bonus">
                  <i className="fas fa-gift"></i>
                  + ₹{policy.doctorCancellation.walletCredit} Wallet Credit
                </span>
              </div>
              <p className="refund-policy__description">
                {policy.doctorCancellation.description}
              </p>
              <div className="refund-policy__highlight">
                <i className="fas fa-heart"></i>
                <span>We value your time! Get compensated if the doctor cancels.</span>
              </div>
            </div>
          </div>

          {/* No Show */}
          <div className="refund-policy__section">
            <div className="refund-policy__section-header">
              <i className="fas fa-calendar-times"></i>
              <h3>Missed Appointment (No-Show)</h3>
            </div>

            <div className="refund-policy__card refund-policy__card--red">
              <div className="refund-policy__card-header">
                <span className="refund-policy__badge refund-policy__badge--red">
                  <i className="fas fa-times-circle"></i>
                  No Refund
                </span>
              </div>
              <p className="refund-policy__description">
                {policy.noShow.description}
              </p>
              <div className="refund-policy__tip">
                <i className="fas fa-lightbulb"></i>
                <span>Set reminders to avoid missing your appointment!</span>
              </div>
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="refund-policy__timeline">
            <h4>
              <i className="fas fa-hourglass-half"></i>
              Refund Timeline
            </h4>
            <div className="refund-policy__timeline-visual">
              <div className="timeline-bar">
                <div className="timeline-segment timeline-segment--green" style={{ width: '60%' }}>
                  <span className="timeline-label">100% Refund</span>
                </div>
                <div className="timeline-segment timeline-segment--orange" style={{ width: '30%' }}>
                  <span className="timeline-label">50% Refund</span>
                </div>
                <div className="timeline-segment timeline-segment--red" style={{ width: '10%' }}>
                  <span className="timeline-label">0%</span>
                </div>
              </div>
              <div className="timeline-markers">
                <span>Booking</span>
                <span>6 hrs before</span>
                <span>Appointment</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="refund-policy__faq">
            <h4>
              <i className="fas fa-question-circle"></i>
              Frequently Asked Questions
            </h4>
            
            <div className="refund-policy__faq-item">
              <strong>How long does the refund take?</strong>
              <p>Refunds are processed within 5-7 business days to your original payment method.</p>
            </div>
            
            <div className="refund-policy__faq-item">
              <strong>What is wallet credit?</strong>
              <p>Wallet credit can be used for future appointments on HealthSync. It never expires!</p>
            </div>
            
            <div className="refund-policy__faq-item">
              <strong>Can I reschedule instead of cancelling?</strong>
              <p>Yes! Rescheduling is free and doesn't affect your payment. We recommend rescheduling when possible.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="refund-policy__error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Unable to load refund policy. Please try again later.</p>
        </div>
      )}

      {showAsModal && (
        <div className="refund-policy__footer">
          <button className="refund-policy__close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="refund-policy-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        {content}
      </div>
    );
  }

  return content;
};

export default RefundPolicy;

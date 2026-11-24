import { useState } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './ReviewModal.css';

const ReviewModal = ({ appointment, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [detailedRatings, setDetailedRatings] = useState({
    punctuality: 0,
    communication: 0,
    treatment: 0,
    cleanliness: 0
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/reviews', {
        userId: appointment.userId._id || appointment.userId,
        doctorId: appointment.doctorId._id || appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        title,
        comment,
        ratings: detailedRatings
      });

      toast.success('Review submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value, onChange, size = 'large') => {
    return (
      <div className={`review-modal__stars review-modal__stars--${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`review-modal__star ${star <= (hoverRating || value) ? 'review-modal__star--filled' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => size === 'large' && setHoverRating(star)}
            onMouseLeave={() => size === 'large' && setHoverRating(0)}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="review-modal__overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="review-modal__header">
          <h2>Rate Your Experience</h2>
          <p>How was your appointment with Dr. {appointment.doctorId?.name}?</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <div className="review-modal__section">
            <label>Overall Rating *</label>
            {renderStars(rating, setRating)}
            <span className="review-modal__rating-text">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </span>
          </div>

          {/* Detailed Ratings */}
          <div className="review-modal__detailed">
            <h4>Rate specific aspects (optional)</h4>
            <div className="review-modal__detailed-grid">
              {Object.entries({
                punctuality: 'Punctuality',
                communication: 'Communication',
                treatment: 'Treatment Quality',
                cleanliness: 'Clinic Cleanliness'
              }).map(([key, label]) => (
                <div key={key} className="review-modal__detailed-item">
                  <span>{label}</span>
                  {renderStars(detailedRatings[key], (val) => 
                    setDetailedRatings({...detailedRatings, [key]: val}), 'small'
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="review-modal__section">
            <label>Review Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="review-modal__section">
            <label>Your Review (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience..."
              rows={4}
              maxLength={500}
            />
            <span className="review-modal__char-count">{comment.length}/500</span>
          </div>

          <div className="review-modal__actions">
            <button type="button" className="review-modal__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="review-modal__submit" disabled={submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

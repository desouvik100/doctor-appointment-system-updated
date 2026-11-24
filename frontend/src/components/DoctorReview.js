// frontend/src/components/DoctorReview.js
// Doctor Review & Rating Component
import { useState } from 'react';
import './DoctorReview.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const DoctorReview = ({ appointment, doctor, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [detailedRatings, setDetailedRatings] = useState({
    consultation: 0,
    communication: 0,
    punctuality: 0,
    cleanliness: 0,
    valueForMoney: 0
  });
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const tags = [
    { id: 'friendly', label: 'Friendly', icon: 'fa-smile' },
    { id: 'professional', label: 'Professional', icon: 'fa-user-tie' },
    { id: 'thorough', label: 'Thorough', icon: 'fa-search' },
    { id: 'quick', label: 'Quick', icon: 'fa-bolt' },
    { id: 'knowledgeable', label: 'Knowledgeable', icon: 'fa-brain' },
    { id: 'patient', label: 'Patient', icon: 'fa-heart' },
    { id: 'helpful', label: 'Helpful', icon: 'fa-hands-helping' },
    { id: 'recommended', label: 'Highly Recommended', icon: 'fa-thumbs-up' }
  ];

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const detailedRatingCategories = [
    { key: 'consultation', label: 'Consultation Quality', icon: 'fa-stethoscope' },
    { key: 'communication', label: 'Communication', icon: 'fa-comments' },
    { key: 'punctuality', label: 'Punctuality', icon: 'fa-clock' },
    { key: 'cleanliness', label: 'Clinic Cleanliness', icon: 'fa-broom' },
    { key: 'valueForMoney', label: 'Value for Money', icon: 'fa-rupee-sign' }
  ];

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select an overall rating');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment._id,
          rating,
          ratings: detailedRatings,
          title,
          review,
          tags: selectedTags,
          wouldRecommend,
          isAnonymous
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit && onSubmit(data.review);
        onClose && onClose();
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating, onSelect, onHover, size = 'large') => {
    return (
      <div className={`stars-container stars-container--${size}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= (onHover ? hoverRating : currentRating) ? 'star-btn--active' : ''}`}
            onClick={() => onSelect(star)}
            onMouseEnter={() => onHover && setHoverRating(star)}
            onMouseLeave={() => onHover && setHoverRating(0)}
          >
            <i className={`${star <= (onHover ? hoverRating : currentRating) ? 'fas' : 'far'} fa-star`}></i>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="doctor-review-overlay">
      <div className="doctor-review">
        <div className="doctor-review__header">
          <h2><i className="fas fa-star"></i> Rate Your Experience</h2>
          <button className="doctor-review__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="doctor-review__content">
          {/* Doctor Info */}
          <div className="doctor-review__doctor-info">
            <div className="doctor-avatar">
              {doctor?.profilePhoto ? (
                <img src={doctor.profilePhoto} alt={doctor.name} />
              ) : (
                <i className="fas fa-user-md"></i>
              )}
            </div>
            <div className="doctor-details">
              <h3>Dr. {doctor?.name || 'Doctor'}</h3>
              <p>{doctor?.specialization || 'Specialist'}</p>
              <span className="appointment-date">
                <i className="fas fa-calendar"></i>
                {new Date(appointment?.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="rating-section rating-section--main">
            <h4>Overall Rating</h4>
            <div className="main-rating">
              {renderStars(rating, setRating, true)}
              {(hoverRating || rating) > 0 && (
                <span className="rating-label">{ratingLabels[hoverRating || rating]}</span>
              )}
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="rating-section">
            <h4>Rate Different Aspects</h4>
            <div className="detailed-ratings">
              {detailedRatingCategories.map((category) => (
                <div key={category.key} className="detailed-rating-item">
                  <div className="detailed-rating-label">
                    <i className={`fas ${category.icon}`}></i>
                    <span>{category.label}</span>
                  </div>
                  <div className="detailed-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn star-btn--small ${star <= detailedRatings[category.key] ? 'star-btn--active' : ''}`}
                        onClick={() => setDetailedRatings(prev => ({ ...prev, [category.key]: star }))}
                      >
                        <i className={`${star <= detailedRatings[category.key] ? 'fas' : 'far'} fa-star`}></i>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="rating-section">
            <h4>What did you like? (Optional)</h4>
            <div className="tags-grid">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-btn ${selectedTags.includes(tag.id) ? 'tag-btn--selected' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                >
                  <i className={`fas ${tag.icon}`}></i>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Review Title */}
          <div className="rating-section">
            <h4>Review Title (Optional)</h4>
            <input
              type="text"
              placeholder="Summarize your experience in a few words"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Review Text */}
          <div className="rating-section">
            <h4>Your Review (Optional)</h4>
            <textarea
              placeholder="Share details of your experience with this doctor..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <span className="char-count">{review.length}/1000</span>
          </div>

          {/* Would Recommend */}
          <div className="rating-section">
            <h4>Would you recommend this doctor?</h4>
            <div className="recommend-buttons">
              <button
                type="button"
                className={`recommend-btn ${wouldRecommend ? 'recommend-btn--yes' : ''}`}
                onClick={() => setWouldRecommend(true)}
              >
                <i className="fas fa-thumbs-up"></i> Yes
              </button>
              <button
                type="button"
                className={`recommend-btn ${!wouldRecommend ? 'recommend-btn--no' : ''}`}
                onClick={() => setWouldRecommend(false)}
              >
                <i className="fas fa-thumbs-down"></i> No
              </button>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="anonymous-option">
            <label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Post anonymously</span>
            </label>
            <p className="anonymous-hint">Your name won't be shown with this review</p>
          </div>
        </div>

        <div className="doctor-review__footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-submit" 
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Component to display reviews
export const DoctorReviews = ({ doctorId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  useState(() => {
    fetchReviews();
  }, [doctorId, sortBy]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/doctor/${doctorId}?sort=${sortBy}`);
      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats);
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="reviews-loading"><i className="fas fa-spinner fa-spin"></i></div>;
  }

  return (
    <div className="doctor-reviews">
      {stats && (
        <div className="reviews-summary">
          <div className="reviews-summary__rating">
            <span className="big-rating">{stats.averageRating?.toFixed(1) || '0.0'}</span>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star} 
                  className={`${star <= Math.round(stats.averageRating || 0) ? 'fas' : 'far'} fa-star`}
                ></i>
              ))}
            </div>
            <span className="total-reviews">{stats.totalReviews || 0} reviews</span>
          </div>
          <div className="reviews-summary__recommend">
            <i className="fas fa-thumbs-up"></i>
            <span>{Math.round((stats.recommendRate || 0) * 100)}% recommend</span>
          </div>
        </div>
      )}

      <div className="reviews-sort">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <i className="fas fa-comment-slash"></i>
            <p>No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-card__header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.isAnonymous ? (
                      <i className="fas fa-user-secret"></i>
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                  <div>
                    <span className="reviewer-name">{review.patientName || 'Anonymous'}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="review-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star} 
                      className={`${star <= review.rating ? 'fas' : 'far'} fa-star`}
                    ></i>
                  ))}
                </div>
              </div>
              {review.title && <h4 className="review-title">{review.title}</h4>}
              {review.review && <p className="review-text">{review.review}</p>}
              {review.tags?.length > 0 && (
                <div className="review-tags">
                  {review.tags.map((tag) => (
                    <span key={tag} className="review-tag">{tag}</span>
                  ))}
                </div>
              )}
              {review.wouldRecommend && (
                <div className="review-recommend">
                  <i className="fas fa-check-circle"></i> Recommends this doctor
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorReview;

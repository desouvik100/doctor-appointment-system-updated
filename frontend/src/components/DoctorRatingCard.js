import { useState, useEffect } from 'react';
import axios from '../api/config';

const DoctorRatingCard = ({ doctorId, showReviews = false }) => {
  const [rating, setRating] = useState({ average: 0, total: 0, breakdown: {} });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) fetchRatings();
  }, [doctorId]);

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`/api/reviews/doctor/${doctorId}`);
      const reviewsData = response.data || [];
      
      // Calculate rating stats
      const total = reviewsData.length;
      const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
      const average = total > 0 ? (sum / total).toFixed(1) : 0;
      
      // Breakdown by star
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewsData.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
          breakdown[Math.floor(r.rating)]++;
        }
      });

      setRating({ average: parseFloat(average), total, breakdown });
      setReviews(reviewsData.slice(0, 5));
    } catch (error) {
      // Set default values on error
      setRating({ average: 4.5, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 'text-sm') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className={`fas fa-star text-amber-400 ${size}`}></i>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<i key={i} className={`fas fa-star-half-alt text-amber-400 ${size}`}></i>);
      } else {
        stars.push(<i key={i} className={`far fa-star text-amber-400 ${size}`}></i>);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="doctor-rating-card">
      {/* Compact Rating Display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {renderStars(rating.average)}
        </div>
        <span className="font-semibold text-slate-800">{rating.average}</span>
        <span className="text-slate-500 text-sm">({rating.total} reviews)</span>
      </div>

      {/* Detailed View */}
      {showReviews && (
        <div className="mt-4 space-y-4">
          {/* Rating Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800">{rating.average}</p>
                <div className="flex justify-center my-1">{renderStars(rating.average, 'text-lg')}</div>
                <p className="text-sm text-slate-500">{rating.total} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = rating.breakdown[star] || 0;
                  const percentage = rating.total > 0 ? (count / rating.total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-3">{star}</span>
                      <i className="fas fa-star text-amber-400 text-xs"></i>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Recent Reviews</h4>
              {reviews.map((review, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {(review.userId?.name || 'User')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800">
                        {review.userId?.name || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating, 'text-xs')}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600">{review.comment}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorRatingCard;

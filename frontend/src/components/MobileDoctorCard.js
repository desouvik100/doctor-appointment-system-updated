/**
 * Mobile Doctor Card - Swiggy/Zomato Restaurant Card Style
 * Shimmer loading, ripple effects, thumb-friendly
 */

import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { tapFeedback } from '../mobile/haptics';
import './MobileDoctorCard.css';

// Skeleton Loader Component
export const DoctorCardSkeleton = () => (
  <div className="doctor-card-skeleton">
    <div className="skeleton-header">
      <div className="skeleton-photo shimmer"></div>
      <div className="skeleton-info">
        <div className="skeleton-line w-70 shimmer"></div>
        <div className="skeleton-line w-50 shimmer"></div>
        <div className="skeleton-line w-40 shimmer"></div>
      </div>
    </div>
    <div className="skeleton-stats">
      <div className="skeleton-stat shimmer"></div>
      <div className="skeleton-stat shimmer"></div>
      <div className="skeleton-stat shimmer"></div>
    </div>
    <div className="skeleton-actions">
      <div className="skeleton-btn shimmer"></div>
      <div className="skeleton-btn primary shimmer"></div>
    </div>
  </div>
);

const MobileDoctorCard = ({ 
  doctor, 
  isFavorite, 
  onFavoriteToggle, 
  onViewProfile, 
  onBookNow,
  isLoading = false
}) => {
  const isNative = Capacitor.isNativePlatform();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [ripple, setRipple] = useState(null);
  
  const handleTap = (callback, e) => {
    if (isNative) tapFeedback();
    
    // Ripple effect
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipple({ x, y });
      setTimeout(() => setRipple(null), 500);
    }
    
    callback?.();
  };

  if (isLoading) {
    return <DoctorCardSkeleton />;
  }

  const docInitials = doctor.name 
    ? doctor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'DR';
  
  const rating = doctor.rating || (4 + Math.random() * 0.9).toFixed(1);
  const reviews = doctor.reviewCount || Math.floor(50 + Math.random() * 200);
  const experience = doctor.experience || Math.floor(5 + Math.random() * 15);
  const isAvailable = doctor.availability === 'Available';
  const hasOnline = doctor.consultationTypes?.includes('online') ?? true;
  const hasClinic = doctor.consultationTypes?.includes('clinic') ?? true;

  return (
    <div 
      className="swiggy-doctor-card"
      onClick={(e) => handleTap(() => onViewProfile(doctor), e)}
    >
      {/* Ripple Effect */}
      {ripple && (
        <span 
          className="ripple-effect" 
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}

      {/* Card Header */}
      <div className="card-header">
        <div className="photo-container">
          {!imageLoaded && (
            <div className="photo-placeholder shimmer">
              <span>{docInitials}</span>
            </div>
          )}
          {doctor.profilePhoto && (
            <img 
              src={doctor.profilePhoto} 
              alt={doctor.name}
              className={`doctor-photo ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          {isAvailable && <div className="available-dot"></div>}
        </div>
        
        <div className="doctor-info">
          <div className="name-row">
            <h3 className="doctor-name">
              {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
            </h3>
            <button 
              className={`fav-btn ${isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleTap(() => onFavoriteToggle(doctor._id));
              }}
            >
              <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>
          </div>
          <p className="specialty">{doctor.specialization}</p>
          <p className="clinic">
            <i className="fas fa-map-marker-alt"></i>
            {doctor.clinicId?.name || 'Independent Practice'}
          </p>
        </div>
      </div>

      {/* Stats Row - Zomato Style */}
      <div className="stats-row">
        <div className="stat">
          <div className="stat-icon green">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{rating}</span>
            <span className="stat-label">{reviews} reviews</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat">
          <div className="stat-icon blue">
            <i className="fas fa-award"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{experience} yrs</span>
            <span className="stat-label">Experience</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat">
          <div className="stat-icon purple">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">₹{doctor.consultationFee || 500}</span>
            <span className="stat-label">Fee</span>
          </div>
        </div>
      </div>

      {/* Consultation Tags */}
      <div className="consult-tags">
        {hasOnline && (
          <span className="tag online">
            <i className="fas fa-video"></i> Video
          </span>
        )}
        {hasClinic && (
          <span className="tag clinic">
            <i className="fas fa-hospital"></i> In-Clinic
          </span>
        )}
        {isAvailable && (
          <span className="tag available">
            <i className="fas fa-clock"></i> Available Today
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-row">
        <button 
          className="action-btn secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleTap(() => onViewProfile(doctor));
          }}
        >
          <i className="fas fa-user"></i>
          Profile
        </button>
        <button 
          className={`action-btn primary ${!isAvailable ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isAvailable) handleTap(() => onBookNow(doctor));
          }}
          disabled={!isAvailable}
        >
          <i className="fas fa-calendar-check"></i>
          {isAvailable ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default MobileDoctorCard;

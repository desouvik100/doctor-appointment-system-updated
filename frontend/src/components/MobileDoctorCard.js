/**
 * Mobile Doctor Card - Modern Practo/Swiggy Style
 */

import { Capacitor } from '@capacitor/core';
import { tapFeedback } from '../mobile/haptics';
import './MobileDoctorCard.css';

const MobileDoctorCard = ({ 
  doctor, 
  isFavorite, 
  onFavoriteToggle, 
  onViewProfile, 
  onBookNow 
}) => {
  const isNative = Capacitor.isNativePlatform();
  
  const handleTap = (callback) => {
    if (isNative) tapFeedback();
    callback?.();
  };

  const docInitials = doctor.name 
    ? doctor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'DR';
  
  const rating = doctor.rating || (4 + Math.random() * 0.9).toFixed(1);
  const reviews = doctor.reviewCount || Math.floor(50 + Math.random() * 200);
  const experience = doctor.experience || Math.floor(5 + Math.random() * 15);
  const isAvailable = doctor.availability === 'Available';
  
  // Consultation types
  const hasOnline = doctor.consultationTypes?.includes('online') ?? true;
  const hasClinic = doctor.consultationTypes?.includes('clinic') ?? true;

  return (
    <div className="mobile-doctor-card">
      {/* Top Section - Photo & Basic Info */}
      <div className="doctor-card-top">
        <div className="doctor-photo-section">
          <div className="doctor-photo">
            {doctor.profilePhoto ? (
              <img 
                src={doctor.profilePhoto} 
                alt={doctor.name} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="doctor-initials">{docInitials}</span>
            )}
          </div>
          {isAvailable && <div className="online-badge"></div>}
        </div>
        
        <div className="doctor-info">
          <div className="doctor-name-row">
            <h3 className="doctor-name">
              {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
            </h3>
            <button 
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => handleTap(() => onFavoriteToggle(doctor._id))}
            >
              <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
            </button>
          </div>
          
          <p className="doctor-specialty">{doctor.specialization}</p>
          <p className="doctor-clinic">
            <i className="fas fa-hospital-alt"></i>
            {doctor.clinicId?.name || 'Independent Practice'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="doctor-stats">
        <div className="stat-item">
          <div className="stat-icon rating">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-text">
            <span className="stat-value">{rating}</span>
            <span className="stat-label">{reviews} reviews</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <div className="stat-icon experience">
            <i className="fas fa-award"></i>
          </div>
          <div className="stat-text">
            <span className="stat-value">{experience} yrs</span>
            <span className="stat-label">Experience</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <div className="stat-icon fee">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-text">
            <span className="stat-value">₹{doctor.consultationFee || 500}</span>
            <span className="stat-label">Consultation</span>
          </div>
        </div>
      </div>

      {/* Consultation Types */}
      <div className="consultation-types">
        {hasOnline && (
          <div className="consult-type online">
            <i className="fas fa-video"></i>
            <span>Video Consult</span>
          </div>
        )}
        {hasClinic && (
          <div className="consult-type clinic">
            <i className="fas fa-hospital"></i>
            <span>In-Clinic</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="doctor-actions">
        <button 
          className="action-btn secondary"
          onClick={() => handleTap(() => onViewProfile(doctor))}
        >
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </button>
        <button 
          className={`action-btn primary ${!isAvailable ? 'disabled' : ''}`}
          onClick={() => isAvailable && handleTap(() => onBookNow(doctor))}
          disabled={!isAvailable}
        >
          <i className="fas fa-calendar-check"></i>
          <span>{isAvailable ? 'Book Now' : 'Unavailable'}</span>
        </button>
      </div>
    </div>
  );
};

export default MobileDoctorCard;

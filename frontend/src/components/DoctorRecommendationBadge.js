import React from 'react';
import './DoctorRecommendationBadge.css';

const DoctorRecommendationBadge = ({ type, stats }) => {
  const badges = {
    recommended: {
      icon: 'star',
      text: 'AI Recommended',
      color: '#fbbf24',
      bgColor: '#fef3c7',
      description: 'Best match for your needs'
    },
    fastest: {
      icon: 'bolt',
      text: 'Fastest Available',
      color: '#10b981',
      bgColor: '#d1fae5',
      description: 'Next available today'
    },
    mostBooked: {
      icon: 'fire',
      text: 'Most Booked',
      color: '#ef4444',
      bgColor: '#fee2e2',
      description: 'Popular choice'
    },
    topRated: {
      icon: 'award',
      text: 'Top Rated',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      description: '95%+ satisfaction'
    },
    experienced: {
      icon: 'user-md',
      text: 'Most Experienced',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      description: '10+ years experience'
    }
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <div 
      className="doctor-recommendation-badge"
      style={{ 
        background: badge.bgColor,
        borderColor: badge.color
      }}
    >
      <div className="badge-icon" style={{ color: badge.color }}>
        <i className={`fas fa-${badge.icon}`}></i>
      </div>
      <div className="badge-content">
        <div className="badge-title" style={{ color: badge.color }}>
          {badge.text}
        </div>
        <div className="badge-description">
          {badge.description}
        </div>
      </div>
      {stats && (
        <div className="badge-stats" style={{ color: badge.color }}>
          {stats}
        </div>
      )}
    </div>
  );
};

export default DoctorRecommendationBadge;

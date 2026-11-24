/**
 * Mobile Doctor Card - Redesigned to match Premium Landing Page Cards
 */

import { useState } from 'react';

// Skeleton Loader Component
export const DoctorCardSkeleton = () => (
  <div className="service-card shimmer-card" style={{ padding: '0', overflow: 'hidden', minHeight: '380px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
    <div className="shimmer" style={{ height: '220px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
    <div style={{ padding: '24px' }}>
      <div className="shimmer" style={{ height: '12px', width: '40%', marginBottom: '10px', background: '#f0f0f0' }}></div>
      <div className="shimmer" style={{ height: '18px', width: '75%', marginBottom: '16px', background: '#f0f0f0' }}></div>
      <div className="shimmer" style={{ height: '14px', width: '90%', marginBottom: '16px', background: '#f0f0f0' }}></div>
      <div className="shimmer" style={{ height: '35px', width: '100%', background: '#f0f0f0' }}></div>
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
  const isNative = false;
  const [imageLoaded, setImageLoaded] = useState(false);

  if (isLoading) {
    return <DoctorCardSkeleton />;
  }

  const rating = doctor.rating || (4 + Math.random() * 0.9).toFixed(1);
  const reviews = doctor.reviewCount || Math.floor(50 + Math.random() * 200);
  const experience = doctor.experience || Math.floor(5 + Math.random() * 15);
  const isAvailable = doctor.availability === 'Available' || doctor.availableToday || true;
  const availabilityText = doctor.availability || (isAvailable ? 'Available Today' : 'Available Tomorrow');
  const fee = doctor.consultationFee || 500;
  const image = doctor.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';

  const handleBook = (e) => {
    e.stopPropagation();
    onBookNow?.(doctor);
  };

  const handleCardClick = () => {
    onViewProfile?.(doctor);
  };

  return (
    <div 
      className="service-card premium-doctor-card-redesign" 
      style={{ 
        padding: '0', 
        overflow: 'hidden', 
        cursor: 'pointer', 
        background: 'var(--bg-white, #ffffff)', 
        borderRadius: '12px', 
        border: '1px solid var(--border-slate, #e5e7eb)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onClick={handleCardClick}
    >
      <div style={{ height: '220px', background: 'var(--bg-slate-50, #f4f4f5)', position: 'relative' }}>
        <img 
          src={image} 
          alt={doctor.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || 'Doctor')}&background=0ea5e9&color=fff&size=200&bold=true`;
          }}
        />
        <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34, 197, 94, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
          {availabilityText}
        </span>
        <button 
          className={`fav-btn-floating ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(doctor._id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10
          }}
        >
          <i 
            className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}
            style={{
              fontSize: '14px',
              color: isFavorite ? '#ef4444' : '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              margin: '0',
              lineHeight: '1'
            }}
          ></i>
        </button>
      </div>
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-primary, #0ea5e9)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
          {doctor.specialization || 'General Physician'}
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-dark, #0f172a)', marginBottom: '8px', marginTop: '0', lineHeight: '1.3' }}>
          {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-slate, #e5e7eb)', paddingBottom: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            <i className="fas fa-briefcase" style={{ marginRight: '6px', color: '#14b8a6' }}></i>
            {experience} Years Exp
          </span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>
            <i className="fas fa-star" style={{ marginRight: '4px' }}></i>
            {rating}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark, #0f172a)' }}>
            ₹{fee}
          </span>
          <button 
            onClick={handleBook} 
            className="btn-premium-primary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '12px', 
              borderRadius: '6px',
              background: 'var(--brand-gradient, linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%))',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Book Slots
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDoctorCard;

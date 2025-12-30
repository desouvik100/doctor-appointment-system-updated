/**
 * Mobile Hero Section - Swiggy/Zomato/PhonePe Style
 * Modern Indian Startup Aesthetic with Animated Illustrations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { tapFeedback } from '../mobile/haptics';
import './MobileHeroSection.css';

// Animated Healthcare Illustration Component (SVG)
const HealthcareIllustration = () => (
  <div className="hs-illustration">
    <svg viewBox="0 0 400 200" className="hs-illustration-svg">
      {/* Background Elements */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#f0f9ff" />
        </linearGradient>
        <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      
      {/* Road */}
      <rect x="0" y="170" width="400" height="30" fill="url(#roadGrad)" />
      <line x1="0" y1="185" x2="400" y2="185" stroke="#94a3b8" strokeWidth="2" strokeDasharray="20,15" className="road-line" />
      
      {/* Hospital Building */}
      <g className="hospital-building">
        <rect x="260" y="80" width="120" height="90" fill="#ffffff" rx="8" />
        <rect x="260" y="80" width="120" height="25" fill="#0ea5e9" rx="8" />
        <rect x="260" y="97" width="120" height="8" fill="#0ea5e9" />
        {/* Windows */}
        <rect x="275" y="115" width="20" height="20" fill="#bae6fd" rx="2" />
        <rect x="310" y="115" width="20" height="20" fill="#bae6fd" rx="2" />
        <rect x="345" y="115" width="20" height="20" fill="#bae6fd" rx="2" />
        <rect x="275" y="145" width="20" height="25" fill="#0ea5e9" rx="2" />
        <rect x="310" y="145" width="20" height="20" fill="#bae6fd" rx="2" />
        <rect x="345" y="145" width="20" height="20" fill="#bae6fd" rx="2" />
        {/* Cross Symbol */}
        <rect x="310" y="85" width="20" height="6" fill="#ffffff" rx="1" />
        <rect x="317" y="78" width="6" height="20" fill="#ffffff" rx="1" />
        {/* Awning */}
        <path d="M255 80 L260 70 L380 70 L385 80" fill="#0891b2" />
      </g>
      
      {/* Ambulance - Animated */}
      <g className="ambulance-group">
        {/* Ambulance Body */}
        <rect x="20" y="130" width="90" height="40" fill="#ffffff" rx="5" />
        <rect x="20" y="130" width="90" height="15" fill="#ef4444" rx="5" />
        <rect x="20" y="140" width="90" height="5" fill="#ef4444" />
        {/* Cabin */}
        <path d="M110 130 L110 170 L130 170 L130 145 L120 130 Z" fill="#ffffff" />
        <rect x="115" y="140" width="12" height="15" fill="#bae6fd" rx="2" />
        {/* Cross */}
        <rect x="55" y="148" width="20" height="5" fill="#ef4444" rx="1" />
        <rect x="62" y="141" width="6" height="19" fill="#ef4444" rx="1" />
        {/* Wheels */}
        <circle cx="45" cy="170" r="12" fill="#1e293b" />
        <circle cx="45" cy="170" r="6" fill="#64748b" />
        <circle cx="115" cy="170" r="12" fill="#1e293b" />
        <circle cx="115" cy="170" r="6" fill="#64748b" />
        {/* Light */}
        <rect x="55" y="122" width="15" height="8" fill="#3b82f6" rx="2" className="ambulance-light" />
      </g>
      
      {/* Doctor Character */}
      <g className="doctor-character">
        {/* Body */}
        <rect x="200" y="120" width="30" height="50" fill="#ffffff" rx="5" />
        {/* Head */}
        <circle cx="215" cy="105" r="18" fill="#fcd9b6" />
        {/* Hair */}
        <ellipse cx="215" cy="92" rx="15" ry="8" fill="#1e293b" />
        {/* Face */}
        <circle cx="210" cy="103" r="2" fill="#1e293b" />
        <circle cx="220" cy="103" r="2" fill="#1e293b" />
        <path d="M212 112 Q215 115 218 112" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        {/* Stethoscope */}
        <path d="M200 130 Q190 140 195 155" stroke="#0ea5e9" strokeWidth="3" fill="none" />
        <circle cx="195" cy="158" r="5" fill="#0ea5e9" />
        {/* Coat Details */}
        <line x1="215" y1="125" x2="215" y2="165" stroke="#e2e8f0" strokeWidth="2" />
        {/* Waving Hand */}
        <ellipse cx="240" cy="125" rx="8" ry="6" fill="#fcd9b6" className="waving-hand" />
      </g>
      
      {/* Floating Hearts/Plus Signs */}
      <g className="floating-elements">
        <text x="180" y="60" fill="#ef4444" fontSize="16" className="float-1">❤</text>
        <text x="250" y="50" fill="#0ea5e9" fontSize="14" className="float-2">+</text>
        <text x="150" y="80" fill="#10b981" fontSize="12" className="float-3">+</text>
      </g>
      
      {/* Cloud */}
      <g className="cloud" opacity="0.8">
        <ellipse cx="50" cy="40" rx="25" ry="15" fill="#ffffff" />
        <ellipse cx="75" cy="35" rx="20" ry="12" fill="#ffffff" />
        <ellipse cx="65" cy="45" rx="18" ry="10" fill="#ffffff" />
      </g>
    </svg>
  </div>
);

const MobileHeroSection = ({ 
  user, 
  onVideoConsult, 
  onClinicVisit, 
  onSmartMatch, 
  onSearch, 
  doctorCounts = {},
  onSearchOpenChange
}) => {
  const [showFullSearch, setShowFullSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isNative = Capacitor.isNativePlatform();
  const searchInputRef = useRef(null);
  const backListenerRef = useRef(null);

  const popularSearches = ['Fever', 'Cold & Cough', 'Skin Issue', 'Stomach', 'Back Pain'];

  useEffect(() => {
    onSearchOpenChange?.(showFullSearch);
  }, [showFullSearch, onSearchOpenChange]);

  useEffect(() => {
    if (!isNative || !showFullSearch) return;
    
    const handleBackButton = () => {
      if (showFullSearch) {
        setShowFullSearch(false);
        setSearchQuery('');
      }
    };

    if (backListenerRef.current) backListenerRef.current.remove();
    backListenerRef.current = App.addListener('backButton', handleBackButton);
    
    return () => {
      if (backListenerRef.current) {
        backListenerRef.current.remove();
        backListenerRef.current = null;
      }
    };
  }, [showFullSearch, isNative]);

  const handleTap = useCallback((callback) => {
    if (isNative) tapFeedback();
    callback?.();
  }, [isNative]);

  const openFullSearch = () => {
    setShowFullSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const closeFullSearch = () => {
    setShowFullSearch(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (query) => {
    handleTap(() => onSearch?.(query));
    closeFullSearch();
  };

  // Vast specialties - soft pastel modern colors
  const specialties = [
    { id: 'general', icon: 'fa-stethoscope', label: 'General', color: '#22c55e' },
    { id: 'dental', icon: 'fa-tooth', label: 'Dental', color: '#3b82f6' },
    { id: 'skin', icon: 'fa-hand-sparkles', label: 'Skin', color: '#f43f5e' },
    { id: 'child', icon: 'fa-baby', label: 'Child', color: '#06b6d4' },
    { id: 'eye', icon: 'fa-eye', label: 'Eye', color: '#8b5cf6' },
    { id: 'ortho', icon: 'fa-bone', label: 'Bones', color: '#f97316' },
    { id: 'heart', icon: 'fa-heartbeat', label: 'Heart', color: '#ef4444' },
    { id: 'neuro', icon: 'fa-brain', label: 'Neuro', color: '#a855f7' },
    { id: 'ent', icon: 'fa-head-side-cough', label: 'ENT', color: '#14b8a6' },
    { id: 'gynec', icon: 'fa-venus', label: 'Gynec', color: '#ec4899' },
    { id: 'gastro', icon: 'fa-stomach', label: 'Stomach', color: '#eab308' },
    { id: 'kidney', icon: 'fa-kidneys', label: 'Kidney', color: '#6366f1' },
  ];

  const allSpecialties = [
    ...specialties,
    { id: 'eye', icon: 'fa-eye', label: 'Eye', color: '#8b5cf6' },
    { id: 'ortho', icon: 'fa-bone', label: 'Bones', color: '#f59e0b' },
    { id: 'heart', icon: 'fa-heartbeat', label: 'Heart', color: '#ef4444' },
    { id: 'neuro', icon: 'fa-brain', label: 'Neuro', color: '#6366f1' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="hs-home">
      {/* Hero Section - Simplified with ONE clear CTA */}
      <div className="hs-hero">
        <p className="hs-tagline">Hi {firstName} 👋</p>
        <p className="hs-tagline-sub">Book a doctor in 5 seconds</p>
        
        {/* PRIMARY CTA - Book Clinic Visit (Most common action) */}
        <button 
          className="hs-primary-cta"
          onClick={() => handleTap(onClinicVisit)}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #fff 0%, #fff 100%)',
            border: 'none',
            borderRadius: '16px',
            color: '#fc8019',
            fontSize: '17px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fas fa-calendar-check" style={{ fontSize: '20px' }}></i>
          Book Clinic Visit
          <span style={{ 
            background: '#fc8019', 
            color: '#fff',
            padding: '4px 10px', 
            borderRadius: '20px', 
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Instant
          </span>
        </button>

        {/* Secondary action - Video Consult */}
        <button 
          className="hs-secondary-cta"
          onClick={() => handleTap(onVideoConsult)}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: '#fff',
            border: 'none',
            borderRadius: '14px',
            color: '#475569',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <i className="fas fa-video" style={{ color: '#fc8019' }}></i>
          Video Consult from Home
        </button>
        
        {/* Search Bar - Secondary */}
        <div className="hs-search-bar" onClick={openFullSearch}>
          <i className="fas fa-search"></i>
          <span>Search doctors, symptoms...</span>
        </div>
      </div>

      {/* Trust Strip - Compact */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '24px', 
        marginTop: '16px', 
        marginBottom: '8px',
        padding: '0 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            background: '#fbbf24', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <i className="fas fa-check" style={{ color: '#fff', fontSize: '12px' }}></i>
          </div>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Verified</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-bolt" style={{ color: '#fbbf24', fontSize: '20px' }}></i>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Instant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-shield-alt" style={{ color: '#fbbf24', fontSize: '20px' }}></i>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Secure</span>
        </div>
      </div>

      {/* Specialties - Top 4 + View All */}
      <div className="hs-specialties">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>Browse by Specialty</h3>
          <button 
            onClick={() => handleTap(() => onSearch?.(''))}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#0ea5e9', 
              fontSize: '13px', 
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View All <i className="fas fa-arrow-right" style={{ fontSize: '10px' }}></i>
          </button>
        </div>
        <div className="hs-spec-grid">
          {specialties.map((spec) => (
            <button 
              key={spec.id} 
              className="hs-spec-item"
              onClick={() => handleTap(() => onSearch?.(spec.label))}
            >
              <div className="hs-spec-icon" style={{ background: `${spec.color}18`, color: spec.color }}>
                <i className={`fas ${spec.icon}`}></i>
              </div>
              <span>{spec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Smart Match - Moved lower, less prominent */}
      <button className="hs-ai-card" onClick={() => handleTap(onSmartMatch)} style={{ marginTop: '8px' }}>
        <div className="hs-ai-left">
          <i className="fas fa-magic"></i>
          <div>
            <strong>Not sure which doctor?</strong>
            <span>AI finds the right one • 1 min</span>
          </div>
        </div>
        <i className="fas fa-chevron-right"></i>
      </button>

      {/* Full Screen Search */}
      {showFullSearch && (
        <div className="hs-fullsearch">
          <div className="hs-search-header">
            <button className="hs-back" onClick={closeFullSearch}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="hs-search-input">
              <i className="fas fa-search"></i>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search doctors, symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchQuery && handleSearchSubmit(searchQuery)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
          <div className="hs-search-body">
            <p className="hs-search-label">Popular Searches</p>
            <div className="hs-search-chips">
              {popularSearches.map((term, i) => (
                <button key={i} onClick={() => handleSearchSubmit(term)}>{term}</button>
              ))}
            </div>
            <p className="hs-search-label">All Specialties</p>
            <div className="hs-search-list">
              {allSpecialties.map((spec) => (
                <button key={spec.id} onClick={() => handleSearchSubmit(spec.label)}>
                  <i className={`fas ${spec.icon}`} style={{ color: spec.color }}></i>
                  <span>{spec.label} Specialist</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHeroSection;

/**
 * Mobile Hero Section - Swiggy/Zomato Style
 * Conversion-focused, search-first, minimal UI
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { tapFeedback } from '../mobile/haptics';
import './MobileHeroSection.css';

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

  const popularSearches = ['Fever', 'Dentist', 'Skin', 'Eye', 'Child'];

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

  const specialties = [
    { id: 'general', icon: 'fa-stethoscope', label: 'General', color: '#10b981' },
    { id: 'dental', icon: 'fa-tooth', label: 'Dental', color: '#3b82f6' },
    { id: 'skin', icon: 'fa-hand-sparkles', label: 'Skin', color: '#ec4899' },
    { id: 'eye', icon: 'fa-eye', label: 'Eye', color: '#8b5cf6' },
    { id: 'child', icon: 'fa-baby', label: 'Child', color: '#06b6d4' },
    { id: 'ortho', icon: 'fa-bone', label: 'Ortho', color: '#f59e0b' },
  ];

  return (
    <div className="hs-home">
      {/* Hero Section - Search First */}
      <div className="hs-hero">
        <p className="hs-tagline">Skip the queue. Book instantly.</p>
        
        {/* Primary Search Bar */}
        <div className="hs-search-bar" onClick={openFullSearch}>
          <i className="fas fa-search"></i>
          <span>Search doctors, symptoms...</span>
        </div>

        {/* Trust Row - Compact */}
        <div className="hs-trust-row">
          <span><i className="fas fa-check-circle"></i> Verified</span>
          <span><i className="fas fa-bolt"></i> Instant</span>
          <span><i className="fas fa-shield-alt"></i> Secure</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="hs-actions">
        <button className="hs-action-btn primary" onClick={() => handleTap(onClinicVisit)}>
          <i className="fas fa-calendar-check"></i>
          <span>Book Appointment</span>
        </button>
        <button className="hs-action-btn secondary" onClick={() => handleTap(onVideoConsult)}>
          <i className="fas fa-video"></i>
          <span>Video Consult</span>
        </button>
      </div>

      {/* Specialties Grid */}
      <div className="hs-specialties">
        <h3>Browse by Specialty</h3>
        <div className="hs-spec-grid">
          {specialties.map((spec) => (
            <button 
              key={spec.id} 
              className="hs-spec-item"
              onClick={() => handleTap(() => onSearch?.(spec.label))}
            >
              <div className="hs-spec-icon" style={{ background: `${spec.color}15`, color: spec.color }}>
                <i className={`fas ${spec.icon}`}></i>
              </div>
              <span>{spec.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Smart Match - Minimal */}
      <button className="hs-ai-card" onClick={() => handleTap(onSmartMatch)}>
        <div className="hs-ai-left">
          <i className="fas fa-magic"></i>
          <div>
            <strong>Find the right doctor</strong>
            <span>AI-powered • 1 min</span>
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
            <p className="hs-search-label">Popular</p>
            <div className="hs-search-chips">
              {popularSearches.map((term, i) => (
                <button key={i} onClick={() => handleSearchSubmit(term)}>{term}</button>
              ))}
            </div>
            <p className="hs-search-label">Specialties</p>
            <div className="hs-search-list">
              {specialties.map((spec) => (
                <button key={spec.id} onClick={() => handleSearchSubmit(spec.label)}>
                  <i className={`fas ${spec.icon}`} style={{ color: spec.color }}></i>
                  <span>{spec.label}</span>
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

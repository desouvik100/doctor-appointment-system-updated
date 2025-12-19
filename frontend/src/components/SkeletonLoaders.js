/**
 * Skeleton Loaders - Native App Loading States
 * Replace spinners with shimmer cards for professional feel
 */

import React from 'react';
import '../styles/skeleton-loaders.css';

// Generic skeleton box
export const SkeletonBox = ({ width, height, radius = '8px', className = '' }) => (
  <div 
    className={`skeleton-shimmer ${className}`}
    style={{ width, height, borderRadius: radius }}
  />
);

// Doctor card skeleton
export const DoctorCardSkeleton = () => (
  <div className="skeleton-doctor-card">
    <div className="skeleton-doctor-header">
      <SkeletonBox width="64px" height="64px" radius="16px" />
      <div className="skeleton-doctor-info">
        <SkeletonBox width="140px" height="18px" />
        <SkeletonBox width="100px" height="14px" />
        <SkeletonBox width="80px" height="12px" />
      </div>
    </div>
    <div className="skeleton-doctor-footer">
      <SkeletonBox width="60px" height="24px" radius="12px" />
      <SkeletonBox width="100px" height="36px" radius="8px" />
    </div>
  </div>
);

// Appointment card skeleton
export const AppointmentCardSkeleton = () => (
  <div className="skeleton-appointment-card">
    <div className="skeleton-apt-left">
      <SkeletonBox width="48px" height="48px" radius="12px" />
    </div>
    <div className="skeleton-apt-content">
      <SkeletonBox width="120px" height="16px" />
      <SkeletonBox width="160px" height="14px" />
      <div className="skeleton-apt-meta">
        <SkeletonBox width="70px" height="12px" />
        <SkeletonBox width="50px" height="12px" />
      </div>
    </div>
    <div className="skeleton-apt-right">
      <SkeletonBox width="60px" height="24px" radius="12px" />
    </div>
  </div>
);

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <div className="skeleton-stats-card">
    <SkeletonBox width="40px" height="40px" radius="10px" />
    <div className="skeleton-stats-content">
      <SkeletonBox width="60px" height="24px" />
      <SkeletonBox width="80px" height="12px" />
    </div>
  </div>
);

// List item skeleton
export const ListItemSkeleton = () => (
  <div className="skeleton-list-item">
    <SkeletonBox width="44px" height="44px" radius="50%" />
    <div className="skeleton-list-content">
      <SkeletonBox width="140px" height="16px" />
      <SkeletonBox width="100px" height="12px" />
    </div>
    <SkeletonBox width="24px" height="24px" radius="6px" />
  </div>
);

// Profile header skeleton
export const ProfileHeaderSkeleton = () => (
  <div className="skeleton-profile-header">
    <SkeletonBox width="80px" height="80px" radius="50%" />
    <div className="skeleton-profile-info">
      <SkeletonBox width="150px" height="20px" />
      <SkeletonBox width="180px" height="14px" />
      <SkeletonBox width="100px" height="12px" />
    </div>
  </div>
);

// Full page loading skeleton
export const PageSkeleton = ({ type = 'doctors' }) => {
  if (type === 'doctors') {
    return (
      <div className="skeleton-page">
        <div className="skeleton-search-bar">
          <SkeletonBox width="100%" height="48px" radius="12px" />
        </div>
        <div className="skeleton-filters">
          <SkeletonBox width="80px" height="32px" radius="16px" />
          <SkeletonBox width="100px" height="32px" radius="16px" />
          <SkeletonBox width="90px" height="32px" radius="16px" />
        </div>
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map(i => <DoctorCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (type === 'appointments') {
    return (
      <div className="skeleton-page">
        <div className="skeleton-header-row">
          <SkeletonBox width="150px" height="24px" />
          <SkeletonBox width="100px" height="32px" radius="8px" />
        </div>
        <div className="skeleton-list">
          {[1, 2, 3, 4, 5].map(i => <AppointmentCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (type === 'overview') {
    return (
      <div className="skeleton-page">
        <div className="skeleton-stats-row">
          {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="skeleton-section">
          <SkeletonBox width="180px" height="20px" className="mb-4" />
          <div className="skeleton-grid-2">
            {[1, 2].map(i => <DoctorCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Inline loading placeholder
export const InlineLoader = ({ text = 'Loading...' }) => (
  <div className="inline-loader">
    <div className="inline-loader-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <span className="inline-loader-text">{text}</span>
  </div>
);

// Button loading state
export const ButtonLoader = () => (
  <div className="button-loader">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

export default {
  SkeletonBox,
  DoctorCardSkeleton,
  AppointmentCardSkeleton,
  StatsCardSkeleton,
  ListItemSkeleton,
  ProfileHeaderSkeleton,
  PageSkeleton,
  InlineLoader,
  ButtonLoader
};

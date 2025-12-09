// frontend/src/components/LoadingSkeleton.js
// Skeleton loading components for better UX

import React from 'react';
import './LoadingSkeleton.css';

// Base skeleton component
export const Skeleton = ({ width, height, borderRadius = '8px', className = '' }) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Doctor card skeleton
export const DoctorCardSkeleton = () => (
  <div className="doctor-card-skeleton">
    <div className="skeleton-header">
      <Skeleton width="80px" height="80px" borderRadius="50%" />
    </div>
    <div className="skeleton-body">
      <Skeleton width="70%" height="20px" className="mb-2" />
      <Skeleton width="50%" height="16px" className="mb-3" />
      <Skeleton width="100%" height="14px" className="mb-1" />
      <Skeleton width="80%" height="14px" className="mb-1" />
      <Skeleton width="60%" height="14px" className="mb-3" />
      <Skeleton width="40%" height="24px" className="mb-3" />
      <Skeleton width="100%" height="44px" borderRadius="12px" />
    </div>
  </div>
);

// Appointment card skeleton
export const AppointmentCardSkeleton = () => (
  <div className="appointment-card-skeleton">
    <div className="skeleton-header-bar">
      <Skeleton width="120px" height="20px" />
      <Skeleton width="80px" height="28px" borderRadius="14px" />
    </div>
    <div className="skeleton-content">
      <div className="skeleton-doctor-info">
        <Skeleton width="56px" height="56px" borderRadius="12px" />
        <div className="skeleton-text-group">
          <Skeleton width="150px" height="18px" className="mb-2" />
          <Skeleton width="100px" height="14px" />
        </div>
      </div>
      <div className="skeleton-details">
        <Skeleton width="120px" height="14px" />
        <Skeleton width="100px" height="14px" />
        <Skeleton width="140px" height="14px" />
      </div>
    </div>
  </div>
);

// Queue item skeleton
export const QueueItemSkeleton = () => (
  <div className="queue-item-skeleton">
    <Skeleton width="40px" height="40px" borderRadius="8px" />
    <div className="skeleton-queue-info">
      <Skeleton width="140px" height="16px" className="mb-1" />
      <Skeleton width="100px" height="12px" />
    </div>
    <Skeleton width="32px" height="32px" borderRadius="8px" />
    <div className="skeleton-queue-actions">
      <Skeleton width="32px" height="32px" borderRadius="8px" />
      <Skeleton width="32px" height="32px" borderRadius="8px" />
    </div>
  </div>
);

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <div className="stats-card-skeleton">
    <Skeleton width="50px" height="50px" borderRadius="14px" />
    <div className="skeleton-stats-text">
      <Skeleton width="60px" height="28px" className="mb-1" />
      <Skeleton width="80px" height="14px" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="table-row-skeleton">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i}>
        <Skeleton width={`${60 + Math.random() * 40}%`} height="16px" />
      </td>
    ))}
  </tr>
);

// List skeleton
export const ListSkeleton = ({ count = 5, ItemComponent = DoctorCardSkeleton }) => (
  <div className="list-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <ItemComponent key={i} />
    ))}
  </div>
);

// Grid skeleton for doctor cards
export const DoctorGridSkeleton = ({ count = 6 }) => (
  <div className="doctor-grid-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <DoctorCardSkeleton key={i} />
    ))}
  </div>
);

export default {
  Skeleton,
  DoctorCardSkeleton,
  AppointmentCardSkeleton,
  QueueItemSkeleton,
  StatsCardSkeleton,
  TableRowSkeleton,
  ListSkeleton,
  DoctorGridSkeleton
};

/**
 * ID Badge Component - Clear Traceability
 * Shows appointment IDs, payment IDs, etc. in a professional format
 */

import React from 'react';
import toast from 'react-hot-toast';
import { tapFeedback } from '../mobile/haptics';
import { Capacitor } from '@capacitor/core';

const IDBadge = ({ 
  id, 
  type = 'appointment', // 'appointment', 'payment', 'booking', 'queue'
  showCopy = true,
  size = 'small' // 'small', 'medium', 'large'
}) => {
  if (!id) return null;

  // Format ID for display (show last 8 chars for long IDs)
  const displayId = id.length > 12 ? `...${id.slice(-8)}` : id;
  
  const icons = {
    appointment: 'fa-calendar-check',
    payment: 'fa-receipt',
    booking: 'fa-ticket-alt',
    queue: 'fa-list-ol'
  };

  const labels = {
    appointment: 'APT',
    payment: 'PAY',
    booking: 'BKG',
    queue: 'Q'
  };

  const handleCopy = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        tapFeedback();
      }
      await navigator.clipboard.writeText(id);
      toast.success('ID copied!', { duration: 1500 });
    } catch (e) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('ID copied!', { duration: 1500 });
    }
  };

  const sizeClasses = {
    small: 'id-badge-sm',
    medium: 'id-badge-md',
    large: 'id-badge-lg'
  };

  return (
    <span 
      className={`id-badge ${sizeClasses[size]} ${showCopy ? 'id-badge-copyable' : ''}`}
      onClick={showCopy ? handleCopy : undefined}
      title={showCopy ? `Click to copy: ${id}` : id}
    >
      <i className={`fas ${icons[type]}`}></i>
      <span className="id-badge-label">{labels[type]}</span>
      <span className="id-badge-value">{displayId}</span>
      {showCopy && <i className="fas fa-copy id-badge-copy"></i>}
    </span>
  );
};

// Timestamp badge
export const TimestampBadge = ({ date, showTime = true }) => {
  if (!date) return null;
  
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const timeStr = d.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <span className="timestamp-badge">
      <i className="fas fa-clock"></i>
      <span>{dateStr}</span>
      {showTime && <span className="timestamp-time">{timeStr}</span>}
    </span>
  );
};

// Status badge
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    confirmed: { icon: 'fa-check-circle', color: 'success', label: 'Confirmed' },
    pending: { icon: 'fa-clock', color: 'warning', label: 'Pending' },
    completed: { icon: 'fa-check-double', color: 'info', label: 'Completed' },
    cancelled: { icon: 'fa-times-circle', color: 'danger', label: 'Cancelled' },
    'in-queue': { icon: 'fa-hourglass-half', color: 'primary', label: 'In Queue' },
    paid: { icon: 'fa-check', color: 'success', label: 'Paid' },
    failed: { icon: 'fa-exclamation-circle', color: 'danger', label: 'Failed' }
  };

  const config = statusConfig[status] || { icon: 'fa-info-circle', color: 'secondary', label: status };

  return (
    <span className={`status-badge status-${config.color}`}>
      <i className={`fas ${config.icon}`}></i>
      <span>{config.label}</span>
    </span>
  );
};

export default IDBadge;

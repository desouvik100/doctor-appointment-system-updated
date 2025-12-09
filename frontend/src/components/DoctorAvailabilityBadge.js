// frontend/src/components/DoctorAvailabilityBadge.js
// Real-time doctor availability indicator

import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import './DoctorAvailabilityBadge.css';

const DoctorAvailabilityBadge = ({ 
  doctorId, 
  showQueueCount = true,
  showEstimatedWait = true,
  compact = false,
  refreshInterval = 60000 // 1 minute
}) => {
  const [availability, setAvailability] = useState({
    isAvailable: true,
    queueCount: 0,
    estimatedWaitMinutes: 0,
    nextSlot: null,
    status: 'loading'
  });

  useEffect(() => {
    if (!doctorId) return;

    const fetchAvailability = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await axios.get(`/api/appointments/queue-info/${doctorId}/${today}`);
        
        if (response.data.success) {
          const { currentQueueCount, availableSlots, estimatedTime, isFull, slotDuration } = response.data;
          
          setAvailability({
            isAvailable: !isFull && availableSlots > 0,
            queueCount: currentQueueCount,
            estimatedWaitMinutes: currentQueueCount * (slotDuration || 30),
            nextSlot: estimatedTime,
            availableSlots,
            status: isFull ? 'full' : currentQueueCount === 0 ? 'free' : 'busy'
          });
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailability(prev => ({ ...prev, status: 'error' }));
      }
    };

    fetchAvailability();
    const interval = setInterval(fetchAvailability, refreshInterval);
    
    return () => clearInterval(interval);
  }, [doctorId, refreshInterval]);

  const getStatusConfig = () => {
    switch (availability.status) {
      case 'free':
        return {
          label: 'Available Now',
          icon: 'fa-check-circle',
          className: 'availability-badge--free'
        };
      case 'busy':
        return {
          label: 'In Consultation',
          icon: 'fa-clock',
          className: 'availability-badge--busy'
        };
      case 'full':
        return {
          label: 'Fully Booked',
          icon: 'fa-times-circle',
          className: 'availability-badge--full'
        };
      case 'error':
        return {
          label: 'Unavailable',
          icon: 'fa-exclamation-circle',
          className: 'availability-badge--error'
        };
      default:
        return {
          label: 'Checking...',
          icon: 'fa-spinner fa-spin',
          className: 'availability-badge--loading'
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <span className={`availability-badge availability-badge--compact ${config.className}`}>
        <i className={`fas ${config.icon}`}></i>
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className={`availability-badge ${config.className}`}>
      <div className="availability-badge__status">
        <i className={`fas ${config.icon}`}></i>
        <span>{config.label}</span>
      </div>
      
      {showQueueCount && availability.queueCount > 0 && (
        <div className="availability-badge__queue">
          <i className="fas fa-users"></i>
          <span>{availability.queueCount} in queue</span>
        </div>
      )}
      
      {showEstimatedWait && availability.estimatedWaitMinutes > 0 && availability.status !== 'full' && (
        <div className="availability-badge__wait">
          <i className="fas fa-hourglass-half"></i>
          <span>~{availability.estimatedWaitMinutes} min wait</span>
        </div>
      )}
      
      {availability.nextSlot && availability.status !== 'full' && (
        <div className="availability-badge__next">
          <i className="fas fa-calendar-check"></i>
          <span>Next: {formatTime(availability.nextSlot)}</span>
        </div>
      )}
    </div>
  );
};

// Helper to format time
function formatTime(time) {
  if (!time || !time.includes(':')) return time;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default DoctorAvailabilityBadge;

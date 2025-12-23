/**
 * Patient Timeline Screen
 * Chronological view of all health events - visits, prescriptions, reports
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './PatientTimeline.css';

const EVENT_TYPES = {
  visit: { icon: '🏥', label: 'Visit', color: '#3b82f6' },
  prescription: { icon: '💊', label: 'Prescription', color: '#22c55e' },
  report: { icon: '📄', label: 'Report', color: '#f59e0b' },
  lab_result: { icon: '🧪', label: 'Lab Result', color: '#8b5cf6' },
  diagnosis: { icon: '🩺', label: 'Diagnosis', color: '#ec4899' },
  follow_up: { icon: '📅', label: 'Follow-up', color: '#06b6d4' }
};

const PatientTimeline = ({ clinicId, patientId, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [patientId, clinicId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/emr/patient/timeline', {
        params: { patientId, clinicId }
      });
      
      if (response.data.success) {
        setEvents(response.data.events || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffDays = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  const groupByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      const date = new Date(item.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return Object.entries(groups).map(([date, items]) => ({
      date: new Date(date),
      items: items.sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
  };

  const renderEventContent = (event) => {
    switch (event.type) {
      case 'visit':
        return (
          <div className="event-details">
            <p><strong>Doctor:</strong> Dr. {event.doctorName || 'Unknown'}</p>
            {event.chiefComplaint && <p><strong>Complaint:</strong> {event.chiefComplaint}</p>}
            {event.diagnosis && <p><strong>Diagnosis:</strong> {event.diagnosis}</p>}
          </div>
        );
      case 'prescription':
        return (
          <div className="event-details">
            <p><strong>Prescribed by:</strong> Dr. {event.doctorName || 'Unknown'}</p>
            <div className="med-list">
              {event.medications?.map((med, idx) => (
                <span key={idx} className="med-tag">{med.name}</span>
              ))}
            </div>
          </div>
        );
      case 'report':
      case 'lab_result':
        return (
          <div className="event-details">
            <p><strong>Type:</strong> {event.reportType || 'Medical Report'}</p>
            {event.summary && <p>{event.summary}</p>}
          </div>
        );
      case 'diagnosis':
        return (
          <div className="event-details">
            <p><strong>Code:</strong> {event.code}</p>
            <p>{event.description}</p>
          </div>
        );
      case 'follow_up':
        return (
          <div className="event-details">
            <p><strong>Status:</strong> {event.status}</p>
            {event.reason && <p><strong>Reason:</strong> {event.reason}</p>}
          </div>
        );
      default:
        return event.description && <p>{event.description}</p>;
    }
  };

  if (loading) {
    return (
      <div className="patient-timeline">
        <div className="timeline-loading">
          <div className="spinner"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-timeline">
      {/* Header */}
      <div className="timeline-header">
        <h2>
          <span className="header-icon">📊</span>
          Patient Timeline
        </h2>
        <div className="header-actions">
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="timeline-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        {Object.entries(EVENT_TYPES).map(([key, value]) => (
          <button 
            key={key}
            className={`filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {value.icon} {value.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="timeline-stats">
        {Object.entries(EVENT_TYPES).map(([key, value]) => {
          const count = events.filter(e => e.type === key).length;
          if (count === 0) return null;
          return (
            <div key={key} className="stat-item" style={{ borderColor: value.color }}>
              <span className="stat-icon">{value.icon}</span>
              <span className="stat-count">{count}</span>
              <span className="stat-label">{value.label}s</span>
            </div>
          );
        })}
      </div>

      {/* Timeline Content */}
      <div className="timeline-content">
        {filteredEvents.length === 0 ? (
          <div className="no-events">
            <span className="no-events-icon">📊</span>
            <p>No events found</p>
          </div>
        ) : (
          <div className="timeline-list">
            {groupByDate(filteredEvents).map((group, gIdx) => (
              <div key={gIdx} className="timeline-day">
                <div className="day-header">
                  <span className="day-date">{formatDate(group.date)}</span>
                  <span className="day-relative">{getRelativeTime(group.date)}</span>
                </div>
                <div className="day-events">
                  {group.items.map((event, idx) => {
                    const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.visit;
                    const isExpanded = expandedEvent === event._id;
                    
                    return (
                      <div 
                        key={event._id || idx} 
                        className={`timeline-event ${isExpanded ? 'expanded' : ''}`}
                        style={{ '--event-color': eventType.color }}
                      >
                        <div className="event-marker">
                          <span className="event-icon">{eventType.icon}</span>
                          <div className="event-line"></div>
                        </div>
                        <div 
                          className="event-card"
                          onClick={() => setExpandedEvent(isExpanded ? null : event._id)}
                        >
                          <div className="event-header">
                            <span className="event-type">{eventType.label}</span>
                            <span className="event-time">{formatTime(event.date)}</span>
                          </div>
                          <h4 className="event-title">{event.title}</h4>
                          {isExpanded && renderEventContent(event)}
                          {!isExpanded && event.summary && (
                            <p className="event-summary">{event.summary}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTimeline;

/**
 * Follow-Up Scheduling Screen
 * Schedule and manage follow-up visits with calendar view
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './FollowUpScheduling.css';

const FollowUpScheduling = ({ clinicId, patientId, doctorId, onClose, onSchedule }) => {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchFollowUps();
  }, [patientId, clinicId]);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/emr/follow-ups', {
        params: { patientId, clinicId }
      });
      
      if (response.data.success) {
        setFollowUps(response.data.followUps || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select date and time');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await axios.post('/api/emr/follow-ups', {
        patientId,
        clinicId,
        doctorId,
        scheduledDate: `${selectedDate}T${selectedTime}`,
        reason,
        notes
      });

      if (response.data.success) {
        setFollowUps(prev => [...prev, response.data.followUp]);
        setShowForm(false);
        resetForm();
        onSchedule?.(response.data.followUp);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule follow-up');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (followUpId) => {
    if (!window.confirm('Cancel this follow-up appointment?')) return;

    try {
      await axios.put(`/api/emr/follow-ups/${followUpId}/cancel`);
      setFollowUps(prev => prev.map(f => 
        f._id === followUpId ? { ...f, status: 'cancelled' } : f
      ));
    } catch (err) {
      setError('Failed to cancel follow-up');
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setReason('');
    setNotes('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
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

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: 'Scheduled', class: 'scheduled' },
      completed: { label: 'Completed', class: 'completed' },
      cancelled: { label: 'Cancelled', class: 'cancelled' },
      missed: { label: 'Missed', class: 'missed' }
    };
    return badges[status] || badges.scheduled;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty slots for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getFollowUpsForDate = (date) => {
    if (!date) return [];
    return followUps.filter(f => {
      const fDate = new Date(f.scheduledDate);
      return fDate.toDateString() === date.toDateString();
    });
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
            ←
          </button>
          <span>{monthName}</span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
            →
          </button>
        </div>
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((day, idx) => {
            const dayFollowUps = getFollowUpsForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={idx} 
                className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''} ${dayFollowUps.length > 0 ? 'has-followups' : ''}`}
              >
                {day && (
                  <>
                    <span className="day-number">{day.getDate()}</span>
                    {dayFollowUps.length > 0 && (
                      <div className="day-followups">
                        {dayFollowUps.map(f => (
                          <div key={f._id} className={`followup-dot ${f.status}`} title={f.reason || 'Follow-up'} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="follow-up-scheduling">
        <div className="followup-loading">
          <div className="spinner"></div>
          <p>Loading follow-ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="follow-up-scheduling">
      {/* Header */}
      <div className="followup-header">
        <h2>
          <span className="header-icon">📅</span>
          Follow-Up Scheduling
        </h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
            <button 
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              📆 Calendar
            </button>
          </div>
          <button className="btn-schedule" onClick={() => setShowForm(true)}>
            + Schedule Follow-Up
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="followup-content">
        {/* Schedule Form */}
        {showForm && (
          <div className="schedule-form">
            <h3>Schedule New Follow-Up</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason for Follow-Up</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select reason...</option>
                <option value="routine_checkup">Routine Checkup</option>
                <option value="medication_review">Medication Review</option>
                <option value="test_results">Review Test Results</option>
                <option value="post_procedure">Post-Procedure Follow-Up</option>
                <option value="chronic_management">Chronic Disease Management</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions or notes..."
                rows={2}
              />
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleSchedule} disabled={saving}>
                {saving ? 'Scheduling...' : '✓ Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* View Content */}
        {viewMode === 'calendar' ? (
          renderCalendar()
        ) : (
          <div className="followup-list">
            {followUps.length === 0 ? (
              <div className="no-followups">
                <span className="no-followups-icon">📅</span>
                <p>No follow-ups scheduled</p>
                <button className="btn-schedule-first" onClick={() => setShowForm(true)}>
                  Schedule First Follow-Up
                </button>
              </div>
            ) : (
              <>
                {/* Upcoming */}
                <div className="followup-section">
                  <h4>Upcoming</h4>
                  {followUps.filter(f => f.status === 'scheduled' && new Date(f.scheduledDate) > new Date()).map(f => (
                    <div key={f._id} className="followup-card">
                      <div className="followup-date">
                        <span className="date">{formatDate(f.scheduledDate)}</span>
                        <span className="time">{formatTime(f.scheduledDate)}</span>
                      </div>
                      <div className="followup-details">
                        <span className="reason">{f.reason?.replace('_', ' ') || 'Follow-up'}</span>
                        {f.notes && <p className="notes">{f.notes}</p>}
                      </div>
                      <div className="followup-actions">
                        <span className={`status-badge ${getStatusBadge(f.status).class}`}>
                          {getStatusBadge(f.status).label}
                        </span>
                        <button className="btn-cancel-followup" onClick={() => handleCancel(f._id)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Past */}
                {followUps.filter(f => f.status !== 'scheduled' || new Date(f.scheduledDate) <= new Date()).length > 0 && (
                  <div className="followup-section past">
                    <h4>Past</h4>
                    {followUps.filter(f => f.status !== 'scheduled' || new Date(f.scheduledDate) <= new Date()).map(f => (
                      <div key={f._id} className="followup-card past">
                        <div className="followup-date">
                          <span className="date">{formatDate(f.scheduledDate)}</span>
                          <span className="time">{formatTime(f.scheduledDate)}</span>
                        </div>
                        <div className="followup-details">
                          <span className="reason">{f.reason?.replace('_', ' ') || 'Follow-up'}</span>
                        </div>
                        <span className={`status-badge ${getStatusBadge(f.status).class}`}>
                          {getStatusBadge(f.status).label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpScheduling;

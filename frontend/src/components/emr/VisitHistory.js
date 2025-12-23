/**
 * Visit History Screen
 * Displays all patient visits with filtering options
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './VisitHistory.css';

const VisitHistory = ({ clinicId, patientId, onSelectVisit, onNewVisit }) => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    doctorId: '',
    status: '',
    visitType: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  useEffect(() => {
    fetchVisits();
    fetchDoctors();
  }, [clinicId, patientId, filters, pagination.page]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = {
        clinicId,
        page: pagination.page,
        limit: 20,
        ...filters
      };
      
      if (patientId) {
        params.patientId = patientId;
      }

      const response = await axios.get('/api/emr/visits', { params });
      
      if (response.data.success) {
        setVisits(response.data.visits || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          pages: response.data.pages || 1
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`/api/clinics/${clinicId}/doctors`);
      if (response.data) {
        setDoctors(response.data.doctors || response.data || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: { label: 'Waiting', class: 'waiting', icon: '⏳' },
      in_progress: { label: 'In Progress', class: 'in-progress', icon: '🔄' },
      completed: { label: 'Completed', class: 'completed', icon: '✅' },
      cancelled: { label: 'Cancelled', class: 'cancelled', icon: '❌' },
      no_show: { label: 'No Show', class: 'no-show', icon: '🚫' }
    };
    return statusConfig[status] || { label: status, class: 'default', icon: '📋' };
  };

  const getVisitTypeBadge = (type) => {
    const typeConfig = {
      walk_in: { label: 'Walk-in', icon: '🚶' },
      appointment: { label: 'Appointment', icon: '📅' },
      follow_up: { label: 'Follow-up', icon: '🔄' },
      emergency: { label: 'Emergency', icon: '🚨' }
    };
    return typeConfig[type] || { label: type, icon: '📋' };
  };

  return (
    <div className="visit-history">
      {/* Header */}
      <div className="visit-history__header">
        <div className="header-title">
          <h2>
            <span className="header-icon">📅</span>
            Visit History
          </h2>
          {patientId && (
            <span className="patient-context">Patient visits only</span>
          )}
        </div>
        {onNewVisit && (
          <button className="btn-new-visit" onClick={onNewVisit}>
            <span>➕</span> New Visit
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="visit-history__filters">
        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Doctor</label>
          <select
            value={filters.doctorId}
            onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select
            value={filters.visitType}
            onChange={(e) => setFilters({ ...filters, visitType: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="walk_in">Walk-in</option>
            <option value="appointment">Appointment</option>
            <option value="follow_up">Follow-up</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <button 
          className="btn-clear-filters"
          onClick={() => setFilters({ startDate: '', endDate: '', doctorId: '', status: '', visitType: '' })}
        >
          Clear
        </button>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="visit-history__loading">
          <div className="spinner"></div>
          <p>Loading visits...</p>
        </div>
      ) : (
        <>
          {/* Visit List */}
          <div className="visit-history__list">
            {visits.length === 0 ? (
              <div className="no-visits">
                <span className="no-visits-icon">📋</span>
                <p>No visits found</p>
                {onNewVisit && (
                  <button onClick={onNewVisit}>Create First Visit</button>
                )}
              </div>
            ) : (
              visits.map((visit) => {
                const status = getStatusBadge(visit.status);
                const visitType = getVisitTypeBadge(visit.visitType);
                
                return (
                  <div 
                    key={visit._id} 
                    className="visit-card"
                    onClick={() => onSelectVisit && onSelectVisit(visit)}
                  >
                    <div className="visit-card__header">
                      <div className="visit-date">
                        <span className="date">{formatDate(visit.visitDate)}</span>
                        <span className="time">{formatTime(visit.visitDate)}</span>
                      </div>
                      <div className="visit-badges">
                        <span className={`badge status ${status.class}`}>
                          {status.icon} {status.label}
                        </span>
                        <span className="badge type">
                          {visitType.icon} {visitType.label}
                        </span>
                      </div>
                    </div>

                    <div className="visit-card__body">
                      <div className="visit-info">
                        {!patientId && visit.patientId && (
                          <div className="info-row patient">
                            <span className="label">Patient:</span>
                            <span className="value">{visit.patientId.name}</span>
                            {visit.patientId.phone && (
                              <span className="phone">📱 {visit.patientId.phone}</span>
                            )}
                          </div>
                        )}
                        {visit.doctorId && (
                          <div className="info-row">
                            <span className="label">Doctor:</span>
                            <span className="value">Dr. {visit.doctorId.name}</span>
                            {visit.doctorId.specialization && (
                              <span className="specialization">({visit.doctorId.specialization})</span>
                            )}
                          </div>
                        )}
                        {visit.chiefComplaint && (
                          <div className="info-row complaint">
                            <span className="label">Chief Complaint:</span>
                            <span className="value">{visit.chiefComplaint}</span>
                          </div>
                        )}
                      </div>

                      <div className="visit-meta">
                        {visit.tokenNumber && (
                          <span className="token">Token #{visit.tokenNumber}</span>
                        )}
                        {visit.prescriptionId && (
                          <span className="has-prescription">💊 Prescription</span>
                        )}
                        {visit.followUp?.required && (
                          <span className="has-followup">🔄 Follow-up</span>
                        )}
                      </div>
                    </div>

                    <div className="visit-card__footer">
                      <button className="btn-view">View Details →</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="visit-history__pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                ← Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisitHistory;

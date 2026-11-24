/**
 * Audit Logs Screen
 * Searchable audit log viewer with filters
 * Advanced Plan Feature - Requirements: 5.4
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './AuditLogs.css';

const ACTION_LABELS = {
  create: { label: 'Created', icon: '➕', color: '#22c55e' },
  update: { label: 'Updated', icon: '✏️', color: '#3b82f6' },
  delete: { label: 'Deleted', icon: '🗑️', color: '#ef4444' },
  view: { label: 'Viewed', icon: '👁️', color: '#64748b' },
  export: { label: 'Exported', icon: '📤', color: '#14b8a6' },
  login: { label: 'Logged In', icon: '🔐', color: '#06b6d4' },
  logout: { label: 'Logged Out', icon: '🚪', color: '#94a3b8' },
  status_change: { label: 'Status Changed', icon: '🔄', color: '#f59e0b' },
  prescription_create: { label: 'Prescription Created', icon: '💊', color: '#22c55e' },
  prescription_update: { label: 'Prescription Updated', icon: '💊', color: '#3b82f6' },
  diagnosis_add: { label: 'Diagnosis Added', icon: '🩺', color: '#22c55e' },
  notes_update: { label: 'Notes Updated', icon: '📝', color: '#3b82f6' },
  vitals_record: { label: 'Vitals Recorded', icon: '❤️', color: '#ef4444' },
  lab_order: { label: 'Lab Ordered', icon: '🧪', color: '#14b8a6' },
  follow_up_schedule: { label: 'Follow-up Scheduled', icon: '📅', color: '#06b6d4' },
  patient_register: { label: 'Patient Registered', icon: '👤', color: '#22c55e' },
  patient_update: { label: 'Patient Updated', icon: '👤', color: '#3b82f6' },
  subscription_change: { label: 'Subscription Changed', icon: '💳', color: '#f59e0b' },
  staff_add: { label: 'Staff Added', icon: '👥', color: '#22c55e' },
  staff_remove: { label: 'Staff Removed', icon: '👥', color: '#ef4444' },
  role_change: { label: 'Role Changed', icon: '🔑', color: '#f59e0b' }
};

const ENTITY_LABELS = {
  EMRVisit: { label: 'Visit', icon: '🏥' },
  Patient: { label: 'Patient', icon: '👤' },
  Prescription: { label: 'Prescription', icon: '💊' },
  SystematicHistory: { label: 'History', icon: '📋' },
  ClinicStaff: { label: 'Staff', icon: '👥' },
  EMRSubscription: { label: 'Subscription', icon: '💳' },
  LabReport: { label: 'Lab Report', icon: '🧪' },
  Appointment: { label: 'Appointment', icon: '📅' }
};

const AuditLogs = ({ clinicId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split('T')[0],
    action: '',
    entityType: '',
    userId: '',
    search: ''
  });
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [expandedLog, setExpandedLog] = useState(null);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (clinicId) {
      fetchLogs();
      fetchUsers();
    }
  }, [clinicId, filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: 50,
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.search) params.search = filters.search;

      const response = await axios.get(`/api/emr/audit/${clinicId}`, { params });
      
      if (response.data.success) {
        setLogs(response.data.logs || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          pages: response.data.pages || 1
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`/api/emr/staff/${clinicId}`);
      if (response.data.success) {
        setUsers(response.data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionInfo = (action) => {
    return ACTION_LABELS[action] || { label: action, icon: '📌', color: '#64748b' };
  };

  const getEntityInfo = (entityType) => {
    return ENTITY_LABELS[entityType] || { label: entityType, icon: '📄' };
  };

  const clearFilters = () => {
    setFilters({
      startDate: getDefaultStartDate(),
      endDate: new Date().toISOString().split('T')[0],
      action: '',
      entityType: '',
      userId: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <div className="log-changes">
        {changes.field && (
          <div className="change-item">
            <span className="change-field">Field: {changes.field}</span>
          </div>
        )}
        {changes.oldValue !== undefined && (
          <div className="change-item old">
            <span className="change-label">Before:</span>
            <span className="change-value">{JSON.stringify(changes.oldValue)}</span>
          </div>
        )}
        {changes.newValue !== undefined && (
          <div className="change-item new">
            <span className="change-label">After:</span>
            <span className="change-value">{JSON.stringify(changes.newValue)}</span>
          </div>
        )}
        {changes.description && (
          <div className="change-description">{changes.description}</div>
        )}
      </div>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="audit-logs">
        <div className="audit-loading">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-logs">
      {/* Header */}
      <div className="audit-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">🔍</span>
            Audit Logs
          </h1>
          <p className="header-subtitle">Track who edited what and when</p>
        </div>
        <button className="btn-refresh" onClick={fetchLogs}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="audit-filters">
        <div className="filters-row">
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
            <label>Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">All Types</option>
              {Object.entries(ENTITY_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>User</label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user._id} value={user.userId?._id || user._id}>
                  {user.name || user.userId?.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters-row">
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search in logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button className="btn-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="audit-stats">
        <span className="stat-item">
          <strong>{pagination.total}</strong> logs found
        </span>
        <span className="stat-item">
          Page {pagination.page} of {pagination.pages}
        </span>
      </div>

      {/* Logs List */}
      <div className="audit-list">
        {logs.length === 0 ? (
          <div className="no-logs">
            <span className="no-logs-icon">📋</span>
            <p>No audit logs found for the selected filters</p>
          </div>
        ) : (
          logs.map((log) => {
            const actionInfo = getActionInfo(log.action);
            const entityInfo = getEntityInfo(log.entityType);
            const isExpanded = expandedLog === log._id;
            
            return (
              <div 
                key={log._id} 
                className={`audit-item ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedLog(isExpanded ? null : log._id)}
              >
                <div className="audit-item-main">
                  <div 
                    className="action-badge" 
                    style={{ backgroundColor: actionInfo.color }}
                  >
                    <span className="action-icon">{actionInfo.icon}</span>
                  </div>
                  <div className="audit-content">
                    <div className="audit-summary">
                      <span className="user-name">
                        {log.userSnapshot?.name || log.userId?.name || 'Unknown User'}
                      </span>
                      <span className="action-text">{actionInfo.label.toLowerCase()}</span>
                      <span className="entity-badge">
                        {entityInfo.icon} {entityInfo.label}
                      </span>
                    </div>
                    <div className="audit-meta">
                      <span className="audit-time">{formatDateTime(log.timestamp)}</span>
                      {log.userSnapshot?.role && (
                        <span className="user-role">{log.userSnapshot.role}</span>
                      )}
                    </div>
                  </div>
                  <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>
                </div>
                
                {isExpanded && (
                  <div className="audit-details">
                    <div className="detail-row">
                      <span className="detail-label">Entity ID:</span>
                      <span className="detail-value">{log.entityId}</span>
                    </div>
                    {log.patientId && (
                      <div className="detail-row">
                        <span className="detail-label">Patient:</span>
                        <span className="detail-value">
                          {log.patientId?.name || log.patientId}
                        </span>
                      </div>
                    )}
                    {log.metadata?.ipAddress && (
                      <div className="detail-row">
                        <span className="detail-label">IP Address:</span>
                        <span className="detail-value">{log.metadata.ipAddress}</span>
                      </div>
                    )}
                    {log.changes && renderChanges(log.changes)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="audit-pagination">
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
    </div>
  );
};

export default AuditLogs;

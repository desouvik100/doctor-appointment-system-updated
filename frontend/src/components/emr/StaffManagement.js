/**
 * Staff Management Screen
 * Invite/remove staff and role assignment
 * Advanced Plan Feature - Requirements: 5.5
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './StaffManagement.css';

const ROLES = {
  admin: { label: 'Admin', icon: '👑', description: 'Full access to all EMR features' },
  doctor: { label: 'Doctor', icon: '👨‍⚕️', description: 'Clinical screens and patient records' },
  staff: { label: 'Staff', icon: '👤', description: 'Registration and appointments only' }
};

const StaffManagement = ({ clinicId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (clinicId) {
      fetchStaff();
    }
  }, [clinicId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/emr/staff/${clinicId}`);
      if (response.data.success) {
        setStaff(response.data.staff || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const response = await axios.post(`/api/emr/staff/${clinicId}/invite`, inviteForm);
      if (response.data.success) {
        setSuccess('Invitation sent successfully!');
        setShowInviteModal(false);
        setInviteForm({ name: '', email: '', phone: '', role: 'staff', department: '' });
        fetchStaff();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (staffId, newRole) => {
    try {
      const response = await axios.put(`/api/emr/staff/${clinicId}/${staffId}/role`, {
        role: newRole
      });
      if (response.data.success) {
        setSuccess('Role updated successfully!');
        fetchStaff();
        setShowEditModal(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeactivate = async (staffId) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) {
      return;
    }
    
    try {
      const response = await axios.put(`/api/emr/staff/${clinicId}/${staffId}/deactivate`);
      if (response.data.success) {
        setSuccess('Staff member deactivated');
        fetchStaff();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate staff');
    }
  };

  const handleReactivate = async (staffId) => {
    try {
      const response = await axios.put(`/api/emr/staff/${clinicId}/${staffId}/reactivate`);
      if (response.data.success) {
        setSuccess('Staff member reactivated');
        fetchStaff();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reactivate staff');
    }
  };

  const handleResendInvite = async (staffId) => {
    try {
      const response = await axios.post(`/api/emr/staff/${clinicId}/${staffId}/resend-invite`);
      if (response.data.success) {
        setSuccess('Invitation resent!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const filteredStaff = staff.filter(s => {
    if (filter !== 'all' && s.role !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.phone?.includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (member) => {
    if (!member.isActive) {
      return { label: 'Inactive', class: 'inactive' };
    }
    if (member.invitationStatus === 'pending') {
      return { label: 'Pending', class: 'pending' };
    }
    return { label: 'Active', class: 'active' };
  };

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.isActive).length,
    doctors: staff.filter(s => s.role === 'doctor').length,
    admins: staff.filter(s => s.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="staff-management">
        <div className="staff-loading">
          <div className="spinner"></div>
          <p>Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-management">
      {/* Header */}
      <div className="staff-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">👥</span>
            Staff Management
          </h1>
          <p className="header-subtitle">Manage doctors and staff access</p>
        </div>
        <button className="btn-invite" onClick={() => setShowInviteModal(true)}>
          ➕ Invite Staff
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Stats */}
      <div className="staff-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Staff</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.doctors}</span>
          <span className="stat-label">Doctors</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.admins}</span>
          <span className="stat-label">Admins</span>
        </div>
      </div>

      {/* Filters */}
      <div className="staff-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {Object.entries(ROLES).map(([key, value]) => (
            <button 
              key={key}
              className={`filter-tab ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {value.icon} {value.label}
            </button>
          ))}
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Staff List */}
      <div className="staff-list">
        {filteredStaff.length === 0 ? (
          <div className="no-staff">
            <span className="no-staff-icon">👥</span>
            <p>No staff members found</p>
            <button onClick={() => setShowInviteModal(true)}>
              Invite your first team member
            </button>
          </div>
        ) : (
          filteredStaff.map((member) => {
            const roleInfo = ROLES[member.role] || ROLES.staff;
            const status = getStatusBadge(member);
            
            return (
              <div key={member._id} className={`staff-card ${!member.isActive ? 'inactive' : ''}`}>
                <div className="staff-avatar">
                  {member.profilePhoto ? (
                    <img src={member.profilePhoto} alt={member.name} />
                  ) : (
                    <span className="avatar-icon">{roleInfo.icon}</span>
                  )}
                </div>
                <div className="staff-info">
                  <div className="staff-name-row">
                    <h3>{member.name}</h3>
                    <span className={`status-badge ${status.class}`}>{status.label}</span>
                  </div>
                  <div className="staff-details">
                    <span className="detail-item">📧 {member.email}</span>
                    {member.phone && <span className="detail-item">📱 {member.phone}</span>}
                    {member.department && <span className="detail-item">🏢 {member.department}</span>}
                  </div>
                  <div className="staff-role">
                    <span className="role-badge" data-role={member.role}>
                      {roleInfo.icon} {roleInfo.label}
                    </span>
                    {member.joinedAt && (
                      <span className="joined-date">
                        Joined {new Date(member.joinedAt).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="staff-actions">
                  {member.invitationStatus === 'pending' && (
                    <button 
                      className="btn-action resend"
                      onClick={() => handleResendInvite(member._id)}
                      title="Resend Invitation"
                    >
                      📨
                    </button>
                  )}
                  <button 
                    className="btn-action edit"
                    onClick={() => {
                      setSelectedStaff(member);
                      setShowEditModal(true);
                    }}
                    title="Edit Role"
                  >
                    ✏️
                  </button>
                  {member.isActive ? (
                    <button 
                      className="btn-action deactivate"
                      onClick={() => handleDeactivate(member._id)}
                      title="Deactivate"
                    >
                      🚫
                    </button>
                  ) : (
                    <button 
                      className="btn-action reactivate"
                      onClick={() => handleReactivate(member._id)}
                      title="Reactivate"
                    >
                      ✅
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Invite Staff Member</h2>
              <button className="btn-close" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <div className="role-options">
                  {Object.entries(ROLES).map(([key, value]) => (
                    <label key={key} className={`role-option ${inviteForm.role === key ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value={key}
                        checked={inviteForm.role === key}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      />
                      <span className="role-icon">{value.icon}</span>
                      <span className="role-name">{value.label}</span>
                      <span className="role-desc">{value.description}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={inviteForm.department}
                  onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  placeholder="e.g., Cardiology, Reception"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Role</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="edit-staff-info">
              <p><strong>{selectedStaff.name}</strong></p>
              <p>{selectedStaff.email}</p>
            </div>
            <div className="role-options vertical">
              {Object.entries(ROLES).map(([key, value]) => (
                <button
                  key={key}
                  className={`role-option-btn ${selectedStaff.role === key ? 'current' : ''}`}
                  onClick={() => handleUpdateRole(selectedStaff._id, key)}
                >
                  <span className="role-icon">{value.icon}</span>
                  <div className="role-info">
                    <span className="role-name">{value.label}</span>
                    <span className="role-desc">{value.description}</span>
                  </div>
                  {selectedStaff.role === key && <span className="current-badge">Current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;

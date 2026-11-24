// frontend/src/components/DoctorLeaveManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DoctorLeaveManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const DoctorLeaveManager = ({ doctorId, onClose }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'personal',
    startDate: '',
    endDate: '',
    reason: '',
    isFullDay: true
  });

  useEffect(() => {
    fetchLeaves();
  }, [doctorId]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/doctor-leaves/doctor/${doctorId}`);
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/doctor-leaves`, {
        doctorId,
        ...formData
      });

      toast.success('Leave scheduled successfully');
      
      if (response.data.affectedAppointmentsCount > 0) {
        toast.warning(`${response.data.affectedAppointmentsCount} appointments may be affected`);
      }

      setShowForm(false);
      setFormData({
        leaveType: 'personal',
        startDate: '',
        endDate: '',
        reason: '',
        isFullDay: true
      });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule leave');
    }
  };

  const handleCancel = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave?')) return;

    try {
      await axios.post(`${API_URL}/doctor-leaves/${leaveId}/cancel`);
      toast.success('Leave cancelled');
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to cancel leave');
    }
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      vacation: '🏖️',
      sick: '🤒',
      personal: '👤',
      conference: '📚',
      emergency: '🚨',
      other: '📋'
    };
    return icons[type] || '📋';
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { class: 'approved', text: 'Approved' },
      pending: { class: 'pending', text: 'Pending' },
      rejected: { class: 'rejected', text: 'Rejected' },
      cancelled: { class: 'cancelled', text: 'Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-IN', options);
    }
    return `${startDate.toLocaleDateString('en-IN', options)} - ${endDate.toLocaleDateString('en-IN', options)}`;
  };

  const getDaysCount = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="leave-manager-modal">
      <div className="leave-manager-content">
        <div className="leave-manager-header">
          <h3>
            <i className="fas fa-calendar-minus"></i>
            Leave / Vacation Management
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="leave-manager-body">
          {!showForm ? (
            <>
              <button 
                className="add-leave-btn"
                onClick={() => setShowForm(true)}
              >
                <i className="fas fa-plus"></i>
                Schedule New Leave
              </button>

              {loading ? (
                <div className="leave-loading">
                  <div className="spinner"></div>
                  <p>Loading leaves...</p>
                </div>
              ) : leaves.length === 0 ? (
                <div className="no-leaves">
                  <i className="fas fa-calendar-check"></i>
                  <h4>No leaves scheduled</h4>
                  <p>Click the button above to schedule a leave or vacation.</p>
                </div>
              ) : (
                <div className="leaves-list">
                  {leaves.map(leave => (
                    <div key={leave._id} className={`leave-card ${leave.status}`}>
                      <div className="leave-card-header">
                        <span className="leave-type">
                          {getLeaveTypeIcon(leave.leaveType)} {leave.leaveType}
                        </span>
                        <span className={`leave-status ${getStatusBadge(leave.status).class}`}>
                          {getStatusBadge(leave.status).text}
                        </span>
                      </div>
                      
                      <div className="leave-dates">
                        <i className="fas fa-calendar"></i>
                        {formatDateRange(leave.startDate, leave.endDate)}
                        <span className="days-count">
                          ({getDaysCount(leave.startDate, leave.endDate)} days)
                        </span>
                      </div>

                      {leave.reason && (
                        <p className="leave-reason">{leave.reason}</p>
                      )}

                      {leave.affectedAppointments?.length > 0 && (
                        <div className="affected-warning">
                          <i className="fas fa-exclamation-triangle"></i>
                          {leave.affectedAppointments.length} appointments affected
                        </div>
                      )}

                      {(leave.status === 'approved' || leave.status === 'pending') && 
                       new Date(leave.startDate) > new Date() && (
                        <button 
                          className="cancel-leave-btn"
                          onClick={() => handleCancel(leave._id)}
                        >
                          <i className="fas fa-times"></i> Cancel Leave
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form className="leave-form" onSubmit={handleSubmit}>
              <h4>Schedule New Leave</h4>

              <div className="form-group">
                <label>Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                >
                  <option value="vacation">🏖️ Vacation</option>
                  <option value="sick">🤒 Sick Leave</option>
                  <option value="personal">👤 Personal</option>
                  <option value="conference">📚 Conference/Training</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for leave..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <i className="fas fa-check"></i> Schedule Leave
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorLeaveManager;

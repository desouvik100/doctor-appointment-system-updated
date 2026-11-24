import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from '../api/config';
import toast from 'react-hot-toast';
import './SmartHealthReminders.css';

const SmartHealthReminders = ({ user, onClose }) => {
  const [reminders, setReminders] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('due');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showSetupCondition, setShowSetupCondition] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchReminders = useCallback(async () => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const [allRes, dueRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/health-reminders`, {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        }),
        fetch(`${API_BASE_URL}/api/health-reminders/due`, {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        }),
        fetch(`${API_BASE_URL}/api/health-reminders/stats`, {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        })
      ]);
      
      if (allRes.ok) setReminders(await allRes.json());
      if (dueRes.ok) setDueReminders(await dueRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleComplete = async (reminderId, action = 'marked_done') => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/health-reminders/${reminderId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        toast.success('Reminder completed!');
        fetchReminders();
      }
    } catch (error) {
      toast.error('Failed to complete reminder');
    }
  };

  const handleSnooze = async (reminderId, days = 3) => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/health-reminders/${reminderId}/snooze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      });
      
      if (response.ok) {
        toast.success(`Snoozed for ${days} days`);
        fetchReminders();
      }
    } catch (error) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleSetupCondition = async (condition, childDOB = null) => {
    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const body = condition === 'child' ? { childDOB } : {};
      
      const response = await fetch(`${API_BASE_URL}/api/health-reminders/setup/${condition}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.count} reminders created for ${condition}`);
        fetchReminders();
        setShowSetupCondition(false);
      }
    } catch (error) {
      toast.error('Failed to setup reminders');
    }
  };

  const getReminderIcon = (type) => {
    const icons = {
      'checkup': 'fa-stethoscope',
      'vaccination': 'fa-syringe',
      'lab_test': 'fa-flask',
      'medicine_refill': 'fa-pills',
      'follow_up': 'fa-calendar-check',
      'screening': 'fa-microscope',
      'dental': 'fa-tooth',
      'eye': 'fa-eye',
      'custom': 'fa-bell'
    };
    return icons[type] || 'fa-bell';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgent': '#dc2626',
      'high': '#f97316',
      'medium': '#eab308',
      'low': '#22c55e'
    };
    return colors[priority] || '#64748b';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="health-reminders-loading">
        <div className="spinner"></div>
        <p>Loading reminders...</p>
      </div>
    );
  }

  return (
    <div className="smart-health-reminders">
      <div className="reminders-header">
        <div className="header-title">
          <i className="fas fa-bell"></i>
          <h2>Smart Health Reminders</h2>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card overdue">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-card completed">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      )}

      {/* Quick Setup */}
      <div className="quick-setup">
        <h3>Quick Setup</h3>
        <p>Set up automatic reminders for health conditions</p>
        <div className="condition-buttons">
          <button onClick={() => handleSetupCondition('diabetes')}>
            <i className="fas fa-tint"></i> Diabetes
          </button>
          <button onClick={() => handleSetupCondition('hypertension')}>
            <i className="fas fa-heartbeat"></i> Hypertension
          </button>
          <button onClick={() => setShowSetupCondition(true)}>
            <i className="fas fa-baby"></i> Child Vaccination
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="reminders-tabs">
        <button 
          className={`tab ${activeTab === 'due' ? 'active' : ''}`}
          onClick={() => setActiveTab('due')}
        >
          Due Soon ({dueReminders.length})
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Reminders
        </button>
      </div>

      {/* Add Reminder Button */}
      <button className="add-reminder-btn" onClick={() => setShowAddReminder(true)}>
        <i className="fas fa-plus"></i> Add Custom Reminder
      </button>

      {/* Reminders List */}
      <div className="reminders-list">
        {(activeTab === 'due' ? dueReminders : reminders).length > 0 ? (
          (activeTab === 'due' ? dueReminders : reminders).map(reminder => (
            <div key={reminder._id} className={`reminder-card ${reminder.status}`}>
              <div className="reminder-icon" style={{ backgroundColor: getPriorityColor(reminder.priority) + '20' }}>
                <i className={`fas ${getReminderIcon(reminder.type)}`} style={{ color: getPriorityColor(reminder.priority) }}></i>
              </div>
              
              <div className="reminder-content">
                <div className="reminder-header">
                  <h4>{reminder.title}</h4>
                  <span className={`priority-badge ${reminder.priority}`}>
                    {reminder.priority}
                  </span>
                </div>
                
                {reminder.description && (
                  <p className="reminder-description">{reminder.description}</p>
                )}
                
                <div className="reminder-meta">
                  <span className="reminder-date">
                    <i className="fas fa-calendar"></i>
                    {formatDate(reminder.nextDueDate || reminder.scheduledDate)}
                  </span>
                  <span className="reminder-type">
                    {reminder.type.replace('_', ' ')}
                  </span>
                  {reminder.frequency !== 'once' && (
                    <span className="reminder-frequency">
                      <i className="fas fa-sync"></i> {reminder.frequency}
                    </span>
                  )}
                </div>

                {reminder.labTestDetails && (
                  <div className="lab-test-info">
                    <span>{reminder.labTestDetails.testName}</span>
                    {reminder.labTestDetails.normalRange && (
                      <small>Normal: {reminder.labTestDetails.normalRange}</small>
                    )}
                  </div>
                )}

                {reminder.vaccinationDetails && (
                  <div className="vaccination-info">
                    <span>{reminder.vaccinationDetails.vaccineName}</span>
                    <small>Dose {reminder.vaccinationDetails.doseNumber} of {reminder.vaccinationDetails.totalDoses}</small>
                  </div>
                )}
              </div>

              <div className="reminder-actions">
                <button 
                  className="action-btn complete"
                  onClick={() => handleComplete(reminder._id)}
                  title="Mark as done"
                >
                  <i className="fas fa-check"></i>
                </button>
                <button 
                  className="action-btn snooze"
                  onClick={() => handleSnooze(reminder._id)}
                  title="Snooze 3 days"
                >
                  <i className="fas fa-clock"></i>
                </button>
                <button 
                  className="action-btn book"
                  title="Book appointment"
                >
                  <i className="fas fa-calendar-plus"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-reminders">
            <i className="fas fa-bell-slash"></i>
            <p>No {activeTab === 'due' ? 'due' : ''} reminders</p>
            <button onClick={() => setShowAddReminder(true)}>Create your first reminder</button>
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddReminder && (
        <AddReminderModal
          onClose={() => setShowAddReminder(false)}
          onAdd={() => { fetchReminders(); setShowAddReminder(false); }}
        />
      )}

      {/* Setup Condition Modal */}
      {showSetupCondition && (
        <SetupConditionModal
          onClose={() => setShowSetupCondition(false)}
          onSetup={handleSetupCondition}
        />
      )}
    </div>
  );
};

// Add Reminder Modal
const AddReminderModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    type: 'checkup',
    title: '',
    description: '',
    frequency: 'once',
    scheduledDate: '',
    priority: 'medium'
  });

  const types = [
    { id: 'checkup', label: 'Health Checkup' },
    { id: 'vaccination', label: 'Vaccination' },
    { id: 'lab_test', label: 'Lab Test' },
    { id: 'medicine_refill', label: 'Medicine Refill' },
    { id: 'follow_up', label: 'Follow-up' },
    { id: 'dental', label: 'Dental' },
    { id: 'eye', label: 'Eye Checkup' },
    { id: 'custom', label: 'Custom' }
  ];

  const frequencies = [
    { id: 'once', label: 'One time' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Every 3 months' },
    { id: 'half_yearly', label: 'Every 6 months' },
    { id: 'yearly', label: 'Yearly' }
  ];

  const handleSubmit = async () => {
    if (!formData.title || !formData.scheduledDate) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const token = localStorage.getItem('user');
      const parsed = JSON.parse(token);
      
      const response = await fetch(`${API_BASE_URL}/api/health-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parsed.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Reminder created!');
        onAdd();
      }
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Add Health Reminder</h3>
        
        <div className="form-group">
          <label>Type</label>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Annual health checkup"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Additional details..."
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
              {frequencies.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <div className="priority-options">
            {['low', 'medium', 'high', 'urgent'].map(p => (
              <button
                key={p}
                className={`priority-btn ${formData.priority === p ? 'selected' : ''} ${p}`}
                onClick={() => setFormData({...formData, priority: p})}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={handleSubmit}>Create Reminder</button>
        </div>
      </div>
    </div>
  );
};

// Setup Condition Modal
const SetupConditionModal = ({ onClose, onSetup }) => {
  const [childDOB, setChildDOB] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Child Vaccination Schedule</h3>
        <p>Enter your child's date of birth to set up vaccination reminders according to the national immunization schedule.</p>
        
        <div className="form-group">
          <label>Child's Date of Birth</label>
          <input
            type="date"
            value={childDOB}
            onChange={e => setChildDOB(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="confirm-btn" 
            onClick={() => onSetup('child', childDOB)}
            disabled={!childDOB}
          >
            Setup Reminders
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartHealthReminders;

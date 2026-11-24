// frontend/src/components/MedicineReminders.js
// Medicine Reminder System for Patients
import { useState, useEffect } from 'react';
import './MedicineReminders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005';

const MedicineReminders = ({ userId, onClose }) => {
  const [reminders, setReminders] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'once_daily',
    timing: 'after_food',
    times: [{ hour: 9, minute: 0, label: 'Morning' }],
    durationDays: 7,
    instructions: ''
  });

  const frequencies = [
    { value: 'once_daily', label: 'Once Daily', times: 1 },
    { value: 'twice_daily', label: 'Twice Daily', times: 2 },
    { value: 'thrice_daily', label: 'Three Times Daily', times: 3 },
    { value: 'four_times', label: 'Four Times Daily', times: 4 }
  ];

  const timings = [
    { value: 'before_food', label: 'Before Food', icon: 'fa-utensils' },
    { value: 'after_food', label: 'After Food', icon: 'fa-utensils' },
    { value: 'with_food', label: 'With Food', icon: 'fa-utensils' },
    { value: 'empty_stomach', label: 'Empty Stomach', icon: 'fa-glass-water' },
    { value: 'bedtime', label: 'At Bedtime', icon: 'fa-bed' }
  ];

  useEffect(() => {
    fetchReminders();
    fetchTodaySchedule();
    fetchStats();
  }, [userId]);

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicine-reminders/user/${userId}?active=true`);
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error('Fetch reminders error:', error);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicine-reminders/user/${userId}/today`);
      const data = await response.json();
      setTodaySchedule(data);
    } catch (error) {
      console.error('Fetch today schedule error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicine-reminders/user/${userId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleTakeDose = async (reminderId, scheduledTime) => {
    try {
      await fetch(`${API_URL}/api/medicine-reminders/${reminderId}/take-dose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime })
      });
      fetchTodaySchedule();
      fetchStats();
    } catch (error) {
      console.error('Take dose error:', error);
    }
  };

  const handleSkipDose = async (reminderId, scheduledTime) => {
    try {
      await fetch(`${API_URL}/api/medicine-reminders/${reminderId}/skip-dose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime })
      });
      fetchTodaySchedule();
    } catch (error) {
      console.error('Skip dose error:', error);
    }
  };

  const handleAddReminder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/medicine-reminders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...newReminder
        })
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewReminder({
          medicineName: '',
          dosage: '',
          frequency: 'once_daily',
          timing: 'after_food',
          times: [{ hour: 9, minute: 0, label: 'Morning' }],
          durationDays: 7,
          instructions: ''
        });
        fetchReminders();
        fetchTodaySchedule();
      }
    } catch (error) {
      console.error('Add reminder error:', error);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      await fetch(`${API_URL}/api/medicine-reminders/${reminderId}`, {
        method: 'DELETE'
      });
      fetchReminders();
      fetchTodaySchedule();
    } catch (error) {
      console.error('Delete reminder error:', error);
    }
  };

  const updateFrequencyTimes = (frequency) => {
    const freq = frequencies.find(f => f.value === frequency);
    let times = [];
    
    switch (freq?.times) {
      case 1:
        times = [{ hour: 9, minute: 0, label: 'Morning' }];
        break;
      case 2:
        times = [
          { hour: 9, minute: 0, label: 'Morning' },
          { hour: 21, minute: 0, label: 'Night' }
        ];
        break;
      case 3:
        times = [
          { hour: 8, minute: 0, label: 'Morning' },
          { hour: 14, minute: 0, label: 'Afternoon' },
          { hour: 21, minute: 0, label: 'Night' }
        ];
        break;
      case 4:
        times = [
          { hour: 8, minute: 0, label: 'Morning' },
          { hour: 12, minute: 0, label: 'Noon' },
          { hour: 18, minute: 0, label: 'Evening' },
          { hour: 22, minute: 0, label: 'Night' }
        ];
        break;
      default:
        times = [{ hour: 9, minute: 0, label: 'Morning' }];
    }
    
    setNewReminder(prev => ({ ...prev, frequency, times }));
  };

  const formatTime = (hour, minute) => {
    // Handle case where hour is a string like "09:00"
    if (typeof hour === 'string' && hour.includes(':')) {
      const [h, m] = hour.split(':').map(Number);
      const hour12 = h % 12 || 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      return `${hour12}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
    }
    // Handle normal case with hour and minute as numbers
    const h = (hour || 0) % 12 || 12;
    const ampm = (hour || 0) < 12 ? 'AM' : 'PM';
    return `${h}:${(minute || 0).toString().padStart(2, '0')} ${ampm}`;
  };

  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  };

  if (loading) {
    return (
      <div className="medicine-reminders">
        <div className="medicine-reminders__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medicine-reminders">
      <div className="medicine-reminders__header">
        <h2><i className="fas fa-pills"></i> Medicine Reminders</h2>
        {onClose && (
          <button className="medicine-reminders__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="medicine-reminders__stats">
          <div className="stat-card stat-card--primary">
            <i className="fas fa-capsules"></i>
            <div className="stat-card__content">
              <span className="stat-card__value">{stats.totalReminders}</span>
              <span className="stat-card__label">Active Medicines</span>
            </div>
          </div>
          <div className="stat-card stat-card--success">
            <i className="fas fa-check-circle"></i>
            <div className="stat-card__content">
              <span className="stat-card__value">{stats.averageAdherence}%</span>
              <span className="stat-card__label">Adherence Rate</span>
            </div>
          </div>
          <div className="stat-card stat-card--info">
            <i className="fas fa-calendar-check"></i>
            <div className="stat-card__content">
              <span className="stat-card__value">{stats.totalDosesTaken}</span>
              <span className="stat-card__label">Doses Taken</span>
            </div>
          </div>
          <div className="stat-card stat-card--warning">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="stat-card__content">
              <span className="stat-card__value">{stats.totalDosesMissed}</span>
              <span className="stat-card__label">Doses Missed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="medicine-reminders__tabs">
        <button 
          className={`tab ${activeTab === 'today' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <i className="fas fa-sun"></i> Today's Schedule
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="fas fa-list"></i> All Medicines
        </button>
      </div>

      {/* Content */}
      <div className="medicine-reminders__content">
        {activeTab === 'today' && (
          <div className="today-schedule">
            <div className="today-schedule__header">
              <h3><i className="fas fa-clock"></i> {getCurrentTimeSlot()} Medicines</h3>
              <span className="today-schedule__date">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No medicines scheduled for today!</p>
              </div>
            ) : (
              <div className="schedule-list">
                {todaySchedule.map((reminder) => (
                  <div key={reminder._id} className="schedule-item">
                    <div className="schedule-item__icon">
                      <i className="fas fa-pills"></i>
                    </div>
                    <div className="schedule-item__info">
                      <h4>{reminder.medicineName}</h4>
                      <p>{reminder.dosage} • {timings.find(t => t.value === reminder.timing)?.label}</p>
                      <div className="schedule-item__times">
                        {reminder.times?.map((time, idx) => {
                          // Handle both object {hour, minute} and string "HH:MM" formats
                          const timeHour = typeof time === 'string' ? parseInt(time.split(':')[0]) : time?.hour;
                          const taken = reminder.dosesTaken?.some(d => 
                            d.status === 'taken' && 
                            new Date(d.scheduledTime).getHours() === timeHour
                          );
                          return (
                            <span 
                              key={idx} 
                              className={`time-badge ${taken ? 'time-badge--taken' : ''}`}
                            >
                              {taken && <i className="fas fa-check"></i>}
                              {typeof time === 'string' ? formatTime(time) : formatTime(time?.hour, time?.minute)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="schedule-item__actions">
                      <button 
                        className="btn-take"
                        onClick={() => handleTakeDose(reminder._id, new Date())}
                      >
                        <i className="fas fa-check"></i> Take
                      </button>
                      <button 
                        className="btn-skip"
                        onClick={() => handleSkipDose(reminder._id, new Date())}
                      >
                        <i className="fas fa-forward"></i> Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="all-medicines">
            <div className="all-medicines__header">
              <h3><i className="fas fa-capsules"></i> Your Medicines</h3>
              <button className="btn-add" onClick={() => setShowAddForm(true)}>
                <i className="fas fa-plus"></i> Add Medicine
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-prescription-bottle"></i>
                <p>No medicine reminders set</p>
                <button className="btn-add-first" onClick={() => setShowAddForm(true)}>
                  <i className="fas fa-plus"></i> Add Your First Medicine
                </button>
              </div>
            ) : (
              <div className="medicines-grid">
                {reminders.map((reminder) => (
                  <div key={reminder._id} className="medicine-card">
                    <div className="medicine-card__header">
                      <div className="medicine-card__icon">
                        <i className="fas fa-pills"></i>
                      </div>
                      <button 
                        className="medicine-card__delete"
                        onClick={() => handleDeleteReminder(reminder._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <h4>{reminder.medicineName}</h4>
                    <p className="medicine-card__dosage">{reminder.dosage}</p>
                    <div className="medicine-card__details">
                      <span><i className="fas fa-clock"></i> {frequencies.find(f => f.value === reminder.frequency)?.label}</span>
                      <span><i className="fas fa-utensils"></i> {timings.find(t => t.value === reminder.timing)?.label}</span>
                    </div>
                    <div className="medicine-card__progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar__fill"
                          style={{ width: `${reminder.adherenceRate || 100}%` }}
                        ></div>
                      </div>
                      <span>{reminder.adherenceRate || 100}% adherence</span>
                    </div>
                    {reminder.endDate && (
                      <p className="medicine-card__end">
                        <i className="fas fa-calendar"></i> Until {new Date(reminder.endDate).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="add-reminder-modal">
            <div className="modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add Medicine Reminder</h3>
              <button onClick={() => setShowAddForm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Paracetamol 500mg"
                  value={newReminder.medicineName}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, medicineName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Dosage *</label>
                <input
                  type="text"
                  placeholder="e.g., 1 tablet"
                  value={newReminder.dosage}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, dosage: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={newReminder.frequency}
                    onChange={(e) => updateFrequencyTimes(e.target.value)}
                  >
                    {frequencies.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Timing</label>
                  <select
                    value={newReminder.timing}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, timing: e.target.value }))}
                  >
                    {timings.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newReminder.durationDays}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                />
              </div>
              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  placeholder="Any special instructions..."
                  value={newReminder.instructions}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={handleAddReminder}
                disabled={!newReminder.medicineName || !newReminder.dosage}
              >
                <i className="fas fa-check"></i> Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineReminders;

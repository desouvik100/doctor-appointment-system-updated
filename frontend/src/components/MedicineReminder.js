import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './MedicineReminder.css';

const MedicineReminder = ({ userId }) => {
  const [medicines, setMedicines] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [todayReminders, setTodayReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', frequency: 'daily', times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', notes: '', color: '#667eea', emailReminders: true
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice', label: 'Twice a day' },
    { value: 'thrice', label: 'Three times a day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'asNeeded', label: 'As needed' }
  ];
  const colorOptions = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const fetchMedicines = useCallback(async () => {
    try {
      const response = await axios.get(`/api/medicines/user/${userId}`);
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  }, [userId]);

  const fetchTodayReminders = useCallback(async () => {
    try {
      const response = await axios.get(`/api/medicines/user/${userId}/today`);
      setTodayReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      buildLocalReminders();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const buildLocalReminders = () => {
    const today = new Date().toDateString();
    const reminders = [];
    medicines.forEach(med => {
      if (med.frequency !== 'asNeeded') {
        (med.times || []).forEach(time => {
          reminders.push({
            medicineId: med._id || med.id, name: med.name,
            dosage: med.dosage, time, color: med.color, taken: false
          });
        });
      }
    });
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    setTodayReminders(reminders);
  };


  useEffect(() => {
    fetchMedicines();
    fetchTodayReminders();
    const interval = setInterval(fetchTodayReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchMedicines, fetchTodayReminders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') toast.success('Browser notifications enabled!');
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      toast.error('Name and dosage are required');
      return;
    }
    try {
      const response = await axios.post('/api/medicines', { userId, ...newMedicine });
      setMedicines([response.data, ...medicines]);
      setNewMedicine({
        name: '', dosage: '', frequency: 'daily', times: ['08:00'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '', notes: '', color: '#667eea', emailReminders: true
      });
      setShowAddForm(false);
      toast.success('Medicine added! Email reminders will be sent at scheduled times.');
      fetchTodayReminders();
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleDeleteMedicine = async (id) => {
    try {
      await axios.delete(`/api/medicines/${id}`);
      setMedicines(medicines.filter(m => (m._id || m.id) !== id));
      toast.success('Medicine removed');
      fetchTodayReminders();
    } catch (error) {
      toast.error('Failed to delete medicine');
    }
  };

  const markAsTaken = async (reminder) => {
    try {
      await axios.post(`/api/medicines/${reminder.medicineId}/taken`, { time: reminder.time });
      setTodayReminders(prev => prev.map(r => 
        r.medicineId === reminder.medicineId && r.time === reminder.time
          ? { ...r, taken: true } : r
      ));
      toast.success(`${reminder.name} marked as taken ✓`);
    } catch (error) {
      toast.error('Failed to mark as taken');
    }
  };

  const toggleEmailReminders = async (medicineId, enabled) => {
    try {
      await axios.put(`/api/medicines/${medicineId}/email-reminders`, { enabled });
      setMedicines(prev => prev.map(m => 
        (m._id || m.id) === medicineId ? { ...m, emailReminders: enabled } : m
      ));
      toast.success(`Email reminders ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling email reminders:', error);
    }
  };

  const updateTimes = (index, value) => {
    const newTimes = [...newMedicine.times];
    newTimes[index] = value;
    setNewMedicine({ ...newMedicine, times: newTimes });
  };

  const addTimeSlot = () => setNewMedicine({ ...newMedicine, times: [...newMedicine.times, '12:00'] });
  const removeTimeSlot = (index) => setNewMedicine({ ...newMedicine, times: newMedicine.times.filter((_, i) => i !== index) });

  const getProgress = () => {
    if (todayReminders.length === 0) return 100;
    return Math.round((todayReminders.filter(r => r.taken).length / todayReminders.length) * 100);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="medicine-reminder">
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p className="mt-2">Loading medicines...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="medicine-reminder">
      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-header">
          <h3>Today's Medicines</h3>
          <span className="progress-text">{getProgress()}% Complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getProgress()}%` }}></div>
        </div>
        <div className="reminder-options">
          <button className="notification-btn" onClick={requestNotificationPermission}>
            <i className="fas fa-bell"></i> Browser Alerts
          </button>
          <span className="email-info">
            <i className="fas fa-envelope"></i> Email reminders sent automatically
          </span>
        </div>
      </div>

      {/* Today's Reminders */}
      <div className="reminders-section">
        <h3><i className="fas fa-clock"></i> Today's Schedule</h3>
        {todayReminders.length === 0 ? (
          <p className="no-reminders">No medicines scheduled for today</p>
        ) : (
          <div className="reminders-list">
            {todayReminders.map((reminder, index) => (
              <div key={`${reminder.medicineId}-${reminder.time}-${index}`}
                className={`reminder-card ${reminder.taken ? 'taken' : ''}`}
                style={{ '--med-color': reminder.color }}>
                <div className="reminder-time">{formatTime(reminder.time)}</div>
                <div className="reminder-info">
                  <h4>{reminder.name}</h4>
                  <p>{reminder.dosage}</p>
                </div>
                {!reminder.taken ? (
                  <button className="take-btn" onClick={() => markAsTaken(reminder)}>
                    <i className="fas fa-check"></i> Take
                  </button>
                ) : (
                  <span className="taken-badge"><i className="fas fa-check-circle"></i> Taken</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Medicines */}
      <div className="medicines-section">
        <div className="section-header">
          <h3><i className="fas fa-pills"></i> My Medicines</h3>
          <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
          </button>
        </div>

        {showAddForm && (
          <div className="add-medicine-form">
            <div className="form-row">
              <input type="text" placeholder="Medicine Name" value={newMedicine.name}
                onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})} />
              <input type="text" placeholder="Dosage (e.g., 500mg)" value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})} />
            </div>
            <select value={newMedicine.frequency}
              onChange={(e) => setNewMedicine({...newMedicine, frequency: e.target.value})}>
              {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div className="times-section">
              <label>Reminder Times:</label>
              {newMedicine.times.map((time, index) => (
                <div key={index} className="time-input">
                  <input type="time" value={time} onChange={(e) => updateTimes(index, e.target.value)} />
                  {newMedicine.times.length > 1 && (
                    <button type="button" onClick={() => removeTimeSlot(index)}><i className="fas fa-times"></i></button>
                  )}
                </div>
              ))}
              <button type="button" className="add-time-btn" onClick={addTimeSlot}>
                <i className="fas fa-plus"></i> Add Time
              </button>
            </div>
            <div className="color-picker">
              <label>Color:</label>
              <div className="colors">
                {colorOptions.map(color => (
                  <button key={color} type="button"
                    className={`color-btn ${newMedicine.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setNewMedicine({...newMedicine, color})} />
                ))}
              </div>
            </div>
            <div className="email-toggle">
              <label>
                <input type="checkbox" checked={newMedicine.emailReminders}
                  onChange={(e) => setNewMedicine({...newMedicine, emailReminders: e.target.checked})} />
                <span>Send email reminders at scheduled times</span>
              </label>
            </div>
            <textarea placeholder="Notes (optional)" value={newMedicine.notes}
              onChange={(e) => setNewMedicine({...newMedicine, notes: e.target.value})} />
            <button className="save-btn" onClick={handleAddMedicine}>
              <i className="fas fa-save"></i> Save Medicine
            </button>
          </div>
        )}

        <div className="medicines-list">
          {medicines.length === 0 ? (
            <p className="no-medicines">No medicines added yet. Add your first medicine to get reminders!</p>
          ) : (
            medicines.map(med => (
              <div key={med._id || med.id} className="medicine-card" style={{ '--med-color': med.color }}>
                <div className="medicine-color-bar"></div>
                <div className="medicine-info">
                  <h4>{med.name}</h4>
                  <p className="dosage">{med.dosage}</p>
                  <p className="frequency"><i className="fas fa-clock"></i> {frequencyOptions.find(f => f.value === med.frequency)?.label}</p>
                  <p className="times"><i className="fas fa-bell"></i> {(med.times || []).map(t => formatTime(t)).join(', ')}</p>
                  <p className="email-status">
                    <i className={`fas fa-envelope ${med.emailReminders ? 'text-success' : 'text-muted'}`}></i>
                    {med.emailReminders ? 'Email reminders on' : 'Email reminders off'}
                  </p>
                </div>
                <div className="medicine-actions">
                  <button className={`email-toggle-btn ${med.emailReminders ? 'active' : ''}`}
                    onClick={() => toggleEmailReminders(med._id || med.id, !med.emailReminders)}
                    title={med.emailReminders ? 'Disable email' : 'Enable email'}>
                    <i className="fas fa-envelope"></i>
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteMedicine(med._id || med.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineReminder;

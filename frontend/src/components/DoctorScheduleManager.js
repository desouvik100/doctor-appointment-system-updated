import { useState, useEffect, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './DoctorScheduleManager.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const DoctorScheduleManager = ({ doctorId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState('weekly'); // weekly, calendar, settings
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [specialDates, setSpecialDates] = useState([]);
  const [consultationDuration, setConsultationDuration] = useState(30); // Queue-based booking duration
  const [consultationSettings, setConsultationSettings] = useState({
    virtualConsultationEnabled: true,
    inClinicConsultationEnabled: true,
    virtualConsultationFee: null,
    slotDuration: 15,
    bufferTime: 5,
    advanceBookingDays: 30,
    cancellationHours: 24
  });
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Special date modal
  const [showSpecialDateModal, setShowSpecialDateModal] = useState(false);
  const [specialDateForm, setSpecialDateForm] = useState({
    date: '', isAvailable: false, reason: '', slots: []
  });

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/doctors/${doctorId}/schedule`);
      if (response.data.success) {
        const { schedule } = response.data;
        setWeeklySchedule(schedule.weeklySchedule || getDefaultSchedule());
        setSpecialDates(schedule.specialDates || []);
        setConsultationSettings(schedule.consultationSettings || consultationSettings);
        setConsultationDuration(schedule.consultationDuration || 30);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setWeeklySchedule(getDefaultSchedule());
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchCalendar = useCallback(async () => {
    try {
      const month = currentMonth.getMonth();
      const year = currentMonth.getFullYear();
      const response = await axios.get(`/api/doctors/${doctorId}/calendar?month=${month}&year=${year}`);
      if (response.data.success) {
        setCalendarData(response.data.calendar || []);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  }, [doctorId, currentMonth]);

  useEffect(() => {
    if (doctorId) {
      fetchSchedule();
    }
  }, [doctorId, fetchSchedule]);

  useEffect(() => {
    if (doctorId && activeView === 'calendar') {
      fetchCalendar();
    }
  }, [doctorId, activeView, fetchCalendar]);

  const getDefaultSchedule = () => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {
        isAvailable: day !== 'sunday',
        slots: day !== 'sunday' ? [
          { startTime: '09:00', endTime: '13:00', type: 'both', maxPatients: 10 },
          { startTime: '14:00', endTime: '18:00', type: 'both', maxPatients: 10 }
        ] : []
      };
    });
    return schedule;
  };

  const handleDayToggle = (day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], isAvailable: !prev[day]?.isAvailable }
    }));
  };

  const handleSlotChange = (day, slotIndex, field, value) => {
    setWeeklySchedule(prev => {
      const daySchedule = { ...prev[day] };
      const slots = [...(daySchedule.slots || [])];
      slots[slotIndex] = { ...slots[slotIndex], [field]: value };
      return { ...prev, [day]: { ...daySchedule, slots } };
    });
  };

  const addSlot = (day) => {
    setWeeklySchedule(prev => {
      const daySchedule = { ...prev[day] };
      const slots = [...(daySchedule.slots || [])];
      slots.push({ startTime: '09:00', endTime: '17:00', type: 'both', maxPatients: 10 });
      return { ...prev, [day]: { ...daySchedule, slots } };
    });
  };

  const removeSlot = (day, slotIndex) => {
    setWeeklySchedule(prev => {
      const daySchedule = { ...prev[day] };
      const slots = [...(daySchedule.slots || [])];
      slots.splice(slotIndex, 1);
      return { ...prev, [day]: { ...daySchedule, slots } };
    });
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      const response = await axios.put(`/api/doctors/${doctorId}/schedule`, {
        weeklySchedule,
        consultationSettings,
        consultationDuration
      });
      if (response.data.success) {
        toast.success('Schedule saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialDate = async () => {
    if (!specialDateForm.date) {
      toast.error('Please select a date');
      return;
    }
    try {
      const response = await axios.post(`/api/doctors/${doctorId}/special-dates`, specialDateForm);
      if (response.data.success) {
        setSpecialDates(response.data.specialDates);
        setShowSpecialDateModal(false);
        setSpecialDateForm({ date: '', isAvailable: false, reason: '', slots: [] });
        toast.success('Special date added!');
        if (activeView === 'calendar') fetchCalendar();
      }
    } catch (error) {
      toast.error('Failed to add special date');
    }
  };

  const removeSpecialDate = async (dateId) => {
    if (!window.confirm('Remove this special date?')) return;
    try {
      const response = await axios.delete(`/api/doctors/${doctorId}/special-dates/${dateId}`);
      if (response.data.success) {
        setSpecialDates(response.data.specialDates);
        toast.success('Special date removed');
        if (activeView === 'calendar') fetchCalendar();
      }
    } catch (error) {
      toast.error('Failed to remove special date');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="schedule-manager-loading">
        <div className="spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="doctor-schedule-manager">
      {/* Header */}
      <div className="schedule-header">
        <h4><i className="fas fa-calendar-alt me-2"></i>Manage Your Schedule</h4>
        <p className="text-muted">Set your availability for virtual and in-clinic consultations</p>
      </div>

      {/* View Tabs */}
      <div className="schedule-tabs">
        <button 
          className={`schedule-tab ${activeView === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveView('weekly')}
        >
          <i className="fas fa-calendar-week me-2"></i>Weekly Schedule
        </button>
        <button 
          className={`schedule-tab ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <i className="fas fa-calendar me-2"></i>Calendar View
        </button>
        <button 
          className={`schedule-tab ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <i className="fas fa-cog me-2"></i>Settings
        </button>
      </div>


      {/* Weekly Schedule View */}
      {activeView === 'weekly' && (
        <div className="weekly-schedule-view">
          <div className="schedule-days">
            {DAYS.map(day => (
              <div key={day} className={`schedule-day-card ${weeklySchedule[day]?.isAvailable ? 'available' : 'unavailable'}`}>
                <div className="day-header">
                  <label className="day-toggle">
                    <input
                      type="checkbox"
                      checked={weeklySchedule[day]?.isAvailable || false}
                      onChange={() => handleDayToggle(day)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <h5>{DAY_LABELS[day]}</h5>
                  {weeklySchedule[day]?.isAvailable && (
                    <button className="btn-add-slot" onClick={() => addSlot(day)} title="Add time slot">
                      <i className="fas fa-plus"></i>
                    </button>
                  )}
                </div>
                
                {weeklySchedule[day]?.isAvailable ? (
                  <div className="day-slots">
                    {(weeklySchedule[day]?.slots || []).map((slot, idx) => (
                      <div key={idx} className="time-slot">
                        <div className="slot-times">
                          <input
                            type="time"
                            value={slot.startTime || '09:00'}
                            onChange={(e) => handleSlotChange(day, idx, 'startTime', e.target.value)}
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={slot.endTime || '17:00'}
                            onChange={(e) => handleSlotChange(day, idx, 'endTime', e.target.value)}
                          />
                        </div>
                        <div className="slot-options">
                          <select
                            value={slot.type || 'both'}
                            onChange={(e) => handleSlotChange(day, idx, 'type', e.target.value)}
                            className="slot-type-select"
                          >
                            <option value="both">Both</option>
                            <option value="in-clinic">In-Clinic Only</option>
                            <option value="virtual">Virtual Only</option>
                          </select>
                          <button 
                            className="btn-remove-slot"
                            onClick={() => removeSlot(day, idx)}
                            title="Remove slot"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(weeklySchedule[day]?.slots || []).length === 0 && (
                      <p className="no-slots">No time slots. Click + to add.</p>
                    )}
                  </div>
                ) : (
                  <div className="day-unavailable">
                    <i className="fas fa-moon"></i>
                    <span>Not Available</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="schedule-actions">
            <button className="btn btn-primary btn-lg" onClick={saveSchedule} disabled={saving}>
              {saving ? (
                <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
              ) : (
                <><i className="fas fa-save me-2"></i>Save Schedule</>
              )}
            </button>
          </div>

          {/* Special Dates Section */}
          <div className="special-dates-section">
            <div className="section-header">
              <h5><i className="fas fa-calendar-times me-2"></i>Special Dates (Holidays/Leaves)</h5>
              <button className="btn btn-outline-primary btn-sm" onClick={() => setShowSpecialDateModal(true)}>
                <i className="fas fa-plus me-1"></i>Add Date
              </button>
            </div>
            
            {specialDates.length === 0 ? (
              <p className="text-muted text-center py-3">No special dates set. Add holidays or leaves here.</p>
            ) : (
              <div className="special-dates-list">
                {specialDates.map(sd => (
                  <div key={sd._id} className={`special-date-item ${sd.isAvailable ? 'special-hours' : 'leave'}`}>
                    <div className="special-date-info">
                      <span className="date">{formatDate(sd.date)}</span>
                      <span className={`badge ${sd.isAvailable ? 'bg-warning' : 'bg-danger'}`}>
                        {sd.isAvailable ? 'Special Hours' : 'Leave/Holiday'}
                      </span>
                      {sd.reason && <span className="reason">{sd.reason}</span>}
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeSpecialDate(sd._id)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-nav">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <h5>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h5>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="calendar-header-cell">{d}</div>
              ))}
            </div>
            <div className="calendar-body">
              {(() => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                const cells = [];
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
                }
                calendarData.forEach(day => {
                  cells.push(
                    <div 
                      key={day.date} 
                      className={`calendar-cell 
                        ${day.isAvailable ? 'available' : 'unavailable'} 
                        ${day.isToday ? 'today' : ''} 
                        ${day.isPast ? 'past' : ''}
                        ${day.isSpecialDate ? 'special' : ''}`}
                      onClick={() => !day.isPast && setShowSpecialDateModal(true) && setSpecialDateForm(prev => ({ ...prev, date: day.date }))}
                    >
                      <span className="day-number">{new Date(day.date).getDate()}</span>
                      {day.isSpecialDate && (
                        <span className="special-indicator" title={day.reason}>
                          <i className="fas fa-star"></i>
                        </span>
                      )}
                      {day.isAvailable && day.slots?.length > 0 && (
                        <span className="slots-count">{day.slots.length} slots</span>
                      )}
                    </div>
                  );
                });
                return cells;
              })()}
            </div>
          </div>

          <div className="calendar-legend">
            <span><i className="fas fa-circle text-success"></i> Available</span>
            <span><i className="fas fa-circle text-secondary"></i> Unavailable</span>
            <span><i className="fas fa-star text-warning"></i> Special Date</span>
          </div>
        </div>
      )}

      {/* Settings View */}
      {activeView === 'settings' && (
        <div className="settings-view">
          <div className="settings-card">
            <h5><i className="fas fa-clock me-2"></i>Appointment Settings</h5>
            
            {/* Consultation Duration - Main setting for queue-based booking */}
            <div className="setting-row highlight-setting">
              <label><i className="fas fa-user-clock me-2"></i>Consultation Duration (Queue Booking)</label>
              <select 
                value={consultationDuration}
                onChange={(e) => setConsultationDuration(parseInt(e.target.value))}
                className="duration-select"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes (Recommended)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
              <small className="setting-hint">
                <i className="fas fa-info-circle me-1"></i>
                This determines how patient queue times are calculated. Each patient's estimated arrival time will be spaced by this duration.
              </small>
            </div>

            <hr className="setting-divider" />
            
            <div className="setting-row">
              <label>Slot Duration (minutes)</label>
              <select 
                value={consultationSettings.slotDuration}
                onChange={(e) => setConsultationSettings(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Buffer Time Between Appointments (minutes)</label>
              <select 
                value={consultationSettings.bufferTime}
                onChange={(e) => setConsultationSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) }))}
              >
                <option value={0}>No buffer</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Advance Booking (days)</label>
              <input 
                type="number" 
                min="1" 
                max="90"
                value={consultationSettings.advanceBookingDays}
                onChange={(e) => setConsultationSettings(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
              />
              <small>How far in advance can patients book</small>
            </div>

            <div className="setting-row">
              <label>Free Cancellation Window (hours)</label>
              <input 
                type="number" 
                min="0" 
                max="72"
                value={consultationSettings.cancellationHours}
                onChange={(e) => setConsultationSettings(prev => ({ ...prev, cancellationHours: parseInt(e.target.value) }))}
              />
              <small>Hours before appointment for free cancellation</small>
            </div>
          </div>

          <div className="settings-card">
            <h5><i className="fas fa-video me-2"></i>Consultation Types</h5>
            
            <div className="setting-row toggle-row">
              <label>
                <input 
                  type="checkbox"
                  checked={consultationSettings.inClinicConsultationEnabled}
                  onChange={(e) => setConsultationSettings(prev => ({ ...prev, inClinicConsultationEnabled: e.target.checked }))}
                />
                <span>In-Clinic Consultations</span>
              </label>
            </div>

            <div className="setting-row toggle-row">
              <label>
                <input 
                  type="checkbox"
                  checked={consultationSettings.virtualConsultationEnabled}
                  onChange={(e) => setConsultationSettings(prev => ({ ...prev, virtualConsultationEnabled: e.target.checked }))}
                />
                <span>Virtual Consultations</span>
              </label>
            </div>

            {consultationSettings.virtualConsultationEnabled && (
              <div className="setting-row">
                <label>Virtual Consultation Fee (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="Same as regular fee"
                  value={consultationSettings.virtualConsultationFee || ''}
                  onChange={(e) => setConsultationSettings(prev => ({ 
                    ...prev, 
                    virtualConsultationFee: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
                <small>Leave empty to use same fee as in-clinic</small>
              </div>
            )}
          </div>

          <div className="schedule-actions">
            <button className="btn btn-primary btn-lg" onClick={saveSchedule} disabled={saving}>
              {saving ? (
                <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
              ) : (
                <><i className="fas fa-save me-2"></i>Save Settings</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Special Date Modal */}
      {showSpecialDateModal && (
        <div className="modal-overlay" onClick={() => setShowSpecialDateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Add Special Date</h5>
              <button className="btn-close" onClick={() => setShowSpecialDateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date"
                  value={specialDateForm.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSpecialDateForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={specialDateForm.isAvailable ? 'special' : 'leave'}
                  onChange={(e) => setSpecialDateForm(prev => ({ ...prev, isAvailable: e.target.value === 'special' }))}
                >
                  <option value="leave">Leave / Holiday (Not Available)</option>
                  <option value="special">Special Hours (Custom Availability)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g., Public Holiday, Conference, Personal Leave"
                  value={specialDateForm.reason}
                  onChange={(e) => setSpecialDateForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSpecialDateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addSpecialDate}>Add Date</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleManager;

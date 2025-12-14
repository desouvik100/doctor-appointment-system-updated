import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './DoctorControls.css';

const DoctorControls = ({ doctor, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  
  // Form states
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [notifyPatients, setNotifyPatients] = useState(true);
  
  const [rescheduleFrom, setRescheduleFrom] = useState('');
  const [rescheduleTo, setRescheduleTo] = useState('');
  
  const [extendDate, setExtendDate] = useState('');
  const [extendTime, setExtendTime] = useState('21:00');
  
  const [pauseReason, setPauseReason] = useState('');
  const [pauseUntil, setPauseUntil] = useState('');

  const doctorId = doctor?.id || doctor?._id;

  useEffect(() => {
    fetchSettings();
    fetchSummary();
  }, [doctorId]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`/api/doctor-control/settings/${doctorId}`);
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`/api/doctor-control/today-summary/${doctorId}`);
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handlePauseOnline = async (paused) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/doctor-control/pause-online/${doctorId}`, {
        paused,
        reason: pauseReason,
        pausedUntil: pauseUntil || null
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchSettings();
        fetchSummary();
        setActiveAction(null);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update online booking status');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseClinic = async (paused) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/doctor-control/pause-clinic/${doctorId}`, {
        paused,
        reason: pauseReason,
        pausedUntil: pauseUntil || null
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchSettings();
        fetchSummary();
        setActiveAction(null);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update clinic booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDay = async () => {
    if (!blockDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/doctor-control/block-day/${doctorId}`, {
        date: blockDate,
        reason: blockReason || 'Emergency leave',
        notifyPatients
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setBlockDate('');
        setBlockReason('');
        setActiveAction(null);
        fetchSummary();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to block day');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleDay = async () => {
    if (!rescheduleFrom || !rescheduleTo) {
      toast.error('Please select both dates');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/doctor-control/reschedule-day/${doctorId}`, {
        fromDate: rescheduleFrom,
        toDate: rescheduleTo,
        notifyPatients
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setRescheduleFrom('');
        setRescheduleTo('');
        setActiveAction(null);
        fetchSummary();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to reschedule appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendHours = async () => {
    if (!extendDate || !extendTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/doctor-control/extend-hours/${doctorId}`, {
        date: extendDate,
        newEndTime: extendTime,
        reason: 'Extended clinic hours'
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setExtendDate('');
        setExtendTime('21:00');
        setActiveAction(null);
        fetchSummary();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to extend hours');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="doctor-controls-overlay" onClick={onClose}>
      <div className="doctor-controls-modal" onClick={e => e.stopPropagation()}>
        <div className="controls-header">
          <h2><i className="fas fa-sliders-h"></i> Doctor Controls</h2>
          <p>Manage your schedule and bookings</p>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Today's Summary */}
        {summary && (
          <div className="today-summary">
            <h4><i className="fas fa-chart-pie"></i> Today's Overview</h4>
            <div className="summary-grid">
              <div className="summary-card online">
                <i className="fas fa-video"></i>
                <div className="summary-info">
                  <span className="label">Online</span>
                  <span className="value">{summary.online?.waiting || 0} waiting</span>
                  <span className="sub">{summary.online?.completed || 0} done</span>
                </div>
                {settings?.bookingControls?.onlineBookingPaused && (
                  <span className="paused-badge">PAUSED</span>
                )}
              </div>
              <div className="summary-card clinic">
                <i className="fas fa-hospital"></i>
                <div className="summary-info">
                  <span className="label">Clinic</span>
                  <span className="value">{summary.clinic?.waiting || 0} waiting</span>
                  <span className="sub">{summary.clinic?.completed || 0} done</span>
                </div>
                {settings?.bookingControls?.clinicBookingPaused && (
                  <span className="paused-badge">PAUSED</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="controls-content">
          <div className="quick-actions">
            {/* Pause Online Bookings */}
            <div className={`action-card ${activeAction === 'pause-online' ? 'expanded' : ''}`}>
              <div className="action-header" onClick={() => setActiveAction(activeAction === 'pause-online' ? null : 'pause-online')}>
                <div className="action-icon online">
                  <i className="fas fa-video-slash"></i>
                </div>
                <div className="action-info">
                  <h4>Pause Online Bookings</h4>
                  <p>Temporarily stop new online consultations</p>
                </div>
                <div className={`toggle-switch ${settings?.bookingControls?.onlineBookingPaused ? 'active' : ''}`}>
                  <span>{settings?.bookingControls?.onlineBookingPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </div>
              </div>
              {activeAction === 'pause-online' && (
                <div className="action-form">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Resume on"
                    value={pauseUntil}
                    onChange={(e) => setPauseUntil(e.target.value)}
                    min={getTodayDate()}
                  />
                  <button 
                    className={`action-btn ${settings?.bookingControls?.onlineBookingPaused ? 'resume' : 'pause'}`}
                    onClick={() => handlePauseOnline(!settings?.bookingControls?.onlineBookingPaused)}
                    disabled={loading}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 
                      settings?.bookingControls?.onlineBookingPaused ? 
                        <><i className="fas fa-play"></i> Resume Online</> : 
                        <><i className="fas fa-pause"></i> Pause Online</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Pause Clinic Bookings */}
            <div className={`action-card ${activeAction === 'pause-clinic' ? 'expanded' : ''}`}>
              <div className="action-header" onClick={() => setActiveAction(activeAction === 'pause-clinic' ? null : 'pause-clinic')}>
                <div className="action-icon clinic">
                  <i className="fas fa-hospital-alt"></i>
                </div>
                <div className="action-info">
                  <h4>Pause Clinic Bookings</h4>
                  <p>Temporarily stop new clinic appointments</p>
                </div>
                <div className={`toggle-switch ${settings?.bookingControls?.clinicBookingPaused ? 'active' : ''}`}>
                  <span>{settings?.bookingControls?.clinicBookingPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </div>
              </div>
              {activeAction === 'pause-clinic' && (
                <div className="action-form">
                  <input
                    type="text"
                    placeholder="Reason (optional)"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Resume on"
                    value={pauseUntil}
                    onChange={(e) => setPauseUntil(e.target.value)}
                    min={getTodayDate()}
                  />
                  <button 
                    className={`action-btn ${settings?.bookingControls?.clinicBookingPaused ? 'resume' : 'pause'}`}
                    onClick={() => handlePauseClinic(!settings?.bookingControls?.clinicBookingPaused)}
                    disabled={loading}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 
                      settings?.bookingControls?.clinicBookingPaused ? 
                        <><i className="fas fa-play"></i> Resume Clinic</> : 
                        <><i className="fas fa-pause"></i> Pause Clinic</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Block Day */}
            <div className={`action-card ${activeAction === 'block-day' ? 'expanded' : ''}`}>
              <div className="action-header" onClick={() => setActiveAction(activeAction === 'block-day' ? null : 'block-day')}>
                <div className="action-icon danger">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <div className="action-info">
                  <h4>Block a Day</h4>
                  <p>Cancel all appointments for a specific day</p>
                </div>
                <i className="fas fa-chevron-right expand-icon"></i>
              </div>
              {activeAction === 'block-day' && (
                <div className="action-form">
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    min={getTodayDate()}
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g., Emergency, Conference)"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notifyPatients}
                      onChange={(e) => setNotifyPatients(e.target.checked)}
                    />
                    <span>Notify affected patients via email</span>
                  </label>
                  <button 
                    className="action-btn danger"
                    onClick={handleBlockDay}
                    disabled={loading || !blockDate}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 
                      <><i className="fas fa-ban"></i> Block Day & Cancel Appointments</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Reschedule Day */}
            <div className={`action-card ${activeAction === 'reschedule' ? 'expanded' : ''}`}>
              <div className="action-header" onClick={() => setActiveAction(activeAction === 'reschedule' ? null : 'reschedule')}>
                <div className="action-icon warning">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="action-info">
                  <h4>Reschedule All</h4>
                  <p>Move all appointments to another day</p>
                </div>
                <i className="fas fa-chevron-right expand-icon"></i>
              </div>
              {activeAction === 'reschedule' && (
                <div className="action-form">
                  <div className="date-row">
                    <div>
                      <label>From Date</label>
                      <input
                        type="date"
                        value={rescheduleFrom}
                        onChange={(e) => setRescheduleFrom(e.target.value)}
                        min={getTodayDate()}
                      />
                    </div>
                    <i className="fas fa-arrow-right"></i>
                    <div>
                      <label>To Date</label>
                      <input
                        type="date"
                        value={rescheduleTo}
                        onChange={(e) => setRescheduleTo(e.target.value)}
                        min={rescheduleFrom || getTodayDate()}
                      />
                    </div>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notifyPatients}
                      onChange={(e) => setNotifyPatients(e.target.checked)}
                    />
                    <span>Notify patients about reschedule</span>
                  </label>
                  <button 
                    className="action-btn warning"
                    onClick={handleRescheduleDay}
                    disabled={loading || !rescheduleFrom || !rescheduleTo}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 
                      <><i className="fas fa-exchange-alt"></i> Reschedule All Appointments</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Extend Hours */}
            <div className={`action-card ${activeAction === 'extend' ? 'expanded' : ''}`}>
              <div className="action-header" onClick={() => setActiveAction(activeAction === 'extend' ? null : 'extend')}>
                <div className="action-icon success">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="action-info">
                  <h4>Extend Clinic Hours</h4>
                  <p>Stay open longer for a specific day</p>
                </div>
                <i className="fas fa-chevron-right expand-icon"></i>
              </div>
              {activeAction === 'extend' && (
                <div className="action-form">
                  <input
                    type="date"
                    value={extendDate}
                    onChange={(e) => setExtendDate(e.target.value)}
                    min={getTodayDate()}
                  />
                  <div className="time-select">
                    <label>New End Time</label>
                    <select value={extendTime} onChange={(e) => setExtendTime(e.target.value)}>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                      <option value="22:00">10:00 PM</option>
                    </select>
                  </div>
                  <button 
                    className="action-btn success"
                    onClick={handleExtendHours}
                    disabled={loading || !extendDate}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 
                      <><i className="fas fa-plus-circle"></i> Extend Hours</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorControls;

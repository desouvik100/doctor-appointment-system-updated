 /**
 * WhatsApp Panel for EMR Dashboard
 * Central hub for all WhatsApp communications
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';
import WhatsAppIntegration, { WhatsAppBulkSend } from './WhatsAppIntegration';
import './WhatsAppPanel.css';

const WhatsAppPanel = ({ clinicId, clinicName }) => {
  const [activeTab, setActiveTab] = useState('quick-send');
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [messageType, setMessageType] = useState('reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingTo, setSendingTo] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [clinicId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Fetch today's appointments
      const todayRes = await axios.get(`/api/appointments/clinic/${clinicId}`, {
        params: {
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
          status: 'confirmed,pending'
        }
      });
      setTodayAppointments(todayRes.data || []);

      // Fetch tomorrow's appointments
      const tomorrowRes = await axios.get(`/api/appointments/clinic/${clinicId}`, {
        params: {
          startDate: tomorrow.toISOString(),
          endDate: dayAfter.toISOString(),
          status: 'confirmed,pending'
        }
      });
      setTomorrowAppointments(tomorrowRes.data || []);

    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSend = async (appointment, type) => {
    setSendingTo(appointment._id);
    try {
      let endpoint = '';
      let payload = {};

      switch (type) {
        case 'reminder':
          endpoint = '/api/whatsapp/send-reminder';
          payload = { appointmentId: appointment._id };
          break;
        case 'confirmation':
          endpoint = '/api/whatsapp/send-confirmation';
          payload = { appointmentId: appointment._id };
          break;
        case 'queue':
          endpoint = '/api/whatsapp/send-queue-update';
          payload = { appointmentId: appointment._id };
          break;
        default:
          return;
      }

      const response = await axios.post(endpoint, payload);

      if (response.data.link) {
        window.open(response.data.link, '_blank');
        toast.success('WhatsApp opened! Send the message.');
      } else {
        toast.success('Message sent via WhatsApp!');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingTo(null);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderAppointmentCard = (apt, showDate = false) => (
    <div key={apt._id} className="wa-appointment-card">
      <div className="wa-apt-info">
        <div className="wa-apt-patient">
          <span className="patient-name">{apt.userId?.name || apt.walkInPatient?.name || 'Patient'}</span>
          <span className="patient-phone">{apt.userId?.phone || apt.walkInPatient?.phone || 'No phone'}</span>
        </div>
        <div className="wa-apt-details">
          <span className="apt-time">
            <i className="fas fa-clock"></i>
            {formatTime(apt.time)}
          </span>
          <span className="apt-doctor">
            <i className="fas fa-user-md"></i>
            Dr. {apt.doctorId?.name || 'Doctor'}
          </span>
          {apt.tokenNumber && (
            <span className="apt-token">
              <i className="fas fa-ticket-alt"></i>
              Token #{apt.tokenNumber}
            </span>
          )}
        </div>
      </div>
      <div className="wa-apt-actions">
        <button
          className="wa-action-btn reminder"
          onClick={() => handleQuickSend(apt, 'reminder')}
          disabled={sendingTo === apt._id || !apt.userId?.phone}
          title="Send Reminder"
        >
          {sendingTo === apt._id ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-bell"></i>
          )}
        </button>
        <button
          className="wa-action-btn queue"
          onClick={() => handleQuickSend(apt, 'queue')}
          disabled={sendingTo === apt._id || !apt.userId?.phone}
          title="Send Queue Update"
        >
          <i className="fas fa-users"></i>
        </button>
        <button
          className="wa-action-btn whatsapp"
          onClick={() => {
            setSelectedPatient({
              phone: apt.userId?.phone || apt.walkInPatient?.phone,
              name: apt.userId?.name || apt.walkInPatient?.name,
              appointmentId: apt._id
            });
          }}
          disabled={!apt.userId?.phone}
          title="Custom Message"
        >
          <i className="fab fa-whatsapp"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="whatsapp-panel">
      {/* Header */}
      <div className="wa-panel-header">
        <div className="wa-header-title">
          <i className="fab fa-whatsapp"></i>
          <h2>WhatsApp Communications</h2>
        </div>
        <div className="wa-header-actions">
          <button 
            className="wa-bulk-btn"
            onClick={() => setShowBulkModal(true)}
          >
            <i className="fas fa-paper-plane"></i>
            Send Bulk Reminders
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="wa-stats">
        <div className="wa-stat-card">
          <div className="stat-icon today">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{todayAppointments.length}</span>
            <span className="stat-label">Today's Appointments</span>
          </div>
        </div>
        <div className="wa-stat-card">
          <div className="stat-icon tomorrow">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{tomorrowAppointments.length}</span>
            <span className="stat-label">Tomorrow's Appointments</span>
          </div>
        </div>
        <div className="wa-stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {todayAppointments.filter(a => !a.remindersSent?.whatsapp).length}
            </span>
            <span className="stat-label">Pending Reminders</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wa-tabs">
        <button 
          className={`wa-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <i className="fas fa-calendar-day"></i>
          Today ({todayAppointments.length})
        </button>
        <button 
          className={`wa-tab ${activeTab === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('tomorrow')}
        >
          <i className="fas fa-calendar-alt"></i>
          Tomorrow ({tomorrowAppointments.length})
        </button>
        <button 
          className={`wa-tab ${activeTab === 'quick-send' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick-send')}
        >
          <i className="fas fa-comment"></i>
          Quick Send
        </button>
        <button 
          className={`wa-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <i className="fas fa-file-alt"></i>
          Templates
        </button>
      </div>

      {/* Content */}
      <div className="wa-content">
        {loading ? (
          <div className="wa-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading appointments...</span>
          </div>
        ) : (
          <>
            {/* Today's Appointments */}
            {activeTab === 'today' && (
              <div className="wa-appointments-list">
                <div className="wa-list-header">
                  <h3>Today's Appointments</h3>
                  <button 
                    className="send-all-btn"
                    onClick={() => {
                      todayAppointments.forEach(apt => {
                        if (apt.userId?.phone && !apt.remindersSent?.whatsapp) {
                          handleQuickSend(apt, 'reminder');
                        }
                      });
                    }}
                  >
                    <i className="fab fa-whatsapp"></i>
                    Send All Reminders
                  </button>
                </div>
                {todayAppointments.length === 0 ? (
                  <div className="wa-empty">
                    <i className="fas fa-calendar-check"></i>
                    <p>No appointments for today</p>
                  </div>
                ) : (
                  todayAppointments.map(apt => renderAppointmentCard(apt))
                )}
              </div>
            )}

            {/* Tomorrow's Appointments */}
            {activeTab === 'tomorrow' && (
              <div className="wa-appointments-list">
                <div className="wa-list-header">
                  <h3>Tomorrow's Appointments</h3>
                  <button 
                    className="send-all-btn"
                    onClick={() => {
                      tomorrowAppointments.forEach(apt => {
                        if (apt.userId?.phone) {
                          handleQuickSend(apt, 'reminder');
                        }
                      });
                    }}
                  >
                    <i className="fab fa-whatsapp"></i>
                    Send All Reminders
                  </button>
                </div>
                {tomorrowAppointments.length === 0 ? (
                  <div className="wa-empty">
                    <i className="fas fa-calendar"></i>
                    <p>No appointments for tomorrow</p>
                  </div>
                ) : (
                  tomorrowAppointments.map(apt => renderAppointmentCard(apt))
                )}
              </div>
            )}

            {/* Quick Send */}
            {activeTab === 'quick-send' && (
              <div className="wa-quick-send">
                <WhatsAppIntegration
                  type="custom"
                  data={{ clinicName }}
                  onSuccess={() => toast.success('Message sent!')}
                />
              </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <div className="wa-templates">
                <h3>Message Templates</h3>
                <div className="template-grid">
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('reminder');
                  }}>
                    <div className="template-icon">🔔</div>
                    <h4>Appointment Reminder</h4>
                    <p>Remind patients about upcoming appointments</p>
                  </div>
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('confirmation');
                  }}>
                    <div className="template-icon">✅</div>
                    <h4>Booking Confirmation</h4>
                    <p>Confirm new appointment bookings</p>
                  </div>
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('prescription');
                  }}>
                    <div className="template-icon">💊</div>
                    <h4>Prescription</h4>
                    <p>Send prescription details to patients</p>
                  </div>
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('lab-report');
                  }}>
                    <div className="template-icon">🔬</div>
                    <h4>Lab Report Ready</h4>
                    <p>Notify patients about lab results</p>
                  </div>
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('followup');
                  }}>
                    <div className="template-icon">📅</div>
                    <h4>Follow-up Reminder</h4>
                    <p>Remind patients about follow-up visits</p>
                  </div>
                  <div className="template-card" onClick={() => {
                    setActiveTab('quick-send');
                    setMessageType('receipt');
                  }}>
                    <div className="template-icon">🧾</div>
                    <h4>Payment Receipt</h4>
                    <p>Send payment confirmation</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Patient Modal */}
      {selectedPatient && (
        <div className="wa-modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="wa-modal" onClick={e => e.stopPropagation()}>
            <WhatsAppIntegration
              type="custom"
              data={{ clinicName, appointmentId: selectedPatient.appointmentId }}
              patientPhone={selectedPatient.phone}
              patientName={selectedPatient.name}
              onSuccess={() => {
                setSelectedPatient(null);
                toast.success('Message sent!');
              }}
              onClose={() => setSelectedPatient(null)}
            />
          </div>
        </div>
      )}

      {/* Bulk Send Modal */}
      {showBulkModal && (
        <div className="wa-modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="wa-modal" onClick={e => e.stopPropagation()}>
            <WhatsAppBulkSend
              clinicId={clinicId}
              appointments={tomorrowAppointments}
              onClose={() => setShowBulkModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppPanel;

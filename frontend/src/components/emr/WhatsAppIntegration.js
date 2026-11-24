/**
 * WhatsApp Integration Component for EMR
 * Send prescriptions, reminders, and notifications via WhatsApp
 */

import React, { useState } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';
import './WhatsAppIntegration.css';

const WhatsAppIntegration = ({ 
  type = 'prescription', // 'prescription', 'reminder', 'lab-report', 'custom'
  data = {},
  patientPhone = '',
  patientName = '',
  onSuccess,
  onClose,
  compact = false
}) => {
  const [phone, setPhone] = useState(patientPhone);
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    if (!phone) {
      toast.error('Please enter patient phone number');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload = { ...data };

      switch (type) {
        case 'prescription':
          endpoint = '/api/whatsapp/send-prescription';
          payload.patientPhone = phone;
          break;
        case 'reminder':
          endpoint = '/api/whatsapp/send-reminder';
          payload.appointmentId = data.appointmentId;
          break;
        case 'confirmation':
          endpoint = '/api/whatsapp/send-confirmation';
          payload.appointmentId = data.appointmentId;
          break;
        case 'lab-report':
          endpoint = '/api/whatsapp/send-lab-report';
          payload.patientPhone = phone;
          break;
        case 'followup':
          endpoint = '/api/whatsapp/send-followup-reminder';
          payload.patientPhone = phone;
          break;
        case 'queue':
          endpoint = '/api/whatsapp/send-queue-update';
          payload.appointmentId = data.appointmentId;
          break;
        case 'receipt':
          endpoint = '/api/whatsapp/send-payment-receipt';
          payload.patientPhone = phone;
          break;
        case 'custom':
          endpoint = '/api/whatsapp/send-custom';
          payload = { phone, message: customMessage, clinicName: data.clinicName };
          break;
        default:
          throw new Error('Invalid message type');
      }

      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        setResult(response.data);
        
        if (response.data.requiresManualSend && response.data.link) {
          // Open WhatsApp link in new tab
          window.open(response.data.link, '_blank');
          toast.success('WhatsApp opened! Send the message manually.');
        } else {
          toast.success('Message sent via WhatsApp!');
        }
        
        onSuccess?.(response.data);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = () => {
    const configs = {
      prescription: {
        icon: '💊',
        title: 'Send Prescription',
        description: 'Send prescription details via WhatsApp',
        buttonText: 'Send Prescription',
        color: '#25D366'
      },
      reminder: {
        icon: '🔔',
        title: 'Send Reminder',
        description: 'Send appointment reminder via WhatsApp',
        buttonText: 'Send Reminder',
        color: '#128C7E'
      },
      confirmation: {
        icon: '✅',
        title: 'Send Confirmation',
        description: 'Send booking confirmation via WhatsApp',
        buttonText: 'Send Confirmation',
        color: '#25D366'
      },
      'lab-report': {
        icon: '🔬',
        title: 'Send Lab Report',
        description: 'Notify patient about lab report',
        buttonText: 'Send Notification',
        color: '#075E54'
      },
      followup: {
        icon: '📅',
        title: 'Follow-up Reminder',
        description: 'Remind patient about follow-up visit',
        buttonText: 'Send Reminder',
        color: '#128C7E'
      },
      queue: {
        icon: '🎫',
        title: 'Queue Update',
        description: 'Send queue position update',
        buttonText: 'Send Update',
        color: '#25D366'
      },
      receipt: {
        icon: '🧾',
        title: 'Payment Receipt',
        description: 'Send payment receipt via WhatsApp',
        buttonText: 'Send Receipt',
        color: '#075E54'
      },
      custom: {
        icon: '💬',
        title: 'Custom Message',
        description: 'Send a custom message',
        buttonText: 'Send Message',
        color: '#25D366'
      }
    };
    return configs[type] || configs.custom;
  };

  const config = getTypeConfig();

  // Compact button mode
  if (compact) {
    return (
      <button
        className="whatsapp-compact-btn"
        onClick={handleSend}
        disabled={loading || !phone}
        title={`Send via WhatsApp to ${phone || 'patient'}`}
      >
        {loading ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fab fa-whatsapp"></i>
        )}
      </button>
    );
  }

  return (
    <div className="whatsapp-integration">
      <div className="whatsapp-header" style={{ background: config.color }}>
        <div className="whatsapp-header-icon">
          <i className="fab fa-whatsapp"></i>
        </div>
        <div className="whatsapp-header-content">
          <h3>{config.icon} {config.title}</h3>
          <p>{config.description}</p>
        </div>
        {onClose && (
          <button className="whatsapp-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className="whatsapp-body">
        {/* Patient Info */}
        {patientName && (
          <div className="whatsapp-patient-info">
            <i className="fas fa-user"></i>
            <span>{patientName}</span>
          </div>
        )}

        {/* Phone Input */}
        <div className="whatsapp-input-group">
          <label>
            <i className="fas fa-phone"></i>
            Patient Phone Number
          </label>
          <div className="whatsapp-phone-input">
            <span className="country-code">+91</span>
            <input
              type="tel"
              value={phone.replace(/^\+?91/, '')}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              maxLength={10}
            />
          </div>
        </div>

        {/* Custom Message Input */}
        {type === 'custom' && (
          <div className="whatsapp-input-group">
            <label>
              <i className="fas fa-comment"></i>
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              maxLength={1000}
            />
            <span className="char-count">{customMessage.length}/1000</span>
          </div>
        )}

        {/* Preview Section */}
        {type !== 'custom' && data && (
          <div className="whatsapp-preview">
            <h4><i className="fas fa-eye"></i> Message Preview</h4>
            <div className="preview-content">
              {type === 'prescription' && (
                <>
                  <p><strong>📋 Prescription</strong></p>
                  <p>👨‍⚕️ Dr. {data.doctorName}</p>
                  <p>💊 {data.medicines?.length || 0} medicines</p>
                </>
              )}
              {type === 'reminder' && (
                <>
                  <p><strong>📅 Appointment Reminder</strong></p>
                  <p>👨‍⚕️ Dr. {data.doctorName}</p>
                  <p>📆 {data.date} at {data.time}</p>
                </>
              )}
              {type === 'lab-report' && (
                <>
                  <p><strong>🔬 Lab Report Ready</strong></p>
                  <p>📋 {data.testName}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {result && result.requiresManualSend && (
          <div className="whatsapp-result">
            <i className="fas fa-external-link-alt"></i>
            <p>WhatsApp opened in new tab. Please send the message manually.</p>
            <a href={result.link} target="_blank" rel="noopener noreferrer" className="whatsapp-link">
              Open WhatsApp Again
            </a>
          </div>
        )}
      </div>

      <div className="whatsapp-footer">
        <button
          className="whatsapp-send-btn"
          onClick={handleSend}
          disabled={loading || !phone || (type === 'custom' && !customMessage)}
          style={{ background: config.color }}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Sending...
            </>
          ) : (
            <>
              <i className="fab fa-whatsapp"></i>
              {config.buttonText}
            </>
          )}
        </button>
        
        <p className="whatsapp-note">
          <i className="fas fa-info-circle"></i>
          Message will be sent via WhatsApp
        </p>
      </div>
    </div>
  );
};

// Quick Send Button Component
export const WhatsAppQuickButton = ({ 
  phone, 
  type, 
  data, 
  label = 'WhatsApp',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [loading, setLoading] = useState(false);

  const handleQuickSend = async () => {
    if (!phone) {
      toast.error('Phone number not available');
      return;
    }

    setLoading(true);
    try {
      const endpoints = {
        prescription: '/api/whatsapp/send-prescription',
        reminder: '/api/whatsapp/send-reminder',
        confirmation: '/api/whatsapp/send-confirmation',
        receipt: '/api/whatsapp/send-payment-receipt'
      };

      const response = await axios.post(endpoints[type] || endpoints.reminder, {
        ...data,
        patientPhone: phone
      });

      if (response.data.link) {
        window.open(response.data.link, '_blank');
        toast.success('WhatsApp opened!');
      } else {
        toast.success('Sent via WhatsApp!');
      }
    } catch (error) {
      toast.error('Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`whatsapp-quick-btn whatsapp-quick-btn--${size}`}
      onClick={handleQuickSend}
      disabled={loading || !phone}
      title={`Send ${type} via WhatsApp`}
    >
      {loading ? (
        <i className="fas fa-spinner fa-spin"></i>
      ) : (
        <i className="fab fa-whatsapp"></i>
      )}
      {size !== 'small' && <span>{label}</span>}
    </button>
  );
};

// Bulk Send Modal Component
export const WhatsAppBulkSend = ({ appointments = [], clinicId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleBulkSend = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/whatsapp/bulk-reminder', {
        clinicId,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });

      setResults(response.data.results);
      toast.success(`Sent ${response.data.results.sent} reminders`);
    } catch (error) {
      toast.error('Failed to send bulk reminders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whatsapp-bulk-modal">
      <div className="whatsapp-bulk-header">
        <h3><i className="fab fa-whatsapp"></i> Bulk WhatsApp Reminders</h3>
        <button onClick={onClose}><i className="fas fa-times"></i></button>
      </div>
      
      <div className="whatsapp-bulk-body">
        <p>Send appointment reminders to all patients with appointments tomorrow.</p>
        
        {results && (
          <div className="bulk-results">
            <div className="result-stat">
              <span className="stat-value">{results.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="result-stat success">
              <span className="stat-value">{results.sent}</span>
              <span className="stat-label">Sent</span>
            </div>
            <div className="result-stat warning">
              <span className="stat-value">{results.skipped}</span>
              <span className="stat-label">Skipped</span>
            </div>
            <div className="result-stat error">
              <span className="stat-value">{results.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
          </div>
        )}

        {results?.links?.length > 0 && (
          <div className="manual-links">
            <h4>Manual Send Required:</h4>
            {results.links.map((item, idx) => (
              <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer">
                {item.patient} <i className="fas fa-external-link-alt"></i>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="whatsapp-bulk-footer">
        <button onClick={onClose} className="btn-secondary">Close</button>
        <button onClick={handleBulkSend} disabled={loading} className="btn-whatsapp">
          {loading ? (
            <><i className="fas fa-spinner fa-spin"></i> Sending...</>
          ) : (
            <><i className="fab fa-whatsapp"></i> Send Reminders</>
          )}
        </button>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;

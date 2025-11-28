import React, { useState } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const VerifyTokenPanel = ({ onTokenVerified }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);

  const handleVerify = async () => {
    if (!token.trim()) {
      toast.error('Please enter a token');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/token/verify', { token: token.toUpperCase() });

      if (response.data.success) {
        setVerifiedData(response.data.appointment);
        toast.success('Token verified successfully!');
        if (onTokenVerified) {
          onTokenVerified(response.data.appointment);
        }
      } else {
        toast.error(response.data.error || 'Token verification failed');
        setVerifiedData(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error verifying token');
      setVerifiedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!verifiedData) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/token/add-to-queue', {
        appointmentId: verifiedData._id
      });

      if (response.data.success) {
        toast.success(`Added to queue at position #${response.data.queuePosition}`);
        setVerifiedData({
          ...verifiedData,
          queuePosition: response.data.queuePosition,
          estimatedWaitTime: response.data.estimatedWaitTime,
          queueStatus: 'in_queue'
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error adding to queue');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!verifiedData) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/token/mark-completed', {
        appointmentId: verifiedData._id
      });

      if (response.data.success) {
        toast.success('Appointment marked as completed');
        setVerifiedData(null);
        setToken('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error marking appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px'
        }}>
          ✓
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1a202c',
          margin: 0
        }}>Token Verification Panel</h2>
      </div>

      {/* Input Section */}
      <div style={{
        marginBottom: '24px'
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#4a5568',
          marginBottom: '8px'
        }}>Enter Patient Token</label>
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            placeholder="e.g., HS-CARDIO-2808-3942"
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '1rem',
              fontFamily: 'monospace',
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
            disabled={loading}
          />
          <button
            onClick={handleVerify}
            disabled={loading}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Verified Data Display */}
      {verifiedData && (
        <div style={{
          background: '#f0f9ff',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #bfdbfe',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#1e40af',
            margin: '0 0 16px 0'
          }}>✓ Token Verified</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Patient Name</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>{verifiedData.patientName}</p>
            </div>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Patient Email</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>{verifiedData.patientEmail}</p>
            </div>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Doctor Name</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>Dr. {verifiedData.doctorName}</p>
            </div>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Specialization</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>{verifiedData.doctorSpecialization}</p>
            </div>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Appointment Date</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>{new Date(verifiedData.appointmentDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Appointment Time</p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1a202c',
                margin: '4px 0 0 0'
              }}>{verifiedData.appointmentTime}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button
              onClick={handleAddToQueue}
              disabled={loading || verifiedData.status === 'in_queue'}
              style={{
                padding: '12px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: verifiedData.status === 'in_queue' ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: verifiedData.status === 'in_queue' ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (verifiedData.status !== 'in_queue') {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="fas fa-list"></i> Add to Queue
            </button>
            <button
              onClick={handleMarkCompleted}
              disabled={loading}
              style={{
                padding: '12px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <i className="fas fa-check"></i> Mark Completed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyTokenPanel;

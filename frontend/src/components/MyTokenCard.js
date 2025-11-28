import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

const MyTokenCard = ({ appointment }) => {
  const [showQR, setShowQR] = useState(false);

  if (!appointment || !appointment.token) {
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appointment.token);
    toast.success('Token copied to clipboard!');
  };

  const downloadQR = () => {
    const qrElement = document.getElementById('qr-code');
    const canvas = qrElement.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-${appointment.token}.png`;
    link.click();
    toast.success('QR code downloaded!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return '#f59e0b'; // Amber
      case 'verified':
        return '#3b82f6'; // Blue
      case 'in_queue':
        return '#8b5cf6'; // Purple
      case 'completed':
        return '#10b981'; // Green
      case 'expired':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'waiting': 'Waiting for Verification',
      'verified': 'Verified',
      'in_queue': 'In Queue',
      'completed': 'Completed',
      'expired': 'Expired',
      'no_show': 'No Show'
    };
    return labels[status] || status;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      marginBottom: '24px',
      border: '2px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
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
          🎫
        </div>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1a202c',
            margin: 0
          }}>Your Appointment Token</h3>
          <p style={{
            fontSize: '0.85rem',
            color: '#718096',
            margin: '4px 0 0 0'
          }}>Show this at clinic reception</p>
        </div>
      </div>

      {/* Token Display */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center',
        border: '2px dashed #667eea'
      }}>
        <p style={{
          fontSize: '0.85rem',
          color: '#718096',
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>Token Number</p>
        <p style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#667eea',
          margin: 0,
          fontFamily: 'monospace',
          letterSpacing: '0.1em'
        }}>
          {appointment.token}
        </p>
      </div>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        padding: '12px 16px',
        background: `${getStatusColor(appointment.queueStatus)}15`,
        borderRadius: '10px',
        border: `2px solid ${getStatusColor(appointment.queueStatus)}`
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          background: getStatusColor(appointment.queueStatus),
          borderRadius: '50%'
        }}></div>
        <div>
          <p style={{
            fontSize: '0.85rem',
            color: '#718096',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>Status</p>
          <p style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: getStatusColor(appointment.queueStatus),
            margin: '4px 0 0 0'
          }}>
            {getStatusLabel(appointment.queueStatus)}
          </p>
        </div>
      </div>

      {/* Queue Info */}
      {appointment.queueStatus === 'in_queue' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '12px',
            background: '#f0f4f8',
            borderRadius: '10px'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#718096',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Queue Position</p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#667eea',
              margin: '4px 0 0 0'
            }}>
              #{appointment.queuePosition || 'N/A'}
            </p>
          </div>
          <div style={{
            padding: '12px',
            background: '#f0f4f8',
            borderRadius: '10px'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#718096',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Est. Wait Time</p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#667eea',
              margin: '4px 0 0 0'
            }}>
              {appointment.estimatedWaitTime ? `${appointment.estimatedWaitTime} min` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Expiry Info */}
      {appointment.tokenExpiredAt && (
        <div style={{
          padding: '12px 16px',
          background: '#fef3c7',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #fcd34d'
        }}>
          <p style={{
            fontSize: '0.85rem',
            color: '#92400e',
            margin: 0
          }}>
            ⏰ Token expires: {new Date(appointment.tokenExpiredAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <button onClick={copyToClipboard} style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}>
          <i className="fas fa-copy"></i>
          Copy Token
        </button>

        <button onClick={() => setShowQR(!showQR)} style={{
          padding: '12px 16px',
          background: '#f0f4f8',
          color: '#667eea',
          border: '2px solid #e5e7eb',
          borderRadius: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#e5e7eb';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f0f4f8';
        }}>
          <i className="fas fa-qrcode"></i>
          {showQR ? 'Hide' : 'Show'} QR
        </button>
      </div>

      {/* QR Code */}
      {showQR && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div id="qr-code" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <QRCode value={appointment.token} size={200} level="H" />
          </div>
          <button onClick={downloadQR} style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}>
            <i className="fas fa-download"></i>
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTokenCard;

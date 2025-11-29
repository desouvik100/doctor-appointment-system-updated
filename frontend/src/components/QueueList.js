import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './QueueList.css';

const QueueList = ({ doctorId, date }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (doctorId && date) {
      fetchQueue();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId, date]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const formattedDate = new Date(date).toISOString().split('T')[0];
      const response = await axios.get(`/api/token/queue/${doctorId}?date=${formattedDate}`);

      if (response.data.success) {
        setQueue(response.data.queue);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchQueue();
    toast.success('Queue refreshed');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#3b82f6'; // Blue
      case 'in_queue':
        return '#8b5cf6'; // Purple
      case 'completed':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return '⏳';
      case 'in_queue':
        return '👤';
      case 'completed':
        return '✓';
      default:
        return '•';
    }
  };

  if (!doctorId || !date) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px',
        textAlign: 'center',
        color: '#718096'
      }}>
        <p>Select a doctor and date to view queue</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: 'clamp(1rem, 5vw, 28px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: 0,
          flex: 1
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
            fontSize: '20px',
            flexShrink: 0
          }}>
            📋
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              fontWeight: 700,
              color: '#1a202c',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>Live Queue</h2>
            <p style={{
              fontSize: '0.85rem',
              color: '#718096',
              margin: '4px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#f0f4f8',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1,
            minHeight: '44px',
            whiteSpace: 'nowrap',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f0f4f8';
          }}
        >
          <i className="fas fa-sync"></i> Refresh
        </button>
      </div>

      {/* Queue Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: 'clamp(12px, 3vw, 16px)',
          background: '#f0f4f8',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: '#718096',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>Total in Queue</p>
          <p style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: 700,
            color: '#667eea',
            margin: '8px 0 0 0'
          }}>{queue.length}</p>
        </div>
        <div style={{
          padding: 'clamp(12px, 3vw, 16px)',
          background: '#f0f4f8',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: '#718096',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>Completed</p>
          <p style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: 700,
            color: '#10b981',
            margin: '8px 0 0 0'
          }}>{queue.filter(p => p.status === 'completed').length}</p>
        </div>
        <div style={{
          padding: 'clamp(12px, 3vw, 16px)',
          background: '#f0f4f8',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: '#718096',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>Avg Wait</p>
          <p style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: 700,
            color: '#f59e0b',
            margin: '8px 0 0 0'
          }}>
            {queue.length > 0 
              ? Math.round(queue.reduce((sum, p) => sum + (p.estimatedWaitTime || 0), 0) / queue.length)
              : 0} min
          </p>
        </div>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#718096'
        }}>
          <p style={{ fontSize: '1rem', margin: 0 }}>No patients in queue</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          overflowX: 'hidden'
        }}>
          {queue.map((patient, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: 'clamp(8px, 2vw, 16px)',
                alignItems: 'center',
                padding: 'clamp(12px, 3vw, 16px)',
                background: patient.status === 'completed' ? '#f0fdf4' : '#f8fafc',
                borderRadius: '10px',
                border: `2px solid ${getStatusColor(patient.status)}30`,
                borderLeft: `4px solid ${getStatusColor(patient.status)}`,
                width: '100%',
                overflowX: 'hidden'
              }}
            >
              {/* Position */}
              <div style={{
                textAlign: 'center',
                minWidth: 0
              }}>
                <div style={{
                  width: 'clamp(40px, 8vw, 44px)',
                  height: 'clamp(40px, 8vw, 44px)',
                  background: getStatusColor(patient.status),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                  margin: '0 auto'
                }}>
                  {patient.position}
                </div>
              </div>

              {/* Patient Info */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontWeight: 600,
                  color: '#1a202c',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{patient.patientName}</p>
                <p style={{
                  fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
                  color: '#718096',
                  margin: '4px 0 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{patient.patientEmail}</p>
              </div>

              {/* Token */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                  color: '#718096',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Token</p>
                <p style={{
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  fontWeight: 700,
                  color: '#667eea',
                  margin: '4px 0 0 0',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{patient.token}</p>
              </div>

              {/* Time */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                  color: '#718096',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Appointment</p>
                <p style={{
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  fontWeight: 600,
                  color: '#1a202c',
                  margin: '4px 0 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{patient.appointmentTime}</p>
              </div>

              {/* Status */}
              <div style={{
                textAlign: 'center',
                minWidth: 0
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
                  background: `${getStatusColor(patient.status)}15`,
                  borderRadius: '20px',
                  border: `1px solid ${getStatusColor(patient.status)}`,
                  minWidth: 0
                }}>
                  <span style={{
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                    flexShrink: 0
                  }}>{getStatusIcon(patient.status)}</span>
                  <span style={{
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                    fontWeight: 600,
                    color: getStatusColor(patient.status),
                    textTransform: 'capitalize',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{patient.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div style={{
        marginTop: '20px',
        padding: 'clamp(10px, 2vw, 12px)',
        background: '#f0f4f8',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
        color: '#718096',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        <i className="fas fa-sync-alt" style={{ animation: 'spin 2s linear infinite', marginRight: '8px' }}></i>
        <span style={{ display: 'inline-block' }}>Auto-refreshing every 30 seconds</span>
      </div>
    </div>
  );
};

export default QueueList;

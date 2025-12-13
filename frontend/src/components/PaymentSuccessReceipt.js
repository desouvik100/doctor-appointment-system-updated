import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import './PaymentSuccessReceipt.css';

const PaymentSuccessReceipt = ({ 
  appointment, 
  doctor, 
  paymentDetails,
  onClose, 
  onViewAppointments,
  onDownloadReceipt 
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [receiptExpanded, setReceiptExpanded] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const receiptRef = useRef(null);

  // Payment details with defaults
  const payment = {
    transactionId: paymentDetails?.transactionId || `TXN${Date.now()}`,
    amount: paymentDetails?.amount || doctor?.consultationFee || 500,
    method: paymentDetails?.method || 'UPI',
    status: paymentDetails?.status || 'SUCCESS',
    timestamp: paymentDetails?.timestamp || new Date().toISOString(),
    ...paymentDetails
  };

  // Appointment details with defaults
  const appointmentData = {
    queueNumber: appointment?.queueNumber || appointment?.tokenNumber || 1,
    estimatedTime: appointment?.estimatedTime || '10:00',
    date: appointment?.date || new Date().toISOString().split('T')[0],
    consultationType: appointment?.consultationType || 'in_person',
    ...appointment
  };

  useEffect(() => {
    // Haptic feedback on mount
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    // Hide confetti after 4 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000);
    
    // Mark animation complete after 1.5 seconds
    const animTimer = setTimeout(() => setAnimationComplete(true), 1500);
    
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(animTimer);
    };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleShare = (platform) => {
    const shareText = `🏥 Payment Successful!\n\n` +
      `👨‍⚕️ Doctor: Dr. ${doctor?.name}\n` +
      `📅 Date: ${formatDate(appointmentData.date)}\n` +
      `⏰ Time: ${formatTime(appointmentData.estimatedTime)}\n` +
      `🎫 Token: #${appointmentData.queueNumber}\n` +
      `💰 Amount: ₹${payment.amount}\n` +
      `📝 Transaction: ${payment.transactionId}\n\n` +
      `Booked via HealthSync Pro`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareText);
      toast.success('Receipt copied to clipboard!', { icon: '📋' });
    }
  };

  const handleDownloadReceipt = () => {
    if (onDownloadReceipt) {
      onDownloadReceipt({ appointment: appointmentData, payment, doctor });
    } else {
      // Generate simple receipt download
      const receiptContent = `
HEALTHSYNC PRO - PAYMENT RECEIPT
================================

Transaction ID: ${payment.transactionId}
Date: ${formatTimestamp(payment.timestamp)}
Status: ${payment.status}

APPOINTMENT DETAILS
-------------------
Doctor: Dr. ${doctor?.name}
Specialization: ${doctor?.specialization}
Date: ${formatDate(appointmentData.date)}
Time: ${formatTime(appointmentData.estimatedTime)}
Token Number: #${appointmentData.queueNumber}
Type: ${appointmentData.consultationType === 'online' ? 'Video Consultation' : 'In-Clinic Visit'}

PAYMENT DETAILS
---------------
Consultation Fee: ₹${payment.amount}
Payment Method: ${payment.method}
Total Paid: ₹${payment.amount}

Thank you for choosing HealthSync Pro!
      `.trim();

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.transactionId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!', { icon: '📥' });
    }
  };

  const handleAddToCalendar = () => {
    const startTime = appointmentData.estimatedTime.replace(':', '');
    const endTime = String(parseInt(startTime) + 30).padStart(4, '0');
    const dateStr = appointmentData.date.replace(/-/g, '');
    
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(`Doctor Appointment - Dr. ${doctor?.name}`)}` +
      `&dates=${dateStr}T${startTime}00/${dateStr}T${endTime}00` +
      `&details=${encodeURIComponent(`Token: #${appointmentData.queueNumber}\nType: ${appointmentData.consultationType === 'online' ? 'Video Consultation' : 'In-Clinic Visit'}`)}`;
    
    window.open(gcalUrl, '_blank');
  };

  return (
    <div className="payment-success-overlay">
      <div className="payment-success-modal">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="confetti-container">
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className={`confetti confetti-${i % 6}`} 
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2.5 + Math.random() * 2}s`
                }} 
              />
            ))}
          </div>
        )}

        {/* Success Header */}
        <div className="success-header">
          <div className={`success-icon-wrapper ${animationComplete ? 'complete' : ''}`}>
            <div className="success-icon">
              <div className="success-checkmark">
                <svg viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
            </div>
            <div className="success-ripple"></div>
            <div className="success-ripple delay-1"></div>
            <div className="success-ripple delay-2"></div>
          </div>
          
          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-subtitle">Your appointment has been confirmed</p>
          
          {/* Amount Badge */}
          <div className="amount-badge">
            <span className="currency">₹</span>
            <span className="amount">{payment.amount}</span>
            <span className="paid-label">PAID</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="success-content">
          {/* Token Card - Prominent Display */}
          <div 
            className="token-card"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              borderRadius: '20px',
              padding: 0,
              marginBottom: '20px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(14, 165, 233, 0.3)',
              position: 'relative'
            }}
          >
            <div 
              className="token-card-inner"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '24px',
                position: 'relative',
                zIndex: 2
              }}
            >
              <div 
                className="token-icon"
                style={{
                  width: '56px',
                  height: '56px',
                  minWidth: '56px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white'
                }}
              >
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🎫</span>
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div 
                  style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                    fontWeight: 600,
                    opacity: 0.95
                  }}
                >
                  YOUR QUEUE TOKEN
                </div>
                <div 
                  style={{
                    display: 'block',
                    color: '#fff',
                    fontSize: '3rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    WebkitTextFillColor: '#ffffff'
                  }}
                >
                  #{appointmentData.queueNumber || '1'}
                </div>
              </div>
              <button 
                className="token-qr"
                onClick={() => setShowQRModal(true)}
                style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  background: 'white',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0ea5e9',
                  fontSize: '1.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                aria-label="Show QR Code"
              >
                <i className="fas fa-qrcode" style={{ color: '#0ea5e9' }}></i>
              </button>
            </div>
            <div 
              className="token-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                padding: '14px 24px',
                background: 'rgba(0, 0, 0, 0.15)',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div className="token-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.95rem', fontWeight: 500 }}>
                <i className="fas fa-clock" style={{ color: 'rgba(255, 255, 255, 0.8)' }}></i>
                <span style={{ color: 'white' }}>{formatTime(appointmentData.estimatedTime)}</span>
              </div>
              <div className="token-detail" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.95rem', fontWeight: 500 }}>
                <i className="fas fa-calendar" style={{ color: 'rgba(255, 255, 255, 0.8)' }}></i>
                <span style={{ color: 'white' }}>{formatDate(appointmentData.date).split(',')[0]}</span>
              </div>
            </div>
          </div>

          {/* Appointment Summary Card */}
          <div className="appointment-summary-card">
            <div className="summary-header">
              <h3><i className="fas fa-clipboard-check"></i> Appointment Details</h3>
            </div>
            
            <div className="doctor-row">
              <div className="doctor-avatar-wrapper">
                {doctor?.profilePhoto ? (
                  <img src={doctor.profilePhoto} alt={doctor.name} />
                ) : (
                  <div className="avatar-placeholder">
                    <i className="fas fa-user-md"></i>
                  </div>
                )}
                <span className="verified-badge"><i className="fas fa-check"></i></span>
              </div>
              <div className="doctor-details">
                <h4>Dr. {doctor?.name}</h4>
                <span className="specialization">{doctor?.specialization}</span>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-icon">
                  <i className={appointmentData.consultationType === 'online' ? 'fas fa-video' : 'fas fa-hospital'}></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Consultation Type</span>
                  <span className="detail-value">
                    {appointmentData.consultationType === 'online' ? 'Video Call' : 'In-Clinic Visit'}
                  </span>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(appointmentData.date)}</span>
                </div>
              </div>
              
              <div className="detail-item highlight">
                <div className="detail-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Estimated Time</span>
                  <span className="detail-value">{formatTime(appointmentData.estimatedTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Receipt Section */}
          <div className={`receipt-section ${receiptExpanded ? 'expanded' : ''}`}>
            <button 
              className="receipt-toggle"
              onClick={() => setReceiptExpanded(!receiptExpanded)}
            >
              <div className="toggle-left">
                <i className="fas fa-receipt"></i>
                <span>Payment Receipt</span>
              </div>
              <div className="toggle-right">
                <span className="txn-id">{payment.transactionId}</span>
                <i className={`fas fa-chevron-${receiptExpanded ? 'up' : 'down'}`}></i>
              </div>
            </button>
            
            {receiptExpanded && (
              <div className="receipt-details" ref={receiptRef}>
                <div className="receipt-row">
                  <span className="receipt-label">Transaction ID</span>
                  <span className="receipt-value mono">{payment.transactionId}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Payment Method</span>
                  <span className="receipt-value">
                    <i className={`fas ${payment.method === 'UPI' ? 'fa-mobile-alt' : payment.method === 'Card' ? 'fa-credit-card' : 'fa-wallet'}`}></i>
                    {payment.method}
                  </span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Date & Time</span>
                  <span className="receipt-value">{formatTimestamp(payment.timestamp)}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Status</span>
                  <span className="receipt-value status-success">
                    <i className="fas fa-check-circle"></i> {payment.status}
                  </span>
                </div>
                <div className="receipt-divider"></div>
                <div className="receipt-row">
                  <span className="receipt-label">Consultation Fee</span>
                  <span className="receipt-value">₹{payment.amount}</span>
                </div>
                <div className="receipt-row total">
                  <span className="receipt-label">Total Paid</span>
                  <span className="receipt-value">₹{payment.amount}</span>
                </div>
              </div>
            )}
          </div>

          {/* What's Next Section */}
          <div className="whats-next-section">
            <h4><i className="fas fa-lightbulb"></i> What's Next?</h4>
            <div className="next-steps">
              <div className="next-step">
                <div className="step-icon email">
                  <i className="fas fa-envelope"></i>
                </div>
                <p>Confirmation email sent to your registered email</p>
              </div>
              <div className="next-step">
                <div className="step-icon reminder">
                  <i className="fas fa-bell"></i>
                </div>
                <p>You'll receive a reminder 30 minutes before</p>
              </div>
              {appointmentData.consultationType === 'online' ? (
                <div className="next-step">
                  <div className="step-icon video">
                    <i className="fas fa-video"></i>
                  </div>
                  <p>Video call link will be sent 15 minutes before</p>
                </div>
              ) : (
                <div className="next-step">
                  <div className="step-icon location">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <p>Please arrive 15 minutes early with your ID</p>
                </div>
              )}
            </div>
          </div>

          {/* Share & Actions */}
          <div className="share-actions">
            <p className="share-label">Share appointment details</p>
            <div className="share-buttons">
              <button 
                className="share-btn whatsapp"
                onClick={() => handleShare('whatsapp')}
                aria-label="Share on WhatsApp"
              >
                <i className="fab fa-whatsapp"></i>
              </button>
              <button 
                className="share-btn copy"
                onClick={() => handleShare('copy')}
                aria-label="Copy to clipboard"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button 
                className="share-btn download"
                onClick={handleDownloadReceipt}
                aria-label="Download receipt"
              >
                <i className="fas fa-download"></i>
              </button>
              <button 
                className="share-btn calendar"
                onClick={handleAddToCalendar}
                aria-label="Add to calendar"
              >
                <i className="fas fa-calendar-plus"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="success-footer">
          <button 
            className="secondary-btn"
            onClick={onViewAppointments}
          >
            <i className="fas fa-list"></i>
            View My Appointments
          </button>
          <button 
            className="primary-btn"
            onClick={onClose}
          >
            <i className="fas fa-check"></i>
            Done
          </button>
        </div>

        {/* Trust Badges */}
        <div className="trust-footer">
          <div className="trust-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Secure Payment</span>
          </div>
          <div className="trust-badge">
            <i className="fas fa-lock"></i>
            <span>256-bit Encrypted</span>
          </div>
          <div className="trust-badge">
            <i className="fas fa-check-circle"></i>
            <span>Verified</span>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="qr-modal-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setShowQRModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="qr-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              animation: 'slideUp 0.3s ease'
            }}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-times" style={{ color: '#64748b' }}></i>
            </button>
            
            <div style={{ marginBottom: '20px' }}>
              <i className="fas fa-qrcode" style={{ fontSize: '2rem', color: '#0ea5e9' }}></i>
              <h3 style={{ margin: '12px 0 8px', color: '#1e293b', fontSize: '1.25rem' }}>
                Appointment QR Code
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Show this at the clinic for quick check-in
              </p>
            </div>

            {/* QR Code using Google Charts API */}
            <div 
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px'
              }}
            >
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  JSON.stringify({
                    type: 'HEALTHSYNC_APPOINTMENT',
                    token: appointmentData.queueNumber,
                    txn: payment.transactionId,
                    doctor: doctor?.name,
                    date: appointmentData.date,
                    time: appointmentData.estimatedTime
                  })
                )}`}
                alt="Appointment QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div 
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #ccfbf1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Token</span>
                <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem' }}>#{appointmentData.queueNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Transaction</span>
                <span style={{ color: '#1e293b', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'monospace' }}>{payment.transactionId}</span>
              </div>
            </div>

            <button
              onClick={() => {
                // Download QR code
                const link = document.createElement('a');
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                  JSON.stringify({
                    type: 'HEALTHSYNC_APPOINTMENT',
                    token: appointmentData.queueNumber,
                    txn: payment.transactionId,
                    doctor: doctor?.name,
                    date: appointmentData.date,
                    time: appointmentData.estimatedTime
                  })
                )}`;
                link.download = `qr-token-${appointmentData.queueNumber}.png`;
                link.click();
                toast.success('QR Code downloaded!', { icon: '📥' });
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-download"></i>
              Save QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccessReceipt;

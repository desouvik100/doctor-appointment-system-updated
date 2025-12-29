import React, { useEffect, useState, useCallback } from 'react';

const PaymentCheckout = () => {
  // Parse URL parameters from hash or search (no React Router)
  const getParams = () => {
    // Try hash first: /#/payment-checkout?orderId=xxx
    const hash = window.location.hash;
    let queryString = '';
    
    if (hash.includes('?')) {
      queryString = hash.split('?')[1];
    } else {
      queryString = window.location.search.slice(1);
    }
    
    const params = new URLSearchParams(queryString);
    return {
      orderId: params.get('orderId'),
      appointmentId: params.get('appointmentId'),
      amount: parseInt(params.get('amount') || '0'),
      name: params.get('name') || '',
      email: params.get('email') || '',
      contact: params.get('contact') || '',
      doctorName: params.get('doctorName') || 'Doctor',
      keyId: params.get('keyId')
    };
  };

  const urlParams = getParams();
  const { orderId, appointmentId, amount, name, email, contact, doctorName, keyId } = urlParams;
  
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://doctor-appointment-system-updated.onrender.com';

  const returnToApp = useCallback((success, errorMsg = '') => {
    const deepLink = success
      ? `healthsync://payment-success?verified=true&appointmentId=${encodeURIComponent(appointmentId || '')}`
      : `healthsync://payment-failed?error=${encodeURIComponent(errorMsg || 'Payment failed')}&appointmentId=${encodeURIComponent(appointmentId || '')}`;

    window.location.href = deepLink;

    // Fallback
    setTimeout(() => {
      window.location.replace(deepLink);
    }, 500);
  }, [appointmentId]);

  const verifyPayment = useCallback(async (response) => {
    setStatus('verifying');
    try {
      const verifyResponse = await fetch(`${BACKEND_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          appointmentId: appointmentId
        })
      });

      const result = await verifyResponse.json();

      if (result.success) {
        setStatus('success');
        setTimeout(() => returnToApp(true), 2000);
      } else {
        throw new Error(result.message || 'Verification failed');
      }
    } catch (err) {
      setStatus('failed');
      setError(err.message);
      setTimeout(() => returnToApp(false, err.message), 3000);
    }
  }, [BACKEND_URL, appointmentId, returnToApp]);

  const startPayment = useCallback(() => {
    if (!window.Razorpay) {
      setError('Payment gateway not loaded');
      setStatus('error');
      return;
    }

    if (!keyId || !orderId) {
      setError('Missing payment configuration');
      setStatus('error');
      return;
    }

    setStatus('paying');

    const options = {
      key: keyId,
      amount: amount,
      currency: 'INR',
      name: 'HealthSync Pro',
      description: `Consultation with ${doctorName}`,
      order_id: orderId,
      prefill: { name, email, contact },
      theme: { color: '#0ea5e9' },
      handler: (response) => {
        verifyPayment(response);
      },
      modal: {
        ondismiss: () => {
          setStatus('cancelled');
          setTimeout(() => returnToApp(false, 'Payment cancelled'), 2000);
        },
        escape: false,
        backdropclose: false
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setStatus('failed');
        setError(response.error.description || 'Payment failed');
        setTimeout(() => returnToApp(false, response.error.description), 3000);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [keyId, orderId, amount, doctorName, name, email, contact, verifyPayment, returnToApp]);

  useEffect(() => {
    // Load Razorpay script
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setTimeout(() => {
            if (window.Razorpay) resolve();
            else reject(new Error('Razorpay failed to initialize'));
          }, 500);
        };
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(() => {
        setStatus('ready');
        setTimeout(startPayment, 500);
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, [startPayment]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      background: 'white',
      borderRadius: '24px',
      padding: '40px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    logo: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0ea5e9',
      marginBottom: '20px'
    },
    amount: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '20px 0'
    },
    doctor: {
      color: '#64748b',
      fontSize: '16px',
      marginBottom: '30px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #e2e8f0',
      borderTopColor: '#0ea5e9',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '20px auto'
    },
    statusText: {
      color: '#64748b',
      marginTop: '10px'
    },
    successIcon: {
      fontSize: '64px',
      marginBottom: '20px'
    },
    button: {
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      color: 'white',
      border: 'none',
      padding: '16px 40px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '12px',
      cursor: 'pointer',
      width: '100%',
      marginTop: '20px'
    },
    errorText: {
      color: '#dc2626',
      background: '#fef2f2',
      padding: '12px',
      borderRadius: '8px',
      marginTop: '15px'
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
      case 'ready':
        return (
          <>
            <div style={styles.spinner}></div>
            <p style={styles.statusText}>Loading payment gateway...</p>
          </>
        );
      case 'paying':
        return (
          <>
            <div style={styles.spinner}></div>
            <p style={styles.statusText}>Processing payment...</p>
          </>
        );
      case 'verifying':
        return (
          <>
            <div style={styles.spinner}></div>
            <p style={styles.statusText}>Verifying payment...</p>
          </>
        );
      case 'success':
        return (
          <>
            <div style={styles.successIcon}>✅</div>
            <h2 style={{ color: '#10b981', marginBottom: '10px' }}>Payment Successful!</h2>
            <p style={styles.statusText}>Redirecting to app...</p>
          </>
        );
      case 'failed':
      case 'cancelled':
        return (
          <>
            <div style={styles.successIcon}>❌</div>
            <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>
              {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
            </h2>
            {error && <p style={styles.errorText}>{error}</p>}
            <button style={styles.button} onClick={() => returnToApp(false, error)}>
              Return to App
            </button>
          </>
        );
      case 'error':
        return (
          <>
            <div style={styles.successIcon}>⚠️</div>
            <h2 style={{ color: '#f59e0b', marginBottom: '10px' }}>Error</h2>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.button} onClick={() => window.location.reload()}>
              Try Again
            </button>
            <button 
              style={{ ...styles.button, background: '#64748b', marginTop: '10px' }} 
              onClick={() => returnToApp(false, error)}
            >
              Return to App
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card}>
        <div style={styles.logo}>🏥 HealthSync Pro</div>
        <div style={styles.doctor}>Consultation with {doctorName}</div>
        <div style={styles.amount}>₹{amount / 100}</div>
        {getStatusContent()}
        <div style={{ marginTop: '20px', color: '#22c55e', fontSize: '14px' }}>
          🔒 Secured by Razorpay
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;

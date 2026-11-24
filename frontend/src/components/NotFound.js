import React from 'react';

/**
 * 404 Not Found page
 * Shown when a user navigates to an unknown route
 */
const NotFound = ({ onNavigateHome }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #e0f2fe 100%)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {/* Animated 404 */}
      <div style={{ fontSize: '120px', lineHeight: 1, marginBottom: '16px', userSelect: 'none' }}>
        🏥
      </div>

      <h1
        style={{
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 8px',
          lineHeight: 1,
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 12px',
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          fontSize: '1rem',
          color: '#64748b',
          maxWidth: '400px',
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}
      >
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(14, 165, 233, 0.4)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)';
          }}
        >
          <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
          Go Home
        </button>

        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 28px',
            background: 'transparent',
            color: '#0ea5e9',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(14, 165, 233, 0.05)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'transparent';
          }}
        >
          <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
          Go Back
        </button>
      </div>

      {/* Quick links */}
      <div style={{ marginTop: '48px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
          Quick links:
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Book Appointment', icon: 'fa-calendar-plus' },
            { label: 'Find Doctors', icon: 'fa-user-md' },
            { label: 'Pricing', icon: 'fa-tag' },
            { label: 'Contact Us', icon: 'fa-envelope' },
          ].map(link => (
            <button
              key={link.label}
              onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#0ea5e9';
                e.currentTarget.style.color = '#0ea5e9';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <i className={`fas ${link.icon}`}></i>
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Support */}
      <p style={{ marginTop: '32px', fontSize: '13px', color: '#94a3b8' }}>
        Need help?{' '}
        <a
          href="mailto:support@healthsyncpro.in"
          style={{ color: '#0ea5e9', textDecoration: 'none' }}
        >
          support@healthsyncpro.in
        </a>
      </p>
    </div>
  );
};

export default NotFound;

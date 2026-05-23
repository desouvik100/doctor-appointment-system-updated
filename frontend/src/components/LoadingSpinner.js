import React from 'react';

/**
 * LoadingSpinner — Reusable loading indicator
 * Supports full-page, inline, and overlay modes
 */
const LoadingSpinner = ({
  size = 'md',       // sm | md | lg | xl
  color = '#0ea5e9',
  fullPage = false,
  overlay = false,
  text = '',
  className = '',
}) => {
  const sizes = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const px = sizes[size] || sizes.md;

  const spinner = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 50 50"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80 40"
        />
      </svg>
      {text && (
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
        }}
      >
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * PageLoader — Full-page branded loading screen
 */
export const PageLoader = ({ text = 'Loading...' }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #e0f2fe 100%)',
      gap: '16px',
    }}
  >
    <div style={{ fontSize: '48px' }}>🏥</div>
    <h2
      style={{
        fontSize: '24px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0,
      }}
    >
      HealthSync
    </h2>
    <LoadingSpinner size="md" color="#0ea5e9" text={text} />
  </div>
);

/**
 * InlineLoader — Small inline loading indicator
 */
export const InlineLoader = ({ text = '' }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 0',
    }}
  >
    <LoadingSpinner size="sm" color="#0ea5e9" />
    {text && <span style={{ fontSize: '13px', color: '#64748b' }}>{text}</span>}
  </div>
);

/**
 * ButtonLoader — Loading state inside a button
 */
export const ButtonLoader = ({ color = '#fff' }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 50 50"
    style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
    <circle
      cx="25" cy="25" r="20" fill="none"
      stroke={color} strokeWidth="5"
      strokeLinecap="round" strokeDasharray="80 40"
    />
  </svg>
);

export default LoadingSpinner;

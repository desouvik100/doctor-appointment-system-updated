import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/accessibility.css';
import App from './App';

// ── One-time stale cache clear (runs only when chunk error was detected) ───
// Only clears caches if the error handler flagged a stale chunk problem.
// Does NOT run on every load — that would cause infinite reload loops.
const CACHE_CLEAR_KEY = 'cache_cleared_v5';
if (!sessionStorage.getItem(CACHE_CLEAR_KEY)) {
  sessionStorage.setItem(CACHE_CLEAR_KEY, '1');
  (async function() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        // Only clear old versioned caches (v1-v4), keep v5
        const oldCaches = keys.filter(k => /healthsync-v[1-4]|healthsync-(static|dynamic|api)-v[1-4]/.test(k));
        await Promise.all(oldCaches.map(k => caches.delete(k)));
        if (oldCaches.length > 0) {
          console.log('[Cache] Cleared old caches:', oldCaches);
        }
      }
    } catch (e) {
      // Non-critical — ignore
    }
  })();
}

// ── Stale chunk auto-recovery ──────────────────────────────────────────────
window.addEventListener('error', function(event) {
  const msg = event?.message || '';
  const isChunkError = (
    msg.includes("Unexpected token '<'") ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError') ||
    (event?.error?.name === 'SyntaxError' && msg.includes('<'))
  );
  if (isChunkError) {
    const reloadKey = 'chunk_error_reload_v1';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 30000) {
      console.warn('🔄 Stale chunk — clearing caches and reloading...');
      sessionStorage.setItem(reloadKey, String(now));
      // Clear all caches before reload so fresh chunks are fetched
      if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).finally(() => {
          window.location.reload(true);
        });
      } else {
        window.location.reload(true);
      }
    }
  }
}, true);

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, source, lineno, colno, error);
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Register Service Worker for PWA (only on web, not in Capacitor native app)
const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

if ('serviceWorker' in navigator && !isCapacitor) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
        // SW updates are handled silently — no forced reloads
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Please restart the app</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
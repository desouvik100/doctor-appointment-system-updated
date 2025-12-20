/**
 * useMobileInit Hook - Native Android Experience
 * Provides native-like behavior for the Capacitor app
 */

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { tapFeedback } from './haptics';

export const useMobileInit = (userId) => {
  const initialized = useRef(false);
  const exitPressedOnce = useRef(false);

  // Native toast for exit confirmation
  const showExitToast = useCallback(() => {
    const existingToast = document.querySelector('.native-exit-toast');
    if (existingToast) return;

    // Haptic feedback for exit warning
    tapFeedback();

    const toast = document.createElement('div');
    toast.className = 'native-exit-toast';
    toast.innerHTML = `
      <span>Press back again to exit</span>
    `;
    toast.style.cssText = `
      position: fixed;
      bottom: calc(80px + env(safe-area-inset-bottom, 0px));
      left: 50%;
      transform: translateX(-50%);
      background: #323232;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      animation: fadeInUp 200ms ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOutDown 200ms ease forwards';
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }, []);

  useEffect(() => {
    const initMobile = async () => {
      if (!Capacitor.isNativePlatform()) return;
      if (initialized.current) return;

      console.log('🚀 Initializing native mobile experience...');

      // Apply native-like CSS immediately
      applyNativeStyles();

      // Add native animation keyframes
      addAnimationKeyframes();

      // Initialize status bar with native colors
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0ea5e9' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (e) {
        console.log('StatusBar:', e.message);
      }

      // Hide splash screen smoothly
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        setTimeout(async () => {
          await SplashScreen.hide({ fadeOutDuration: 300 });
        }, 800);
      } catch (e) {
        console.log('SplashScreen:', e.message);
      }

      // Keyboard handling for native feel
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        Keyboard.addListener('keyboardWillShow', (info) => {
          document.body.classList.add('keyboard-open');
          document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
          // Scroll focused input into view
          setTimeout(() => {
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        });
        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
          document.body.style.setProperty('--keyboard-height', '0px');
        });
      } catch (e) {
        console.log('Keyboard:', e.message);
      }

      // App lifecycle and back button
      try {
        const { App } = await import('@capacitor/app');
        
        // Native back button handling with double-tap to exit
        App.addListener('backButton', ({ canGoBack }) => {
          // Check if modal/overlay is open
          const modal = document.querySelector(
            '.modal-open, [data-modal="true"], .booking-modal, ' +
            '.cinema-booking-overlay, .native-modal-overlay, ' +
            '.dropdown-menu.show, .offcanvas.show'
          );
          
          if (modal) {
            // Close modal instead of navigating
            const closeBtn = modal.querySelector(
              '.close-btn, [data-close], .modal-close, ' +
              '.btn-close, [data-bs-dismiss]'
            );
            if (closeBtn) {
              closeBtn.click();
              return;
            }
            // Try clicking overlay to close
            if (modal.classList.contains('cinema-booking-overlay') || 
                modal.classList.contains('native-modal-overlay')) {
              modal.click();
              return;
            }
          }
          
          if (canGoBack && window.history.length > 1) {
            window.history.back();
            exitPressedOnce.current = false;
          } else {
            // Double-tap to exit (native Android behavior)
            if (exitPressedOnce.current) {
              App.exitApp();
            } else {
              exitPressedOnce.current = true;
              showExitToast();
              setTimeout(() => {
                exitPressedOnce.current = false;
              }, 2000);
            }
          }
        });

        // Handle app resume - refresh data
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('📱 App resumed');
            window.dispatchEvent(new CustomEvent('appResumed'));
            document.dispatchEvent(new CustomEvent('refreshData'));
            // Re-apply status bar colors
            import('@capacitor/status-bar').then(({ StatusBar }) => {
              StatusBar.setBackgroundColor({ color: '#0ea5e9' });
            }).catch(() => {});
          }
        });

        // Deep links
        App.addListener('appUrlOpen', (event) => {
          handleDeepLink(event.url);
        });
      } catch (e) {
        console.log('App:', e.message);
      }

      // Disable text selection on non-input elements
      disableTextSelection();

      // Prevent pull-to-refresh on Android
      preventPullToRefresh();

      // Enable smooth scrolling
      enableSmoothScrolling();

      // Add ripple effect to buttons
      addRippleEffect();

      // Prevent context menu (long press)
      preventContextMenu();

      // Request location permission on app startup
      requestLocationOnStartup();

      initialized.current = true;
      console.log('✅ Native mobile experience ready');
    };

    initMobile();

    return () => {
      const cleanup = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
          const { App } = await import('@capacitor/app');
          await App.removeAllListeners();
          const { Keyboard } = await import('@capacitor/keyboard');
          await Keyboard.removeAllListeners();
        } catch (e) {}
      };
      cleanup();
    };
  }, [showExitToast]);

  // Push notifications
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    const initPush = async () => {
      setTimeout(async () => {
        try {
          const { initPushNotifications } = await import('./pushNotifications');
          await initPushNotifications(userId);
        } catch (e) {
          console.warn('Push:', e.message);
        }
      }, 2000);
    };
    initPush();
  }, [userId]);
};

/**
 * Add animation keyframes for native effects
 */
const addAnimationKeyframes = () => {
  if (document.getElementById('native-keyframes')) return;
  
  const style = document.createElement('style');
  style.id = 'native-keyframes';
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    @keyframes fadeOutDown {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
    }
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Apply native-like CSS styles
 */
const applyNativeStyles = () => {
  const style = document.createElement('style');
  style.id = 'native-mobile-styles';
  style.textContent = `
    /* ===== NATIVE ANDROID FEEL ===== */
    
    /* Disable pinch-to-zoom but allow scrolling */
    html {
      touch-action: pan-y pan-x;
      -ms-touch-action: pan-y pan-x;
      overscroll-behavior-y: none;
    }
    
    /* Allow normal scrolling - DON'T use position:fixed */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      overscroll-behavior: none;
      -webkit-overflow-scrolling: touch;
    }
    
    #root {
      min-height: 100%;
    }
    
    /* Native Android Feel */
    * {
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      box-sizing: border-box;
    }
    
    body {
      user-select: none;
      -webkit-user-select: none;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Allow text selection in inputs */
    input, textarea, [contenteditable="true"] {
      user-select: text;
      -webkit-user-select: text;
    }
    
    /* Hide scrollbars but allow scrolling */
    ::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }
    
    * {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    /* Smooth scrolling for scroll containers */
    .overflow-auto, .overflow-y-auto, .overflow-scroll {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    
    /* ===== NATIVE PAGE TRANSITIONS ===== */
    .page-transition-enter {
      opacity: 0;
      transform: translateX(30px);
    }
    .page-transition-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-transition-exit {
      opacity: 1;
      transform: translateX(0);
    }
    .page-transition-exit-active {
      opacity: 0;
      transform: translateX(-30px);
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* ===== NATIVE BUTTON EFFECTS ===== */
    button:active, .btn:active, [role="button"]:active {
      transform: scale(0.96);
      opacity: 0.9;
      transition: transform 50ms ease;
    }
    
    /* Card press effect */
    .native-card:active,
    .doctor-card:active,
    .appointment-card:active,
    .clickable:active {
      transform: scale(0.98);
      transition: transform 80ms ease;
    }
    
    /* ===== SAFE AREA HANDLING ===== */
    .safe-area-top {
      padding-top: env(safe-area-inset-top, 0);
    }
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    
    /* Bottom nav spacing */
    .has-bottom-nav {
      padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px)) !important;
    }
    
    /* ===== KEYBOARD HANDLING ===== */
    body.keyboard-open .mobile-payment-footer,
    body.keyboard-open .bottom-nav,
    body.keyboard-open .native-bottom-nav,
    body.keyboard-open .bottom-nav-container {
      display: none !important;
    }
    
    /* Prevent zoom on input focus (iOS) */
    input, select, textarea {
      font-size: 16px !important;
    }
    
    /* ===== RIPPLE EFFECT ===== */
    .ripple-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      border-radius: inherit;
    }
    
    .ripple-effect {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: rippleEffect 600ms linear forwards;
      pointer-events: none;
    }
    
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* ===== LOADING STATES ===== */
    .native-loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 9999;
    }
    
    .native-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #0ea5e9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* ===== PREVENT UNWANTED BEHAVIORS ===== */
    img {
      -webkit-user-drag: none;
      user-drag: none;
    }
    
    /* Disable text selection on labels */
    label, h1, h2, h3, h4, h5, h6, p, span {
      user-select: none;
      -webkit-user-select: none;
    }
    
    /* ===== TODAY FOCUS STYLING ===== */
    .today-highlight {
      position: relative;
    }
    .today-highlight::before {
      content: 'TODAY';
      position: absolute;
      top: -8px;
      left: 12px;
      background: linear-gradient(135deg, #0ea5e9, #14b8a6);
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    
    /* ===== ID BADGES ===== */
    .id-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'SF Mono', 'Roboto Mono', monospace;
      color: #64748b;
    }
    
    .id-badge i {
      font-size: 10px;
      opacity: 0.7;
    }
  `;
  
  if (!document.getElementById('native-mobile-styles')) {
    document.head.appendChild(style);
  }
  
  // Also update viewport meta tag to prevent zoom
  updateViewportMeta();
};

/**
 * Update viewport meta to prevent zoom
 */
const updateViewportMeta = () => {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }
};

/**
 * Disable text selection on non-input elements
 */
const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => {
    const tag = e.target.tagName.toLowerCase();
    if (!['input', 'textarea'].includes(tag) && !e.target.isContentEditable) {
      e.preventDefault();
    }
  });
};

/**
 * Prevent pull-to-refresh - ONLY block the browser's pull-to-refresh gesture
 * Don't interfere with normal scrolling
 */
const preventPullToRefresh = () => {
  // Use CSS overscroll-behavior instead of JS - much cleaner
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overscrollBehavior = 'none';
  
  // Only prevent the actual pull-to-refresh at document level when already at top
  let touchStartY = 0;
  let isAtTop = false;
  
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    // Check if any scrollable parent is at top
    const scrollableParent = e.target.closest('.overflow-y-auto, .overflow-auto, [style*="overflow"]');
    if (scrollableParent) {
      isAtTop = scrollableParent.scrollTop <= 0;
    } else {
      isAtTop = (document.documentElement.scrollTop || document.body.scrollTop) <= 0;
    }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    // Only prevent if:
    // 1. We started at the very top (scrollTop = 0)
    // 2. User is pulling DOWN (finger moving down = y increasing)
    // 3. This is the document body, not a scrollable container
    const currentY = e.touches[0].clientY;
    const isPullingDown = currentY > touchStartY;
    const scrollableParent = e.target.closest('.overflow-y-auto, .overflow-auto, [style*="overflow"]');
    
    // Only block pull-to-refresh on body when at absolute top and pulling down
    if (isAtTop && isPullingDown && !scrollableParent) {
      const bodyScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (bodyScrollTop <= 0) {
        e.preventDefault();
      }
    }
  }, { passive: false });
};

/**
 * Enable smooth scrolling with momentum
 */
const enableSmoothScrolling = () => {
  // Apply to existing elements
  const applyScrollStyles = () => {
    document.querySelectorAll(
      '.scroll-container, .modal-body, .page-content, ' +
      '.booking-content, .native-sheet-content, .dashboard-content'
    ).forEach(el => {
      el.style.webkitOverflowScrolling = 'touch';
      el.style.overscrollBehavior = 'contain';
    });
  };
  
  applyScrollStyles();
  
  // Re-apply when DOM changes
  const observer = new MutationObserver(applyScrollStyles);
  observer.observe(document.body, { childList: true, subtree: true });
};

/**
 * Add ripple effect to interactive elements
 */
const addRippleEffect = () => {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .btn, [role="button"], .native-btn, .clickable');
    if (!target) return;
    
    // Create ripple container if not exists
    let container = target.querySelector('.ripple-container');
    if (!container) {
      container = document.createElement('span');
      container.className = 'ripple-container';
      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(container);
    }
    
    // Create ripple
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    container.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => ripple.remove(), 600);
  });
};

/**
 * Prevent context menu on long press
 */
const preventContextMenu = () => {
  document.addEventListener('contextmenu', (e) => {
    const tag = e.target.tagName.toLowerCase();
    // Allow context menu on inputs for copy/paste
    if (!['input', 'textarea'].includes(tag)) {
      e.preventDefault();
    }
  });
};

/**
 * Handle deep links
 */
const handleDeepLink = async (url) => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const params = urlObj.searchParams;

    // Payment callback
    if (path.includes('/payment/') || params.has('payment_id')) {
      window.dispatchEvent(new CustomEvent('paymentCallback', { 
        detail: { url, params: Object.fromEntries(params) } 
      }));
      return;
    }

    // Appointment deep link
    if (path.includes('/appointments/') || path.includes('/booking/')) {
      const appointmentId = path.split('/').pop();
      window.dispatchEvent(new CustomEvent('openAppointment', { 
        detail: { appointmentId } 
      }));
      return;
    }

    // Doctor profile deep link
    if (path.includes('/doctor/')) {
      const doctorId = path.split('/').pop();
      window.dispatchEvent(new CustomEvent('openDoctorProfile', { 
        detail: { doctorId } 
      }));
      return;
    }

    // Generic navigation
    if (path && path !== '/') {
      window.location.hash = path.replace(/^\//, '');
    }
  } catch (e) {
    console.error('Deep link error:', e);
  }
};

/**
 * Request location permission on app startup
 */
const requestLocationOnStartup = () => {
  // Check if we've already asked for location
  const locationAsked = localStorage.getItem('locationPermissionAsked');
  
  // Request location permission
  if (navigator.geolocation) {
    console.log('📍 Requesting location permission...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('📍 Location granted:', position.coords.latitude, position.coords.longitude);
        localStorage.setItem('locationPermissionAsked', 'true');
        
        // Store location in localStorage for quick access
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        localStorage.setItem('userLocation', JSON.stringify(locationData));
        
        // Try to get city name
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const data = await response.json();
          if (data.city || data.locality) {
            locationData.city = data.city || data.locality;
            locationData.state = data.principalSubdivision;
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            console.log('📍 Location city:', locationData.city);
          }
        } catch (e) {
          console.log('Geocoding failed:', e.message);
        }
        
        // Dispatch event for components to update
        window.dispatchEvent(new CustomEvent('locationUpdated', { detail: locationData }));
      },
      (error) => {
        console.log('📍 Location denied or error:', error.message);
        localStorage.setItem('locationPermissionAsked', 'true');
        
        // Dispatch event even on error so UI can handle it
        window.dispatchEvent(new CustomEvent('locationError', { detail: { error: error.message } }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
};

export default useMobileInit;

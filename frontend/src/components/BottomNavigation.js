/**
 * Bottom Navigation - Material 3 Style with Strong Active States
 * Thumb-friendly spacing, badge counts, always visible
 */

import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { tapFeedback } from '../mobile/haptics';
import '../styles/bottom-navigation.css';

const BottomNavigation = ({ activeTab, onTabChange, unreadNotifications = 0, upcomingBookings = 0, onMenuAction, isSearchOpen = false }) => {
  const isNative = Capacitor.isNativePlatform();
  const [showMenu, setShowMenu] = useState(false);
  const listenerRef = useRef(null);

  // Handle Android back button
  useEffect(() => {
    if (!isNative) return;
    
    const handleBackButton = () => {
      // If search is open, let MobileHeroSection handle it
      if (isSearchOpen) {
        return;
      }
      
      if (showMenu) {
        setShowMenu(false);
        return;
      }
      
      if (activeTab !== 'overview') {
        onTabChange('overview');
        return;
      }
      
      // On home with nothing open, exit app
      App.exitApp();
    };

    // Remove previous listener if exists
    if (listenerRef.current) {
      listenerRef.current.remove();
    }
    
    // Add new listener
    listenerRef.current = App.addListener('backButton', handleBackButton);
    
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [showMenu, activeTab, onTabChange, isNative, isSearchOpen]);

  const tabs = [
    { id: 'overview', icon: 'fas fa-home', activeIcon: 'fas fa-home', label: 'Home', badge: 0 },
    { id: 'doctors', icon: 'fas fa-user-md', activeIcon: 'fas fa-user-md', label: 'Doctors', badge: 0 },
    { id: 'appointments', icon: 'fas fa-calendar-alt', activeIcon: 'fas fa-calendar-check', label: 'Bookings', badge: upcomingBookings, highlight: true },
    { id: 'health', icon: 'fas fa-heart', activeIcon: 'fas fa-heartbeat', label: 'Health', badge: 0 },
    { id: 'menu', icon: 'fas fa-grip-horizontal', activeIcon: 'fas fa-grip-horizontal', label: 'More', badge: 0 }
  ];

  const menuItems = [
    // Section: Care
    { section: 'Care', items: [
      { id: 'ai-assistant', icon: 'fas fa-robot', label: 'AI Assistant', color: '#ec4899' },
      { id: 'second-opinion', icon: 'fas fa-user-md', label: 'Second Opinion', color: '#7c3aed' },
      { id: 'checkup', icon: 'fas fa-stethoscope', label: 'Health Checkup', color: '#14b8a6' },
    ]},
    // Section: Records
    { section: 'Records', items: [
      { id: 'medical-history', icon: 'fas fa-history', label: 'Medical History', color: '#06b6d4' },
      { id: 'lab-reports', icon: 'fas fa-flask', label: 'Lab Reports', color: '#f59e0b' },
      { id: 'imaging', icon: 'fas fa-x-ray', label: 'Medical Imaging', color: '#6366f1' },
      { id: 'health-analytics', icon: 'fas fa-chart-line', label: 'Analytics', color: '#8b5cf6' },
    ]},
    // Section: Emergency
    { section: 'Emergency', items: [
      { id: 'ambulance', icon: 'fas fa-ambulance', label: 'Ambulance', color: '#ef4444' },
      { id: 'emergency', icon: 'fas fa-phone-alt', label: 'Emergency', color: '#dc2626' },
      { id: 'insurance', icon: 'fas fa-shield-alt', label: 'Insurance', color: '#14b8a6' },
    ]},
    // Section: Tools
    { section: 'Tools', items: [
      { id: 'medicine-reminder', icon: 'fas fa-pills', label: 'Reminders', color: '#ec4899' },
      { id: 'quick-tools', icon: 'fas fa-tools', label: 'Quick Tools', color: '#64748b' },
      { id: 'calculators', icon: 'fas fa-calculator', label: 'Calculators', color: '#0ea5e9' },
      { id: 'health-tips', icon: 'fas fa-lightbulb', label: 'Health Tips', color: '#84cc16' },
    ]},
    // Section: Rewards
    { section: 'Rewards', items: [
      { id: 'wallet', icon: 'fas fa-wallet', label: 'Wallet', color: '#10b981' },
      { id: 'transactions', icon: 'fas fa-receipt', label: 'Transactions', color: '#8b5cf6' },
      { id: 'referrals', icon: 'fas fa-gift', label: 'Refer & Earn', color: '#f97316' },
      { id: 'loyalty', icon: 'fas fa-coins', label: 'Loyalty Points', color: '#eab308' },
    ]},
    // Section: Account
    { section: 'Account', items: [
      { id: 'profile', icon: 'fas fa-user-circle', label: 'My Profile', color: '#3b82f6' },
      { id: 'email-reminders', icon: 'fas fa-envelope', label: 'Email Alerts', color: '#0891b2' },
      { id: 'settings', icon: 'fas fa-cog', label: 'Settings', color: '#64748b' },
    ]},
  ];

  // Flatten for backward compatibility
  const flatMenuItems = menuItems.flatMap(section => section.items);

  const handleTabClick = (tabId) => {
    if (isNative) tapFeedback();
    
    if (tabId === 'menu') {
      setShowMenu(!showMenu);
    } else {
      setShowMenu(false);
      onTabChange(tabId);
    }
  };

  const handleMenuItemClick = (itemId) => {
    if (isNative) tapFeedback();
    setShowMenu(false);
    
    if (onMenuAction) {
      onMenuAction(itemId);
    } else {
      onTabChange(itemId);
    }
  };

  return (
    <>
      {/* Menu Overlay - Modern Bottom Sheet with Sections */}
      {showMenu && (
        <div 
          className="menu-overlay" 
          onClick={() => setShowMenu(false)}
          role="dialog"
          aria-modal="true"
          aria-label="More options menu"
        >
          <div 
            className="menu-sheet" 
            onClick={(e) => e.stopPropagation()}
            role="menu"
            style={{ maxHeight: '85vh' }}
          >
            <div className="menu-handle" aria-hidden="true"></div>
            <div className="menu-header">
              <span id="menu-title">More Options</span>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 140px)', paddingBottom: '20px' }}>
              {menuItems.map((section, sectionIndex) => (
                <div key={section.section} style={{ marginBottom: '16px' }}>
                  {/* Section Header */}
                  <div style={{
                    padding: '8px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>{section.section}</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>
                  {/* Section Items */}
                  <div className="menu-grid" role="group" style={{ padding: '0 12px' }}>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        className="menu-grid-item"
                        onClick={() => handleMenuItemClick(item.id)}
                        role="menuitem"
                        aria-label={item.label}
                      >
                        <div className="menu-grid-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }} aria-hidden="true">
                          <i className={item.icon}></i>
                        </div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="menu-footer">
              <button 
                className="logout-btn" 
                onClick={() => handleMenuItemClick('logout')}
                role="menuitem"
                aria-label="Logout from account"
              >
                <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Swiggy Style */}
      <nav className="bottom-nav-container" aria-label="Main navigation">
        <div className="bottom-nav" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || (tab.id === 'menu' && showMenu);
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-label={`${tab.label}${tab.badge > 0 ? `, ${tab.badge} notifications` : ''}`}
                tabIndex={isActive ? 0 : -1}
              >
                <div className="nav-tab-icon" aria-hidden="true">
                  <i className={isActive ? tab.activeIcon : tab.icon}></i>
                  {tab.badge > 0 && (
                    <span className={`nav-badge ${tab.highlight ? 'highlight' : ''}`} aria-hidden="true">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="nav-tab-label">{tab.label}</span>
                {isActive && <div className="nav-tab-indicator" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;

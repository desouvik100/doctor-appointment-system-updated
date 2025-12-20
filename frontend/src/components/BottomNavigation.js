/**
 * Bottom Navigation - Modern Swiggy/Ola Style
 */

import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { tapFeedback } from '../mobile/haptics';
import '../styles/bottom-navigation.css';

const BottomNavigation = ({ activeTab, onTabChange, unreadNotifications = 0, upcomingBookings = 0, onMenuAction }) => {
  const isNative = Capacitor.isNativePlatform();
  const [showMenu, setShowMenu] = useState(false);

  const tabs = [
    { id: 'overview', icon: 'fas fa-home', activeIcon: 'fas fa-home', label: 'Home', badge: 0 },
    { id: 'doctors', icon: 'fas fa-user-md', activeIcon: 'fas fa-user-md', label: 'Doctors', badge: 0 },
    { id: 'appointments', icon: 'fas fa-calendar-alt', activeIcon: 'fas fa-calendar-check', label: 'Bookings', badge: upcomingBookings, highlight: true },
    { id: 'health', icon: 'fas fa-heart', activeIcon: 'fas fa-heartbeat', label: 'Health', badge: 0 },
    { id: 'menu', icon: 'fas fa-grip-horizontal', activeIcon: 'fas fa-grip-horizontal', label: 'More', badge: 0 }
  ];

  const menuItems = [
    { id: 'profile', icon: 'fas fa-user-circle', label: 'My Profile', color: '#3b82f6' },
    { id: 'wallet', icon: 'fas fa-wallet', label: 'Wallet', color: '#10b981' },
    { id: 'transactions', icon: 'fas fa-receipt', label: 'Transactions', color: '#8b5cf6' },
    { id: 'medical-history', icon: 'fas fa-history', label: 'Medical History', color: '#06b6d4' },
    { id: 'lab-reports', icon: 'fas fa-flask', label: 'Lab Reports', color: '#f59e0b' },
    { id: 'medicine-reminder', icon: 'fas fa-pills', label: 'Reminders', color: '#ec4899' },
    { id: 'insurance', icon: 'fas fa-shield-alt', label: 'Insurance', color: '#14b8a6' },
    { id: 'emergency', icon: 'fas fa-phone-alt', label: 'Emergency', color: '#ef4444' },
    { id: 'referrals', icon: 'fas fa-gift', label: 'Refer & Earn', color: '#f97316' },
    { id: 'loyalty', icon: 'fas fa-coins', label: 'Loyalty Points', color: '#eab308' },
    { id: 'health-tips', icon: 'fas fa-lightbulb', label: 'Health Tips', color: '#84cc16' },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings', color: '#64748b' },
    { id: 'logout', icon: 'fas fa-sign-out-alt', label: 'Logout', danger: true }
  ];

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
      {/* Menu Overlay - Modern Bottom Sheet */}
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
          >
            <div className="menu-handle" aria-hidden="true"></div>
            <div className="menu-header">
              <span id="menu-title">More Options</span>
            </div>
            <div className="menu-grid" role="group" aria-labelledby="menu-title">
              {menuItems.filter(item => !item.danger).map((item) => (
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

/**
 * Bottom Navigation Component - Native Android Style
 * Thumb-friendly navigation for patient app
 */

import React from 'react';
import { Capacitor } from '@capacitor/core';
import { tapFeedback } from '../mobile/haptics';
import '../styles/bottom-navigation.css';

const BottomNavigation = ({ activeTab, onTabChange, unreadNotifications = 0 }) => {
  const isNative = Capacitor.isNativePlatform();

  const tabs = [
    { id: 'overview', icon: 'fas fa-home', label: 'Home' },
    { id: 'doctors', icon: 'fas fa-user-md', label: 'Doctors' },
    { id: 'appointments', icon: 'fas fa-calendar-check', label: 'Bookings' },
    { id: 'health', icon: 'fas fa-heartbeat', label: 'Health' },
    { id: 'profile', icon: 'fas fa-user', label: 'Profile' }
  ];

  const handleTabClick = (tabId) => {
    if (isNative) {
      tapFeedback();
    }
    onTabChange(tabId);
  };

  return (
    <nav className="bottom-nav-container">
      <div className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            aria-label={tab.label}
          >
            <div className="nav-icon-wrapper">
              <i className={tab.icon}></i>
              {tab.id === 'appointments' && unreadNotifications > 0 && (
                <span className="nav-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
              )}
            </div>
            <span className="nav-label">{tab.label}</span>
            {activeTab === tab.id && <div className="nav-indicator" />}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;

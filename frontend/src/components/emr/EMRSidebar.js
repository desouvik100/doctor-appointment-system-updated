/**
 * EMR Sidebar Navigation Component
 * Displays available EMR screens based on subscription and role
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './EMRSidebar.css';

const EMRSidebar = ({ 
  clinicId, 
  currentScreen, 
  onScreenChange, 
  subscription,
  userRole = 'staff',
  collapsed = false,
  onToggleCollapse
}) => {
  const [screens, setScreens] = useState([]);
  const [lockedScreens, setLockedScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      fetchAvailableScreens();
    }
  }, [clinicId]);

  const fetchAvailableScreens = async () => {
    try {
      const response = await axios.get(`/api/emr/screens/${clinicId}`);
      if (response.data.success) {
        setScreens(response.data.screens || []);
        setLockedScreens(response.data.lockedScreens || []);
      }
    } catch (error) {
      console.error('Error fetching EMR screens:', error);
    } finally {
      setLoading(false);
    }
  };

  const screenIcons = {
    patient_registration: '📋',
    visit_history: '📅',
    systematic_history: '🩺',
    basic_prescription: '💊',
    uploaded_reports: '📄',
    doctor_notes: '📝',
    follow_up_scheduling: '🔄',
    medication_history: '💉',
    patient_timeline: '📊',
    emr_dashboard: '🏠',
    analytics_reports: '📈',
    audit_logs: '🔍',
    staff_management: '👥',
    data_export: '📤',
    whatsapp: '💬',
    // Clinical Features
    vitals_recorder: '❤️',
    vitals_trends: '📈',
    lab_orders: '🧪',
    medical_history: '📋',
    diagnosis_coding: '🏥',
    drug_interactions: '⚠️'
  };

  const screenLabels = {
    patient_registration: 'Patient Registration',
    visit_history: 'Visit History',
    systematic_history: 'Systematic History',
    basic_prescription: 'Prescription',
    uploaded_reports: 'Reports',
    doctor_notes: 'Doctor Notes',
    follow_up_scheduling: 'Follow-ups',
    medication_history: 'Medications',
    patient_timeline: 'Timeline',
    emr_dashboard: 'Dashboard',
    analytics_reports: 'Analytics',
    audit_logs: 'Audit Logs',
    staff_management: 'Staff',
    data_export: 'Export',
    whatsapp: 'WhatsApp',
    // Clinical Features
    vitals_recorder: 'Vitals Recording',
    vitals_trends: 'Vitals Trends',
    lab_orders: 'Lab Orders',
    medical_history: 'Medical History',
    diagnosis_coding: 'ICD-10 Coding',
    drug_interactions: 'Drug Interactions'
  };

  const getDaysRemaining = () => {
    if (!subscription?.expiryDate) return 0;
    const expiry = new Date(subscription.expiryDate);
    const now = new Date();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  if (loading) {
    return (
      <div className={`emr-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="emr-sidebar__loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`emr-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="emr-sidebar__header">
        <div className="emr-sidebar__logo">
          <span className="logo-icon">🏥</span>
          {!collapsed && <span className="logo-text">Clinic EMR</span>}
        </div>
        <button 
          className="emr-sidebar__toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="emr-sidebar__nav">
        {/* Available Screens */}
        {screens.map((screen) => (
          <button
            key={screen.id}
            className={`emr-sidebar__item ${currentScreen === screen.id ? 'active' : ''}`}
            onClick={() => onScreenChange(screen.id)}
            title={collapsed ? screenLabels[screen.id] : ''}
          >
            <span className="item-icon">{screenIcons[screen.id] || '📌'}</span>
            {!collapsed && (
              <span className="item-label">{screenLabels[screen.id] || screen.name}</span>
            )}
          </button>
        ))}

        {/* Divider if there are locked screens */}
        {lockedScreens.length > 0 && (
          <div className="emr-sidebar__divider">
            {!collapsed && <span>Upgrade to unlock</span>}
          </div>
        )}

        {/* Locked Screens */}
        {lockedScreens.map((screen) => (
          <button
            key={screen.id}
            className="emr-sidebar__item locked"
            onClick={() => onScreenChange(screen.id, true)}
            title={collapsed ? `${screenLabels[screen.id]} (Locked)` : ''}
          >
            <span className="item-icon">🔒</span>
            {!collapsed && (
              <>
                <span className="item-label">{screenLabels[screen.id] || screen.name}</span>
                <span className="item-badge">{screen.plan}</span>
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Subscription Status */}
      {!collapsed && subscription && (
        <div className={`emr-sidebar__subscription ${isExpired ? 'expired' : isExpiringSoon ? 'warning' : ''}`}>
          <div className="subscription-plan">
            <span className="plan-icon">
              {subscription.plan === 'advanced' ? '⭐' : subscription.plan === 'standard' ? '🌟' : '✨'}
            </span>
            <span className="plan-name">
              {subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} Plan
            </span>
          </div>
          <div className="subscription-status">
            {isExpired ? (
              <span className="status-expired">Expired</span>
            ) : (
              <span className={`status-days ${isExpiringSoon ? 'warning' : ''}`}>
                {daysRemaining} days left
              </span>
            )}
          </div>
          {(isExpired || isExpiringSoon) && (
            <button 
              className="subscription-renew"
              onClick={() => onScreenChange('subscription_renew')}
            >
              {isExpired ? 'Renew Now' : 'Extend'}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="emr-sidebar__footer">
        {!collapsed && (
          <span className="powered-by">EMR powered by HealthSync</span>
        )}
      </div>
    </div>
  );
};

export default EMRSidebar;

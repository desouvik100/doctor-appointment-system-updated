// frontend/src/components/ConfirmDialog.js
// Reusable confirmation dialog component

import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  icon = null,
  loading = false,
  children = null
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'danger':
        return <i className="fas fa-exclamation-triangle"></i>;
      case 'success':
        return <i className="fas fa-check-circle"></i>;
      case 'info':
        return <i className="fas fa-info-circle"></i>;
      default:
        return <i className="fas fa-question-circle"></i>;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
      <div className={`confirm-dialog confirm-dialog--${type}`}>
        <div className={`confirm-dialog__icon confirm-dialog__icon--${type}`}>
          {getIcon()}
        </div>
        
        <h3 className="confirm-dialog__title">{title}</h3>
        
        <p className="confirm-dialog__message">{message}</p>
        
        {children && (
          <div className="confirm-dialog__content">
            {children}
          </div>
        )}
        
        <div className="confirm-dialog__actions">
          <button 
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog__btn confirm-dialog__btn--confirm confirm-dialog__btn--${type}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

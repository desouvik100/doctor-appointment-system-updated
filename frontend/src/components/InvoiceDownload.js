// frontend/src/components/InvoiceDownload.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './InvoiceDownload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const InvoiceDownload = ({ appointmentId, patientEmail, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/invoices/generate/${appointmentId}`);
      
      if (response.data.success) {
        // Create blob and download
        const blob = new Blob([response.data.invoiceHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${response.data.invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Invoice downloaded! Open in browser and print as PDF.');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    window.open(`${API_URL}/invoices/view/${appointmentId}`, '_blank');
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const response = await axios.post(`${API_URL}/invoices/send/${appointmentId}`);
      
      if (response.data.success) {
        toast.success(`Invoice sent to ${patientEmail || 'patient email'}`);
      } else {
        toast.error(response.data.message || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(error.response?.data?.message || 'Failed to send invoice email');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(`${API_URL}/invoices/view/${appointmentId}`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  return (
    <div className="invoice-modal">
      <div className="invoice-modal-content">
        <div className="invoice-modal-header">
          <h3>
            <i className="fas fa-file-invoice"></i>
            Invoice / Receipt
          </h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="invoice-modal-body">
          <div className="invoice-preview">
            <div className="preview-icon">
              <i className="fas fa-receipt"></i>
            </div>
            <h4>Payment Invoice</h4>
            <p>Generate, download, or email your invoice for this appointment.</p>
          </div>

          <div className="invoice-actions">
            <button 
              className="action-btn view"
              onClick={handleView}
            >
              <i className="fas fa-eye"></i>
              <span>View Invoice</span>
            </button>

            <button 
              className="action-btn download"
              onClick={handleDownload}
              disabled={loading}
            >
              <i className="fas fa-download"></i>
              <span>{loading ? 'Downloading...' : 'Download'}</span>
            </button>

            <button 
              className="action-btn print"
              onClick={handlePrint}
            >
              <i className="fas fa-print"></i>
              <span>Print / PDF</span>
            </button>

            <button 
              className="action-btn email"
              onClick={handleSendEmail}
              disabled={sending}
            >
              <i className="fas fa-envelope"></i>
              <span>{sending ? 'Sending...' : 'Email Invoice'}</span>
            </button>
          </div>

          {patientEmail && (
            <p className="email-note">
              <i className="fas fa-info-circle"></i>
              Invoice will be sent to: <strong>{patientEmail}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple button component for inline use
export const InvoiceButton = ({ appointmentId, size = 'normal' }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        className={`invoice-btn ${size}`}
        onClick={() => setShowModal(true)}
        title="View/Download Invoice"
      >
        <i className="fas fa-file-invoice"></i>
        {size !== 'small' && <span>Invoice</span>}
      </button>

      {showModal && (
        <InvoiceDownload 
          appointmentId={appointmentId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default InvoiceDownload;

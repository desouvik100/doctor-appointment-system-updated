// frontend/src/components/HealthDataExport.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './HealthDataExport.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const HealthDataExport = ({ userId, onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('all');

  const handleExport = async (format = 'json') => {
    try {
      setExporting(true);
      
      let url = `${API_URL}/export/health-data/${userId}`;
      if (format === 'html') {
        url += '?format=html';
      }

      const response = await axios.get(url, {
        responseType: format === 'html' ? 'blob' : 'json'
      });

      if (format === 'html') {
        // Download HTML file
        const blob = new Blob([response.data], { type: 'text/html' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `health-data-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.success('Health data exported as HTML!');
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `health-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.success('Health data exported as JSON!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export health data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPrescriptions = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`${API_URL}/export/prescriptions/${userId}`);
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `prescriptions-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Exported ${response.data.count} prescriptions!`);
    } catch (error) {
      toast.error('Failed to export prescriptions');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAppointments = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`${API_URL}/export/appointments/${userId}`);
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `appointments-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Exported ${response.data.count} appointments!`);
    } catch (error) {
      toast.error('Failed to export appointments');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-modal">
      <div className="export-content">
        <div className="export-header">
          <h3>
            <i className="fas fa-download"></i>
            Export Health Data
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="export-body">
          <p className="export-description">
            Download your complete health records including appointments, prescriptions, 
            and lab reports. Your data is always yours.
          </p>

          <div className="export-options">
            <div className="export-option">
              <div className="option-icon all">
                <i className="fas fa-file-archive"></i>
              </div>
              <div className="option-info">
                <h4>Complete Health Data</h4>
                <p>All appointments, prescriptions, lab reports, and medical history</p>
              </div>
              <div className="option-actions">
                <button 
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="btn-json"
                >
                  <i className="fas fa-code"></i> JSON
                </button>
                <button 
                  onClick={() => handleExport('html')}
                  disabled={exporting}
                  className="btn-html"
                >
                  <i className="fas fa-file-alt"></i> HTML
                </button>
              </div>
            </div>

            <div className="export-option">
              <div className="option-icon prescriptions">
                <i className="fas fa-prescription"></i>
              </div>
              <div className="option-info">
                <h4>Prescriptions Only</h4>
                <p>All your prescriptions with medicines and doctor notes</p>
              </div>
              <div className="option-actions">
                <button 
                  onClick={handleExportPrescriptions}
                  disabled={exporting}
                  className="btn-json"
                >
                  <i className="fas fa-download"></i> Export
                </button>
              </div>
            </div>

            <div className="export-option">
              <div className="option-icon appointments">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="option-info">
                <h4>Appointments Only</h4>
                <p>Complete appointment history with doctor details</p>
              </div>
              <div className="option-actions">
                <button 
                  onClick={handleExportAppointments}
                  disabled={exporting}
                  className="btn-json"
                >
                  <i className="fas fa-download"></i> Export
                </button>
              </div>
            </div>
          </div>

          {exporting && (
            <div className="export-progress">
              <div className="progress-spinner"></div>
              <span>Preparing your data...</span>
            </div>
          )}

          <div className="export-info">
            <i className="fas fa-shield-alt"></i>
            <div>
              <strong>Your data is secure</strong>
              <p>Exported files contain your personal health information. 
              Keep them safe and don't share with untrusted parties.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDataExport;

/**
 * Uploaded Reports Screen
 * View and manage patient medical reports
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './UploadedReports.css';

const UploadedReports = ({ clinicId, patientId, onClose }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [patientId, filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { patientId };
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await axios.get('/api/medical-files', { params });
      
      if (response.data.success) {
        setReports(response.data.files || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, WebP, and PDF files are allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('clinicId', clinicId);
      formData.append('type', 'lab_report');

      const response = await axios.post('/api/medical-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        fetchReports();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (type, mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    
    const icons = {
      lab_report: '🧪',
      xray: '☢️',
      mri: '🧲',
      ct_scan: '📷',
      prescription: '💊',
      discharge_summary: '📋',
      other: '📎'
    };
    return icons[type] || '📎';
  };

  const getTypeLabel = (type) => {
    const labels = {
      lab_report: 'Lab Report',
      xray: 'X-Ray',
      mri: 'MRI',
      ct_scan: 'CT Scan',
      prescription: 'Prescription',
      discharge_summary: 'Discharge Summary',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="uploaded-reports">
      {/* Header */}
      <div className="reports__header">
        <h2>
          <span className="header-icon">📄</span>
          Medical Reports
        </h2>
        <div className="header-actions">
          <label className="btn-upload">
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? '⏳ Uploading...' : '📤 Upload Report'}
          </label>
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="reports__filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'lab_report' ? 'active' : ''}`}
          onClick={() => setFilter('lab_report')}
        >
          🧪 Lab Reports
        </button>
        <button 
          className={`filter-btn ${filter === 'xray' ? 'active' : ''}`}
          onClick={() => setFilter('xray')}
        >
          ☢️ X-Ray
        </button>
        <button 
          className={`filter-btn ${filter === 'prescription' ? 'active' : ''}`}
          onClick={() => setFilter('prescription')}
        >
          💊 Prescriptions
        </button>
        <button 
          className={`filter-btn ${filter === 'other' ? 'active' : ''}`}
          onClick={() => setFilter('other')}
        >
          📎 Other
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Content */}
      <div className="reports__content">
        {loading ? (
          <div className="reports__loading">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="no-reports">
            <span className="no-reports-icon">📂</span>
            <p>No reports found</p>
            <label className="btn-upload-large">
              <input 
                type="file" 
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleUpload}
              />
              Upload First Report
            </label>
          </div>
        ) : (
          <div className="reports__grid">
            {reports.map((report) => (
              <div 
                key={report._id} 
                className="report-card"
                onClick={() => setSelectedReport(report)}
              >
                <div className="report-preview">
                  {report.mimeType?.includes('image') ? (
                    <img src={report.url} alt={report.name} />
                  ) : (
                    <span className="file-icon">
                      {getFileIcon(report.type, report.mimeType)}
                    </span>
                  )}
                </div>
                <div className="report-info">
                  <h4>{report.name || 'Untitled Report'}</h4>
                  <div className="report-meta">
                    <span className="type-badge">
                      {getTypeLabel(report.type)}
                    </span>
                    <span className="date">{formatDate(report.uploadedAt)}</span>
                  </div>
                  {report.notes && (
                    <p className="report-notes">{report.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="report-modal" onClick={() => setSelectedReport(null)}>
          <div className="report-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedReport.name || 'Report'}</h3>
              <button onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedReport.mimeType?.includes('image') ? (
                <img src={selectedReport.url} alt={selectedReport.name} />
              ) : selectedReport.mimeType?.includes('pdf') ? (
                <iframe 
                  src={selectedReport.url} 
                  title={selectedReport.name}
                  width="100%"
                  height="600px"
                />
              ) : (
                <div className="unsupported-preview">
                  <span>{getFileIcon(selectedReport.type, selectedReport.mimeType)}</span>
                  <p>Preview not available</p>
                  <a href={selectedReport.url} target="_blank" rel="noopener noreferrer">
                    Download File
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="report-details">
                <span>Type: {getTypeLabel(selectedReport.type)}</span>
                <span>Uploaded: {formatDate(selectedReport.uploadedAt)}</span>
              </div>
              <div className="modal-actions">
                <a 
                  href={selectedReport.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-download"
                >
                  📥 Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadedReports;

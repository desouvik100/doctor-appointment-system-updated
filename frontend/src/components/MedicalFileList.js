/**
 * MedicalFileList Component
 * Displays uploaded medical documents with secure viewing
 */

import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const MedicalFileList = ({ 
  patientId = null, 
  appointmentId = null,
  showUploadButton = false,
  onUploadClick
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingFile, setViewingFile] = useState(null);

  const categoryLabels = {
    all: '📁 All Files',
    prescription: '💊 Prescriptions',
    lab_report: '🧪 Lab Reports',
    xray: '🩻 X-Rays',
    mri: '🧠 MRI Scans',
    ct_scan: '📷 CT Scans',
    ultrasound: '🔊 Ultrasounds',
    ecg: '💓 ECG/EKG',
    blood_test: '🩸 Blood Tests',
    other: '📄 Other'
  };

  useEffect(() => {
    fetchFiles();
  }, [patientId, appointmentId, selectedCategory]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let url = '/api/medical-files/my-files';
      const params = new URLSearchParams();
      
      if (patientId) {
        url = `/api/medical-files/patient/${patientId}`;
      } else if (appointmentId) {
        url = `/api/medical-files/appointment/${appointmentId}`;
      }
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await axios.get(`${url}?${params.toString()}`);
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await axios.delete(`/api/medical-files/${fileId}`);
      if (response.data.success) {
        toast.success('File deleted');
        setFiles(files.filter(f => f.id !== fileId));
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (format, category) => {
    if (format === 'pdf') return '📄';
    const icons = {
      prescription: '💊',
      lab_report: '🧪',
      xray: '🩻',
      mri: '🧠',
      ct_scan: '📷',
      ultrasound: '🔊',
      ecg: '💓',
      blood_test: '🩸'
    };
    return icons[category] || '🖼️';
  };

  return (
    <div className="medical-file-list">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px' }}>
          📋 Medical Documents
        </h3>
        
        {showUploadButton && (
          <button
            onClick={onUploadClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ➕ Upload File
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedCategory === key ? '#6366f1' : '#f3f4f6',
              color: selectedCategory === key ? 'white' : '#4b5563',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Files Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Loading files...
        </div>
      ) : files.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
          <p style={{ margin: 0 }}>No files found</p>
          {showUploadButton && (
            <button
              onClick={onUploadClick}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Upload your first file
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {files.map(file => (
            <div
              key={file.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => setViewingFile(file)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Thumbnail */}
              <div style={{
                height: '120px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {file.thumbnail ? (
                  <img 
                    src={file.thumbnail} 
                    alt={file.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '48px' }}>
                    {getFileIcon(file.format, file.category)}
                  </span>
                )}
              </div>

              {/* File Info */}
              <div style={{ padding: '12px' }}>
                <h4 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '14px',
                  color: '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.title}
                </h4>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '12px', 
                  color: '#6b7280' 
                }}>
                  {formatDate(file.createdAt)} • {file.sizeKB} KB
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#eef2ff',
                    color: '#4f46e5',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}>
                    {file.category.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {file.uploadedBy?.role || 'patient'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setViewingFile(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>
                  {viewingFile.title}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {formatDate(viewingFile.createdAt)} • Uploaded by {viewingFile.uploadedBy?.name || viewingFile.uploadedBy?.role}
                </p>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9fafb'
            }}>
              {viewingFile.format === 'pdf' ? (
                <iframe
                  src={viewingFile.url}
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title={viewingFile.title}
                />
              ) : (
                <img
                  src={viewingFile.url}
                  alt={viewingFile.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {viewingFile.description || 'No description'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={viewingFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => handleDelete(viewingFile.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalFileList;

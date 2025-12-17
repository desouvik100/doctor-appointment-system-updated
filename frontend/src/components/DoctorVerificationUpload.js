/**
 * DoctorVerificationUpload Component
 * Upload verification documents (license, degree, ID)
 */

import React, { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const DoctorVerificationUpload = ({ 
  currentDocs = {},
  onUpdate 
}) => {
  const [uploading, setUploading] = useState({});
  const fileInputRefs = {
    license: useRef(null),
    degree: useRef(null),
    id_proof: useRef(null)
  };

  const docTypes = [
    {
      key: 'license',
      label: 'Medical License',
      icon: '📜',
      description: 'Upload your medical registration certificate'
    },
    {
      key: 'degree',
      label: 'Medical Degree',
      icon: '🎓',
      description: 'MBBS, MD, or equivalent degree certificate'
    },
    {
      key: 'id_proof',
      label: 'ID Proof',
      icon: '🪪',
      description: 'Aadhaar, PAN, or government-issued ID'
    }
  ];

  const handleUpload = async (docType, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    setUploading(prev => ({ ...prev, [docType]: true }));
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);

    try {
      const response = await axios.post('/api/upload/verification-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(`${docType.replace('_', ' ')} uploaded for verification`);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fef3c7', color: '#92400e', text: '⏳ Pending Review' },
      approved: { bg: '#dcfce7', color: '#166534', text: '✅ Verified' },
      rejected: { bg: '#fee2e2', color: '#991b1b', text: '❌ Rejected' }
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
        backgroundColor: badge.bg,
        color: badge.color
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="verification-upload">
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>🔐 Verification Documents</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          Upload your documents for verification. This helps build trust with patients.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {docTypes.map(({ key, label, icon, description }) => {
          const doc = currentDocs[key];
          const isUploading = uploading[key];

          return (
            <div
              key={key}
              style={{
                padding: 16,
                backgroundColor: doc ? '#f0fdf4' : '#f9fafb',
                borderRadius: 12,
                border: `1px solid ${doc ? '#bbf7d0' : '#e5e7eb'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{icon}</span>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#374151' }}>{label}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{description}</p>
                    
                    {doc && (
                      <div style={{ marginTop: 8 }}>
                        {getStatusBadge(doc.status)}
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {doc?.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: 13
                      }}
                    >
                      👁️ View
                    </a>
                  )}
                  <button
                    onClick={() => fileInputRefs[key].current?.click()}
                    disabled={isUploading}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: doc ? '#f3f4f6' : '#6366f1',
                      color: doc ? '#374151' : 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontSize: 13
                    }}
                  >
                    {isUploading ? '⏳ Uploading...' : doc ? '🔄 Replace' : '📤 Upload'}
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRefs[key]}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleUpload(key, e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div style={{
        marginTop: 20,
        padding: 12,
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        border: '1px solid #bfdbfe'
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af' }}>
          ℹ️ <strong>Note:</strong> Documents are reviewed within 24-48 hours. 
          Verified doctors get a badge on their profile and appear higher in search results.
        </p>
      </div>
    </div>
  );
};

export default DoctorVerificationUpload;

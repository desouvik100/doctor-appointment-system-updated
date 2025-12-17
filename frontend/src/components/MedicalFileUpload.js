/**
 * MedicalFileUpload Component
 * Secure upload of medical documents (reports, prescriptions, images)
 * Files are stored in Cloudinary, only metadata in database
 */

import React, { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const MedicalFileUpload = ({ 
  patientId = null, 
  appointmentId = null,
  onUploadSuccess,
  allowedCategories = ['prescription', 'lab_report', 'xray', 'mri', 'ct_scan', 'ultrasound', 'ecg', 'blood_test', 'other']
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const categoryLabels = {
    prescription: '💊 Prescription',
    lab_report: '🧪 Lab Report',
    xray: '🩻 X-Ray',
    mri: '🧠 MRI Scan',
    ct_scan: '📷 CT Scan',
    ultrasound: '🔊 Ultrasound',
    ecg: '💓 ECG/EKG',
    blood_test: '🩸 Blood Test',
    other: '📄 Other Document'
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension for title

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('title', title || file.name);
    formData.append('description', description);
    
    if (patientId) formData.append('patientId', patientId);
    if (appointmentId) {
      formData.append('relatedType', 'appointment');
      formData.append('relatedId', appointmentId);
    }

    try {
      const response = await axios.post('/api/medical-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('File uploaded successfully!');
        setFile(null);
        setPreview(null);
        setTitle('');
        setDescription('');
        setCategory('other');
        if (onUploadSuccess) onUploadSuccess(response.data.file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setTitle('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="medical-file-upload" style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#6366f1' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: file ? 'default' : 'pointer',
          backgroundColor: dragActive ? '#eef2ff' : '#f9fafb',
          transition: 'all 0.2s ease'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {file ? (
          <div className="file-preview">
            {preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px', 
                  borderRadius: '8px',
                  marginBottom: '12px'
                }} 
              />
            ) : (
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '12px',
                color: '#6366f1'
              }}>
                📄
              </div>
            )}
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📤</div>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Drop your file here or click to browse
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Supports: JPEG, PNG, GIF, WebP, PDF (Max 10MB)
            </p>
          </>
        )}
      </div>

      {/* File Details Form */}
      {file && (
        <div style={{ marginTop: '20px' }}>
          {/* Category Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Document Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              {allowedCategories.map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Blood Test Report - Dec 2024"
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
              Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any relevant notes about this document..."
              maxLength={1000}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: uploading ? '#9ca3af' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {uploading ? (
              <>
                <span className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #ffffff40',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Uploading...
              </>
            ) : (
              <>
                ☁️ Upload Securely
              </>
            )}
          </button>

          {/* Security Note */}
          <p style={{ 
            marginTop: '12px', 
            fontSize: '12px', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            🔒 Your files are encrypted and stored securely in the cloud
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MedicalFileUpload;

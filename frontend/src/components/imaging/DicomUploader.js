/**
 * DICOM File Uploader Component
 * Allows uploading DICOM files for a patient
 */

import React, { useState, useRef } from 'react';
import './DicomUploader.css';

const DicomUploader = ({ patientId, clinicId, onUploadComplete, onError }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  // Add files to the list
  const addFiles = (newFiles) => {
    const dicomFiles = newFiles.filter(file => 
      file.name.toLowerCase().endsWith('.dcm') || 
      file.name.toLowerCase().endsWith('.dicom') ||
      file.type === 'application/dicom' ||
      !file.name.includes('.') // DICOM files sometimes have no extension
    );

    const skippedFiles = newFiles.length - dicomFiles.length;
    if (skippedFiles > 0) {
      const skippedNames = newFiles
        .filter(f => !dicomFiles.includes(f))
        .map(f => f.name)
        .slice(0, 3)
        .join(', ');
      
      alert(
        `⚠️ ${skippedFiles} file(s) skipped (not DICOM format)\n\n` +
        `Skipped: ${skippedNames}${skippedFiles > 3 ? '...' : ''}\n\n` +
        `Only .dcm and .dicom files are supported.\n` +
        `JPG, PNG, PDF files cannot be uploaded here.\n\n` +
        `💡 Tip: Get DICOM files from your hospital's radiology department.`
      );
    }

    if (dicomFiles.length > 0) {
      setFiles(prev => [...prev, ...dicomFiles]);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select DICOM files to upload');
      return;
    }

    if (!patientId) {
      alert('Patient ID is required');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      if (clinicId) {
        formData.append('clinicId', clinicId);
      }

      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token') || 
                    JSON.parse(localStorage.getItem('user') || '{}').token ||
                    JSON.parse(localStorage.getItem('doctor') || '{}').token;

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setFiles([]);
              setProgress(100);
              if (onUploadComplete) {
                onUploadComplete(response.data);
              }
              alert(`Upload successful! Study ID: ${response.data.studyId}\n${response.data.totalImages} images uploaded.`);
            } else if (response.requiresConfirmation) {
              // Patient mismatch - ask for confirmation
              const confirm = window.confirm(
                `Patient information mismatch detected:\n` +
                `DICOM Patient: ${response.patientValidation?.dicomPatient?.name}\n` +
                `System Patient: ${response.patientValidation?.systemPatient?.name}\n\n` +
                `Do you want to proceed anyway?`
              );
              if (confirm) {
                // Retry with acknowledgment
                formData.append('acknowledgedMismatch', 'true');
                handleUpload();
              }
            } else {
              throw new Error(response.error?.message || 'Upload failed');
            }
          } catch (parseError) {
            console.error('Response parse error:', parseError);
            alert('Upload failed: Invalid server response');
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const errResponse = JSON.parse(xhr.responseText);
            errorMsg = errResponse.error?.message || errorMsg;
          } catch (e) {}
          alert(`Upload failed: ${errorMsg}`);
        }
      });

      xhr.addEventListener('error', () => {
        setUploading(false);
        const error = new Error('Network error during upload');
        if (onError) onError(error);
        alert('Upload failed: Network error. Please check your connection and try again.');
      });

      xhr.addEventListener('timeout', () => {
        setUploading(false);
        alert('Upload timed out. The files may be too large or the server is busy. Try uploading fewer files at once.');
      });

      xhr.open('POST', '/api/imaging/upload');
      xhr.timeout = 300000; // 5 minute timeout for large uploads
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);

    } catch (error) {
      setUploading(false);
      if (onError) onError(error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="dicom-uploader">
      <div className="uploader-header">
        <h3><i className="fas fa-upload"></i> Upload DICOM Files</h3>
        <p className="hint">Supported formats: .dcm, .dicom</p>
      </div>

      {/* Drop Zone */}
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".dcm,.dicom,application/dicom"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div className="drop-zone-content">
          <i className="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop DICOM files here</p>
          <span>or click to browse</span>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <span>{files.length} file(s) selected</span>
            <button 
              className="clear-btn"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear All
            </button>
          </div>
          
          <div className="files">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <i className="fas fa-file-medical"></i>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatSize(file.size)}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}

      {/* Upload Button */}
      <button 
        className="upload-btn"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
      >
        {uploading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Uploading...
          </>
        ) : (
          <>
            <i className="fas fa-upload"></i>
            Upload {files.length > 0 ? `${files.length} File(s)` : 'Files'}
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="upload-instructions">
        <h4>📋 Instructions:</h4>
        <ul>
          <li><strong>Only DICOM files</strong> (.dcm or .dicom) are supported</li>
          <li>❌ JPG, PNG, PDF files are NOT supported</li>
          <li>Files can be from CT, MRI, X-Ray, Ultrasound, etc.</li>
          <li>Maximum 500 files per upload, 100MB per file</li>
        </ul>
        <h4 style={{ marginTop: '16px' }}>💡 How to get DICOM files:</h4>
        <ul>
          <li>Ask your hospital's radiology department for a CD/DVD</li>
          <li>Request digital copy via hospital patient portal</li>
          <li>DICOM files are the original medical scan format</li>
        </ul>
      </div>
    </div>
  );
};

export default DicomUploader;

/**
 * ProfilePhotoUpload Component
 * Upload and manage profile photos with face detection
 */

import React, { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const ProfilePhotoUpload = ({ 
  currentPhoto, 
  onPhotoUpdate,
  size = 120,
  editable = true 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await axios.post('/api/upload/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Profile photo updated!');
        setPreview(null);
        if (onPhotoUpdate) {
          onPhotoUpdate(response.data.photo.url);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove profile photo?')) return;

    try {
      await axios.delete('/api/upload/profile-photo');
      toast.success('Photo removed');
      if (onPhotoUpdate) onPhotoUpdate(null);
    } catch (error) {
      toast.error('Failed to remove photo');
    }
  };

  const displayPhoto = preview || currentPhoto;

  return (
    <div className="profile-photo-upload" style={{ textAlign: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          margin: '0 auto',
          position: 'relative',
          backgroundColor: '#f3f4f6',
          border: '3px solid #e5e7eb',
          cursor: editable ? 'pointer' : 'default'
        }}
        onClick={() => editable && fileInputRef.current?.click()}
      >
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            color: '#9ca3af'
          }}>
            👤
          </div>
        )}

        {/* Upload overlay */}
        {editable && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '4px',
            fontSize: '11px',
            textAlign: 'center'
          }}>
            {uploading ? '⏳' : '📷 Change'}
          </div>
        )}

        {/* Loading spinner */}
        {uploading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 30,
              height: 30,
              border: '3px solid #e5e7eb',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Remove button */}
      {editable && currentPhoto && !uploading && (
        <button
          onClick={handleRemove}
          style={{
            marginTop: 8,
            padding: '4px 12px',
            fontSize: '12px',
            color: '#dc2626',
            backgroundColor: 'transparent',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Remove
        </button>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePhotoUpload;

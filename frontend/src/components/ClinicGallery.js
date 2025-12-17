/**
 * ClinicGallery Component
 * Display and manage clinic photos
 */

import React, { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const ClinicGallery = ({ 
  clinicId, 
  photos = [], 
  logo,
  editable = false,
  onUpdate 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const photoInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('clinicId', clinicId);

    try {
      const response = await axios.post('/api/upload/clinic-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Logo updated!');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('clinicId', clinicId);

    try {
      const response = await axios.post('/api/upload/clinic-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Photo added!');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  return (
    <div className="clinic-gallery">
      {/* Logo Section */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Clinic Logo</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 12,
              backgroundColor: '#f3f4f6',
              border: '2px dashed #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: editable ? 'pointer' : 'default'
            }}
            onClick={() => editable && logoInputRef.current?.click()}
          >
            {logo ? (
              <img src={logo} alt="Clinic Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 32, color: '#9ca3af' }}>🏥</span>
            )}
            {uploadingLogo && (
              <div style={{
                position: 'absolute',
                backgroundColor: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ⏳
              </div>
            )}
          </div>
          {editable && (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              {uploadingLogo ? 'Uploading...' : 'Change Logo'}
            </button>
          )}
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Gallery Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, color: '#374151' }}>Clinic Photos ({photos.length})</h4>
          {editable && (
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              {uploading ? '⏳ Uploading...' : '➕ Add Photo'}
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <div style={{
            padding: 40,
            backgroundColor: '#f9fafb',
            borderRadius: 12,
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <span style={{ fontSize: 48 }}>📷</span>
            <p>No photos yet</p>
            {editable && <p style={{ fontSize: 13 }}>Add photos to showcase your clinic</p>}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12
          }}>
            {photos.map((photo, index) => (
              <div
                key={index}
                style={{
                  aspectRatio: '4/3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setViewingPhoto(photo)}
              >
                <img
                  src={photo.thumbnail || photo.url}
                  alt={`Clinic photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setViewingPhoto(null)}
        >
          <button
            onClick={() => setViewingPhoto(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              fontSize: 20,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
          <img
            src={viewingPhoto.url}
            alt="Clinic"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ClinicGallery;

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import './UserAvatar.css';

/**
 * UserAvatar Component
 * Displays user profile picture with fallback options
 */
const UserAvatar = ({ 
  user, 
  size = 'medium', 
  showName = false, 
  showEmail = false,
  editable = false,
  onUpload = null 
}) => {
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Size mapping
  const sizeMap = {
    small: 40,
    medium: 80,
    large: 120,
    xlarge: 160
  };

  const pixelSize = sizeMap[size] || 80;

  // Generate avatar URL
  const getAvatarUrl = () => {
    if (!user) {
      return `https://ui-avatars.com/api/?name=User&size=${pixelSize}&background=667eea&color=fff`;
    }

    // If user uploaded a photo
    if (user.profilePhoto && !imageError) {
      return user.profilePhoto;
    }

    // Use Gravatar with email
    if (user.email) {
      const email = user.email.toLowerCase().trim();
      // Simple hash for Gravatar (in production, use crypto-js or md5)
      const hash = btoa(email); // Base64 encoding as simple alternative
      
      // Use UI Avatars as fallback with user initials
      const initials = user.name 
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();
      
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${pixelSize}&background=667eea&color=fff&bold=true`;
    }

    // Final fallback
    return `https://ui-avatars.com/api/?name=User&size=${pixelSize}&background=667eea&color=fff`;
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 or upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onUpload) {
          onUpload(reader.result);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setUploading(false);
    }
  };

  return (
    <div className={`user-avatar-container ${size}`}>
      <div className="user-avatar-wrapper">
        <img
          src={getAvatarUrl()}
          alt={user?.name || 'User'}
          className="user-avatar-image"
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
          style={{
            width: pixelSize,
            height: pixelSize
          }}
        />
        
        {editable && (
          <div className="avatar-upload-overlay">
            <label htmlFor="avatar-upload" className="avatar-upload-label">
              {uploading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-camera"></i>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>
        )}
      </div>

      {(showName || showEmail) && user && (
        <div className="user-avatar-info">
          {showName && user.name && (
            <div className="user-avatar-name">{user.name}</div>
          )}
          {showEmail && user.email && (
            <div className="user-avatar-email">{user.email}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

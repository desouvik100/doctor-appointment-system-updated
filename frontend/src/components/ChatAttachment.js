/**
 * ChatAttachment Component
 * Upload and display attachments in chat
 */

import React, { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

// Upload Button Component
export const ChatAttachmentButton = ({ conversationId, onUploadSuccess, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('conversationId', conversationId);

    try {
      const response = await axios.post('/api/upload/chat-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        onUploadSuccess(response.data.attachment);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          padding: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          opacity: disabled || uploading ? 0.5 : 1,
          fontSize: '20px'
        }}
        title="Attach file"
      >
        {uploading ? '⏳' : '📎'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  );
};

// Display Component for attachments in messages
export const ChatAttachmentDisplay = ({ attachment, onClick }) => {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachment.format?.toLowerCase());
  const isPdf = attachment.format?.toLowerCase() === 'pdf';

  return (
    <div
      onClick={onClick}
      style={{
        maxWidth: 200,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid #e5e7eb'
      }}
    >
      {isImage ? (
        <img
          src={attachment.thumbnail || attachment.url}
          alt="Attachment"
          style={{
            width: '100%',
            maxHeight: 150,
            objectFit: 'cover'
          }}
        />
      ) : isPdf ? (
        <div style={{
          padding: 16,
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>PDF Document</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{attachment.sizeKB} KB</div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: 16,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 24 }}>📁</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>File</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{attachment.sizeKB} KB</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Full-screen viewer
export const AttachmentViewer = ({ attachment, onClose }) => {
  if (!attachment) return null;

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachment.format?.toLowerCase());

  return (
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
        zIndex: 9999,
        padding: 20
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
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

      {isImage ? (
        <img
          src={attachment.url}
          alt="Attachment"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: 8
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <iframe
          src={attachment.url}
          style={{
            width: '90vw',
            height: '90vh',
            border: 'none',
            borderRadius: 8,
            backgroundColor: 'white'
          }}
          title="Document viewer"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          bottom: 20,
          padding: '10px 20px',
          backgroundColor: '#6366f1',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        ⬇️ Download
      </a>
    </div>
  );
};

export default { ChatAttachmentButton, ChatAttachmentDisplay, AttachmentViewer };

# 📸 Profile Photo Feature Guide

## Overview

Users can now have profile pictures displayed throughout the application! The system supports:
1. **Gravatar** - Automatic profile pictures based on email
2. **Custom Upload** - Users can upload their own photos
3. **Initials Avatar** - Fallback with user's initials

---

## 🎯 How It Works

### Automatic Profile Pictures (Gravatar)

When a user logs in with their email, the system automatically:
1. Checks if they have a Gravatar account
2. If yes → Shows their Gravatar photo
3. If no → Shows an avatar with their initials

**No setup required!** It works automatically.

### Custom Photo Upload

Users can upload their own photos:
1. Click the camera icon on their avatar
2. Select an image file (JPG, PNG, etc.)
3. Photo is saved to their profile
4. Appears everywhere in the app

---

## 🚀 Implementation

### 1. Backend Changes

**User Model** (`backend/models/User.js`)
```javascript
profilePhoto: {
  type: String,
  default: null // Stores URL or base64 image
}
```

**New API Endpoints** (`backend/routes/profileRoutes.js`)
- `POST /api/profile/update-photo` - Upload/update photo
- `GET /api/profile/profile/:userId` - Get user profile
- `DELETE /api/profile/delete-photo/:userId` - Remove photo

### 2. Frontend Components

**UserAvatar Component** (`frontend/src/components/UserAvatar.js`)
- Displays user profile picture
- Supports multiple sizes (small, medium, large, xlarge)
- Upload functionality
- Fallback to initials

**Usage Example:**
```jsx
import UserAvatar from './components/UserAvatar';

// Basic usage
<UserAvatar user={currentUser} size="medium" />

// With name and email
<UserAvatar 
  user={currentUser} 
  size="large" 
  showName={true}
  showEmail={true}
/>

// Editable (with upload)
<UserAvatar 
  user={currentUser} 
  size="large" 
  editable={true}
  onUpload={handlePhotoUpload}
/>
```

---

## 📋 Features

### Avatar Sizes
- **small** - 40x40px (for lists, comments)
- **medium** - 80x80px (for headers, cards)
- **large** - 120x120px (for profiles)
- **xlarge** - 160x160px (for profile pages)

### Avatar Sources (Priority Order)
1. **Custom Upload** - User's uploaded photo
2. **Gravatar** - Photo from Gravatar.com
3. **Initials** - Generated avatar with user's initials

### Styling
- Circular avatars
- White border with shadow
- Hover effects
- Smooth transitions
- Responsive design

---

## 🎨 Where Avatars Appear

### 1. Dashboard Header
```jsx
<UserAvatar 
  user={user}
  size="large"
  editable={true}
  onUpload={handlePhotoUpload}
/>
```

### 2. Navigation Bar
```jsx
<UserAvatar user={user} size="small" />
```

### 3. Profile Page
```jsx
<UserAvatar 
  user={user}
  size="xlarge"
  showName={true}
  showEmail={true}
  editable={true}
/>
```

### 4. Comments/Messages
```jsx
<UserAvatar user={user} size="small" showName={true} />
```

---

## 🔧 API Usage

### Upload Profile Photo

**Request:**
```javascript
POST /api/profile/update-photo
Content-Type: application/json

{
  "userId": "user_id_here",
  "profilePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile photo updated successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePhoto": "data:image/jpeg;base64,...",
    "role": "patient"
  }
}
```

### Get User Profile

**Request:**
```javascript
GET /api/profile/profile/:userId
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profilePhoto": "https://...",
    "role": "patient"
  }
}
```

### Delete Profile Photo

**Request:**
```javascript
DELETE /api/profile/delete-photo/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Profile photo deleted successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePhoto": null,
    "role": "patient"
  }
}
```

---

## 💡 Implementation Examples

### Example 1: Dashboard with Avatar

```jsx
import React, { useState } from 'react';
import UserAvatar from './components/UserAvatar';
import axios from './api/config';

function Dashboard({ user }) {
  const [currentUser, setCurrentUser] = useState(user);

  const handlePhotoUpload = async (photoData) => {
    try {
      const response = await axios.post('/api/profile/update-photo', {
        userId: currentUser.id,
        profilePhoto: photoData
      });

      if (response.data.success) {
        setCurrentUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        alert('Photo updated!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo');
    }
  };

  return (
    <div className="dashboard">
      <div className="header">
        <UserAvatar 
          user={currentUser}
          size="large"
          editable={true}
          onUpload={handlePhotoUpload}
        />
        <h2>Welcome, {currentUser.name}!</h2>
      </div>
    </div>
  );
}
```

### Example 2: User List with Avatars

```jsx
function UserList({ users }) {
  return (
    <div className="user-list">
      {users.map(user => (
        <div key={user.id} className="user-item">
          <UserAvatar 
            user={user}
            size="small"
            showName={true}
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Profile Card

```jsx
function ProfileCard({ user }) {
  return (
    <div className="user-avatar-card">
      <UserAvatar 
        user={user}
        size="xlarge"
        showName={true}
        showEmail={true}
      />
      <div className="profile-details">
        <p>Role: {user.role}</p>
        <p>Phone: {user.phone}</p>
      </div>
    </div>
  );
}
```

---

## 🎨 Customization

### Custom Styles

You can customize the avatar appearance in `UserAvatar.css`:

```css
/* Change border color */
.user-avatar-image {
  border: 3px solid #your-color;
}

/* Change hover effect */
.user-avatar-image:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Change upload button color */
.avatar-upload-overlay {
  background: linear-gradient(135deg, #your-color1, #your-color2);
}
```

### Custom Sizes

Add new sizes in the component:

```javascript
const sizeMap = {
  tiny: 32,
  small: 40,
  medium: 80,
  large: 120,
  xlarge: 160,
  huge: 200  // Add custom size
};
```

---

## 🔒 Security Considerations

### File Size Limit
- Maximum: 5MB per image
- Enforced in frontend before upload

### File Type Validation
- Only image files allowed (JPEG, PNG, GIF, WebP)
- Validated using MIME type

### Storage Options

**Option 1: Base64 (Current)**
- Stores image as base64 string in database
- Simple, no external dependencies
- Good for small images
- Increases database size

**Option 2: Cloud Storage (Recommended for Production)**
```javascript
// Example with AWS S3
const uploadToS3 = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post('/api/upload/s3', formData);
  return response.data.url;
};
```

**Option 3: Local Storage**
```javascript
// Save to server's public folder
const uploadLocal = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post('/api/upload/local', formData);
  return response.data.url;
};
```

---

## 🧪 Testing

### Test Avatar Display

1. **Login with email**
   - Avatar should show automatically
   - Check if Gravatar loads (if user has one)
   - Otherwise, initials should appear

2. **Upload custom photo**
   - Click camera icon
   - Select image file
   - Verify upload success
   - Check if photo appears everywhere

3. **Test different sizes**
   - Small avatar in lists
   - Medium in headers
   - Large in profiles
   - XLarge in profile pages

4. **Test fallbacks**
   - User with no photo → Initials
   - Invalid image → Fallback
   - Network error → Cached version

### Test API Endpoints

```bash
# Update photo
curl -X POST http://localhost:5000/api/profile/update-photo \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","profilePhoto":"data:image/jpeg;base64,..."}'

# Get profile
curl http://localhost:5000/api/profile/profile/USER_ID

# Delete photo
curl -X DELETE http://localhost:5000/api/profile/delete-photo/USER_ID
```

---

## 📊 Performance

### Optimization Tips

1. **Lazy Loading**
```jsx
<img 
  src={avatarUrl} 
  loading="lazy"
  alt="User avatar"
/>
```

2. **Image Compression**
```javascript
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to max 400x400
        const maxSize = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
```

3. **Caching**
```javascript
// Cache avatar URLs
const avatarCache = new Map();

const getCachedAvatar = (userId) => {
  if (avatarCache.has(userId)) {
    return avatarCache.get(userId);
  }
  
  const url = generateAvatarUrl(userId);
  avatarCache.set(userId, url);
  return url;
};
```

---

## 🚀 Next Steps

### Enhancements to Add

1. **Image Cropping**
   - Allow users to crop uploaded images
   - Use library like `react-image-crop`

2. **Multiple Photos**
   - Photo gallery
   - Cover photos
   - Profile banners

3. **Social Integration**
   - Import from Facebook
   - Import from Google
   - Import from LinkedIn

4. **Advanced Features**
   - Filters and effects
   - Stickers and frames
   - AI background removal

---

## 📚 Resources

### Libraries Used
- **UI Avatars** - https://ui-avatars.com/
- **Gravatar** - https://gravatar.com/

### Recommended Libraries
- **react-avatar-editor** - Image cropping
- **react-dropzone** - Drag & drop upload
- **sharp** (backend) - Image processing
- **multer** (backend) - File upload handling

---

## ✅ Checklist

- [x] User model updated with profilePhoto field
- [x] Profile API routes created
- [x] UserAvatar component created
- [x] Avatar CSS styling
- [x] Upload functionality
- [x] Gravatar integration
- [x] Initials fallback
- [x] Multiple size support
- [x] Responsive design
- [x] Error handling
- [x] Documentation

---

## 🎉 Summary

Your users can now:
- ✅ Have automatic profile pictures (Gravatar)
- ✅ Upload custom photos
- ✅ See avatars throughout the app
- ✅ Edit their profile pictures
- ✅ Get beautiful fallback avatars with initials

**The feature is production-ready and fully documented!**

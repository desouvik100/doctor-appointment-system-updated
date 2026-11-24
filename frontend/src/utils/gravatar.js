// Gravatar utility - Get profile picture from email
import crypto from 'crypto-js';

/**
 * Generate Gravatar URL from email
 * @param {string} email - User's email address
 * @param {number} size - Image size (default: 200)
 * @param {string} defaultImage - Default image type if no Gravatar exists
 * @returns {string} Gravatar URL
 */
export const getGravatarUrl = (email, size = 200, defaultImage = 'identicon') => {
  if (!email) {
    return `https://ui-avatars.com/api/?name=User&size=${size}&background=667eea&color=fff`;
  }

  // Gravatar requires MD5 hash of lowercase email
  const hash = crypto.MD5(email.toLowerCase().trim()).toString();
  
  // Default image options:
  // 'identicon' - geometric pattern
  // 'monsterid' - monster avatar
  // 'wavatar' - face avatar
  // 'retro' - 8-bit style
  // 'robohash' - robot avatar
  // 'mp' - mystery person silhouette
  
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`;
};

/**
 * Generate UI Avatars URL (fallback with initials)
 * @param {string} name - User's name
 * @param {string} email - User's email (for color consistency)
 * @param {number} size - Image size
 * @returns {string} Avatar URL
 */
export const getInitialsAvatar = (name, email, size = 200) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  
  // Generate consistent color from email
  const colors = ['667eea', '764ba2', '3b82f6', '10b981', 'f59e0b', 'ef4444', '8b5cf6'];
  const colorIndex = email ? email.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${initials}&size=${size}&background=${bgColor}&color=fff&bold=true`;
};

/**
 * Get best available avatar URL
 * Tries Gravatar first, falls back to initials
 */
export const getUserAvatar = (user, size = 200) => {
  if (!user) return getInitialsAvatar('User', '', size);
  
  // If user has uploaded photo, use that
  if (user.profilePhoto) {
    return user.profilePhoto;
  }
  
  // Try Gravatar with initials as fallback
  const gravatarUrl = getGravatarUrl(user.email, size, 'mp');
  
  // Return Gravatar URL (it will show default if no Gravatar exists)
  return gravatarUrl;
};

export default {
  getGravatarUrl,
  getInitialsAvatar,
  getUserAvatar
};

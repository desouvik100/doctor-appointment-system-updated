import { useState, useRef } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const UserProfileModal = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePhoto: user?.profilePhoto || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || '');
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
      setProfileData(prev => ({ ...prev, profilePhoto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      await axios.delete(`/api/profile/delete-photo/${userId}`);
      setPreviewPhoto('');
      setProfileData(prev => ({ ...prev, profilePhoto: '' }));
      toast.success('Photo removed');
      if (onUpdate) {
        const updatedUser = { ...user, profilePhoto: '' };
        onUpdate(updatedUser);
      }
    } catch (error) {
      toast.error('Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Saving profile for userId:', userId);

      // Use the combined profile update endpoint
      const updatePayload = {
        name: profileData.name,
        phone: profileData.phone
      };

      // Only include photo if it changed
      if (profileData.profilePhoto && profileData.profilePhoto !== user?.profilePhoto) {
        updatePayload.profilePhoto = profileData.profilePhoto;
      }

      const response = await axios.put(`/api/profile/update/${userId}`, updatePayload);

      if (response.data.success) {
        // Update local storage with the response data
        const updatedUser = {
          ...user,
          ...response.data.user,
          id: response.data.user.id || response.data.user._id
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (onUpdate) onUpdate(updatedUser);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/auth/reset-password', {
        email: user?.email,
        otp: 'skip', // For logged-in users, we might skip OTP
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    return (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-user-cog"></i> Account Settings
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'profile', icon: 'fa-user', label: 'Profile' },
            { id: 'security', icon: 'fa-lock', label: 'Security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-100">
                      {getUserInitials()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-colors"
                  >
                    <i className="fas fa-camera text-sm"></i>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Change Photo
                  </button>
                  {previewPhoto && (
                    <>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={handleRemovePhoto}
                        className="text-sm text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-shield-alt text-amber-500 mt-0.5"></i>
                  <div>
                    <h4 className="font-medium text-amber-800">Password Security</h4>
                    <p className="text-sm text-amber-600">Use a strong password with at least 6 characters</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Updating...</> : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

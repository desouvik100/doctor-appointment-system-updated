/**
 * useProfile — User profile management hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useProfile = (userId) => {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/users/me');
      setProfile(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    setSaving(true);
    try {
      const res = await axios.put('/api/users/profile', updates);
      const updated = res.data?.user || res.data;
      setProfile(prev => ({ ...prev, ...updated }));

      // Sync to localStorage
      const storageKey = profile?.role === 'admin' ? 'admin'
        : profile?.role === 'doctor' ? 'doctor'
        : profile?.role === 'receptionist' || profile?.role === 'clinic' ? 'receptionist'
        : 'user';

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem(storageKey, JSON.stringify({ ...parsed, ...updated }));
        } catch { /* ignore */ }
      }

      toast.success('Profile updated successfully');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile?.role]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setSaving(true);
    try {
      await axios.put('/api/users/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const uploadPhoto = useCallback(async (file) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await axios.post('/api/upload/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const photoUrl = res.data?.url || res.data?.profilePhoto;
      if (photoUrl) {
        setProfile(prev => ({ ...prev, profilePhoto: photoUrl }));
      }
      toast.success('Photo updated successfully');
      return photoUrl;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload photo');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  return {
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadPhoto,
    refresh: fetchProfile,
  };
};

export default useProfile;

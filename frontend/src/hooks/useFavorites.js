/**
 * useFavorites — Favorite doctors management hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useFavorites = (userId) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/favorites');
      const data = res.data;
      setFavorites(data?.favorites || data?.doctors || (Array.isArray(data) ? data : []));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [userId]);

  const addFavorite = useCallback(async (doctorId) => {
    try {
      await axios.post('/api/favorites', { doctorId });
      setFavorites(prev => [...prev, { _id: doctorId }]);
      toast.success('Added to favorites');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add favorite');
      return false;
    }
  }, []);

  const removeFavorite = useCallback(async (doctorId) => {
    try {
      await axios.delete(`/api/favorites/${doctorId}`);
      setFavorites(prev => prev.filter(f => (f._id || f) !== doctorId));
      toast.success('Removed from favorites');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove favorite');
      return false;
    }
  }, []);

  const toggleFavorite = useCallback(async (doctorId) => {
    const isFav = favorites.some(f => (f._id || f) === doctorId);
    if (isFav) return removeFavorite(doctorId);
    return addFavorite(doctorId);
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((doctorId) => {
    return favorites.some(f => (f._id || f) === doctorId);
  }, [favorites]);

  useEffect(() => {
    if (userId) fetchFavorites();
  }, [userId, fetchFavorites]);

  return {
    favorites,
    loading,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
};

export default useFavorites;

/**
 * useReviews — Doctor reviews and ratings hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useReviews = (doctorId) => {
  const [reviews, setReviews]     = useState([]);
  const [stats, setStats]         = useState({ average: 0, total: 0, distribution: {} });
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async (page = 1) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/reviews/doctor/${doctorId}`, {
        params: { page, limit: 10 }
      });
      const data = res.data;
      setReviews(data?.reviews || data?.data || (Array.isArray(data) ? data : []));
      if (data?.stats || data?.averageRating !== undefined) {
        setStats({
          average: data.stats?.average || data.averageRating || 0,
          total:   data.stats?.total   || data.totalReviews  || 0,
          distribution: data.stats?.distribution || {},
        });
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [doctorId]);

  const submitReview = useCallback(async (appointmentId, rating, comment) => {
    setSubmitting(true);
    try {
      await axios.post('/api/reviews', { appointmentId, doctorId, rating, comment });
      toast.success('Review submitted successfully');
      await fetchReviews();
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [doctorId, fetchReviews]);

  useEffect(() => {
    if (doctorId) fetchReviews();
  }, [doctorId, fetchReviews]);

  return {
    reviews,
    stats,
    loading,
    submitting,
    fetchReviews,
    submitReview,
    averageRating: stats.average,
    totalReviews:  stats.total,
  };
};

export default useReviews;

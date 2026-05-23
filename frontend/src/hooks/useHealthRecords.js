/**
 * useHealthRecords — Medical records, prescriptions, and lab reports hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const useHealthRecords = (userId) => {
  const [prescriptions, setPrescriptions]   = useState([]);
  const [labReports, setLabReports]         = useState([]);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [vitals, setVitals]                 = useState([]);
  const [timeline, setTimeline]             = useState([]);
  const [loading, setLoading]               = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [rxRes, labRes, historyRes] = await Promise.allSettled([
        axios.get('/api/prescriptions'),
        axios.get('/api/lab-reports'),
        axios.get(`/api/health/medical-history/${userId}`),
      ]);

      if (rxRes.status === 'fulfilled') {
        const data = rxRes.value.data;
        setPrescriptions(data?.prescriptions || data?.data || (Array.isArray(data) ? data : []));
      }
      if (labRes.status === 'fulfilled') {
        const data = labRes.value.data;
        setLabReports(data?.reports || data?.data || (Array.isArray(data) ? data : []));
      }
      if (historyRes.status === 'fulfilled') {
        setMedicalHistory(historyRes.value.data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [userId]);

  const fetchVitals = useCallback(async (type = null, dateRange = null) => {
    if (!userId) return;
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (dateRange) params.append('dateRange', dateRange);
      const res = await axios.get(`/api/health/vitals/${userId}?${params}`);
      setVitals(res.data?.vitals || []);
    } catch { /* silent */ }
  }, [userId]);

  const addVital = useCallback(async (vitalData) => {
    try {
      const res = await axios.post(`/api/health/vitals/${userId}`, vitalData);
      toast.success('Vital recorded successfully');
      await fetchVitals();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record vital');
      return null;
    }
  }, [userId, fetchVitals]);

  const fetchTimeline = useCallback(async (filter = 'all') => {
    if (!userId) return;
    try {
      const res = await axios.get(`/api/health/timeline/${userId}?filter=${filter}`);
      setTimeline(res.data?.events || []);
    } catch { /* silent */ }
  }, [userId]);

  const updateMedicalHistory = useCallback(async (data) => {
    try {
      await axios.put(`/api/health/medical-history/${userId}`, data);
      setMedicalHistory(prev => ({ ...prev, ...data }));
      toast.success('Medical history updated');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update medical history');
      return false;
    }
  }, [userId]);

  const uploadReport = useCallback(async (file, metadata = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));

      const res = await axios.post('/api/lab-reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded successfully');
      await fetchAll();
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload report');
      return null;
    }
  }, [fetchAll]);

  useEffect(() => {
    if (userId) {
      fetchAll();
      fetchVitals();
      fetchTimeline();
    }
  }, [userId, fetchAll, fetchVitals, fetchTimeline]);

  return {
    prescriptions,
    labReports,
    medicalHistory,
    vitals,
    timeline,
    loading,
    fetchAll,
    fetchVitals,
    addVital,
    fetchTimeline,
    updateMedicalHistory,
    uploadReport,
    refresh: fetchAll,
  };
};

export default useHealthRecords;

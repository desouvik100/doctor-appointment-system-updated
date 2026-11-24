/**
 * useDoctors — Doctor search and listing hook
 */
import { useState, useCallback, useEffect } from 'react';
import axios from '../api/config';
import { useDebounce } from './useDebounce';

export const useDoctors = (initialFilters = {}) => {
  const [doctors, setDoctors]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [total, setTotal]             = useState(0);
  const [specializations, setSpecializations] = useState([]);
  const [filters, setFilters]         = useState({
    search: '',
    specialization: '',
    city: '',
    minFee: '',
    maxFee: '',
    availability: '',
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters,
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  const fetchDoctors = useCallback(async (overrideFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const activeFilters = { ...filters, ...overrideFilters, search: debouncedSearch };

      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          params.append(key, val);
        }
      });

      const res = await axios.get(`/api/doctors?${params.toString()}`);
      const data = res.data;
      const list = data?.doctors || data?.data || (Array.isArray(data) ? data : []);
      setDoctors(list);
      setTotal(data?.total || list.length);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  const fetchSpecializations = useCallback(async () => {
    try {
      const res = await axios.get('/api/doctors/specializations/list');
      setSpecializations(res.data || []);
    } catch { /* silent */ }
  }, []);

  const getDoctorById = useCallback(async (doctorId) => {
    try {
      const res = await axios.get(`/api/doctors/${doctorId}`);
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Doctor not found');
    }
  }, []);

  const getDoctorAvailability = useCallback(async (doctorId, date) => {
    try {
      const res = await axios.get(`/api/doctors/${doctorId}/available-slots?date=${date}`);
      return res.data;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to get availability');
    }
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      specialization: '',
      city: '',
      minFee: '',
      maxFee: '',
      availability: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, []);

  // Fetch when debounced search or filters change
  useEffect(() => {
    fetchDoctors();
  }, [debouncedSearch, filters.specialization, filters.city, filters.availability, filters.sortBy]);

  // Fetch specializations once
  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  return {
    doctors,
    loading,
    error,
    total,
    filters,
    specializations,
    updateFilter,
    resetFilters,
    fetchDoctors,
    getDoctorById,
    getDoctorAvailability,
    refresh: fetchDoctors,
  };
};

export default useDoctors;

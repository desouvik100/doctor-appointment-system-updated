import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "../api/config";
import BookAppointment from "./BookAppointment";

// Custom hook for debounced value
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function DoctorList({ user }) {
  // State
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [clinics, setClinics] = useState([]);
  const [summary, setSummary] = useState(null);

  // Debounced search term (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch data only once on mount
  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    fetchSummary();
  }, []);

  // Show filter loading when search changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setFilterLoading(true);
    } else {
      setFilterLoading(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/api/doctors");
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await axios.get("/api/clinics");
      setClinics(response.data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/api/doctors/summary");
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  // Memoized filtered doctors - only recalculates when dependencies change
  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchLower) ||
        doctor.specialization.toLowerCase().includes(searchLower) ||
        doctor.email.toLowerCase().includes(searchLower)
      );
    }

    // Specialization filter
    if (filterSpecialization) {
      filtered = filtered.filter(doctor =>
        doctor.specialization.toLowerCase() === filterSpecialization.toLowerCase()
      );
    }

    // Clinic filter
    if (filterClinic) {
      filtered = filtered.filter(doctor =>
        doctor.clinicId?._id === filterClinic || doctor.clinicId === filterClinic
      );
    }

    return filtered;
  }, [doctors, debouncedSearchTerm, filterSpecialization, filterClinic]);

  // Memoized unique specializations
  const uniqueSpecializations = useMemo(() => {
    const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];
    return specializations.sort();
  }, [doctors]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setFilterSpecialization("");
    setFilterClinic("");
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || filterSpecialization || filterClinic;

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBooking(true);
  };

  const handleBookingSuccess = () => {
    setShowBooking(false);
    setSelectedDoctor(null);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading doctors...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      {summary && (
        <div className="mb-3">
          <div className="d-flex gap-2 flex-wrap">
            <span className="badge bg-primary fs-6 px-3 py-2">
              <i className="fas fa-user-md me-2"></i>
              {summary.totalDoctors} Doctors
            </span>
            <span className="badge bg-success fs-6 px-3 py-2">
              <i className="fas fa-check-circle me-2"></i>
              {summary.availableDoctors} Available
            </span>
            <span className="badge bg-info fs-6 px-3 py-2">
              <i className="fas fa-stethoscope me-2"></i>
              {summary.bySpecialization.length} Specializations
            </span>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i className="fas fa-filter me-2"></i>
              Find Your Doctor
            </h5>
            {hasActiveFilters && (
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleResetFilters}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                <i className="fas fa-search me-1"></i>
                Search Doctors
              </label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., 'Cardiologist', 'Dr. Smith', or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {filterLoading && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Searching...</span>
                    </div>
                  </div>
                )}
              </div>
              {filterLoading && (
                <small className="text-muted">
                  <i className="fas fa-sync fa-spin me-1"></i>
                  Updating results...
                </small>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fas fa-stethoscope me-1"></i>
                Specialization
              </label>
              <select
                className="form-select"
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
              >
                <option value="">All Specializations</option>
                {uniqueSpecializations.map((spec, index) => (
                  <option key={index} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <i className="fas fa-clinic-medical me-1"></i>
                Clinic
              </label>
              <select
                className="form-select"
                value={filterClinic}
                onChange={(e) => setFilterClinic(e.target.value)}
              >
                <option value="">All Clinics</option>
                {clinics.map((clinic) => (
                  <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">
          <i className="fas fa-user-md me-2 text-primary"></i>
          Available Doctors ({filteredDoctors.length})
        </h4>
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && (
        <div className="card shadow-sm text-center py-5">
          <div className="card-body">
            <div className="mb-4">
              <i className="fas fa-user-md text-muted" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
            </div>
            <h3 className="mb-3">No doctors match your search</h3>
            <p className="text-muted mb-4">
              We couldn't find any doctors matching your current filters.
              <br />
              Try adjusting your search criteria or clearing the filters.
            </p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              {hasActiveFilters && (
                <button 
                  className="btn btn-primary"
                  onClick={handleResetFilters}
                >
                  <i className="fas fa-redo me-2"></i>
                  Reset Filters
                </button>
              )}
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setFilterSpecialization("");
                  setFilterClinic("");
                }}
              >
                <i className="fas fa-filter me-2"></i>
                Try Another Clinic/Specialization
              </button>
            </div>
            <div className="mt-4">
              <small className="text-muted">
                <i className="fas fa-lightbulb me-1"></i>
                <strong>Tip:</strong> Try searching by doctor name, specialization, or email
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Cards */}
      <div className="row g-3">
        {filteredDoctors.map((doctor) => (
          <div key={doctor._id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm hover-shadow">
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <div className="doctor-avatar me-3">
                    <i className="fas fa-user-md fa-2x text-primary"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{doctor.name}</h5>
                    <p className="text-muted mb-1">
                      <i className="fas fa-stethoscope me-1"></i>
                      {doctor.specialization}
                    </p>
                    {doctor.clinicId && (
                      <p className="text-muted small mb-0">
                        <i className="fas fa-clinic-medical me-1"></i>
                        {doctor.clinicId.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">
                      <i className="fas fa-graduation-cap me-1"></i>
                      {doctor.qualification || 'MBBS'}
                    </span>
                    <span className="text-muted small">
                      <i className="fas fa-clock me-1"></i>
                      {doctor.experience || 0}+ years
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">
                      <i className="fas fa-rupee-sign me-1"></i>
                      ₹{doctor.consultationFee || 500}
                    </span>
                    <span className={`badge ${doctor.availability === 'Available' ? 'bg-success' : 'bg-warning'}`}>
                      {doctor.availability || 'Available'}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-100"
                  onClick={() => handleBookAppointment(doctor)}
                >
                  <i className="fas fa-calendar-plus me-2"></i>
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBooking && selectedDoctor && (
        <BookAppointment
          doctor={selectedDoctor}
          user={user}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

export default DoctorList;

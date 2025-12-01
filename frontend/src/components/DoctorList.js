import React, { useState, useEffect } from "react";
import axios from "../api/config";
import BookAppointment from "./BookAppointment";
import DoctorRecommendationBadge from "./DoctorRecommendationBadge";
import './DoctorList.css';

function DoctorList({ user }) {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, filterSpecialization, filterClinic]);

  const fetchDoctors = async () => {
    try {
      console.log("Fetching doctors...");
      const response = await axios.get("/api/doctors");
      console.log("Doctors fetched:", response.data);
      setDoctors(response.data);
      setFilteredDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      console.log("Fetching clinics...");
      const response = await axios.get("/api/clinics");
      console.log("Clinics fetched:", response.data);
      setClinics(response.data);
    } catch (error) {
      console.error("Error fetching clinics:", error);
      console.error("Error details:", error.response?.data || error.message);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
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

    // AI-powered sorting: recommended doctors first
    filtered = filtered.sort((a, b) => {
      const aScore = getDoctorRecommendationScore(a);
      const bScore = getDoctorRecommendationScore(b);
      return bScore - aScore;
    });

    setFilteredDoctors(filtered);
  };

  const getDoctorRecommendationScore = (doctor) => {
    let score = 0;
    // Add scoring logic based on various factors
    if (doctor.experience > 10) score += 30;
    if (doctor.rating >= 4.5) score += 25;
    if (doctor.availableToday) score += 20;
    if (doctor.bookingCount > 100) score += 15;
    return score;
  };

  const getDoctorRecommendationType = (doctor, index) => {
    if (index === 0 && getDoctorRecommendationScore(doctor) > 50) return 'recommended';
    if (doctor.availableToday) return 'fastest';
    if (doctor.bookingCount > 100) return 'mostBooked';
    if (doctor.rating >= 4.8) return 'topRated';
    if (doctor.experience > 10) return 'experienced';
    return null;
  };

  const getUniqueSpecializations = () => {
    const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];
    return specializations.sort();
  };

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
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                <i className="fas fa-search me-1"></i>
                Search Doctors
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, specialization, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                {getUniqueSpecializations().map((spec, index) => (
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
          {(searchTerm || filterSpecialization || filterClinic) && (
            <div className="mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSpecialization("");
                  setFilterClinic("");
                }}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </button>
              <span className="ms-2 text-muted small">
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-user-md me-2"></i>
            Available Doctors {filteredDoctors.length !== doctors.length && `(${filteredDoctors.length} found)`}
          </h5>
        </div>
        <div className="card-body">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
              <p className="text-muted">No doctors available at the moment.</p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredDoctors.map((doctor, index) => {
                const recommendationType = getDoctorRecommendationType(doctor, index);
                return (
                <div key={doctor._id} className="col-md-6 col-lg-4">
                  <div className={`card h-100 shadow-sm ${recommendationType ? 'border-2' : 'border-0'}`}
                    style={recommendationType ? { borderColor: '#667eea' } : {}}>
                    <div className="card-body">
                      {recommendationType && (
                        <DoctorRecommendationBadge 
                          type={recommendationType}
                          stats={doctor.rating ? `${doctor.rating}⭐` : null}
                        />
                      )}
                      <div className="d-flex align-items-center mb-3">
                        {doctor.profilePhoto ? (
                          <img 
                            src={doctor.profilePhoto} 
                            alt={`Dr. ${doctor.name}`}
                            className="rounded-circle me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=50`;
                            }}
                          />
                        ) : (
                          <div className="bg-primary rounded-circle p-2 me-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-user-md text-white"></i>
                          </div>
                        )}
                        <div>
                          <h6 className="card-title mb-0">Dr. {doctor.name}</h6>
                          <small className="text-muted">{doctor.specialization}</small>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="card-text small text-muted mb-2">
                          <i className="fas fa-envelope me-1"></i>
                          {doctor.email}
                        </p>
                        <p className="card-text small text-muted mb-2">
                          <i className="fas fa-phone me-1"></i>
                          {doctor.phone}
                        </p>
                        <p className="card-text small text-muted mb-2">
                          <i className="fas fa-clock me-1"></i>
                          {doctor.availability || "Available"}
                        </p>
                        <p className="card-text small text-muted mb-0">
                          <i className="fas fa-rupee-sign me-1"></i>
                          Consultation Fee: ₹{doctor.consultationFee || 500}
                        </p>
                        {doctor.clinicId && (
                          <p className="card-text small text-muted mb-0">
                            <i className="fas fa-clinic-medical me-1"></i>
                            {doctor.clinicId.name || doctor.clinicId}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleBookAppointment(doctor)}
                        className="btn btn-primary btn-sm w-100"
                      >
                        <i className="fas fa-calendar-plus me-1"></i>
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

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

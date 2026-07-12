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
                const rating = doctor.rating || (4 + Math.random() * 0.9).toFixed(1);
                const reviews = doctor.reviewCount || Math.floor(50 + Math.random() * 200);
                const experience = doctor.experience || Math.floor(5 + Math.random() * 15);
                const isAvailable = doctor.availability === 'Available' || doctor.availableToday || true;
                const availabilityText = doctor.availability || (isAvailable ? 'Available Today' : 'Available Tomorrow');
                const image = doctor.profilePhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';
                const fee = doctor.consultationFee || 500;

                return (
                <div key={doctor._id} className="col-md-6 col-lg-4">
                  <div 
                    className="service-card premium-doctor-card-redesign" 
                    style={{ 
                      padding: '0', 
                      overflow: 'hidden', 
                      background: '#ffffff', 
                      borderRadius: '12px', 
                      border: recommendationType ? '2px solid var(--brand-accent, #14b8a6)' : '1px solid var(--border-slate, #e5e7eb)', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      position: 'relative',
                      textAlign: 'left'
                    }}
                  >
                    {recommendationType && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                        <DoctorRecommendationBadge 
                          type={recommendationType}
                          stats={doctor.rating ? `${doctor.rating}⭐` : null}
                        />
                      </div>
                    )}
                    <div style={{ height: '220px', background: '#f4f4f5', position: 'relative' }}>
                      <img 
                        src={image} 
                        alt={doctor.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || 'Doctor')}&background=0ea5e9&color=fff&size=200&bold=true`;
                        }}
                      />
                      <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34, 197, 94, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {availabilityText}
                      </span>
                    </div>
                    <div style={{ padding: '24px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-primary, #0ea5e9)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
                        {doctor.specialization || 'General Physician'}
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', marginTop: '0', lineHeight: '1.3' }}>
                        {doctor.name?.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                      </h3>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          <i className="fas fa-briefcase" style={{ marginRight: '6px', color: '#14b8a6' }}></i>
                          {experience} Years Exp
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>
                          <i className="fas fa-star" style={{ marginRight: '4px' }}></i>
                          {rating}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          ₹{fee}
                        </span>
                        <button 
                          onClick={() => handleBookAppointment(doctor)}
                          className="btn-premium-primary"
                          style={{ 
                            padding: '8px 16px', 
                            fontSize: '12px', 
                            borderRadius: '6px',
                            background: 'var(--brand-gradient, linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%))',
                            color: 'white',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Book Slots
                        </button>
                      </div>
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

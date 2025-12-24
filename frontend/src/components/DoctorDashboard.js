import { useState, useEffect, useCallback } from "react";
import axios from "../api/config";
import toast from "react-hot-toast";
import "./ClinicDashboard.css"; // Reuse clinic dashboard styles
import "./DoctorDashboard.css"; // Doctor-specific styles
import DoctorWallet from "./DoctorWallet";
import DoctorScheduleManager from "./DoctorScheduleManager";
import { exportAppointmentsToPDF } from "../utils/pdfExport";
import PrescriptionManager from "./PrescriptionManager";
import SecurityWarningBanner from "./SecurityWarningBanner";
import WalkInPatientModal from "./WalkInPatientModal";
import DoctorSupport from "./DoctorSupport";
import DoctorControls from "./DoctorControls";
import SystematicHistorySummary from "./systematic-history/SystematicHistorySummary";
import { ProfessionalDicomViewer } from "./imaging";

// Simple component to show systematic history status for appointments
const SystematicHistoryIndicator = ({ appointmentId }) => {
  const [hasHistory, setHasHistory] = useState(null);
  
  useEffect(() => {
    const checkHistory = async () => {
      try {
        const response = await axios.get(`/api/systematic-history/appointment/${appointmentId}`);
        setHasHistory(response.data.success && response.data.history);
      } catch (error) {
        setHasHistory(false);
      }
    };
    
    if (appointmentId) {
      checkHistory();
    }
  }, [appointmentId]);
  
  if (hasHistory === null) {
    return <span className="text-muted">...</span>;
  }
  
  return hasHistory ? (
    <span className="badge bg-success" title="Systematic history available">
      <i className="fas fa-clipboard-check"></i>
    </span>
  ) : (
    <span className="badge bg-light text-muted" title="No systematic history">
      <i className="fas fa-clipboard"></i>
    </span>
  );
};

function DoctorDashboard({ doctor, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState("queue"); // queue, appointments, schedule, wallet
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [queueFilter, setQueueFilter] = useState('all'); // all, virtual, in_clinic
  const [showSupport, setShowSupport] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [consultationTime, setConsultationTime] = useState(0);
  
  // EMR State
  const [emrSubscription, setEmrSubscription] = useState(null);
  const [emrLoading, setEmrLoading] = useState(false);
  const [emrPatients, setEmrPatients] = useState([]);
  const [emrPrescriptions, setEmrPrescriptions] = useState([]);
  
  // Systematic History State
  const [systematicHistory, setSystematicHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Imaging State
  const [imagingPatients, setImagingPatients] = useState([]);
  const [selectedImagingPatient, setSelectedImagingPatient] = useState(null);
  const [imagingStudies, setImagingStudies] = useState([]);
  const [imagingLoading, setImagingLoading] = useState(false);
  const [showImagingViewer, setShowImagingViewer] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);

  // Fetch systematic history for current patient
  const fetchSystematicHistory = async (appointmentId) => {
    if (!appointmentId) {
      setSystematicHistory(null);
      return;
    }
    
    try {
      setHistoryLoading(true);
      const response = await axios.get(`/api/systematic-history/appointment/${appointmentId}`);
      if (response.data.success && response.data.history) {
        setSystematicHistory(response.data.history);
      } else {
        setSystematicHistory(null);
      }
    } catch (error) {
      console.error('Error fetching systematic history:', error);
      setSystematicHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch systematic history when current patient changes
  useEffect(() => {
    if (currentPatient?._id) {
      fetchSystematicHistory(currentPatient._id);
    } else {
      setSystematicHistory(null);
    }
  }, [currentPatient]);

  // Get doctor ID (handle both id and _id)
  const doctorId = doctor.id || doctor._id;

  const fetchQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      const today = new Date().toISOString().split('T')[0];
      console.log(`📋 Fetching queue for doctor: ${doctorId}, date: ${today}`);
      const response = await axios.get(`/api/appointments/doctor/${doctorId}/queue?date=${today}`);
      
      const queueData = response.data || [];
      // Separate current patient (in_progress) from waiting queue
      const inProgress = queueData.find(a => a.status === 'in_progress');
      const waiting = queueData.filter(a => 
        a.status === 'confirmed' || a.status === 'pending'
      ).sort((a, b) => {
        // Sort by token number or time
        if (a.tokenNumber && b.tokenNumber) return a.tokenNumber - b.tokenNumber;
        return a.time.localeCompare(b.time);
      });
      
      // Debug: Log the in_progress patient's consultationStartTime
      if (inProgress) {
        console.log('📋 Current patient consultationStartTime:', inProgress.consultationStartTime);
      }
      
      setCurrentPatient(inProgress || null);
      setQueue(waiting);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setQueueLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
      fetchQueue();
      fetchEmrSubscription();
      
      // Auto-refresh queue every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId, fetchQueue]);

  // Fetch EMR subscription for the clinic
  const fetchEmrSubscription = async () => {
    // Handle different formats of clinicId (populated object, ObjectId string, or nested _id)
    let clinicId = null;
    if (doctor.clinicId) {
      if (typeof doctor.clinicId === 'object' && doctor.clinicId._id) {
        clinicId = doctor.clinicId._id;
      } else if (typeof doctor.clinicId === 'string') {
        clinicId = doctor.clinicId;
      } else if (doctor.clinicId.$oid) {
        // Handle MongoDB extended JSON format
        clinicId = doctor.clinicId.$oid;
      }
    }
    
    console.log('📋 EMR: Doctor object:', doctor);
    console.log('📋 EMR: Doctor clinicId raw:', doctor.clinicId);
    console.log('📋 EMR: Extracted clinicId:', clinicId);
    
    if (!clinicId) {
      console.log('📋 EMR: No clinicId found, skipping subscription fetch');
      setEmrLoading(false);
      return;
    }
    
    try {
      setEmrLoading(true);
      console.log('📋 EMR: Fetching subscription for clinic:', clinicId);
      const response = await axios.get(`/api/emr/subscription/${clinicId}`);
      console.log('📋 EMR: Subscription response:', response.data);
      if (response.data.success && response.data.subscription) {
        setEmrSubscription(response.data.subscription);
        console.log('📋 EMR: Subscription set:', response.data.subscription.plan);
      } else {
        console.log('📋 EMR: No subscription in response');
        setEmrSubscription(null);
      }
    } catch (error) {
      console.log('📋 EMR: Error fetching subscription:', error.response?.data || error.message);
      setEmrSubscription(null);
    } finally {
      setEmrLoading(false);
    }
  };

  // Fetch EMR patients for the clinic
  const fetchEmrPatients = async () => {
    // Handle different formats of clinicId
    let clinicId = null;
    if (doctor.clinicId) {
      if (typeof doctor.clinicId === 'object' && doctor.clinicId._id) {
        clinicId = doctor.clinicId._id;
      } else if (typeof doctor.clinicId === 'string') {
        clinicId = doctor.clinicId;
      } else if (doctor.clinicId.$oid) {
        clinicId = doctor.clinicId.$oid;
      }
    }
    
    if (!clinicId) return;
    
    try {
      const response = await axios.get(`/api/emr/patients/clinic/${clinicId}`);
      if (response.data.success) {
        setEmrPatients(response.data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching EMR patients:', error);
    }
  };

  // Fetch EMR prescriptions for the clinic
  const fetchEmrPrescriptions = async () => {
    // Handle different formats of clinicId
    let clinicId = null;
    if (doctor.clinicId) {
      if (typeof doctor.clinicId === 'object' && doctor.clinicId._id) {
        clinicId = doctor.clinicId._id;
      } else if (typeof doctor.clinicId === 'string') {
        clinicId = doctor.clinicId;
      } else if (doctor.clinicId.$oid) {
        clinicId = doctor.clinicId.$oid;
      }
    }
    
    if (!clinicId) return;
    
    try {
      const response = await axios.get(`/api/prescriptions/clinic/${clinicId}`);
      if (response.data.success) {
        setEmrPrescriptions(response.data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  // Load EMR data when EMR tab is selected
  useEffect(() => {
    if (activeTab === 'emr' && emrSubscription) {
      fetchEmrPatients();
      fetchEmrPrescriptions();
    }
  }, [activeTab, emrSubscription]);

  // Fetch patients with imaging studies
  const fetchImagingPatients = async () => {
    try {
      setImagingLoading(true);
      // Get all patients who have had appointments with this doctor
      const response = await axios.get(`/api/appointments/doctor/${doctorId}`);
      const appointments = response.data || [];
      
      // Get unique patients
      const patientMap = new Map();
      appointments.forEach(apt => {
        const patient = apt.userId;
        if (patient && patient._id && !patientMap.has(patient._id)) {
          patientMap.set(patient._id, {
            _id: patient._id,
            name: patient.name,
            email: patient.email,
            phone: patient.phone
          });
        }
      });
      
      setImagingPatients(Array.from(patientMap.values()));
    } catch (error) {
      console.error('Error fetching imaging patients:', error);
    } finally {
      setImagingLoading(false);
    }
  };

  // Fetch imaging studies for a patient
  const fetchPatientImagingStudies = async (patientId) => {
    try {
      setImagingLoading(true);
      const response = await axios.get(`/api/imaging/patients/${patientId}/studies`);
      if (response.data.success) {
        setImagingStudies(response.data.data || []);
      } else {
        setImagingStudies([]);
      }
    } catch (error) {
      console.error('Error fetching imaging studies:', error);
      setImagingStudies([]);
    } finally {
      setImagingLoading(false);
    }
  };

  // Load imaging patients when imaging tab is selected
  useEffect(() => {
    if (activeTab === 'imaging') {
      fetchImagingPatients();
    }
  }, [activeTab]);

  // Fetch studies when patient is selected
  useEffect(() => {
    if (selectedImagingPatient) {
      fetchPatientImagingStudies(selectedImagingPatient._id);
    } else {
      setImagingStudies([]);
    }
  }, [selectedImagingPatient]);

  // Consultation timer - tracks time with current patient
  useEffect(() => {
    let timer;
    // Check both field names for compatibility
    const startTime = currentPatient?.consultationStartedAt || currentPatient?.consultationStartTime;
    if (startTime) {
      const startTimeMs = new Date(startTime).getTime();
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
        setConsultationTime(elapsed);
      }, 1000);
    } else {
      setConsultationTime(0);
    }
    return () => clearInterval(timer);
  }, [currentPatient]);

  // Format consultation time as MM:SS
  const formatConsultationTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/appointments/doctor/${doctorId}`);
      setAppointments(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // More specific error messages
      if (!error.response) {
        toast.error("Network error. Please check your connection.", { id: 'fetch-appt-error' });
      } else if (error.response.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load appointments. Pull to refresh.");
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const todayAppts = data.filter(a => new Date(a.date).toDateString() === today);
    setStats({
      total: data.length,
      today: todayAppts.length,
      pending: data.filter(a => a.status === "pending" || a.status === "confirmed").length,
      completed: data.filter(a => a.status === "completed").length
    });
  };

  const getFilteredAppointments = () => {
    const today = new Date().toDateString();
    switch (filter) {
      case "today":
        return appointments.filter(a => new Date(a.date).toDateString() === today);
      case "upcoming":
        return appointments.filter(a => new Date(a.date) >= new Date() && a.status !== "completed");
      case "completed":
        return appointments.filter(a => a.status === "completed");
      default:
        return appointments;
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const response = await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      toast.success(`Appointment ${status === 'in_progress' ? 'started' : status}`);
      
      // If starting consultation, immediately set current patient with consultationStartTime
      // This ensures the timer starts right away without waiting for fetchQueue
      if (status === 'in_progress' && response.data) {
        console.log('📋 Setting current patient with consultationStartTime:', response.data.consultationStartTime);
        setCurrentPatient(response.data);
      }
      
      fetchAppointments();
      fetchQueue();
    } catch (error) {
      console.error("Error updating appointment:", error);
      if (!error.response) {
        toast.error("Network error. Please try again.");
      } else if (error.response.status === 404) {
        toast.error("Appointment not found. Refreshing...");
        fetchQueue();
      } else if (error.response.status === 409) {
        toast.error("Appointment already updated. Refreshing...");
        fetchQueue();
      } else {
        toast.error(error.response?.data?.message || "Failed to update appointment");
      }
    }
  };

  // Call next patient from queue
  const callNextPatient = async () => {
    if (queue.length === 0) {
      toast.error("No patients in queue");
      return;
    }

    // If there's a current patient, complete them first
    if (currentPatient) {
      await updateAppointmentStatus(currentPatient._id, "completed");
    }

    // Start the next patient
    const nextPatient = queue[0];
    await updateAppointmentStatus(nextPatient._id, "in_progress");
    toast.success(`Calling ${nextPatient.userId?.name || 'Patient'}`);
  };

  // Complete current patient
  const completeCurrentPatient = async () => {
    if (!currentPatient) return;
    await updateAppointmentStatus(currentPatient._id, "completed");
    toast.success("Patient consultation completed");
  };

  // Skip patient (move to end of queue)
  const skipPatient = async (appointmentId) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/skip`);
      toast.success("Patient moved to end of queue");
      fetchQueue();
    } catch (error) {
      toast.error("Failed to skip patient");
    }
  };

  // Mark patient as no-show
  const markNoShow = async (appointmentId) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}/status`, { status: "cancelled", reason: "No show" });
      toast.success("Patient marked as no-show");
      fetchQueue();
      fetchAppointments();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Notify patient about their queue position
  const notifyPatient = async (appointmentId) => {
    try {
      toast.loading("Sending notification...", { id: "notify" });
      const response = await axios.post(`/api/appointments/${appointmentId}/notify-patient`);
      if (response.data.success && response.data.notified) {
        toast.success(`Notification sent! Patient is #${response.data.position} in queue`, { id: "notify" });
      } else {
        toast.success(response.data.reason || "Patient already notified", { id: "notify" });
      }
    } catch (error) {
      toast.error("Failed to send notification", { id: "notify" });
    }
  };

  // Notify all upcoming patients (next 3 in queue)
  const notifyUpcomingPatients = async () => {
    try {
      toast.loading("Sending notifications...", { id: "notify-all" });
      const response = await axios.post(`/api/appointments/doctor/${doctorId}/notify-queue`, { notifyAtPosition: 3 });
      if (response.data.success) {
        const notified = response.data.results.filter(r => r.notified).length;
        toast.success(`Notified ${notified} patient(s)`, { id: "notify-all" });
      }
    } catch (error) {
      toast.error("Failed to send notifications", { id: "notify-all" });
    }
  };

  // Regenerate Google Meet link for an appointment
  const regenerateMeetLink = async (appointmentId) => {
    try {
      toast.loading("Generating meeting link...", { id: "meet-gen" });
      const response = await axios.post(`/api/appointments/${appointmentId}/generate-meeting`);
      if (response.data.success) {
        toast.success("Meeting link generated!", { id: "meet-gen" });
        fetchAppointments();
        fetchQueue();
      } else {
        toast.error(response.data.message || "Failed to generate link", { id: "meet-gen" });
      }
    } catch (error) {
      console.error("Error generating meet link:", error);
      toast.error("Failed to generate meeting link", { id: "meet-gen" });
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: "bg-warning text-dark",
      confirmed: "bg-primary",
      in_progress: "bg-info",
      completed: "bg-success",
      cancelled: "bg-danger"
    };
    return <span className={`badge ${classes[status] || "bg-secondary"}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <article className="doctor-dashboard-container">
      {/* Security Warning Banner */}
      <SecurityWarningBanner userId={doctorId} />
      
      {/* Header - Doctor info + controls */}
      <header className="doctor-dashboard-header">
        <div className="card doctor-header-card text-white">
          <div className="card-body py-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center">
                {doctor.profilePhoto ? (
                  <img src={doctor.profilePhoto} alt={doctor.name} className="me-3" style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: '16px', border: "3px solid rgba(255,255,255,0.3)", boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
                ) : (
                  <div className="bg-white d-flex align-items-center justify-content-center me-3" style={{ width: "70px", height: "70px", borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} aria-hidden="true">
                    <i className="fas fa-user-md fa-2x" style={{ color: '#4f46e5' }}></i>
                  </div>
                )}
                <div>
                  <h1 className="mb-1 fw-bold text-white" style={{ fontSize: '1.5rem' }}>Dr. {doctor.name}</h1>
                  <p className="mb-0" style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    <i className="fas fa-stethoscope me-2" aria-hidden="true"></i>{doctor.specialization}
                  </p>
                  <p className="mb-0" style={{ opacity: 0.75, fontSize: '0.85rem' }}>
                    <i className="fas fa-hospital me-2" aria-hidden="true"></i>{doctor.clinicId?.name || "Independent Practice"}
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2" role="toolbar" aria-label="Doctor actions">
                <time className="text-end me-3 d-none d-md-block" dateTime={new Date().toISOString()}>
                  <small style={{ opacity: 0.75 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</small>
                </time>
                <button 
                  className="btn btn-warning px-3" 
                  onClick={() => setShowControls(true)} 
                  style={{ borderRadius: '12px', fontWeight: 600 }}
                  title="Doctor Controls"
                  aria-label="Open doctor controls panel"
                >
                  <i className="fas fa-sliders-h" aria-hidden="true"></i>
                  <span className="d-none d-md-inline ms-2">Controls</span>
                </button>
                <button 
                  className="btn btn-outline-light px-3" 
                  onClick={() => setShowSupport(true)} 
                  style={{ borderRadius: '12px', fontWeight: 600 }}
                  title="Contact Admin Support"
                  aria-label="Open support chat"
                >
                  <i className="fas fa-headset" aria-hidden="true"></i>
                  <span className="d-none d-md-inline ms-2">Support</span>
                  <span className="support-live-indicator ms-2 d-none d-lg-inline-flex" aria-label="Support is live">
                    <span className="dot" aria-hidden="true"></span>
                    Live
                  </span>
                </button>
                <button className="btn btn-light px-4" onClick={onLogout} style={{ borderRadius: '12px', fontWeight: 600 }} aria-label="Logout">
                  <i className="fas fa-sign-out-alt me-2" aria-hidden="true"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="doctor-stats-section" aria-label="Dashboard statistics" style={{ marginBottom: '1.5rem' }}>
        <div className="row g-3">
          {[
            { label: "Today", value: stats.today, icon: "calendar-day", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { label: "Pending", value: stats.pending, icon: "hourglass-half", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
            { label: "Completed", value: stats.completed, icon: "check-circle", gradient: "linear-gradient(135deg, #10b981, #059669)" },
            { label: "Total", value: stats.total, icon: "users", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }
          ].map((stat, i) => (
            <div key={i} className="col-6 col-lg-3">
              <div className="card h-100 border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px', borderRadius: '14px', background: stat.gradient }} aria-hidden="true">
                      <i className={`fas fa-${stat.icon} text-white`} style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div>
                      <p className="mb-0 fw-bold" style={{ fontSize: '1.75rem', color: '#1e293b' }}>{stat.value}</p>
                      <small className="text-muted" style={{ fontSize: '0.8rem' }}>{stat.label}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Tabs - Queue is the HERO */}
      <nav className="doctor-dashboard-tabs" aria-label="Dashboard navigation" role="tablist">
        <button 
          className={`doctor-tab queue-hero ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
          role="tab"
          aria-selected={activeTab === 'queue'}
          aria-controls="queue-panel"
        >
          <i className="fas fa-users" aria-hidden="true"></i>
          <span>Queue</span>
          {queue.length > 0 && <span className="badge bg-danger" aria-label={`${queue.length} patients waiting`}>{queue.length}</span>}
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
          role="tab"
          aria-selected={activeTab === 'appointments'}
          aria-controls="appointments-panel"
        >
          <i className="fas fa-calendar-alt" aria-hidden="true"></i>
          <span>All Bookings</span>
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
          role="tab"
          aria-selected={activeTab === 'schedule'}
          aria-controls="schedule-panel"
        >
          <i className="fas fa-clock" aria-hidden="true"></i>
          <span>Schedule</span>
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
          role="tab"
          aria-selected={activeTab === 'wallet'}
          aria-controls="wallet-panel"
        >
          <i className="fas fa-wallet" aria-hidden="true"></i>
          <span>Wallet</span>
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'emr' ? 'active' : ''}`}
          onClick={() => setActiveTab('emr')}
          role="tab"
          aria-selected={activeTab === 'emr'}
          aria-controls="emr-panel"
          style={{ background: emrSubscription ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }}
        >
          <i className="fas fa-notes-medical" aria-hidden="true"></i>
          <span>EMR</span>
          {emrSubscription && <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Active</span>}
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'imaging' ? 'active' : ''}`}
          onClick={() => setActiveTab('imaging')}
          role="tab"
          aria-selected={activeTab === 'imaging'}
          aria-controls="imaging-panel"
          style={{ background: activeTab === 'imaging' ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : undefined }}
        >
          <i className="fas fa-x-ray" aria-hidden="true"></i>
          <span>Imaging</span>
        </button>
      </nav>

      {/* Patient Queue Section */}
      {activeTab === 'queue' && (
        <div className="row" id="queue-panel" role="tabpanel" aria-labelledby="queue-tab">
          {/* Daily Summary Section - Today at a Glance */}
          <section className="col-12 mb-3" aria-label="Today at a glance">
            <div className="daily-summary-card">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                <i className="fas fa-chart-line me-2" aria-hidden="true"></i>Today at a Glance
              </h2>
              <div className="daily-summary-stats">
                <div className="summary-stat seen">
                  <div className="value" aria-label="Patients seen">{stats.completed}</div>
                  <div className="label">Seen</div>
                </div>
                <div className="summary-stat pending">
                  <div className="value" aria-label="Patients waiting">{queue.length}</div>
                  <div className="label">Waiting</div>
                </div>
                <div className="summary-stat earnings">
                  <div className="value" aria-label="Today's earnings">₹{(stats.completed * (doctor.consultationFee || 500)).toLocaleString()}</div>
                  <div className="label">Earnings</div>
                </div>
                <div className="summary-stat avg-time">
                  <div className="value" aria-label="Average consultation time">~{doctor.consultationDuration || 20}m</div>
                  <div className="label">Avg Time</div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions Bar - Staff Friendly */}
          <div className="col-12 mb-3">
            <div className="quick-actions-bar" role="toolbar" aria-label="Queue actions">
              <div className="quick-actions-left">
                <h2 className="queue-title" style={{ fontSize: '1.25rem' }}>
                  <i className="fas fa-users" aria-hidden="true"></i>
                  Today's Queue
                  <span className="queue-count" aria-label={`${queue.length + (currentPatient ? 1 : 0)} total patients`}>{queue.length + (currentPatient ? 1 : 0)}</span>
                </h2>
              </div>
              <div className="quick-actions-right">
                <button 
                  className="quick-btn quick-btn-refresh"
                  onClick={fetchQueue}
                  disabled={queueLoading}
                  title="Refresh Queue"
                  aria-label="Refresh queue"
                >
                  <i className={`fas fa-sync-alt ${queueLoading ? 'fa-spin' : ''}`} aria-hidden="true"></i>
                </button>
                {queue.length > 0 && (
                  <button 
                    className="quick-btn quick-btn-notify"
                    onClick={notifyUpcomingPatients}
                    title="Notify Next 3 Patients"
                    aria-label="Notify next 3 patients"
                  >
                    <i className="fas fa-bell" aria-hidden="true"></i>
                    <span>Notify</span>
                  </button>
                )}
                {queue.length > 0 && !currentPatient && (
                  <button 
                    className="quick-btn quick-btn-call"
                    onClick={callNextPatient}
                    title="Call First Patient"
                    aria-label="Call next patient"
                  >
                    <i className="fas fa-phone-alt" aria-hidden="true"></i>
                    <span>Call Next</span>
                  </button>
                )}
                <button 
                  className="quick-btn quick-btn-add"
                  onClick={() => setShowWalkInModal(true)}
                  aria-label="Add walk-in patient"
                >
                  <i className="fas fa-user-plus" aria-hidden="true"></i>
                  <span>Walk-In</span>
                </button>
              </div>
            </div>
          </div>

          {/* Queue Type Filter - Human Language */}
          <div className="col-12 mb-3">
            <div className="queue-type-filter" role="group" aria-label="Filter queue by type">
              <button 
                className={`queue-filter-btn ${queueFilter === 'all' ? 'active' : ''}`}
                onClick={() => setQueueFilter('all')}
                aria-pressed={queueFilter === 'all'}
              >
                <i className="fas fa-layer-group me-1" aria-hidden="true"></i>
                All Patients ({queue.length})
              </button>
              <button 
                className={`queue-filter-btn in-clinic ${queueFilter === 'in_clinic' ? 'active' : ''}`}
                onClick={() => setQueueFilter('in_clinic')}
                aria-pressed={queueFilter === 'in_clinic'}
              >
                <i className="fas fa-hospital me-1" aria-hidden="true"></i>
                Clinic Queue ({queue.filter(p => p.consultationType !== 'online').length})
              </button>
              <button 
                className={`queue-filter-btn virtual ${queueFilter === 'virtual' ? 'active' : ''}`}
                onClick={() => setQueueFilter('virtual')}
                aria-pressed={queueFilter === 'virtual'}
              >
                <i className="fas fa-video me-1" aria-hidden="true"></i>
                Online Consults ({queue.filter(p => p.consultationType === 'online').length})
              </button>
            </div>
          </div>

          {/* Current Patient - Aside */}
          <aside className="col-lg-5 mb-4" aria-label="Current patient in consultation">
            <div className="card doctor-current-patient-card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-user-check me-2"></i>
                  Current Patient
                </h5>
              </div>
              <div className="card-body">
                {currentPatient ? (
                  <div className="current-patient-info">
                    <div className="patient-avatar">
                      {currentPatient.isWalkIn 
                        ? (currentPatient.walkInPatient?.name?.charAt(0) || 'W')
                        : (currentPatient.userId?.name?.charAt(0) || 'P')}
                    </div>
                    <h4>
                      {currentPatient.isWalkIn 
                        ? (currentPatient.walkInPatient?.name || 'Walk-In Patient')
                        : (currentPatient.userId?.name || 'Unknown Patient')}
                    </h4>
                    
                    {/* Patient Type Badge */}
                    <div className={`patient-type-badge ${currentPatient.consultationType === 'online' ? 'virtual' : 'clinic'}`}>
                      <i className={`fas ${currentPatient.consultationType === 'online' ? 'fa-video' : 'fa-hospital'}`}></i>
                      {currentPatient.consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
                    </div>

                    {/* Consultation Timer */}
                    <div className="consultation-timer">
                      <i className="fas fa-stopwatch"></i>
                      <span>{formatConsultationTime(consultationTime)} elapsed</span>
                    </div>

                    {/* Status Pill */}
                    <div className="mb-2">
                      <span className="status-pill in-consultation">In Consultation</span>
                    </div>

                    <p className="text-muted mb-2">
                      <i className="fas fa-phone me-2"></i>
                      {currentPatient.isWalkIn 
                        ? (currentPatient.walkInPatient?.phone || 'N/A')
                        : (currentPatient.userId?.phone || 'N/A')}
                    </p>
                    <div className="patient-details">
                      <span className="badge bg-info me-2">
                        Token #{currentPatient.tokenNumber || currentPatient.queueNumber || '-'}
                      </span>
                      <span className="badge bg-secondary">
                        {currentPatient.estimatedTime ? formatTime(currentPatient.estimatedTime) : (currentPatient.time ? formatTime(currentPatient.time) : '-')}
                      </span>
                    </div>
                    {currentPatient.reason && (
                      <>
                        <p className="mt-3 mb-2"><strong>Reason:</strong></p>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>{currentPatient.reason}</p>
                      </>
                    )}
                    
                    {/* Systematic History Summary */}
                    {historyLoading ? (
                      <div className="mt-3 text-center">
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                        <small className="text-muted ms-2">Loading history...</small>
                      </div>
                    ) : systematicHistory ? (
                      <div className="mt-3">
                        <SystematicHistorySummary 
                          history={systematicHistory}
                          compact={true}
                          expandable={true}
                          onPrint={() => {
                            const printWindow = window.open('', '_blank');
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Systematic History - ${currentPatient.userId?.name || currentPatient.walkInPatient?.name || 'Patient'}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                    .system-row { margin: 10px 0; padding: 8px; border-left: 3px solid #007bff; }
                                    .symptom { background: #f8f9fa; padding: 4px 8px; margin: 2px; border-radius: 4px; display: inline-block; }
                                    .allergy { background: #fff3cd; border: 1px solid #ffeaa7; padding: 4px 8px; margin: 2px; border-radius: 4px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h2>Systematic History Summary</h2>
                                    <p><strong>Patient:</strong> ${currentPatient.userId?.name || currentPatient.walkInPatient?.name || 'Unknown'}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                    <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                                  </div>
                                  <div id="history-content"></div>
                                </body>
                              </html>
                            `);
                            // Add the systematic history content here
                            printWindow.document.close();
                            printWindow.print();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="alert alert-info" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                          <i className="fas fa-info-circle me-2"></i>
                          No systematic history available for this patient
                        </div>
                      </div>
                    )}
                    
                    {/* Quick Action Buttons - Improved */}
                    <div className="current-patient-actions">
                      {currentPatient.consultationType === 'online' && currentPatient.googleMeetLink && (
                        <a 
                          href={currentPatient.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn-primary"
                          style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)', textDecoration: 'none', color: 'white' }}
                        >
                          <i className="fas fa-video"></i>
                          <span>Join Video Call</span>
                        </a>
                      )}
                      <div className="action-row">
                        <button 
                          className="action-btn-primary prescription"
                          onClick={() => { setPrescriptionPatient(currentPatient); setShowPrescription(true); }}
                        >
                          <i className="fas fa-prescription"></i>
                          Prescription
                        </button>
                        <button 
                          className="action-btn-primary complete"
                          onClick={completeCurrentPatient}
                        >
                          <i className="fas fa-check-circle"></i>
                          Complete
                        </button>
                      </div>
                      <div className="action-row">
                        <button 
                          className="action-btn-primary back-to-waiting"
                          onClick={() => updateAppointmentStatus(currentPatient._id, 'confirmed')}
                        >
                          <i className="fas fa-undo"></i>
                          Back to Queue
                        </button>
                        <button 
                          className="action-btn-primary cancel"
                          onClick={() => markNoShow(currentPatient._id)}
                        >
                          <i className="fas fa-user-slash"></i>
                          No Show
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="current-patient-empty">
                    <div className="empty-icon">
                      <i className="fas fa-user-clock"></i>
                    </div>
                    <h5>No patient in consultation</h5>
                    <p>
                      {queue.length > 0 
                        ? `${queue.length} patient${queue.length > 1 ? 's' : ''} waiting in queue`
                        : 'Walk-ins and online bookings will appear here'
                      }
                    </p>
                    {queue.length > 0 ? (
                      <button 
                        className="action-btn-primary complete"
                        onClick={callNextPatient}
                        style={{ margin: '0 auto' }}
                      >
                        <i className="fas fa-phone-alt"></i>
                        Call Next Patient
                      </button>
                    ) : (
                      <div className="hint">
                        <i className="fas fa-hand-point-right"></i>
                        <span>Click "Walk-In" to add a patient</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Waiting Queue - Main Content */}
          <main className="col-lg-7 mb-4" aria-label="Patient waiting queue">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="mb-0" style={{ fontSize: '1.1rem' }}>
                  <i className={`fas ${queueFilter === 'virtual' ? 'fa-video' : queueFilter === 'in_clinic' ? 'fa-hospital' : 'fa-list-ol'} me-2`} aria-hidden="true"></i>
                  {queueFilter === 'virtual' ? 'Virtual Queue' : queueFilter === 'in_clinic' ? 'In-Clinic Queue' : 'Waiting Queue'} ({
                    queueFilter === 'all' ? queue.length 
                    : queueFilter === 'virtual' ? queue.filter(p => p.consultationType === 'online').length
                    : queue.filter(p => p.consultationType !== 'online').length
                  })
                </h3>
                <div>
                  <button 
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={fetchQueue}
                    disabled={queueLoading}
                  >
                    <i className={`fas fa-sync ${queueLoading ? 'fa-spin' : ''}`}></i>
                  </button>
                  {queue.length > 0 && (
                    <button 
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={notifyUpcomingPatients}
                      title="Notify next 3 patients"
                    >
                      <i className="fas fa-bell me-1"></i>
                      Notify
                    </button>
                  )}
                  {queue.length > 0 && currentPatient && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={callNextPatient}
                    >
                      <i className="fas fa-forward me-1"></i>
                      Next Patient
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {(() => {
                  // Filter queue based on selected filter
                  const filteredQueue = queueFilter === 'all' 
                    ? queue 
                    : queueFilter === 'virtual'
                      ? queue.filter(p => p.consultationType === 'online')
                      : queue.filter(p => p.consultationType !== 'online');
                  
                  return filteredQueue.length === 0 ? (
                  <div className="empty-queue-state">
                    <div className="empty-queue-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h4>All Clear!</h4>
                    <p>{queueFilter === 'all' ? 'No patients waiting in queue' : `No ${queueFilter === 'virtual' ? 'virtual' : 'in-clinic'} patients waiting`}</p>
                    <button className="empty-queue-btn" onClick={() => setShowWalkInModal(true)}>
                      <i className="fas fa-user-plus"></i>
                      Add Walk-In Patient
                    </button>
                  </div>
                ) : (
                  <div className="queue-list">
                    {filteredQueue.map((patient, index) => {
                      // Calculate estimated wait time (15 min per patient + 5 min buffer)
                      const estimatedWaitMinutes = index * 20;
                      const estimatedTime = new Date(Date.now() + estimatedWaitMinutes * 60000);
                      const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                      
                      return (
                        <div key={patient._id} className={`queue-item ${index === 0 ? 'next-up' : ''} ${patient.consultationType === 'online' ? 'virtual-patient' : 'clinic-patient'}`}>
                          <div className="queue-position">
                            {index + 1}
                          </div>
                          <div className="queue-patient-info">
                            <h6 className="mb-0">
                              {patient.isWalkIn ? (patient.walkInPatient?.name || 'Walk-In Patient') : (patient.userId?.name || 'Unknown')}
                              {/* Booking Source Badge */}
                              {patient.bookingSource === 'offline' || patient.isWalkIn ? (
                                <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>
                                  <i className="fas fa-walking me-1"></i>Walk-In
                                </span>
                              ) : patient.bookingSource === 'receptionist' ? (
                                <span className="badge bg-purple text-white ms-2" style={{ fontSize: '0.65rem', background: '#9333ea' }}>
                                  <i className="fas fa-user-tie me-1"></i>Receptionist
                                </span>
                              ) : patient.bookingSource === 'phone' ? (
                                <span className="badge bg-info text-white ms-2" style={{ fontSize: '0.65rem' }}>
                                  <i className="fas fa-phone me-1"></i>Phone
                                </span>
                              ) : (
                                <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>
                                  <i className="fas fa-globe me-1"></i>Online
                                </span>
                              )}
                            </h6>
                            <small className="text-muted">
                              Token #{patient.tokenNumber || '-'} • {formatTime(patient.time)}
                              {patient.isWalkIn && patient.walkInPatient?.phone && (
                                <> • <i className="fas fa-phone-alt"></i> {patient.walkInPatient.phone}</>
                              )}
                            </small>
                            <br />
                            <small className="text-muted">{patient.reason}</small>
                            <div className="mt-1">
                              <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                                <i className="fas fa-clock me-1"></i>
                                Est. ~{estimatedWaitMinutes} min ({estimatedTimeStr})
                              </span>
                              <SystematicHistoryIndicator appointmentId={patient._id} />
                            </div>
                          </div>
                          <div className="queue-patient-type">
                            {patient.consultationType === 'online' ? (
                              <span className="badge bg-info">
                                <i className="fas fa-video"></i>
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                <i className="fas fa-hospital"></i>
                              </span>
                            )}
                          </div>
                          <div className="queue-actions">
                            {index === 0 && !currentPatient && (
                              <button 
                                className="btn btn-sm btn-success me-1"
                                onClick={() => updateAppointmentStatus(patient._id, 'in_progress')}
                                title="Start consultation"
                              >
                                <i className="fas fa-play"></i>
                              </button>
                            )}
                            <button 
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => notifyPatient(patient._id)}
                              title="Send notification to patient"
                            >
                              <i className="fas fa-bell"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => skipPatient(patient._id)}
                              title="Skip (move to end)"
                            >
                              <i className="fas fa-step-forward"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => markNoShow(patient._id)}
                              title="Mark as no-show"
                            >
                              <i className="fas fa-user-slash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
                })()}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
      <main className="card" id="appointments-panel" role="tabpanel" aria-labelledby="appointments-tab">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h2 className="mb-0" style={{ fontSize: '1.25rem' }}><i className="fas fa-calendar-alt me-2" aria-hidden="true"></i>Appointments</h2>
            <div className="d-flex align-items-center gap-2">
              <div className="btn-group btn-group-sm">
                {["today", "upcoming", "completed", "all"].map(f => (
                  <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => exportAppointmentsToPDF(getFilteredAppointments(), `Dr. ${doctor.name} - Appointments`)}
              >
                <i className="fas fa-file-pdf me-1"></i>PDF
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {getFilteredAppointments().length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <p className="text-muted">No appointments found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>History</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAppointments().map(apt => (
                    <tr key={apt._id}>
                      <td>
                        <strong>{apt.isWalkIn ? (apt.walkInPatient?.name || 'Walk-In') : (apt.userId?.name || "Unknown")}</strong>
                        {/* Booking Source Badge */}
                        {(apt.bookingSource === 'offline' || apt.isWalkIn) && (
                          <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>Walk-In</span>
                        )}
                        {apt.bookingSource === 'receptionist' && (
                          <span className="badge text-white ms-1" style={{ fontSize: '0.6rem', background: '#9333ea' }}>Receptionist</span>
                        )}
                        {apt.bookingSource === 'phone' && (
                          <span className="badge bg-info ms-1" style={{ fontSize: '0.6rem' }}>Phone</span>
                        )}
                        {apt.bookingSource === 'online' && !apt.isWalkIn && (
                          <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>Online</span>
                        )}
                        <br /><small className="text-muted">{apt.isWalkIn ? (apt.walkInPatient?.phone || 'N/A') : apt.userId?.phone}</small>
                      </td>
                      <td>{formatDate(apt.date)}</td>
                      <td>{formatTime(apt.time)}</td>
                      <td>
                        {apt.consultationType === "online" ? (
                          <span className="badge bg-info">
                            <i className="fas fa-video me-1"></i>Online
                          </span>
                        ) : (
                          <span className="badge bg-secondary">
                            <i className="fas fa-hospital me-1"></i>In-Clinic
                          </span>
                        )}
                      </td>
                      <td><small>{apt.reason}</small></td>
                      <td>
                        <SystematicHistoryIndicator appointmentId={apt._id} />
                      </td>
                      <td>{getStatusBadge(apt.status)}</td>
                      <td>
                        {/* Meet Link for Online Appointments - Doctor joins as Host */}
                        {apt.consultationType === "online" && apt.googleMeetLink && (
                          <a 
                            href={apt.doctorMeetLink || apt.googleMeetLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary me-1"
                            title="Join as Host (You have moderator controls)"
                            style={{ background: apt.meetingProvider === 'jitsi' ? '#location' : '#1a73e8' }}
                          >
                            <i className="fas fa-video me-1"></i>
                            {apt.meetingProvider === 'jitsi' ? 'Host Meeting' : 'Start'}
                          </a>
                        )}
                        {apt.consultationType === "online" && !apt.googleMeetLink && (
                          <button 
                            className="btn btn-sm btn-warning me-1"
                            onClick={() => regenerateMeetLink(apt._id)}
                            title="Click to generate Google Meet link"
                          >
                            <i className="fas fa-sync-alt me-1"></i>Generate
                          </button>
                        )}
                        {apt.status === "confirmed" && (
                          <button className="btn btn-sm btn-info me-1" onClick={() => updateAppointmentStatus(apt._id, "in_progress")} title="Start Appointment">
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        {apt.status === "in_progress" && (
                          <button className="btn btn-sm btn-success" onClick={() => updateAppointmentStatus(apt._id, "completed")} title="Complete">
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <main id="schedule-panel" role="tabpanel" aria-labelledby="schedule-tab">
          <DoctorScheduleManager doctorId={doctorId} />
        </main>
      )}

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <main id="wallet-panel" role="tabpanel" aria-labelledby="wallet-tab">
          <DoctorWallet doctorId={doctorId} doctorName={doctor.name} />
        </main>
      )}

      {/* EMR Tab */}
      {activeTab === 'emr' && (
        <main id="emr-panel" role="tabpanel" aria-labelledby="emr-tab">
          {emrLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-2">Loading EMR...</p>
            </div>
          ) : !emrSubscription ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <i className="fas fa-lock text-white" style={{ fontSize: '2rem' }}></i>
                </div>
                <h3 className="mb-3">EMR Not Available</h3>
                <p className="text-muted mb-4">
                  Your clinic doesn't have an active EMR subscription.<br />
                  Contact your clinic administrator to enable EMR features.
                </p>
                <div className="alert alert-info" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <i className="fas fa-info-circle me-2"></i>
                  EMR features include patient records, prescriptions, visit history, and more.
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              {/* EMR Subscription Info */}
              <div className="col-12 mb-4">
                <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <h5 className="mb-1">
                          <i className="fas fa-crown me-2"></i>
                          EMR {emrSubscription.plan?.charAt(0).toUpperCase() + emrSubscription.plan?.slice(1)} Plan
                        </h5>
                        <p className="mb-0 opacity-75">
                          <i className="fas fa-hospital me-2"></i>
                          {doctor.clinicId?.name || 'Your Clinic'}
                        </p>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-white text-success px-3 py-2">
                          <i className="fas fa-check-circle me-1"></i>
                          Active
                        </span>
                        <p className="mb-0 mt-2 opacity-75" style={{ fontSize: '0.85rem' }}>
                          Expires: {new Date(emrSubscription.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* EMR Quick Stats */}
              <div className="col-12 mb-4">
                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <i className="fas fa-users text-white"></i>
                        </div>
                        <h4 className="mb-0">{emrPatients.length}</h4>
                        <small className="text-muted">Patients</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <i className="fas fa-prescription text-white"></i>
                        </div>
                        <h4 className="mb-0">{emrPrescriptions.length}</h4>
                        <small className="text-muted">Prescriptions</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <i className="fas fa-calendar-check text-white"></i>
                        </div>
                        <h4 className="mb-0">{stats.completed}</h4>
                        <small className="text-muted">Visits Today</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="card h-100">
                      <div className="card-body text-center">
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <i className="fas fa-file-medical text-white"></i>
                        </div>
                        <h4 className="mb-0">{emrSubscription.daysRemaining || '-'}</h4>
                        <small className="text-muted">Days Left</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patients */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><i className="fas fa-users me-2"></i>Recent Patients</h6>
                    <button className="btn btn-sm btn-outline-primary" onClick={fetchEmrPatients}>
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  </div>
                  <div className="card-body p-0">
                    {emrPatients.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="fas fa-user-plus fa-2x text-muted mb-2"></i>
                        <p className="text-muted mb-0">No patients registered yet</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {emrPatients.slice(0, 5).map(patient => (
                          <div key={patient._id} className="list-group-item d-flex align-items-center">
                            <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                              {patient.name?.charAt(0) || 'P'}
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{patient.name}</h6>
                              <small className="text-muted">{patient.phone || patient.email}</small>
                            </div>
                            <span className="badge bg-light text-dark">{patient.gender || '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Prescriptions */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><i className="fas fa-prescription me-2"></i>Recent Prescriptions</h6>
                    <button className="btn btn-sm btn-outline-primary" onClick={fetchEmrPrescriptions}>
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  </div>
                  <div className="card-body p-0">
                    {emrPrescriptions.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="fas fa-file-prescription fa-2x text-muted mb-2"></i>
                        <p className="text-muted mb-0">No prescriptions yet</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {emrPrescriptions.slice(0, 5).map(rx => (
                          <div key={rx._id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{rx.patientId?.name || 'Unknown Patient'}</h6>
                                <small className="text-muted">{rx.diagnosis || 'No diagnosis'}</small>
                              </div>
                              <small className="text-muted">{new Date(rx.createdAt).toLocaleDateString()}</small>
                            </div>
                            <div className="mt-1">
                              <span className="badge bg-info me-1">{rx.medicines?.length || 0} medicines</span>
                              {rx.followUpDate && (
                                <span className="badge bg-warning text-dark">
                                  <i className="fas fa-calendar me-1"></i>
                                  Follow-up: {new Date(rx.followUpDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* EMR Features Info */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="fas fa-info-circle me-2"></i>Available EMR Features</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {[
                        { icon: 'fa-user-plus', label: 'Patient Registration', desc: 'Register walk-in patients', available: true },
                        { icon: 'fa-prescription', label: 'Prescriptions', desc: 'Create digital prescriptions', available: true },
                        { icon: 'fa-history', label: 'Visit History', desc: 'Track patient visits', available: emrSubscription.plan !== 'basic' },
                        { icon: 'fa-notes-medical', label: 'Doctor Notes', desc: 'Add clinical notes', available: emrSubscription.plan !== 'basic' },
                        { icon: 'fa-chart-line', label: 'Analytics', desc: 'View clinic analytics', available: emrSubscription.plan === 'advanced' },
                        { icon: 'fa-file-export', label: 'Data Export', desc: 'Export patient data', available: emrSubscription.plan === 'advanced' }
                      ].map((feature, i) => (
                        <div key={i} className="col-6 col-md-4">
                          <div className={`p-3 rounded-3 ${feature.available ? 'bg-light' : 'bg-light opacity-50'}`}>
                            <div className="d-flex align-items-center">
                              <i className={`fas ${feature.icon} me-2 ${feature.available ? 'text-primary' : 'text-muted'}`}></i>
                              <div>
                                <strong className={feature.available ? '' : 'text-muted'}>{feature.label}</strong>
                                {!feature.available && <span className="badge bg-secondary ms-2" style={{ fontSize: '0.6rem' }}>Upgrade</span>}
                                <br />
                                <small className="text-muted">{feature.desc}</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Imaging Tab */}
      {activeTab === 'imaging' && (
        <main id="imaging-panel" role="tabpanel" aria-labelledby="imaging-tab">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 py-3" style={{ borderRadius: '16px 16px 0 0' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-x-ray me-2 text-primary"></i>
                  Patient Medical Imaging (DICOM)
                </h5>
              </div>
            </div>
            <div className="card-body">
              {imagingLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : (
                <div className="row">
                  {/* Patient List */}
                  <div className="col-md-4">
                    <h6 className="mb-3">
                      <i className="fas fa-users me-2"></i>
                      Select Patient
                    </h6>
                    <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {imagingPatients.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <i className="fas fa-user-slash fa-2x mb-2"></i>
                          <p>No patients found</p>
                        </div>
                      ) : (
                        imagingPatients.map(patient => (
                          <button
                            key={patient._id}
                            className={`list-group-item list-group-item-action ${selectedImagingPatient?._id === patient._id ? 'active' : ''}`}
                            onClick={() => setSelectedImagingPatient(patient)}
                          >
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <i className="fas fa-user-circle fa-2x text-secondary"></i>
                              </div>
                              <div>
                                <strong>{patient.name}</strong>
                                <br />
                                <small className="text-muted">{patient.phone || patient.email}</small>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Studies List */}
                  <div className="col-md-8">
                    {selectedImagingPatient ? (
                      <>
                        <h6 className="mb-3">
                          <i className="fas fa-images me-2"></i>
                          Imaging Studies for {selectedImagingPatient.name}
                        </h6>
                        {imagingStudies.length === 0 ? (
                          <div className="text-center text-muted py-5">
                            <i className="fas fa-x-ray fa-3x mb-3"></i>
                            <p>No imaging studies found for this patient</p>
                            <small>Patient can upload DICOM files from their dashboard</small>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {imagingStudies.map(study => (
                              <div key={study._id} className="col-md-6">
                                <div 
                                  className="card h-100 border cursor-pointer hover-shadow"
                                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                  onClick={() => {
                                    setSelectedStudy({
                                      studyId: study._id,
                                      studyInstanceUID: study.studyInstanceUID,
                                      series: study.series || [],
                                      studyDate: study.studyDate,
                                      modality: study.modality,
                                      studyDescription: study.studyDescription,
                                      dicomPatientName: study.dicomPatientName,
                                      totalImages: study.totalImages,
                                      totalSeries: study.totalSeries
                                    });
                                    setShowImagingViewer(true);
                                  }}
                                >
                                  <div className="card-body">
                                    <div className="d-flex align-items-start">
                                      <div className="me-3">
                                        <div 
                                          className="d-flex align-items-center justify-content-center"
                                          style={{ 
                                            width: '50px', 
                                            height: '50px', 
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                                          }}
                                        >
                                          <i className="fas fa-x-ray text-white fa-lg"></i>
                                        </div>
                                      </div>
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1">{study.modality || 'Unknown'}</h6>
                                        <p className="text-muted mb-1 small">
                                          {study.studyDescription || 'No description'}
                                        </p>
                                        <div className="d-flex gap-2 flex-wrap">
                                          <span className="badge bg-light text-dark">
                                            <i className="fas fa-calendar me-1"></i>
                                            {study.studyDate ? new Date(study.studyDate).toLocaleDateString() : 'Unknown date'}
                                          </span>
                                          <span className="badge bg-light text-dark">
                                            <i className="fas fa-images me-1"></i>
                                            {study.totalImages || 0} images
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <i className="fas fa-chevron-right text-muted"></i>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="fas fa-hand-pointer fa-3x mb-3"></i>
                        <p>Select a patient to view their imaging studies</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Professional DICOM Viewer Modal */}
      {showImagingViewer && selectedStudy && (
        <ProfessionalDicomViewer
          study={selectedStudy}
          patientId={selectedImagingPatient?._id}
          onBack={() => {
            setShowImagingViewer(false);
            setSelectedStudy(null);
          }}
        />
      )}

      {/* Prescription Modal */}
      {showPrescription && prescriptionPatient && (
        <PrescriptionManager
          doctorId={doctorId}
          doctorName={doctor.name}
          patientId={prescriptionPatient.userId?._id || prescriptionPatient.userId || prescriptionPatient.walkInPatient?._id || prescriptionPatient.patientId}
          patientName={prescriptionPatient.userId?.name || prescriptionPatient.walkInPatient?.name || prescriptionPatient.patientName || 'Patient'}
          appointmentId={prescriptionPatient._id}
          onClose={() => { setShowPrescription(false); setPrescriptionPatient(null); }}
          onSave={() => { setShowPrescription(false); setPrescriptionPatient(null); toast.success('Prescription saved!'); }}
        />
      )}

      {/* Walk-In Patient Modal */}
      {showWalkInModal && (
        <WalkInPatientModal
          doctor={doctor}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={(newAppointment) => {
            fetchQueue(); // Refresh the queue
            toast.success(`Walk-in patient added! Token #${newAppointment.queueNumber}`);
          }}
        />
      )}

      {/* Doctor Support Modal */}
      {showSupport && (
        <DoctorSupport onClose={() => setShowSupport(false)} />
      )}

      {/* Doctor Controls Modal */}
      {showControls && (
        <DoctorControls 
          doctor={doctor} 
          onClose={() => setShowControls(false)}
          onUpdate={() => fetchQueue()}
        />
      )}
    </article>
  );
}

export default DoctorDashboard;

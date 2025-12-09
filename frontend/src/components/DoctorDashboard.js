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
      
      // Auto-refresh queue every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId, fetchQueue]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/appointments/doctor/${doctorId}`);
      setAppointments(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
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
      await axios.put(`/api/appointments/${appointmentId}/status`, { status });
      toast.success(`Appointment ${status}`);
      fetchAppointments();
      fetchQueue();
    } catch (error) {
      toast.error("Failed to update appointment");
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
    <div className="container-fluid py-4">
      {/* Security Warning Banner */}
      <SecurityWarningBanner userId={doctorId} />
      
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-gradient text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {doctor.profilePhoto ? (
                    <img src={doctor.profilePhoto} alt={doctor.name} className="rounded-circle me-3" style={{ width: "60px", height: "60px", objectFit: "cover", border: "3px solid white" }} />
                  ) : (
                    <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center me-3" style={{ width: "60px", height: "60px" }}>
                      <i className="fas fa-user-md fa-2x"></i>
                    </div>
                  )}
                  <div>
                    <h4 className="mb-0">Dr. {doctor.name}</h4>
                    <p className="mb-0 opacity-75">{doctor.specialization} | {doctor.clinicId?.name || "Clinic"}</p>
                  </div>
                </div>
                <button className="btn btn-light" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: "Today's Appointments", value: stats.today, icon: "calendar-day", color: "primary" },
          { label: "Pending", value: stats.pending, icon: "clock", color: "warning" },
          { label: "Completed", value: stats.completed, icon: "check-circle", color: "success" },
          { label: "Total Patients", value: stats.total, icon: "users", color: "info" }
        ].map((stat, i) => (
          <div key={i} className="col-md-3 col-6 mb-3">
            <div className="card h-100">
              <div className="card-body text-center">
                <i className={`fas fa-${stat.icon} fa-2x text-${stat.color} mb-2`}></i>
                <h3 className="mb-0">{stat.value}</h3>
                <small className="text-muted">{stat.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="doctor-dashboard-tabs mb-4">
        <button 
          className={`doctor-tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <i className="fas fa-users me-2"></i>
          Patient Queue
          {queue.length > 0 && <span className="badge bg-danger ms-2">{queue.length}</span>}
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <i className="fas fa-calendar-alt me-2"></i>
          All Appointments
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <i className="fas fa-clock me-2"></i>
          My Schedule
        </button>
        <button 
          className={`doctor-tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <i className="fas fa-wallet me-2"></i>
          My Wallet
        </button>
      </div>

      {/* Patient Queue Section */}
      {activeTab === 'queue' && (
        <div className="row">
          {/* Current Patient */}
          <div className="col-lg-5 mb-4">
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
                      {currentPatient.userId?.name?.charAt(0) || 'P'}
                    </div>
                    <h4>{currentPatient.userId?.name || 'Unknown Patient'}</h4>
                    <p className="text-muted mb-2">
                      <i className="fas fa-phone me-2"></i>
                      {currentPatient.userId?.phone || 'N/A'}
                    </p>
                    <div className="patient-details">
                      <span className="badge bg-info me-2">
                        Token #{currentPatient.tokenNumber || '-'}
                      </span>
                      <span className="badge bg-secondary">
                        {formatTime(currentPatient.time)}
                      </span>
                    </div>
                    <p className="mt-3 mb-2"><strong>Reason:</strong></p>
                    <p className="text-muted">{currentPatient.reason}</p>
                    
                    <div className="current-patient-actions mt-4">
                      <button 
                        className="btn btn-primary btn-lg w-100 mb-2"
                        onClick={() => { setPrescriptionPatient(currentPatient); setShowPrescription(true); }}
                      >
                        <i className="fas fa-prescription me-2"></i>
                        Write Prescription
                      </button>
                      <button 
                        className="btn btn-success btn-lg w-100 mb-2"
                        onClick={completeCurrentPatient}
                      >
                        <i className="fas fa-check-circle me-2"></i>
                        Complete Consultation
                      </button>
                      {currentPatient.consultationType === 'online' && currentPatient.googleMeetLink && (
                        <div className="online-consultation-section">
                          <div className="alert alert-warning mb-2 py-2">
                            <i className="fas fa-info-circle me-2"></i>
                            <small><strong>Important:</strong> Click "Start Meeting" first so patients can join</small>
                          </div>
                          <a 
                            href={currentPatient.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary w-100 mb-2"
                            style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)', border: 'none' }}
                          >
                            <i className="fas fa-video me-2"></i>
                            🎬 Start Meeting (Join as Host)
                          </a>
                          <small className="text-muted d-block text-center">
                            You must join first to let patients enter
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-user-clock fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No patient currently being seen</p>
                    {queue.length > 0 && (
                      <button 
                        className="btn btn-primary btn-lg mt-2"
                        onClick={callNextPatient}
                      >
                        <i className="fas fa-bell me-2"></i>
                        Call First Patient
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Waiting Queue */}
          <div className="col-lg-7 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-list-ol me-2"></i>
                  Waiting Queue ({queue.length})
                </h5>
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
                {queue.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <p className="text-muted">No patients waiting</p>
                  </div>
                ) : (
                  <div className="queue-list">
                    {queue.map((patient, index) => {
                      // Calculate estimated wait time (15 min per patient + 5 min buffer)
                      const estimatedWaitMinutes = index * 20;
                      const estimatedTime = new Date(Date.now() + estimatedWaitMinutes * 60000);
                      const estimatedTimeStr = estimatedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                      
                      return (
                        <div key={patient._id} className={`queue-item ${index === 0 ? 'next-up' : ''}`}>
                          <div className="queue-position">
                            {index + 1}
                          </div>
                          <div className="queue-patient-info">
                            <h6 className="mb-0">{patient.userId?.name || 'Unknown'}</h6>
                            <small className="text-muted">
                              Token #{patient.tokenNumber || '-'} • {formatTime(patient.time)}
                            </small>
                            <br />
                            <small className="text-muted">{patient.reason}</small>
                            <div className="mt-1">
                              <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>
                                <i className="fas fa-clock me-1"></i>
                                Est. ~{estimatedWaitMinutes} min ({estimatedTimeStr})
                              </span>
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0"><i className="fas fa-calendar-alt me-2"></i>Appointments</h5>
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAppointments().map(apt => (
                    <tr key={apt._id}>
                      <td>
                        <strong>{apt.userId?.name || "Unknown"}</strong>
                        <br /><small className="text-muted">{apt.userId?.phone}</small>
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
      </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <DoctorScheduleManager doctorId={doctorId} />
      )}

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <DoctorWallet doctorId={doctorId} doctorName={doctor.name} />
      )}

      {/* Prescription Modal */}
      {showPrescription && prescriptionPatient && (
        <PrescriptionManager
          doctorId={doctorId}
          doctorName={doctor.name}
          patientId={prescriptionPatient.userId?._id}
          patientName={prescriptionPatient.userId?.name || 'Patient'}
          appointmentId={prescriptionPatient._id}
          onClose={() => { setShowPrescription(false); setPrescriptionPatient(null); }}
          onSave={() => { setShowPrescription(false); setPrescriptionPatient(null); toast.success('Prescription saved!'); }}
        />
      )}
    </div>
  );
}

export default DoctorDashboard;

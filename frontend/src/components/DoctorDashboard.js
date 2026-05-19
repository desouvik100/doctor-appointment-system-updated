import { useState, useEffect, useCallback } from "react";
import axios from "../api/config";
import toast from "react-hot-toast";
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

// ── Systematic History Indicator ─────────────────────────────────────────────
const SystematicHistoryIndicator = ({ appointmentId }) => {
  const [hasHistory, setHasHistory] = useState(null);
  useEffect(() => {
    if (!appointmentId) return;
    axios.get(`/api/systematic-history/appointment/${appointmentId}`)
      .then(r => setHasHistory(r.data.success && r.data.history))
      .catch(() => setHasHistory(false));
  }, [appointmentId]);
  if (hasHistory === null) return <span className="text-slate-400 text-xs">…</span>;
  return hasHistory ? (
    <span title="Systematic history available" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs">
      <i className="fas fa-clipboard-check"></i>
    </span>
  ) : (
    <span title="No systematic history" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs">
      <i className="fas fa-clipboard"></i>
    </span>
  );
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:     "bg-amber-100 text-amber-700",
    confirmed:   "bg-blue-100 text-blue-700",
    in_progress: "bg-sky-100 text-sky-700",
    completed:   "bg-emerald-100 text-emerald-700",
    cancelled:   "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};

const BookingSourceBadge = ({ apt }) => {
  if (apt.isWalkIn || apt.bookingSource === "offline")
    return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700"><i className="fas fa-walking mr-1"></i>Walk-In</span>;
  if (apt.bookingSource === "receptionist")
    return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700"><i className="fas fa-user-tie mr-1"></i>Receptionist</span>;
  if (apt.bookingSource === "phone")
    return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700"><i className="fas fa-phone mr-1"></i>Phone</span>;
  return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700"><i className="fas fa-globe mr-1"></i>Online</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────
function DoctorDashboard({ doctor, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, completed: 0 });
  const [activeTab, setActiveTab] = useState("queue");
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [queueFilter, setQueueFilter] = useState("all");
  const [showSupport, setShowSupport] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [consultationTime, setConsultationTime] = useState(0);
  const [emrSubscription, setEmrSubscription] = useState(null);
  const [emrLoading, setEmrLoading] = useState(false);
  const [emrPatients, setEmrPatients] = useState([]);
  const [emrPrescriptions, setEmrPrescriptions] = useState([]);
  const [systematicHistory, setSystematicHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [imagingPatients, setImagingPatients] = useState([]);
  const [selectedImagingPatient, setSelectedImagingPatient] = useState(null);
  const [imagingStudies, setImagingStudies] = useState([]);
  const [imagingLoading, setImagingLoading] = useState(false);
  const [showImagingViewer, setShowImagingViewer] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState(null);

  const doctorId = doctor.id || doctor._id;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getClinicId = () => {
    if (!doctor.clinicId) return null;
    if (typeof doctor.clinicId === "object" && doctor.clinicId._id) return doctor.clinicId._id;
    if (typeof doctor.clinicId === "string") return doctor.clinicId;
    if (doctor.clinicId.$oid) return doctor.clinicId.$oid;
    return null;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const formatTime = (t) => { const [h, m] = t.split(":"); const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
  const formatConsultationTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const res = await axios.get(`/api/appointments/doctor/${doctorId}/queue?date=${today}`);
      const data = res.data || [];
      const inProgress = data.find(a => a.status === "in_progress");
      const waiting = data.filter(a => a.status === "confirmed" || a.status === "pending")
        .sort((a, b) => a.tokenNumber && b.tokenNumber ? a.tokenNumber - b.tokenNumber : a.time.localeCompare(b.time));
      setCurrentPatient(inProgress || null);
      setQueue(waiting);
    } catch { /* silent */ } finally { setQueueLoading(false); }
  }, [doctorId]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`/api/appointments/doctor/${doctorId}`);
      setAppointments(res.data || []);
      const data = res.data || [];
      const today = new Date().toDateString();
      setStats({
        total: data.length,
        today: data.filter(a => new Date(a.date).toDateString() === today).length,
        pending: data.filter(a => a.status === "pending" || a.status === "confirmed").length,
        completed: data.filter(a => a.status === "completed").length,
      });
    } catch { toast.error("Failed to load appointments"); setAppointments([]); }
    finally { setLoading(false); }
  };

  const fetchEmrSubscription = async () => {
    const clinicId = getClinicId();
    if (!clinicId) { setEmrLoading(false); return; }
    try {
      setEmrLoading(true);
      const res = await axios.get(`/api/emr/subscription/${clinicId}`);
      setEmrSubscription(res.data.success && res.data.subscription ? res.data.subscription : null);
    } catch { setEmrSubscription(null); } finally { setEmrLoading(false); }
  };

  const fetchEmrPatients = async () => {
    const clinicId = getClinicId(); if (!clinicId) return;
    try { const r = await axios.get(`/api/emr/patients/clinic/${clinicId}`); if (r.data.success) setEmrPatients(r.data.patients || []); } catch {}
  };

  const fetchEmrPrescriptions = async () => {
    const clinicId = getClinicId(); if (!clinicId) return;
    try { const r = await axios.get(`/api/prescriptions/clinic/${clinicId}`); if (r.data.success) setEmrPrescriptions(r.data.prescriptions || []); } catch {}
  };

  const fetchImagingPatients = async () => {
    try {
      setImagingLoading(true);
      const res = await axios.get(`/api/appointments/doctor/${doctorId}`);
      const map = new Map();
      (res.data || []).forEach(apt => { const p = apt.userId; if (p?._id && !map.has(p._id)) map.set(p._id, { _id: p._id, name: p.name, email: p.email, phone: p.phone }); });
      setImagingPatients(Array.from(map.values()));
    } catch {} finally { setImagingLoading(false); }
  };

  const fetchPatientImagingStudies = async (patientId) => {
    try {
      setImagingLoading(true);
      const r = await axios.get(`/api/imaging/patients/${patientId}/studies`);
      setImagingStudies(r.data.success ? r.data.data || [] : []);
    } catch { setImagingStudies([]); } finally { setImagingLoading(false); }
  };

  const fetchSystematicHistory = async (appointmentId) => {
    if (!appointmentId) { setSystematicHistory(null); return; }
    try {
      setHistoryLoading(true);
      const r = await axios.get(`/api/systematic-history/appointment/${appointmentId}`);
      setSystematicHistory(r.data.success && r.data.history ? r.data.history : null);
    } catch { setSystematicHistory(null); } finally { setHistoryLoading(false); }
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (doctorId) { fetchAppointments(); fetchQueue(); fetchEmrSubscription(); const iv = setInterval(fetchQueue, 30000); return () => clearInterval(iv); }
  }, [doctorId, fetchQueue]);

  useEffect(() => {
    if (!doctorId) return;
    const hb = async () => { try { await axios.post(`/api/doctors/${doctorId}/heartbeat`); } catch {} };
    hb(); const iv = setInterval(hb, 30000);
    const bye = () => navigator.sendBeacon(`/api/doctors/${doctorId}/go-offline`);
    window.addEventListener("beforeunload", bye);
    return () => { clearInterval(iv); window.removeEventListener("beforeunload", bye); axios.post(`/api/doctors/${doctorId}/go-offline`).catch(() => {}); };
  }, [doctorId]);

  useEffect(() => { if (currentPatient?._id) fetchSystematicHistory(currentPatient._id); else setSystematicHistory(null); }, [currentPatient]);
  useEffect(() => { if (activeTab === "emr" && emrSubscription) { fetchEmrPatients(); fetchEmrPrescriptions(); } }, [activeTab, emrSubscription]);
  useEffect(() => { if (activeTab === "imaging") fetchImagingPatients(); }, [activeTab]);
  useEffect(() => { if (selectedImagingPatient) fetchPatientImagingStudies(selectedImagingPatient._id); else setImagingStudies([]); }, [selectedImagingPatient]);

  useEffect(() => {
    let timer;
    const startTime = currentPatient?.consultationStartedAt || currentPatient?.consultationStartTime;
    if (startTime) { const ms = new Date(startTime).getTime(); timer = setInterval(() => setConsultationTime(Math.floor((Date.now() - ms) / 1000)), 1000); }
    else setConsultationTime(0);
    return () => clearInterval(timer);
  }, [currentPatient]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const updateAppointmentStatus = async (id, status) => {
    try {
      const res = await axios.put(`/api/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status === "in_progress" ? "started" : status}`);
      if (status === "in_progress" && res.data) setCurrentPatient(res.data);
      fetchAppointments(); fetchQueue();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to update appointment"); }
  };

  const callNextPatient = async () => {
    if (!queue.length) { toast.error("No patients in queue"); return; }
    if (currentPatient) await updateAppointmentStatus(currentPatient._id, "completed");
    await updateAppointmentStatus(queue[0]._id, "in_progress");
    toast.success(`Calling ${queue[0].userId?.name || "Patient"}`);
  };

  const skipPatient = async (id) => { try { await axios.put(`/api/appointments/${id}/skip`); toast.success("Patient moved to end"); fetchQueue(); } catch { toast.error("Failed to skip"); } };
  const markNoShow = async (id) => { try { await axios.put(`/api/appointments/${id}/status`, { status: "cancelled", reason: "No show" }); toast.success("Marked as no-show"); fetchQueue(); fetchAppointments(); } catch { toast.error("Failed"); } };
  const notifyPatient = async (id) => { try { toast.loading("Sending…", { id: "n" }); const r = await axios.post(`/api/appointments/${id}/notify-patient`); toast.success(r.data.reason || `Notified! Position #${r.data.position}`, { id: "n" }); } catch { toast.error("Failed", { id: "n" }); } };
  const notifyUpcomingPatients = async () => { try { toast.loading("Sending…", { id: "na" }); const r = await axios.post(`/api/appointments/doctor/${doctorId}/notify-queue`, { notifyAtPosition: 3 }); toast.success(`Notified ${r.data.results?.filter(x => x.notified).length || 0} patient(s)`, { id: "na" }); } catch { toast.error("Failed", { id: "na" }); } };
  const regenerateMeetLink = async (id) => { try { toast.loading("Generating…", { id: "mg" }); const r = await axios.post(`/api/appointments/${id}/generate-meeting`); if (r.data.success) { toast.success("Link generated!", { id: "mg" }); fetchAppointments(); fetchQueue(); } else toast.error(r.data.message || "Failed", { id: "mg" }); } catch { toast.error("Failed", { id: "mg" }); } };

  const getFilteredAppointments = () => {
    const today = new Date().toDateString();
    if (filter === "today") return appointments.filter(a => new Date(a.date).toDateString() === today);
    if (filter === "upcoming") return appointments.filter(a => new Date(a.date) >= new Date() && a.status !== "completed");
    if (filter === "completed") return appointments.filter(a => a.status === "completed");
    return appointments;
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SecurityWarningBanner userId={doctorId} />

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white px-4 py-4 sm:py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Doctor info */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {doctor.profilePhoto ? (
              <img src={doctor.profilePhoto} alt={doctor.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-white/30 shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                <i className="fas fa-user-md text-xl sm:text-2xl text-white"></i>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">Dr. {doctor.name}</h1>
              <p className="text-white/85 text-xs sm:text-sm truncate"><i className="fas fa-stethoscope mr-1.5"></i>{doctor.specialization}</p>
              <p className="text-white/70 text-xs truncate"><i className="fas fa-hospital mr-1.5"></i>{doctor.clinicId?.name || "Independent Practice"}</p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-white/70 text-xs mr-1 hidden md:block whitespace-nowrap">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </span>
            <button onClick={() => setShowControls(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md">
              <i className="fas fa-sliders-h"></i><span className="hidden xs:inline sm:inline">Controls</span>
            </button>
            <button onClick={() => setShowSupport(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all border border-white/20">
              <i className="fas fa-headset"></i><span className="hidden sm:inline">Support</span>
              <span className="hidden lg:inline-flex items-center gap-1 text-xs bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>Live
              </span>
            </button>
            <button onClick={onLogout}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/90 hover:bg-white text-teal-700 font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md ml-auto sm:ml-0">
              <i className="fas fa-sign-out-alt"></i><span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ── Stats ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Today",     value: stats.today,     icon: "calendar-day",    from: "from-blue-500",    to: "to-blue-700" },
            { label: "Pending",   value: stats.pending,   icon: "hourglass-half",  from: "from-amber-400",   to: "to-amber-600" },
            { label: "Completed", value: stats.completed, icon: "check-circle",    from: "from-emerald-500", to: "to-emerald-700" },
            { label: "Total",     value: stats.total,     icon: "users",           from: "from-violet-500",  to: "to-violet-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center flex-shrink-0 shadow-md`}>
                <i className={`fas fa-${s.icon} text-white text-base sm:text-lg`}></i>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Tabs ── */}
        <nav className="flex gap-1 bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {[
            { id: "queue",        icon: "users",         label: "Queue",       badge: queue.length > 0 ? queue.length : null },
            { id: "appointments", icon: "calendar-alt",  label: "Bookings" },
            { id: "schedule",     icon: "clock",         label: "Schedule" },
            { id: "wallet",       icon: "wallet",        label: "Wallet" },
            { id: "emr",          icon: "notes-medical", label: "EMR",         badge: emrSubscription ? "●" : null, badgeColor: "bg-emerald-500" },
            { id: "imaging",      icon: "x-ray",         label: "Imaging" },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === t.id
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <i className={`fas fa-${t.icon} text-xs`}></i>
              <span>{t.label}</span>
              {t.badge && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-4 sm:h-5 px-1 rounded-full text-[10px] sm:text-xs font-bold text-white ${t.badgeColor || "bg-red-500"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ══════════════════════════════════════════════════════════════════════
            QUEUE TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "queue" && (
          <div className="space-y-4">

            {/* Daily Summary */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 sm:mb-4 flex items-center gap-2">
                <i className="fas fa-chart-line text-teal-500"></i>Today at a Glance
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                {[
                  { label: "Seen",     value: stats.completed,                                                  color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Waiting",  value: queue.length,                                                     color: "text-amber-600",   bg: "bg-amber-50" },
                  { label: "Earnings", value: `₹${(stats.completed * (doctor.consultationFee || 500)).toLocaleString()}`, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Avg Time", value: `~${doctor.consultationDuration || 20}m`,                         color: "text-violet-600",  bg: "bg-violet-50" },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-2.5 sm:p-3 text-center`}>
                    <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-users text-teal-500"></i>
                Today's Queue
                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                  {queue.length + (currentPatient ? 1 : 0)}
                </span>
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button onClick={fetchQueue} disabled={queueLoading}
                  className="w-8 h-8 sm:w-auto sm:h-auto inline-flex items-center justify-center sm:gap-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-all disabled:opacity-50">
                  <i className={`fas fa-sync-alt text-xs ${queueLoading ? "animate-spin" : ""}`}></i>
                </button>
                {queue.length > 0 && (
                  <button onClick={notifyUpcomingPatients}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs sm:text-sm font-medium transition-all">
                    <i className="fas fa-bell text-xs"></i><span>Notify</span>
                  </button>
                )}
                {queue.length > 0 && !currentPatient && (
                  <button onClick={callNextPatient}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs sm:text-sm font-medium transition-all">
                    <i className="fas fa-phone-alt text-xs"></i><span>Call Next</span>
                  </button>
                )}
                <button onClick={() => setShowWalkInModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm">
                  <i className="fas fa-user-plus text-xs"></i><span>Walk-In</span>
                </button>
              </div>
            </div>

            {/* Queue Type Filter */}
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: "all",      label: `All (${queue.length})`,                                                      icon: "layer-group" },
                { id: "in_clinic",label: `Clinic (${queue.filter(p => p.consultationType !== "online").length})`,       icon: "hospital" },
                { id: "virtual",  label: `Online (${queue.filter(p => p.consultationType === "online").length})`,       icon: "video" },
              ].map((f) => (
                <button key={f.id} onClick={() => setQueueFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    queueFilter === f.id ? "bg-teal-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
                  }`}>
                  <i className={`fas fa-${f.icon} text-xs`}></i>{f.label}
                </button>
              ))}
            </div>

            {/* Queue Grid: Current Patient + Waiting List */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

              {/* Current Patient */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-3">
                    <h5 className="text-white font-semibold text-sm flex items-center gap-2">
                      <i className="fas fa-user-check"></i>Current Patient
                    </h5>
                  </div>
                  <div className="p-5">
                    {currentPatient ? (
                      <div className="space-y-3">
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {(currentPatient.isWalkIn ? currentPatient.walkInPatient?.name : currentPatient.userId?.name)?.charAt(0) || "P"}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              {currentPatient.isWalkIn ? (currentPatient.walkInPatient?.name || "Walk-In Patient") : (currentPatient.userId?.name || "Unknown Patient")}
                            </h4>
                            <p className="text-xs text-slate-500">
                              <i className="fas fa-phone mr-1"></i>
                              {currentPatient.isWalkIn ? (currentPatient.walkInPatient?.phone || "N/A") : (currentPatient.userId?.phone || "N/A")}
                            </p>
                          </div>
                        </div>
                        {/* Type + Timer */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${currentPatient.consultationType === "online" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"}`}>
                            <i className={`fas ${currentPatient.consultationType === "online" ? "fa-video" : "fa-hospital"} text-xs`}></i>
                            {currentPatient.consultationType === "online" ? "Online" : "In-Clinic"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <i className="fas fa-stopwatch text-xs"></i>{formatConsultationTime(consultationTime)} elapsed
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                            Token #{currentPatient.tokenNumber || currentPatient.queueNumber || "-"}
                          </span>
                        </div>
                        {currentPatient.reason && (
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                            <span className="font-semibold">Reason: </span>{currentPatient.reason}
                          </p>
                        )}
                        {/* Systematic History */}
                        {historyLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>Loading history…
                          </div>
                        ) : systematicHistory ? (
                          <SystematicHistorySummary history={systematicHistory} compact={true} expandable={true} />
                        ) : (
                          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-2.5 flex items-center gap-1.5">
                            <i className="fas fa-info-circle text-sky-400"></i>No systematic history available
                          </p>
                        )}
                        {/* Action Buttons */}
                        <div className="space-y-2 pt-1">
                          {currentPatient.consultationType === "online" && currentPatient.googleMeetLink && (
                            <a href={currentPatient.googleMeetLink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">
                              <i className="fas fa-video"></i>Join Video Call
                            </a>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => { setPrescriptionPatient(currentPatient); setShowPrescription(true); }}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-semibold transition-all">
                              <i className="fas fa-prescription"></i>Prescription
                            </button>
                            <button onClick={() => updateAppointmentStatus(currentPatient._id, "completed")}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all">
                              <i className="fas fa-check-circle"></i>Complete
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => updateAppointmentStatus(currentPatient._id, "confirmed")}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all">
                              <i className="fas fa-undo"></i>Back to Queue
                            </button>
                            <button onClick={() => markNoShow(currentPatient._id)}
                              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold transition-all">
                              <i className="fas fa-user-slash"></i>No Show
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                          <i className="fas fa-user-clock text-2xl text-slate-400"></i>
                        </div>
                        <h5 className="font-semibold text-slate-700 text-sm">No patient in consultation</h5>
                        <p className="text-xs text-slate-400">{queue.length > 0 ? `${queue.length} patient${queue.length > 1 ? "s" : ""} waiting` : "Walk-ins will appear here"}</p>
                        {queue.length > 0 && (
                          <button onClick={callNextPatient}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all">
                            <i className="fas fa-phone-alt"></i>Call Next Patient
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Waiting Queue */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <i className={`fas ${queueFilter === "virtual" ? "fa-video" : queueFilter === "in_clinic" ? "fa-hospital" : "fa-list-ol"} text-teal-500`}></i>
                      Waiting Queue
                    </h3>
                    <div className="flex items-center gap-2">
                      <button onClick={fetchQueue} disabled={queueLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all disabled:opacity-50">
                        <i className={`fas fa-sync text-xs ${queueLoading ? "animate-spin" : ""}`}></i>
                      </button>
                      {queue.length > 0 && currentPatient && (
                        <button onClick={callNextPatient}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold transition-all">
                          <i className="fas fa-forward text-xs"></i>Next
                        </button>
                      )}
                    </div>
                  </div>
                  {(() => {
                    const filtered = queueFilter === "all" ? queue : queueFilter === "virtual" ? queue.filter(p => p.consultationType === "online") : queue.filter(p => p.consultationType !== "online");
                    if (!filtered.length) return (
                      <div className="text-center py-12 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                          <i className="fas fa-check-circle text-2xl text-emerald-400"></i>
                        </div>
                        <h4 className="font-semibold text-slate-700">All Clear!</h4>
                        <p className="text-xs text-slate-400">No patients waiting</p>
                        <button onClick={() => setShowWalkInModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-all">
                          <i className="fas fa-user-plus"></i>Add Walk-In
                        </button>
                      </div>
                    );
                    return (
                      <div className="divide-y divide-slate-50">
                        {filtered.map((patient, idx) => {
                          const waitMins = idx * 20;
                          const estTime = new Date(Date.now() + waitMins * 60000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                          return (
                            <div key={patient._id} className={`flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-slate-50 transition-colors ${idx === 0 ? "bg-teal-50/50" : ""}`}>
                              {/* Position */}
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5 sm:mt-0 ${idx === 0 ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {idx + 1}
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                                    {patient.isWalkIn ? (patient.walkInPatient?.name || "Walk-In") : (patient.userId?.name || "Unknown")}
                                  </span>
                                  <BookingSourceBadge apt={patient} />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Token #{patient.tokenNumber || "-"} · {formatTime(patient.time)}
                                  {patient.isWalkIn && patient.walkInPatient?.phone && ` · ${patient.walkInPatient.phone}`}
                                </p>
                                {patient.reason && <p className="text-xs text-slate-500 truncate">{patient.reason}</p>}
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                    ~{waitMins}m ({estTime})
                                  </span>
                                  <SystematicHistoryIndicator appointmentId={patient._id} />
                                </div>
                              </div>
                              {/* Type badge — hidden on xs */}
                              <span className={`hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs flex-shrink-0 ${patient.consultationType === "online" ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"}`}>
                                <i className={`fas ${patient.consultationType === "online" ? "fa-video" : "fa-hospital"}`}></i>
                              </span>
                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {idx === 0 && !currentPatient && (
                                  <button onClick={() => updateAppointmentStatus(patient._id, "in_progress")} title="Start"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-all">
                                    <i className="fas fa-play text-xs"></i>
                                  </button>
                                )}
                                <button onClick={() => notifyPatient(patient._id)} title="Notify"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-600 transition-all">
                                  <i className="fas fa-bell text-xs"></i>
                                </button>
                                <button onClick={() => skipPatient(patient._id)} title="Skip"
                                  className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 transition-all">
                                  <i className="fas fa-step-forward text-xs"></i>
                                </button>
                                <button onClick={() => markNoShow(patient._id)} title="No Show"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all">
                                  <i className="fas fa-user-slash text-xs"></i>
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
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            APPOINTMENTS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                <i className="fas fa-calendar-alt text-teal-500"></i>Appointments
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  {["today", "upcoming", "completed", "all"].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all capitalize ${filter === f ? "bg-teal-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button onClick={() => exportAppointmentsToPDF(getFilteredAppointments(), `Dr. ${doctor.name} - Appointments`)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all">
                  <i className="fas fa-file-pdf text-red-500"></i><span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            </div>

            {getFilteredAppointments().length === 0 ? (
              <div className="text-center py-10 sm:py-12">
                <i className="fas fa-calendar-times text-3xl sm:text-4xl text-slate-300 mb-3"></i>
                <p className="text-slate-400 text-sm">No appointments found</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        {["Patient", "Date", "Time", "Type", "Reason", "History", "Status", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {getFilteredAppointments().map((apt) => (
                        <tr key={apt._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1 flex-wrap text-sm">
                              {apt.isWalkIn ? (apt.walkInPatient?.name || "Walk-In") : (apt.userId?.name || "Unknown")}
                              <BookingSourceBadge apt={apt} />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{apt.isWalkIn ? (apt.walkInPatient?.phone || "N/A") : apt.userId?.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDate(apt.date)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatTime(apt.time)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${apt.consultationType === "online" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                              <i className={`fas ${apt.consultationType === "online" ? "fa-video" : "fa-hospital"} text-xs`}></i>
                              {apt.consultationType === "online" ? "Online" : "In-Clinic"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{apt.reason}</td>
                          <td className="px-4 py-3"><SystematicHistoryIndicator appointmentId={apt._id} /></td>
                          <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {apt.consultationType === "online" && apt.googleMeetLink && (
                                <a href={apt.doctorMeetLink || apt.googleMeetLink} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium transition-all">
                                  <i className="fas fa-video text-xs"></i>Start
                                </a>
                              )}
                              {apt.consultationType === "online" && !apt.googleMeetLink && (
                                <button onClick={() => regenerateMeetLink(apt._id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium transition-all">
                                  <i className="fas fa-sync-alt text-xs"></i>Gen
                                </button>
                              )}
                              {apt.status === "confirmed" && (
                                <button onClick={() => updateAppointmentStatus(apt._id, "in_progress")}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-600 transition-all">
                                  <i className="fas fa-play text-xs"></i>
                                </button>
                              )}
                              {apt.status === "in_progress" && (
                                <button onClick={() => updateAppointmentStatus(apt._id, "completed")}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-all">
                                  <i className="fas fa-check text-xs"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {getFilteredAppointments().map((apt) => (
                    <div key={apt._id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-sm flex items-center gap-1 flex-wrap">
                            {apt.isWalkIn ? (apt.walkInPatient?.name || "Walk-In") : (apt.userId?.name || "Unknown")}
                            <BookingSourceBadge apt={apt} />
                          </div>
                          <p className="text-xs text-slate-400">{apt.isWalkIn ? (apt.walkInPatient?.phone || "N/A") : apt.userId?.phone}</p>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                        <span><i className="fas fa-calendar mr-1 text-teal-400"></i>{formatDate(apt.date)}</span>
                        <span><i className="fas fa-clock mr-1 text-teal-400"></i>{formatTime(apt.time)}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${apt.consultationType === "online" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                          <i className={`fas ${apt.consultationType === "online" ? "fa-video" : "fa-hospital"} text-xs`}></i>
                          {apt.consultationType === "online" ? "Online" : "In-Clinic"}
                        </span>
                      </div>
                      {apt.reason && <p className="text-xs text-slate-500 truncate">{apt.reason}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <SystematicHistoryIndicator appointmentId={apt._id} />
                        {apt.consultationType === "online" && apt.googleMeetLink && (
                          <a href={apt.doctorMeetLink || apt.googleMeetLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                            <i className="fas fa-video text-xs"></i>Start
                          </a>
                        )}
                        {apt.status === "confirmed" && (
                          <button onClick={() => updateAppointmentStatus(apt._id, "in_progress")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 text-xs font-medium">
                            <i className="fas fa-play text-xs"></i>Start
                          </button>
                        )}
                        {apt.status === "in_progress" && (
                          <button onClick={() => updateAppointmentStatus(apt._id, "completed")}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                            <i className="fas fa-check text-xs"></i>Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Schedule Tab ── */}
        {activeTab === "schedule" && <DoctorScheduleManager doctorId={doctorId} />}

        {/* ── Wallet Tab ── */}
        {activeTab === "wallet" && <DoctorWallet doctorId={doctorId} doctorName={doctor.name} />}

        {/* ══════════════════════════════════════════════════════════════════════
            EMR TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "emr" && (
          <div className="space-y-4">
            {emrLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !emrSubscription ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-lock text-2xl text-amber-500"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">EMR Not Available</h3>
                <p className="text-slate-500 text-sm mb-4">Your clinic doesn't have an active EMR subscription.<br />Contact your clinic administrator to enable EMR features.</p>
                <div className="inline-flex items-center gap-2 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700 text-sm">
                  <i className="fas fa-info-circle"></i>EMR features include patient records, prescriptions, visit history, and more.
                </div>
              </div>
            ) : (
              <>
                {/* EMR Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold flex items-center gap-2"><i className="fas fa-crown"></i>EMR {emrSubscription.plan?.charAt(0).toUpperCase() + emrSubscription.plan?.slice(1)} Plan</h5>
                    <p className="text-white/75 text-sm mt-0.5"><i className="fas fa-hospital mr-1.5"></i>{doctor.clinicId?.name || "Your Clinic"}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-xl text-sm font-semibold">
                      <i className="fas fa-check-circle"></i>Active
                    </span>
                    <p className="text-white/70 text-xs mt-1">Expires: {new Date(emrSubscription.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* EMR Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Patients",      value: emrPatients.length,              icon: "users",          from: "from-blue-500",    to: "to-blue-700" },
                    { label: "Prescriptions", value: emrPrescriptions.length,         icon: "prescription",   from: "from-amber-400",   to: "to-amber-600" },
                    { label: "Visits Today",  value: stats.completed,                 icon: "calendar-check", from: "from-emerald-500", to: "to-emerald-700" },
                    { label: "Days Left",     value: emrSubscription.daysRemaining || "-", icon: "file-medical", from: "from-violet-500", to: "to-violet-700" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center flex-shrink-0`}>
                        <i className={`fas fa-${s.icon} text-white text-xs sm:text-sm`}></i>
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-slate-800 leading-none">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Patients + Prescriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h6 className="font-bold text-slate-800 text-sm flex items-center gap-2"><i className="fas fa-users text-teal-500"></i>Recent Patients</h6>
                      <button onClick={fetchEmrPatients} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
                        <i className="fas fa-sync-alt text-xs"></i>
                      </button>
                    </div>
                    {emrPatients.length === 0 ? (
                      <div className="text-center py-8 text-slate-400"><i className="fas fa-user-plus text-2xl mb-2"></i><p className="text-sm">No patients yet</p></div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {emrPatients.slice(0, 5).map(p => (
                          <div key={p._id} className="flex items-center gap-3 px-5 py-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {p.name?.charAt(0) || "P"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                              <p className="text-xs text-slate-400 truncate">{p.phone || p.email}</p>
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{p.gender || "-"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h6 className="font-bold text-slate-800 text-sm flex items-center gap-2"><i className="fas fa-prescription text-teal-500"></i>Recent Prescriptions</h6>
                      <button onClick={fetchEmrPrescriptions} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
                        <i className="fas fa-sync-alt text-xs"></i>
                      </button>
                    </div>
                    {emrPrescriptions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400"><i className="fas fa-file-prescription text-2xl mb-2"></i><p className="text-sm">No prescriptions yet</p></div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {emrPrescriptions.slice(0, 5).map(rx => (
                          <div key={rx._id} className="px-5 py-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{rx.patientId?.name || "Unknown"}</p>
                                <p className="text-xs text-slate-400 truncate">{rx.diagnosis || "No diagnosis"}</p>
                              </div>
                              <p className="text-xs text-slate-400 whitespace-nowrap">{new Date(rx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">{rx.medicines?.length || 0} medicines</span>
                              {rx.followUpDate && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                  <i className="fas fa-calendar mr-1"></i>Follow-up: {new Date(rx.followUpDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* EMR Features */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                  <h6 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><i className="fas fa-info-circle text-teal-500"></i>Available EMR Features</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { icon: "user-plus",    label: "Patient Registration", desc: "Register walk-in patients",    available: true },
                      { icon: "prescription", label: "Prescriptions",        desc: "Create digital prescriptions", available: true },
                      { icon: "history",      label: "Visit History",        desc: "Track patient visits",         available: emrSubscription.plan !== "basic" },
                      { icon: "notes-medical",label: "Doctor Notes",         desc: "Add clinical notes",           available: emrSubscription.plan !== "basic" },
                      { icon: "chart-line",   label: "Analytics",            desc: "View clinic analytics",        available: emrSubscription.plan === "advanced" },
                      { icon: "file-export",  label: "Data Export",          desc: "Export patient data",          available: emrSubscription.plan === "advanced" },
                    ].map((f, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${f.available ? "border-teal-100 bg-teal-50/50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                        <div className="flex items-start gap-2">
                          <i className={`fas fa-${f.icon} mt-0.5 ${f.available ? "text-teal-500" : "text-slate-400"}`}></i>
                          <div>
                            <p className={`text-xs font-semibold ${f.available ? "text-slate-800" : "text-slate-500"}`}>{f.label}</p>
                            {!f.available && <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-semibold">Upgrade</span>}
                            <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            IMAGING TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "imaging" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h5 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-x-ray text-teal-500"></i>Patient Medical Imaging (DICOM)
              </h5>
            </div>
            <div className="p-5">
              {imagingLoading && !selectedImagingPatient ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5">
                  {/* Patient List */}
                  <div className="md:col-span-2">
                    <h6 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                      <i className="fas fa-users text-teal-500"></i>Select Patient
                    </h6>
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-96 pb-2 md:pb-0 md:pr-1">
                      {imagingPatients.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 w-full">
                          <i className="fas fa-user-slash text-2xl mb-2"></i><p className="text-sm">No patients found</p>
                        </div>
                      ) : imagingPatients.map(p => (
                        <button key={p._id} onClick={() => setSelectedImagingPatient(p)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all flex-shrink-0 md:flex-shrink md:w-full ${selectedImagingPatient?._id === p._id ? "bg-teal-500 text-white" : "bg-slate-50 hover:bg-slate-100 text-slate-700"}`}>
                          <i className={`fas fa-user-circle text-xl ${selectedImagingPatient?._id === p._id ? "text-white/80" : "text-slate-400"}`}></i>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{p.name}</p>
                            <p className={`text-xs truncate ${selectedImagingPatient?._id === p._id ? "text-white/70" : "text-slate-400"}`}>{p.phone || p.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Studies */}
                  <div className="md:col-span-3">
                    {!selectedImagingPatient ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                        <i className="fas fa-hand-pointer text-3xl mb-3"></i>
                        <p className="text-sm">Select a patient to view imaging studies</p>
                      </div>
                    ) : imagingLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <h6 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                          <i className="fas fa-images text-teal-500"></i>Studies for {selectedImagingPatient.name}
                        </h6>
                        {imagingStudies.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">
                            <i className="fas fa-x-ray text-3xl mb-3"></i>
                            <p className="text-sm">No imaging studies found</p>
                            <p className="text-xs mt-1">Patient can upload DICOM files from their dashboard</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {imagingStudies.map(study => (
                              <button key={study._id} onClick={() => { setSelectedStudy({ studyId: study._id, studyInstanceUID: study.studyInstanceUID, series: study.series || [], studyDate: study.studyDate, modality: study.modality, studyDescription: study.studyDescription, dicomPatientName: study.dicomPatientName, totalImages: study.totalImages, totalSeries: study.totalSeries }); setShowImagingViewer(true); }}
                                className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md text-left transition-all group">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                  <i className="fas fa-x-ray text-white"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-800 text-sm">{study.modality || "Unknown"}</p>
                                  <p className="text-xs text-slate-400 truncate">{study.studyDescription || "No description"}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                      <i className="fas fa-calendar mr-1"></i>{study.studyDate ? new Date(study.studyDate).toLocaleDateString() : "Unknown"}
                                    </span>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                      <i className="fas fa-images mr-1"></i>{study.totalImages || 0} images
                                    </span>
                                  </div>
                                </div>
                                <i className="fas fa-chevron-right text-slate-300 group-hover:text-teal-400 transition-colors mt-1"></i>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>{/* end max-w-7xl */}

      {/* ── Modals ── */}
      {showImagingViewer && selectedStudy && (
        <ProfessionalDicomViewer study={selectedStudy} patientId={selectedImagingPatient?._id}
          onBack={() => { setShowImagingViewer(false); setSelectedStudy(null); }} />
      )}
      {showPrescription && prescriptionPatient && (
        <PrescriptionManager
          doctorId={doctorId} doctorName={doctor.name}
          patientId={prescriptionPatient.userId?._id || prescriptionPatient.userId || prescriptionPatient.walkInPatient?._id || prescriptionPatient.patientId}
          patientName={prescriptionPatient.userId?.name || prescriptionPatient.walkInPatient?.name || prescriptionPatient.patientName || "Patient"}
          patientEmail={prescriptionPatient.userId?.email || prescriptionPatient.walkInPatient?.email || prescriptionPatient.patientEmail || ""}
          patientPhone={prescriptionPatient.userId?.phone || prescriptionPatient.walkInPatient?.phone || prescriptionPatient.patientPhone || prescriptionPatient.phone || ""}
          appointmentId={prescriptionPatient._id}
          onClose={() => { setShowPrescription(false); setPrescriptionPatient(null); }}
          onSave={() => { setShowPrescription(false); setPrescriptionPatient(null); toast.success("Prescription saved!"); }}
        />
      )}
      {showWalkInModal && (
        <WalkInPatientModal doctor={doctor} onClose={() => setShowWalkInModal(false)}
          onSuccess={(apt) => { fetchQueue(); toast.success(`Walk-in added! Token #${apt.queueNumber}`); }} />
      )}
      {showSupport && <DoctorSupport onClose={() => setShowSupport(false)} />}
      {showControls && <DoctorControls doctor={doctor} onClose={() => setShowControls(false)} onUpdate={fetchQueue} />}

    </div>
  );
}

export default DoctorDashboard;

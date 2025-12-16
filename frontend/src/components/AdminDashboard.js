import { useState, useEffect, useCallback } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import AdminChatbot from './AdminChatbot';
import AdminEmailSender from './AdminEmailSender';
import ThemeToggle from './ThemeToggle';
import { exportAppointmentsToPDF } from '../utils/pdfExport';
import DashboardAnalytics from './DashboardAnalytics';
import RevenueReport from './RevenueReport';
import ActivityLog from './ActivityLog';
import SecurityMonitor from './SecurityMonitor';
import '../styles/premium-saas.css';
import '../styles/admin-dashboard-professional.css';

// Stat Card Component - MNC Enterprise Style with SVG Icons
const StatCard = ({ title, value, icon, color = "primary" }) => {
  const colors = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  // SVG icons for reliability
  const icons = {
    users: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    'user-md': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <path d="M12 11v4"/>
        <path d="M10 13h4"/>
      </svg>
    ),
    'calendar-check': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
    hospital: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"/>
        <path d="M5 21V7l8-4v18"/>
        <path d="M19 21V11l-6-4"/>
        <path d="M9 9v.01"/>
        <path d="M9 12v.01"/>
        <path d="M9 15v.01"/>
        <path d="M9 18v.01"/>
      </svg>
    )
  };
  
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px 24px',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          minWidth: '48px',
          background: colors[color] || colors.primary,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          {icons[icon] || <i className={`fas fa-${icon}`} style={{ fontSize: '1.25rem' }} />}
        </div>
        <div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            color: '#0f172a',
            lineHeight: 1.2,
            marginBottom: '4px'
          }}>
            {value}
          </div>
          <div style={{ 
            fontSize: '0.8125rem', 
            fontWeight: 500, 
            color: '#64748b'
          }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ tab, activeTab, onClick, children }) => (
  <button
    className={`admin-tab ${activeTab === tab ? 'admin-tab--active' : ''}`}
    onClick={() => onClick(tab)}
  >
    {children}
  </button>
);

function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalClinics: 0
  });

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state for users
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Pending approvals state
  const [pendingStaff, setPendingStaff] = useState([]);
  const [pendingClinics, setPendingClinics] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  // Doctor Wallet/Payout state
  const [doctorWallets, setDoctorWallets] = useState([]);
  const [walletSummary, setWalletSummary] = useState({});
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bank_transfer', reference: '' });
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [withdrawalStats, setWithdrawalStats] = useState({ totalPending: 0, totalAmount: 0 });
  
  // Security alerts state
  const [securityAlertCount, setSecurityAlertCount] = useState(0);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // OTP verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpType, setOtpType] = useState(""); // 'user', 'doctor', 'clinic'
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  // Form states
  const [userForm, setUserForm] = useState({
    name: "", email: "", password: "", phone: "", role: "patient"
  });

  const [doctorForm, setDoctorForm] = useState({
    name: "", email: "", phone: "", specialization: "", consultationFee: 500
  });

  // Clinic modal and form states
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    type: "clinic",
    address: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    phone: "",
    alternatePhone: "",
    email: "",
    website: "",
    description: "",
    facilities: [],
    isActive: true
  });

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, doctorsRes, appointmentsRes, clinicsRes] = await Promise.allSettled([
        axios.get("/api/users?includeInactive=true"),
        axios.get("/api/doctors"),
        axios.get("/api/appointments"),
        axios.get("/api/clinics")
      ]);

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const doctorsData = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data : [];
      const appointmentsData = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const clinicsData = clinicsRes.status === 'fulfilled' ? clinicsRes.value.data : [];

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setClinics(clinicsData);

      setStats({
        totalUsers: usersData.length,
        totalDoctors: doctorsData.length,
        totalAppointments: appointmentsData.length,
        totalClinics: clinicsData.length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending approvals
  const fetchPendingApprovals = useCallback(async () => {
    try {
      const [staffRes, clinicsRes, doctorsRes] = await Promise.allSettled([
        axios.get('/api/receptionists/pending'),
        axios.get('/api/clinics/admin/pending'),
        axios.get('/api/doctors/admin/pending')
      ]);
      
      if (staffRes.status === 'fulfilled') {
        setPendingStaff(staffRes.value.data || []);
      }
      if (clinicsRes.status === 'fulfilled') {
        setPendingClinics(clinicsRes.value.data || []);
      }
      if (doctorsRes.status === 'fulfilled') {
        setPendingDoctors(doctorsRes.value.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  }, []);

  // Fetch security alerts count
  const fetchSecurityAlerts = useCallback(async () => {
    try {
      const response = await axios.get('/api/security/stats');
      if (response.data.success) {
        setSecurityAlertCount(response.data.stats.newAlerts || 0);
      }
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingApprovals();
    fetchSecurityAlerts();
  }, [fetchDashboardData, fetchPendingApprovals, fetchSecurityAlerts]);

  // Fetch doctor wallets for payout management
  const fetchDoctorWallets = async () => {
    try {
      const response = await axios.get('/api/wallet/admin/all');
      if (response.data.success) {
        setDoctorWallets(response.data.wallets);
        setWalletSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching doctor wallets:', error);
    }
  };

  // Process payout to doctor
  const handleProcessPayout = async () => {
    if (!selectedWallet || !payoutForm.amount) {
      toast.error('Please enter payout amount');
      return;
    }
    try {
      const response = await axios.post('/api/wallet/admin/payout', {
        doctorId: selectedWallet.doctor._id,
        amount: parseFloat(payoutForm.amount),
        method: payoutForm.method,
        reference: payoutForm.reference,
        adminId: admin?.id || admin?._id
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setShowPayoutModal(false);
        setPayoutForm({ amount: '', method: 'bank_transfer', reference: '' });
        fetchDoctorWallets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payout');
    }
  };

  // Fetch pending withdrawal requests
  const fetchPendingWithdrawals = async () => {
    try {
      const response = await axios.get('/api/wallet/admin/withdrawals');
      if (response.data.success) {
        setPendingWithdrawals(response.data.requests);
        setWithdrawalStats({
          totalPending: response.data.totalPending,
          totalAmount: response.data.totalAmount
        });
      }
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
    }
  };

  // Process withdrawal request (approve/reject)
  const handleProcessWithdrawal = async (walletId, requestId, action, reference = '', rejectionReason = '') => {
    try {
      const response = await axios.put(`/api/wallet/admin/withdrawals/${walletId}/${requestId}`, {
        action,
        reference,
        rejectionReason,
        adminId: admin?.id || admin?._id
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchPendingWithdrawals();
        fetchDoctorWallets();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    }
  };

  // Fetch wallets when payouts tab is active
  useEffect(() => {
    if (activeTab === 'payouts') {
      fetchDoctorWallets();
      fetchPendingWithdrawals();
    }
  }, [activeTab]);

  // Approve staff
  const handleApproveStaff = async (staffId, clinicId) => {
    try {
      await axios.put(`/api/receptionists/${staffId}/approve`, { clinicId });
      toast.success('Staff approved successfully!');
      fetchPendingApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve staff');
    }
  };

  // Approve doctor
  const handleApproveDoctor = async (doctorId) => {
    try {
      await axios.put(`/api/doctors/${doctorId}/approve`);
      toast.success('Doctor approved successfully!');
      fetchPendingApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve doctor');
    }
  };

  // Reject doctor
  const handleRejectDoctor = async (doctorId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await axios.put(`/api/doctors/${doctorId}/reject`, { reason });
      toast.success('Doctor rejected');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject doctor');
    }
  };

  // Reject staff
  const handleRejectStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to reject this staff registration?')) return;
    try {
      await axios.put(`/api/receptionists/${staffId}/reject`);
      toast.success('Staff rejected');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject staff');
    }
  };

  // Approve clinic
  const handleApproveClinic = async (clinicId) => {
    try {
      await axios.put(`/api/clinics/${clinicId}/approve`, { adminId: admin?.id || admin?._id });
      toast.success('Clinic approved successfully!');
      fetchPendingApprovals();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve clinic');
    }
  };

  // Reject clinic
  const handleRejectClinic = async (clinicId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await axios.put(`/api/clinics/${clinicId}/reject`, { reason });
      toast.success('Clinic rejected');
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject clinic');
    }
  };

  // CRUD Operations
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/users/${userId}`);
        console.log('Delete user response:', response.data);
        
        // Immediately update local state to remove the user
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        
        toast.success("User deleted successfully!");
      } catch (error) {
        console.error('Delete user error:', error);
        toast.error(error.response?.data?.message || "Error deleting user");
      }
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/doctors/${doctorId}`);
        console.log('Delete doctor response:', response.data);
        
        // Immediately update local state to remove the doctor
        setDoctors(prevDoctors => prevDoctors.filter(doctor => doctor._id !== doctorId));
        setStats(prev => ({ ...prev, totalDoctors: prev.totalDoctors - 1 }));
        
        toast.success("Doctor deleted successfully!");
      } catch (error) {
        console.error('Delete doctor error:', error);
        toast.error(error.response?.data?.message || "Error deleting doctor");
      }
    }
  };

  // User CRUD Operations
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "", email: "", password: "", phone: "", role: "patient"
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: user.role || "patient"
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Editing existing user - no OTP needed
        await axios.put(`/api/users/${editingUser._id}`, userForm);
        toast.success("User updated successfully!");
        setShowUserModal(false);
        fetchDashboardData();
      } else {
        // Creating new user - require OTP verification
        setShowUserModal(false);
        setPendingFormData(userForm);
        setOtpEmail(userForm.email);
        setOtpType("user");
        setShowOtpModal(true);
        await sendOtpForVerification(userForm.email, "admin-create-user");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving user");
    }
  };

  // Send OTP for admin-created accounts
  const sendOtpForVerification = async (email, type) => {
    setOtpLoading(true);
    try {
      const response = await axios.post("/api/otp/send-otp", { email, type });
      setOtpSent(true);
      toast.success("OTP sent to " + email);
      // Auto-fill OTP in development mode
      if (response.data.otp) {
        setOtp(response.data.otp);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
      setShowOtpModal(false);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and create account
  const handleVerifyOtpAndCreate = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      // Verify OTP first
      const verifyResponse = await axios.post("/api/otp/verify-otp", {
        email: otpEmail,
        otp: otp,
        type: otpType === "user" ? "admin-create-user" : otpType === "doctor" ? "admin-create-doctor" : "admin-create-clinic"
      });

      if (verifyResponse.data.success || verifyResponse.data.verified) {
        // OTP verified, now create the account
        try {
          if (otpType === "user") {
            await axios.post("/api/users", { ...pendingFormData, emailVerified: true });
            toast.success("User created successfully!");
          } else if (otpType === "doctor") {
            await axios.post("/api/doctors", { ...pendingFormData, emailVerified: true, approvalStatus: "approved" });
            toast.success("Doctor created successfully!");
          } else if (otpType === "clinic") {
            await axios.post("/api/clinics", { ...pendingFormData, emailVerified: true });
            toast.success("Clinic created successfully!");
          }

          // Reset states and refresh data
          setShowOtpModal(false);
          setOtp("");
          setOtpEmail("");
          setOtpType("");
          setPendingFormData(null);
          setOtpSent(false);
          
          // Force refresh dashboard data
          await fetchDashboardData();
        } catch (createError) {
          const errorMsg = createError.response?.data?.message || "Failed to create account";
          toast.error(errorMsg);
          
          // If duplicate email error, close modal and reset
          if (errorMsg.includes("already exists")) {
            setShowOtpModal(false);
            setOtp("");
            setOtpEmail("");
            setOtpType("");
            setPendingFormData(null);
            setOtpSent(false);
          }
          // Otherwise keep modal open so user can try again or cancel
        }
      } else {
        toast.error(verifyResponse.data.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    const type = otpType === "user" ? "admin-create-user" : otpType === "doctor" ? "admin-create-doctor" : "admin-create-clinic";
    await sendOtpForVerification(otpEmail, type);
  };

  // Doctor CRUD Operations
  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: "", email: "", phone: "", specialization: "", consultationFee: 500, clinicId: ""
    });
    setShowDoctorModal(true);
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      name: doctor.name || "",
      email: doctor.email || "",
      phone: doctor.phone || "",
      specialization: doctor.specialization || "",
      consultationFee: doctor.consultationFee || 500,
      clinicId: doctor.clinicId?._id || doctor.clinicId || ""
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        // Editing existing doctor - no OTP needed
        await axios.put(`/api/doctors/${editingDoctor._id}`, doctorForm);
        toast.success("Doctor updated successfully!");
        setShowDoctorModal(false);
        fetchDashboardData();
      } else {
        // Creating new doctor - require OTP verification
        setShowDoctorModal(false);
        setPendingFormData(doctorForm);
        setOtpEmail(doctorForm.email);
        setOtpType("doctor");
        setShowOtpModal(true);
        await sendOtpForVerification(doctorForm.email, "admin-create-doctor");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving doctor");
    }
  };

  // Clinic CRUD Operations
  const handleAddClinic = () => {
    setEditingClinic(null);
    setClinicForm({
      name: "",
      type: "clinic",
      address: "",
      addressLine2: "",
      landmark: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      latitude: "",
      longitude: "",
      googleMapsUrl: "",
      phone: "",
      alternatePhone: "",
      email: "",
      website: "",
      description: "",
      facilities: [],
      isActive: true
    });
    setShowClinicModal(true);
  };

  const handleEditClinic = (clinic) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name || "",
      type: clinic.type || "clinic",
      address: clinic.address || "",
      addressLine2: clinic.addressLine2 || "",
      landmark: clinic.landmark || "",
      city: clinic.city || "",
      state: clinic.state || "",
      country: clinic.country || "India",
      pincode: clinic.pincode || "",
      latitude: clinic.latitude || "",
      longitude: clinic.longitude || "",
      googleMapsUrl: clinic.googleMapsUrl || "",
      phone: clinic.phone || "",
      alternatePhone: clinic.alternatePhone || "",
      email: clinic.email || "",
      website: clinic.website || "",
      description: clinic.description || "",
      facilities: clinic.facilities || [],
      isActive: clinic.isActive !== false
    });
    setShowClinicModal(true);
  };

  const handleSaveClinic = async (e) => {
    e.preventDefault();
    try {
      if (editingClinic) {
        // Editing existing clinic - no OTP needed
        await axios.put(`/api/clinics/${editingClinic._id}`, clinicForm);
        toast.success("Clinic updated successfully!");
        setShowClinicModal(false);
        fetchDashboardData();
      } else {
        // Creating new clinic - require OTP verification if email provided
        if (clinicForm.email) {
          setShowClinicModal(false);
          setPendingFormData(clinicForm);
          setOtpEmail(clinicForm.email);
          setOtpType("clinic");
          setShowOtpModal(true);
          await sendOtpForVerification(clinicForm.email, "admin-create-clinic");
        } else {
          // No email provided, create without OTP
          await axios.post("/api/clinics", clinicForm);
          toast.success("Clinic created successfully!");
          setShowClinicModal(false);
          fetchDashboardData();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving clinic");
    }
  };

  const handleDeleteClinic = async (clinicId) => {
    if (window.confirm("Are you sure you want to delete this clinic? This will also deactivate all associated doctors. This action cannot be undone.")) {
      try {
        const response = await axios.delete(`/api/clinics/${clinicId}`);
        console.log('Delete clinic response:', response.data);
        
        // Immediately update local state to remove the clinic
        setClinics(prevClinics => prevClinics.filter(clinic => clinic._id !== clinicId));
        setStats(prev => ({ ...prev, totalClinics: prev.totalClinics - 1 }));
        
        // Also refresh doctors as some may have been deactivated
        const doctorsRes = await axios.get("/api/doctors");
        setDoctors(doctorsRes.data);
        setStats(prev => ({ ...prev, totalDoctors: doctorsRes.data.length }));
        
        toast.success("Clinic deleted successfully!");
      } catch (error) {
        console.error('Delete clinic error:', error);
        toast.error(error.response?.data?.message || "Error deleting clinic");
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setClinicForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Unable to get location: " + error.message);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const openGoogleMaps = () => {
    if (clinicForm.latitude && clinicForm.longitude) {
      window.open(`https://www.google.com/maps?q=${clinicForm.latitude},${clinicForm.longitude}`, '_blank');
    } else {
      toast.error("Please enter coordinates first");
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner" style={{ width: '60px', height: '60px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        
        {/* Navbar */}
        <nav className="admin-navbar">
          <div className="admin-navbar__content">
            <div className="admin-navbar__brand">
              <div className="admin-navbar__logo">
                <svg viewBox="0 0 60 40" fill="none" className="admin-logo-svg">
                  <path d="M0 20 L10 20 L15 20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path className="ecg-pulse" d="M15 20 L20 8 L25 32 L30 12 L35 28 L40 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M40 20 L50 20 L60 20" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="admin-navbar__title">HealthSync Admin</h1>
            </div>
            
            <div className="admin-navbar__stats">
              <div className="admin-navbar__stat">
                <div className="admin-navbar__stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div>
                  <div className="admin-navbar__stat-value">{stats.totalUsers}</div>
                  <div className="admin-navbar__stat-label">Users</div>
                </div>
              </div>
              <div className="admin-navbar__stat">
                <div className="admin-navbar__stat-icon">
                  <i className="fas fa-user-md"></i>
                </div>
                <div>
                  <div className="admin-navbar__stat-value">{stats.totalDoctors}</div>
                  <div className="admin-navbar__stat-label">Doctors</div>
                </div>
              </div>
            </div>
            
            <div className="admin-navbar__actions">
              {admin && (
                <span className="admin-navbar__user">
                  <i className="fas fa-user-shield"></i>
                  {admin.name || 'Admin'}
                </span>
              )}
              <ThemeToggle compact />
              <button className="btn btn-primary" onClick={fetchDashboardData}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
              {onLogout && (
                <button className="btn btn-outline-light" onClick={onLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Stats Grid */}
        <div className="admin-stats">
          <StatCard title="Total Users" value={stats.totalUsers} icon="users" color="primary" />
          <StatCard title="Total Doctors" value={stats.totalDoctors} icon="user-md" color="success" />
          <StatCard title="Appointments" value={stats.totalAppointments} icon="calendar-check" color="info" />
          <StatCard title="Clinics" value={stats.totalClinics} icon="hospital" color="warning" />
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <TabButton tab="overview" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-chart-pie"></i> Overview
          </TabButton>
          <TabButton tab="users" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-users"></i> Users
          </TabButton>
          <TabButton tab="doctors" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-md"></i> Doctors
          </TabButton>
          <TabButton tab="appointments" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-calendar-check"></i> Appointments
          </TabButton>
          <TabButton tab="clinics" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-hospital"></i> Clinics
          </TabButton>
          <TabButton tab="approvals" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-user-check"></i> Approvals
            {(pendingStaff.length + pendingClinics.length + pendingDoctors.length) > 0 && (
              <span className="admin-tab__badge">{pendingStaff.length + pendingClinics.length + pendingDoctors.length}</span>
            )}
          </TabButton>
          <TabButton tab="payouts" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-wallet"></i> Doctor Payouts
          </TabButton>
          <TabButton tab="analytics" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-chart-line"></i> Analytics
          </TabButton>
          <TabButton tab="revenue" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-rupee-sign"></i> Revenue
          </TabButton>
          <TabButton tab="activity" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-history"></i> Activity Log
          </TabButton>
          <TabButton tab="email" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-envelope"></i> Send Email
          </TabButton>
          <TabButton tab="security" activeTab={activeTab} onClick={handleTabChange}>
            <i className="fas fa-shield-alt"></i> AI Security
            {securityAlertCount > 0 && (
              <span className="admin-tab__badge" style={{ background: '#ef4444' }}>{securityAlertCount}</span>
            )}
          </TabButton>
        </div>

        {/* Content Sections */}
        <div className="admin-section">
          {activeTab === "overview" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-chart-pie"></i>
                  </div>
                  System Overview
                </h2>
              </div>
              <p style={{ color: '#718096', fontSize: '16px', marginBottom: '20px' }}>
                Welcome to the HealthSync Admin Dashboard. Monitor and manage your healthcare system from here.
              </p>
              
              {/* Security Alerts Widget */}
              {securityAlertCount > 0 && (
                <div 
                  onClick={() => handleTabChange('security')}
                  style={{
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    border: '1px solid #fca5a5',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <i className="fas fa-shield-alt" style={{ color: 'white', fontSize: '20px' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: '#991b1b', fontSize: '16px', fontWeight: '600' }}>
                      {securityAlertCount} Security Alert{securityAlertCount > 1 ? 's' : ''} Detected
                    </h4>
                    <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '14px' }}>
                      AI has detected suspicious activities. Click to review.
                    </p>
                  </div>
                  <i className="fas fa-arrow-right" style={{ color: '#dc2626' }}></i>
                </div>
              )}
            </>
          )}

          {activeTab === "users" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-users"></i>
                  </div>
                  User Management
                </h2>
                <button className="btn btn-primary" onClick={handleAddUser}>
                  <i className="fas fa-plus"></i> Add User
                </button>
              </div>
              
              {/* Search Box */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                  <i className="fas fa-search" style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#94a3b8' 
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery("")}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                {userSearchQuery && (
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Found {users.filter(u => 
                      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).length} user(s)
                  </small>
                )}
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => 
                        user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                      )
                      .map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className="badge badge-primary">{user.role}</span></td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>
                          <div className="admin-actions" style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              style={{ 
                                padding: '6px 10px', 
                                background: '#fef3c7', 
                                color: '#d97706', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                              onClick={async () => {
                                if (window.confirm(`Delete ALL appointments for ${user.name}? This cannot be undone.`)) {
                                  try {
                                    const response = await axios.delete(`/api/appointments/admin/user/${user._id}/all`, {
                                      data: { reason: 'Admin bulk delete from user management' }
                                    });
                                    if (response.data.success) {
                                      toast.success(`Deleted ${response.data.deletedCount} appointments for ${user.name}`);
                                    } else {
                                      toast.info(response.data.message);
                                    }
                                  } catch (error) {
                                    toast.error(error.response?.data?.message || 'Failed to delete appointments');
                                  }
                                }
                              }}
                              title="Delete all appointments for this user"
                            >
                              <i className="fas fa-calendar-times"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "doctors" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  Doctor Management
                </h2>
                <button className="btn btn-primary" onClick={handleAddDoctor}>
                  <i className="fas fa-plus"></i> Add Doctor
                </button>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Email</th>
                      <th>Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doctor => (
                      <tr key={doctor._id}>
                        <td>Dr. {doctor.name}</td>
                        <td>{doctor.specialization}</td>
                        <td>{doctor.email}</td>
                        <td>₹{doctor.consultationFee}</td>
                        <td>
                          <div className="admin-actions">
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditDoctor(doctor)}
                              title="Edit Doctor"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteDoctor(doctor._id)}
                              title="Delete Doctor"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "appointments" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  Appointments
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => exportAppointmentsToPDF(appointments, 'All Appointments Report')}
                  >
                    <i className="fas fa-file-pdf me-2"></i>Export PDF
                  </button>
                </div>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(apt => (
                      <tr key={apt._id}>
                        <td>{apt.userId?.name || 'Unknown'}</td>
                        <td>Dr. {apt.doctorId?.name || 'Unknown'}</td>
                        <td>{new Date(apt.date).toLocaleDateString()}</td>
                        <td>{apt.time}</td>
                        <td>
                          <span className={`badge ${apt.consultationType === 'online' ? 'badge-info' : 'badge-secondary'}`} style={{ fontSize: '10px' }}>
                            {apt.consultationType === 'online' ? '🎥 Online' : '🏥 In-Person'}
                          </span>
                        </td>
                        <td>₹{apt.payment?.totalAmount || 0}</td>
                        <td>
                          <span className={`badge ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'pending' ? 'badge-warning' : apt.status === 'completed' ? 'badge-info' : 'badge-error'}`}>
                            {apt.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              style={{ 
                                padding: '6px 12px', 
                                background: '#fef2f2', 
                                color: '#ef4444', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={async () => {
                                if (window.confirm('Delete this appointment?')) {
                                  try {
                                    await axios.delete(`/api/appointments/${apt._id}`);
                                    toast.success('Appointment deleted');
                                    setAppointments(prev => prev.filter(a => a._id !== apt._id));
                                  } catch (error) {
                                    toast.error('Failed to delete appointment');
                                  }
                                }
                              }}
                              title="Delete Appointment"
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "clinics" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-hospital"></i>
                  </div>
                  Clinic Management
                </h2>
                <button className="btn btn-primary" onClick={handleAddClinic}>
                  <i className="fas fa-plus"></i> Add Clinic
                </button>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinics.map(clinic => (
                      <tr key={clinic._id}>
                        <td><strong>{clinic.name}</strong></td>
                        <td>
                          <span className={`badge ${clinic.type === 'hospital' ? 'badge-info' : 'badge-primary'}`}>
                            {clinic.type || 'clinic'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ fontSize: '13px' }}>{clinic.address}</div>
                          {clinic.landmark && <div style={{ fontSize: '11px', color: '#718096' }}>Near: {clinic.landmark}</div>}
                        </td>
                        <td>{clinic.city}, {clinic.state || ''}</td>
                        <td>
                          {clinic.latitude && clinic.longitude ? (
                            <a 
                              href={`https://www.google.com/maps?q=${clinic.latitude},${clinic.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm"
                              style={{ fontSize: '11px', padding: '4px 8px', background: '#10b981', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
                            >
                              <i className="fas fa-map-marker-alt"></i> View Map
                            </a>
                          ) : (
                            <span style={{ color: '#a0aec0', fontSize: '12px' }}>Not set</span>
                          )}
                        </td>
                        <td>{clinic.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge ${clinic.isActive !== false ? 'badge-success' : 'badge-error'}`}>
                            {clinic.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button 
                              className="admin-action-btn admin-action-btn--edit"
                              onClick={() => handleEditClinic(clinic)}
                              title="Edit Clinic"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="admin-action-btn admin-action-btn--delete"
                              onClick={() => handleDeleteClinic(clinic._id)}
                              title="Delete Clinic"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "approvals" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  Pending Approvals
                </h2>
              </div>

              {/* Pending Staff */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-user-tie" style={{ color: '#3b82f6' }}></i>
                  Pending Staff Registrations ({pendingStaff.length})
                </h3>
                {pendingStaff.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                    <p>No pending staff registrations</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Clinic Name</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingStaff.map(staff => (
                          <tr key={staff._id}>
                            <td><strong>{staff.name}</strong></td>
                            <td>{staff.email}</td>
                            <td>{staff.phone || 'N/A'}</td>
                            <td>{staff.clinicName || 'Not specified'}</td>
                            <td>{new Date(staff.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <select 
                                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginRight: '8px', fontSize: '13px' }}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleApproveStaff(staff._id, e.target.value);
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">Assign Clinic & Approve</option>
                                  {clinics.map(clinic => (
                                    <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                                  ))}
                                </select>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => handleRejectStaff(staff._id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Clinics */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-hospital" style={{ color: '#10b981' }}></i>
                  Pending Clinic Registrations ({pendingClinics.length})
                </h3>
                {pendingClinics.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                    <p>No pending clinic registrations</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Address</th>
                          <th>City</th>
                          <th>Phone</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingClinics.map(clinic => (
                          <tr key={clinic._id}>
                            <td><strong>{clinic.name}</strong></td>
                            <td>
                              <span className={`badge ${clinic.type === 'hospital' ? 'badge-info' : 'badge-primary'}`}>
                                {clinic.type || 'clinic'}
                              </span>
                            </td>
                            <td>{clinic.address}</td>
                            <td>{clinic.city}</td>
                            <td>{clinic.phone || 'N/A'}</td>
                            <td>{new Date(clinic.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <button 
                                  className="admin-action-btn"
                                  style={{ background: '#10b981', color: 'white' }}
                                  onClick={() => handleApproveClinic(clinic._id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => handleRejectClinic(clinic._id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Doctors */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-user-md" style={{ color: '#8b5cf6' }}></i>
                  Pending Doctor Registrations ({pendingDoctors.length})
                </h3>
                {pendingDoctors.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                    <p>No pending doctor registrations</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Specialization</th>
                          <th>Clinic</th>
                          <th>Phone</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDoctors.map(doctor => (
                          <tr key={doctor._id}>
                            <td><strong>Dr. {doctor.name}</strong></td>
                            <td>{doctor.email}</td>
                            <td>
                              <span className="badge badge-info">{doctor.specialization}</span>
                            </td>
                            <td>{doctor.clinicId?.name || 'N/A'}</td>
                            <td>{doctor.phone}</td>
                            <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <button 
                                  className="admin-action-btn"
                                  style={{ background: '#8b5cf6', color: 'white' }}
                                  onClick={() => handleApproveDoctor(doctor._id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => handleRejectDoctor(doctor._id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Doctor Payouts Section */}
          {activeTab === "payouts" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <i className="fas fa-wallet"></i>
                  </div>
                  Doctor Payouts & Earnings
                </h2>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pending Withdrawals</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{withdrawalStats.totalPending || 0}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>₹{withdrawalStats.totalAmount?.toLocaleString() || 0}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Pending</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹{walletSummary.totalPendingPayouts?.toLocaleString() || 0}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Earnings</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹{walletSummary.totalEarnings?.toLocaleString() || 0}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Paid</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹{walletSummary.totalPayouts?.toLocaleString() || 0}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Doctors</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{walletSummary.totalDoctors || 0}</div>
                </div>
              </div>

              {/* Pending Withdrawal Requests */}
              {pendingWithdrawals.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-clock" style={{ color: '#ef4444' }}></i>
                    Pending Withdrawal Requests ({pendingWithdrawals.length})
                  </h3>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Bank Details</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingWithdrawals.map((req, index) => (
                          <tr key={index}>
                            <td>
                              <strong>Dr. {req.doctor?.name}</strong>
                              <br />
                              <small className="text-muted">{req.doctor?.email}</small>
                            </td>
                            <td style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              ₹{req.amount?.toLocaleString()}
                            </td>
                            <td>
                              <span className="badge badge-info">{req.payoutMethod}</span>
                            </td>
                            <td style={{ fontSize: '0.75rem' }}>
                              {req.bankDetails?.accountNumber ? (
                                <>
                                  <div>{req.bankDetails.bankName}</div>
                                  <div>A/C: ****{req.bankDetails.accountNumber?.slice(-4)}</div>
                                  <div>IFSC: {req.bankDetails.ifscCode}</div>
                                </>
                              ) : (
                                <span style={{ color: '#ef4444' }}>Not Added</span>
                              )}
                            </td>
                            <td>{new Date(req.requestedAt).toLocaleDateString()}</td>
                            <td>
                              <div className="admin-actions">
                                <button 
                                  className="admin-action-btn"
                                  style={{ background: '#10b981', color: 'white' }}
                                  onClick={() => {
                                    const reference = window.prompt('Enter transaction reference/ID:');
                                    if (reference !== null) {
                                      handleProcessWithdrawal(req.walletId, req._id, 'approve', reference);
                                    }
                                  }}
                                  title="Approve & Pay"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="admin-action-btn admin-action-btn--delete"
                                  onClick={() => {
                                    const reason = window.prompt('Enter rejection reason:');
                                    if (reason !== null) {
                                      handleProcessWithdrawal(req.walletId, req._id, 'reject', '', reason);
                                    }
                                  }}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Doctor Wallets Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Email</th>
                      <th>Specialization</th>
                      <th>Total Earnings</th>
                      <th>Pending Payout</th>
                      <th>Total Paid</th>
                      <th>Patients</th>
                      <th>Bank Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorWallets.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          <i className="fas fa-wallet" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
                          <p>No doctor wallets found</p>
                        </td>
                      </tr>
                    ) : (
                      doctorWallets.map(wallet => (
                        <tr key={wallet._id}>
                          <td><strong>Dr. {wallet.doctor?.name || 'Unknown'}</strong></td>
                          <td>{wallet.doctor?.email || 'N/A'}</td>
                          <td>
                            <span className="badge badge-info">{wallet.doctor?.specialization || 'N/A'}</span>
                          </td>
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>₹{wallet.totalEarnings?.toLocaleString()}</td>
                          <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>₹{wallet.pendingAmount?.toLocaleString()}</td>
                          <td style={{ color: '#3b82f6' }}>₹{wallet.totalPayouts?.toLocaleString()}</td>
                          <td>{wallet.stats?.completedAppointments || 0}</td>
                          <td>
                            {wallet.bankDetails?.accountNumber ? (
                              <div style={{ fontSize: '0.75rem' }}>
                                <div><strong>{wallet.bankDetails.bankName}</strong></div>
                                <div>A/C: ****{wallet.bankDetails.accountNumber?.slice(-4)}</div>
                                <div>IFSC: {wallet.bankDetails.ifscCode}</div>
                                {wallet.bankDetails.upiId && <div>UPI: {wallet.bankDetails.upiId}</div>}
                              </div>
                            ) : (
                              <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Not Added</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="admin-action-btn"
                              style={{ background: '#10b981', color: 'white' }}
                              onClick={() => { setSelectedWallet(wallet); setShowPayoutModal(true); }}
                              disabled={wallet.pendingAmount <= 0}
                              title="Process Payout"
                            >
                              <i className="fas fa-money-bill-wave"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Analytics Section */}
          {activeTab === "analytics" && (
            <DashboardAnalytics 
              appointments={appointments} 
              doctors={doctors} 
              users={users} 
            />
          )}

          {/* Revenue Section */}
          {activeTab === "revenue" && (
            <RevenueReport 
              appointments={appointments} 
              doctors={doctors} 
            />
          )}

          {/* Activity Log Section */}
          {activeTab === "activity" && (
            <ActivityLog userType="all" />
          )}

          {/* Email Section */}
          {activeTab === "email" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  Send Email
                </h2>
              </div>
              <AdminEmailSender />
            </>
          )}

          {/* AI Security Monitor Section */}
          {activeTab === "security" && (
            <>
              <div className="admin-section__header">
                <h2 className="admin-section__title">
                  <div className="admin-section__icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  AI Security Monitor
                </h2>
              </div>
              <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                AI-powered security monitoring detects suspicious activities by staff, doctors, and admins in real-time.
              </p>
              <SecurityMonitor adminId={admin?.id || admin?._id} />
            </>
          )}
        </div>

      </div>
      
      {/* AI Chatbot */}
      <AdminChatbot 
        systemStats={stats} 
        currentContext={activeTab} 
      />

      {/* Clinic Modal */}
      {showClinicModal && (
        <div className="modal-overlay" onClick={() => setShowClinicModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-hospital"></i> {editingClinic ? 'Edit Clinic' : 'Add New Clinic'}</h3>
              <button className="modal-close" onClick={() => setShowClinicModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveClinic}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Basic Information */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-info-circle"></i> Basic Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Clinic Name *</label>
                      <input
                        type="text"
                        value={clinicForm.name}
                        onChange={e => setClinicForm({...clinicForm, name: e.target.value})}
                        placeholder="Enter clinic name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={clinicForm.type}
                        onChange={e => setClinicForm({...clinicForm, type: e.target.value})}
                      >
                        <option value="clinic">Clinic</option>
                        <option value="hospital">Hospital</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={clinicForm.description}
                      onChange={e => setClinicForm({...clinicForm, description: e.target.value})}
                      placeholder="Brief description of the clinic"
                      rows="2"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-map-marker-alt"></i> Address Details</h4>
                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      value={clinicForm.address}
                      onChange={e => setClinicForm({...clinicForm, address: e.target.value})}
                      placeholder="Street address, building name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={clinicForm.addressLine2}
                      onChange={e => setClinicForm({...clinicForm, addressLine2: e.target.value})}
                      placeholder="Floor, suite, unit number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Landmark</label>
                    <input
                      type="text"
                      value={clinicForm.landmark}
                      onChange={e => setClinicForm({...clinicForm, landmark: e.target.value})}
                      placeholder="Near landmark (e.g., Near City Mall)"
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        value={clinicForm.city}
                        onChange={e => setClinicForm({...clinicForm, city: e.target.value})}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={clinicForm.state}
                        onChange={e => setClinicForm({...clinicForm, state: e.target.value})}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Pincode</label>
                      <input
                        type="text"
                        value={clinicForm.pincode}
                        onChange={e => setClinicForm({...clinicForm, pincode: e.target.value})}
                        placeholder="Pincode"
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={clinicForm.country}
                        onChange={e => setClinicForm({...clinicForm, country: e.target.value})}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Coordinates */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-crosshairs"></i> Exact Location (GPS Coordinates)</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={clinicForm.latitude}
                        onChange={e => setClinicForm({...clinicForm, latitude: e.target.value})}
                        placeholder="e.g., 28.6139"
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={clinicForm.longitude}
                        onChange={e => setClinicForm({...clinicForm, longitude: e.target.value})}
                        placeholder="e.g., 77.2090"
                      />
                    </div>
                  </div>
                  <div className="form-actions-inline">
                    <button type="button" className="btn btn-secondary" onClick={getCurrentLocation}>
                      <i className="fas fa-location-arrow"></i> Get Current Location
                    </button>
                    <button type="button" className="btn btn-info" onClick={openGoogleMaps}>
                      <i className="fas fa-external-link-alt"></i> View on Google Maps
                    </button>
                  </div>
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Google Maps URL</label>
                    <input
                      type="url"
                      value={clinicForm.googleMapsUrl}
                      onChange={e => setClinicForm({...clinicForm, googleMapsUrl: e.target.value})}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <h4 className="form-section-title"><i className="fas fa-phone"></i> Contact Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={clinicForm.phone}
                        onChange={e => setClinicForm({...clinicForm, phone: e.target.value})}
                        placeholder="Primary phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Alternate Phone</label>
                      <input
                        type="tel"
                        value={clinicForm.alternatePhone}
                        onChange={e => setClinicForm({...clinicForm, alternatePhone: e.target.value})}
                        placeholder="Alternate phone number"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={clinicForm.email}
                        onChange={e => setClinicForm({...clinicForm, email: e.target.value})}
                        placeholder="clinic@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="url"
                        value={clinicForm.website}
                        onChange={e => setClinicForm({...clinicForm, website: e.target.value})}
                        placeholder="https://www.clinic.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="form-section">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={clinicForm.isActive}
                        onChange={e => setClinicForm({...clinicForm, isActive: e.target.checked})}
                      />
                      <span>Active (Clinic is operational)</span>
                    </label>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClinicModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingClinic ? 'Update Clinic' : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user"></i> {editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Enter password"
                    required={!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={e => setUserForm({...userForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value})}
                  >
                    <option value="patient">Patient</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-user-md"></i> {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="modal-close" onClick={() => setShowDoctorModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSaveDoctor}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={doctorForm.name}
                    onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                    placeholder="Enter doctor's name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={e => setDoctorForm({...doctorForm, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={doctorForm.phone}
                    onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization *</label>
                  <select
                    value={doctorForm.specialization}
                    onChange={e => setDoctorForm({...doctorForm, specialization: e.target.value})}
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Orthopedic">Orthopedic</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Dentist">Dentist</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={doctorForm.consultationFee}
                    onChange={e => setDoctorForm({...doctorForm, consultationFee: parseInt(e.target.value) || 0})}
                    placeholder="Enter consultation fee"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Clinic</label>
                  <select
                    value={doctorForm.clinicId}
                    onChange={e => setDoctorForm({...doctorForm, clinicId: e.target.value})}
                  >
                    <option value="">Select Clinic (Optional)</option>
                    {clinics.map(clinic => (
                      <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDoctorModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={() => { setShowOtpModal(false); setOtp(""); setOtpSent(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <h3><i className="fas fa-shield-alt"></i> Email Verification Required</h3>
              <button className="modal-close" onClick={() => { setShowOtpModal(false); setOtp(""); setOtpSent(false); }} style={{ color: 'white' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{ marginBottom: '20px' }}>
                <i className="fas fa-envelope-open-text" style={{ fontSize: '48px', color: '#667eea', marginBottom: '15px' }}></i>
                <p style={{ color: '#4a5568', marginBottom: '10px' }}>
                  A verification code has been sent to:
                </p>
                <p style={{ fontWeight: '600', color: '#1a202c', fontSize: '16px' }}>
                  {otpEmail}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#4a5568' }}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '24px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontFamily: 'monospace'
                  }}
                  disabled={otpLoading}
                />
              </div>

              <button
                onClick={handleVerifyOtpAndCreate}
                disabled={otpLoading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: otp.length === 6 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0',
                  color: otp.length === 6 ? 'white' : '#a0aec0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                  marginBottom: '15px'
                }}
              >
                {otpLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Verifying...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> Verify & Create {otpType === 'user' ? 'User' : otpType === 'doctor' ? 'Doctor' : 'Clinic'}</>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '14px' }}>
                <button
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  <i className="fas fa-redo"></i> Resend OTP
                </button>
                <button
                  onClick={() => { setShowOtpModal(false); setOtp(""); setOtpSent(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#718096',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedWallet && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
              <h3><i className="fas fa-money-bill-wave"></i> Process Payout</h3>
              <button className="modal-close" onClick={() => setShowPayoutModal(false)} style={{ color: 'white' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, color: '#166534' }}>Dr. {selectedWallet.doctor?.name}</h4>
                <p style={{ margin: '0.5rem 0 0', color: '#15803d', fontSize: '0.875rem' }}>{selectedWallet.doctor?.email}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534' }}>Pending Amount</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>₹{selectedWallet.pendingAmount?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534' }}>Total Earnings</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>₹{selectedWallet.totalEarnings?.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {selectedWallet.bankDetails?.accountNumber ? (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <h5 style={{ margin: '0 0 0.5rem', color: '#334155' }}><i className="fas fa-university"></i> Bank Details</h5>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    <p style={{ margin: '0.25rem 0' }}><strong>Name:</strong> {selectedWallet.bankDetails.accountHolderName}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Bank:</strong> {selectedWallet.bankDetails.bankName}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Account:</strong> {selectedWallet.bankDetails.accountNumber}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>IFSC:</strong> {selectedWallet.bankDetails.ifscCode}</p>
                    {selectedWallet.bankDetails.upiId && <p style={{ margin: '0.25rem 0' }}><strong>UPI:</strong> {selectedWallet.bankDetails.upiId}</p>}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#991b1b' }}>
                  <i className="fas fa-exclamation-triangle"></i> Doctor has not added bank details yet
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payout Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                  max={selectedWallet.pendingAmount}
                  placeholder={`Max: ₹${selectedWallet.pendingAmount}`}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Method</label>
                <select
                  className="form-control"
                  value={payoutForm.method}
                  onChange={(e) => setPayoutForm({...payoutForm, method: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reference/Transaction ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={payoutForm.reference}
                  onChange={(e) => setPayoutForm({...payoutForm, reference: e.target.value})}
                  placeholder="Enter transaction reference"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayout}
                  disabled={!payoutForm.amount || parseFloat(payoutForm.amount) <= 0}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: 'white', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: (!payoutForm.amount || parseFloat(payoutForm.amount) <= 0) ? 0.5 : 1
                  }}
                >
                  <i className="fas fa-check"></i> Process Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

import { useState, useEffect, useMemo } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import '../styles/premium-saas.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { exportAppointmentsToPDF } from '../utils/pdfExport';
import { VitalsRecorder, VitalsTrends, MedicalHistorySummary, MedicalHistoryForm, PharmacySection, BillingSection, StaffScheduleSection, ClinicAnalyticsSection, AdvancedQueueSection, IPDSection, AuditLogSection, BedManagementSection, InsuranceClaimsSection, MultiBranchSection, VendorManagementSection, ComplianceSection, StaffAttendanceSection, PatientFeedbackSection, StaffAnalyticsSection } from './emr';

// Helper function to format address (handles both string and object)
const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    return [address.street, address.city, address.state, address.country, address.pincode]
      .filter(Boolean)
      .join(', ');
  }
  return '';
};

const ClinicDashboardPro = ({ receptionist, onLogout }) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedQueueDoctor, setSelectedQueueDoctor] = useState('all');
  
  // Staff presence state for real-time check-in/out indicator
  const [staffPresence, setStaffPresence] = useState([]);
  const [showPresenceWidget, setShowPresenceWidget] = useState(true);
  
  // Doctor modal state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '', email: '', phone: '', specialization: '', consultationFee: 500, experience: 0, qualification: 'MBBS'
  });

  // Clinic day status
  const [clinicDayOpen, setClinicDayOpen] = useState(() => {
    const saved = localStorage.getItem('clinicDayOpen');
    return saved ? JSON.parse(saved) : false;
  });

  // EMR Patient Registration state
  const [emrPatientForm, setEmrPatientForm] = useState({
    name: '', phone: '', email: '', doctorId: '', age: '', gender: 'male', address: ''
  });
  const [emrRegistering, setEmrRegistering] = useState(false);
  const [selectedEmrPatient, setSelectedEmrPatient] = useState(null);
  const [emrPatientView, setEmrPatientView] = useState('list'); // list, register, details, appointments
  const [patientVisits, setPatientVisits] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [loadingPatientAppointments, setLoadingPatientAppointments] = useState(false);

  // EMR Vitals state
  const [showVitalsRecorder, setShowVitalsRecorder] = useState(false);
  const [showVitalsTrends, setShowVitalsTrends] = useState(false);
  const [lastVitals, setLastVitals] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);

  // EMR Medical History state
  const [showMedicalHistoryForm, setShowMedicalHistoryForm] = useState(false);

  // EMR Prescription state
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '', medicines: [], instructions: '', followUpDate: '', followUpNotes: ''
  });
  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', frequency: '', duration: '', timing: 'after_food', notes: ''
  });
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineSearchResults, setMedicineSearchResults] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionView, setPrescriptionView] = useState('list'); // 'list', 'create', 'view'
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [sendingPrescription, setSendingPrescription] = useState({ email: false, whatsapp: false });

  // Register EMR walk-in patient
  const handleEmrPatientRegister = async (e) => {
    e.preventDefault();
    if (!emrPatientForm.name || !emrPatientForm.phone) {
      toast.error('Name and phone are required');
      return;
    }
    
    setEmrRegistering(true);
    try {
      const response = await axios.post('/api/emr/patients/walk-in', {
        ...emrPatientForm,
        clinicId: receptionist.clinicId
      });
      
      if (response.data.success) {
        toast.success('Patient registered successfully!');
        setEmrPatientForm({ name: '', phone: '', email: '', doctorId: '', age: '', gender: 'male', address: '' });
        fetchPatients(); // Refresh patient list
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      toast.error(error.response?.data?.message || 'Failed to register patient');
    } finally {
      setEmrRegistering(false);
    }
  };

  // Fetch patient details (visits and prescriptions)
  const fetchPatientDetails = async (patient) => {
    setLoadingPatientDetails(true);
    setSelectedEmrPatient(patient);
    setEmrPatientView('details');
    
    try {
      const patientId = patient._id || patient.userId?._id;
      
      // Fetch visits and prescriptions in parallel
      const [visitsRes, prescriptionsRes] = await Promise.allSettled([
        axios.get(`/api/emr/visits/patient/${patientId}`),
        axios.get(`/api/prescriptions/patient/${patientId}`)
      ]);
      
      if (visitsRes.status === 'fulfilled' && visitsRes.value.data.success) {
        setPatientVisits(visitsRes.value.data.visits || []);
      } else {
        setPatientVisits([]);
      }
      
      if (prescriptionsRes.status === 'fulfilled') {
        const rxData = prescriptionsRes.value.data;
        setPatientPrescriptions(rxData.prescriptions || rxData || []);
      } else {
        setPatientPrescriptions([]);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Fetch patient appointments
  const fetchPatientAppointments = async (patient) => {
    setLoadingPatientAppointments(true);
    setSelectedEmrPatient(patient);
    setEmrPatientView('appointments');
    setPatientAppointments([]);
    
    try {
      const patientId = patient._id || patient.userId?._id || patient.id;
      console.log('Fetching appointments for patient:', patient.name, 'ID:', patientId);
      
      if (!patientId) {
        console.error('No patient ID found:', patient);
        toast.error('Invalid patient ID');
        setLoadingPatientAppointments(false);
        return;
      }
      
      const response = await axios.get(`/api/appointments/user/${patientId}`);
      console.log('Appointments response:', response.data);
      
      if (Array.isArray(response.data)) {
        setPatientAppointments(response.data);
      } else if (response.data.appointments) {
        setPatientAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Error fetching patient appointments:', error.response?.data || error.message);
      toast.error('Failed to load appointments');
      setPatientAppointments([]);
    } finally {
      setLoadingPatientAppointments(false);
    }
  };

  // Fetch last recorded vitals for a patient
  const fetchLastVitals = async (patientId) => {
    if (!patientId) return;
    setLoadingVitals(true);
    try {
      const response = await axios.get(`/api/emr/patients/${patientId}/vitals/trends`, {
        params: { days: 30, clinicId: receptionist.clinicId }
      });
      if (response.data.success && response.data.trends?.length > 0) {
        // Get the most recent vitals entry
        const latest = response.data.trends[response.data.trends.length - 1];
        setLastVitals(latest);
      } else {
        setLastVitals(null);
      }
    } catch (error) {
      console.error('Error fetching last vitals:', error);
      setLastVitals(null);
    } finally {
      setLoadingVitals(false);
    }
  };

  // Handle saving vitals from VitalsRecorder
  const handleSaveVitals = async (vitalsData) => {
    try {
      const patientId = selectedEmrPatient?._id;
      if (!patientId) {
        toast.error('No patient selected');
        return;
      }
      
      // Create a visit first if needed, or use existing visit
      const visitResponse = await axios.post('/api/emr/visits', {
        patientId,
        clinicId: receptionist.clinicId,
        doctorId: doctors[0]?._id,
        visitType: 'walk-in',
        chiefComplaint: 'Vitals recording'
      });
      
      const visitId = visitResponse.data.visit?._id || visitResponse.data._id;
      
      // Record vitals for the visit
      await axios.post(`/api/emr/visits/${visitId}/vitals`, vitalsData);
      
      toast.success('Vitals recorded successfully!');
      setShowVitalsRecorder(false);
      fetchLastVitals(patientId);
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast.error(error.response?.data?.message || 'Failed to save vitals');
    }
  };

  // Common medicines for autocomplete
  const commonMedicines = [
    'Paracetamol 500mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Ibuprofen 200mg',
    'Amoxicillin 500mg', 'Amoxicillin 250mg', 'Azithromycin 500mg', 'Azithromycin 250mg',
    'Cetirizine 10mg', 'Levocetirizine 5mg', 'Omeprazole 20mg', 'Pantoprazole 40mg',
    'Metformin 500mg', 'Metformin 850mg', 'Amlodipine 5mg', 'Amlodipine 10mg',
    'Atorvastatin 10mg', 'Atorvastatin 20mg', 'Vitamin D3 60000IU', 'Vitamin B12',
    'Calcium + Vitamin D3', 'Iron + Folic Acid', 'Dolo 650', 'Crocin', 'Combiflam'
  ];

  const frequencyOptions = [
    { value: 'OD', label: 'Once daily (OD)' },
    { value: 'BD', label: 'Twice daily (BD)' },
    { value: 'TDS', label: 'Three times daily (TDS)' },
    { value: 'QID', label: 'Four times daily (QID)' },
    { value: 'SOS', label: 'As needed (SOS)' },
    { value: 'HS', label: 'At bedtime (HS)' }
  ];

  const timingOptions = [
    { value: 'before_food', label: 'Before food' },
    { value: 'after_food', label: 'After food' },
    { value: 'with_food', label: 'With food' },
    { value: 'empty_stomach', label: 'Empty stomach' },
    { value: 'any_time', label: 'Any time' }
  ];

  // Search medicines
  const handleMedicineSearch = (query) => {
    setMedicineSearch(query);
    if (query.length < 2) {
      setMedicineSearchResults([]);
      return;
    }
    const results = commonMedicines.filter(m => 
      m.toLowerCase().includes(query.toLowerCase())
    );
    setMedicineSearchResults(results);
  };

  // Add medicine to prescription
  const addMedicineToPrescription = () => {
    if (!newMedicine.name) {
      toast.error('Medicine name is required');
      return;
    }
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { ...newMedicine, id: Date.now() }]
    }));
    setNewMedicine({ name: '', dosage: '', frequency: '', duration: '', timing: 'after_food', notes: '' });
    setMedicineSearch('');
    setMedicineSearchResults([]);
  };

  // Remove medicine from prescription
  const removeMedicineFromPrescription = (id) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id)
    }));
  };

  // Save prescription
  const handleSavePrescription = async () => {
    if (!selectedPatientForPrescription) {
      toast.error('Please select a patient');
      return;
    }
    if (prescriptionForm.medicines.length === 0) {
      toast.error('Add at least one medicine');
      return;
    }
    
    // Get patient ID - handle different formats
    const patientId = selectedPatientForPrescription._id || selectedPatientForPrescription.id;
    if (!patientId) {
      toast.error('Invalid patient selection');
      console.error('Patient object:', selectedPatientForPrescription);
      return;
    }
    
    // Get doctor ID
    const doctorId = doctors[0]?._id || doctors[0]?.id;
    if (!doctorId) {
      toast.error('No doctor available for prescription');
      return;
    }

    setSavingPrescription(true);
    try {
      const payload = {
        clinicId: receptionist.clinicId,
        patientId: patientId,
        doctorId: doctorId,
        diagnosis: prescriptionForm.diagnosis,
        symptoms: prescriptionForm.symptoms,
        medicines: prescriptionForm.medicines,
        advice: prescriptionForm.instructions || prescriptionForm.advice,
        followUpDate: prescriptionForm.followUpDate,
        followUpInstructions: prescriptionForm.followUpNotes
      };
      
      console.log('Saving prescription with payload:', payload);

      const response = await axios.post('/api/prescriptions', payload);
      if (response.data) {
        toast.success('Prescription saved successfully!');
        setPrescriptionForm({ diagnosis: '', symptoms: '', medicines: [], instructions: '', followUpDate: '', followUpNotes: '' });
        setSelectedPatientForPrescription(null);
        setPrescriptionView('list');
        fetchPrescriptions();
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  // Fetch prescriptions for clinic
  const fetchPrescriptions = async () => {
    try {
      console.log('Fetching prescriptions for clinicId:', receptionist.clinicId);
      const response = await axios.get(`/api/prescriptions/clinic/${receptionist.clinicId}`);
      console.log('Prescription response:', response.data);
      if (response.data.success && response.data.prescriptions) {
        setPrescriptions(response.data.prescriptions.map(p => {
          // Handle address - could be string or object
          let addressStr = '';
          if (p.patientId?.address) {
            if (typeof p.patientId.address === 'string') {
              addressStr = p.patientId.address;
            } else if (typeof p.patientId.address === 'object') {
              // Address is an object, format it
              const addr = p.patientId.address;
              addressStr = [addr.street, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean).join(', ');
            }
          }
          
          return {
            ...p,
            patientName: p.patientId?.name || 'Unknown Patient',
            patientPhone: p.patientId?.phone || '',
            patientEmail: p.patientId?.email || '',
            patientAge: p.patientId?.age || '',
            patientGender: p.patientId?.gender || '',
            patientAddress: addressStr
          };
        }));
      } else if (Array.isArray(response.data)) {
        // Handle if response is direct array
        setPrescriptions(response.data.map(p => {
          let addressStr = '';
          if (p.patientId?.address) {
            if (typeof p.patientId.address === 'string') {
              addressStr = p.patientId.address;
            } else if (typeof p.patientId.address === 'object') {
              const addr = p.patientId.address;
              addressStr = [addr.street, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean).join(', ');
            }
          }
          
          return {
            ...p,
            patientName: p.patientId?.name || 'Unknown Patient',
            patientPhone: p.patientId?.phone || '',
            patientEmail: p.patientId?.email || '',
            patientAge: p.patientId?.age || '',
            patientGender: p.patientId?.gender || '',
            patientAddress: addressStr
          };
        }));
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error.response?.data || error.message);
      setPrescriptions([]);
    }
  };

  // Send prescription via Email
  const handleSendPrescriptionEmail = async (prescriptionId, email) => {
    if (!email) {
      toast.error('Patient email not available');
      return;
    }
    setSendingPrescription(prev => ({ ...prev, email: true }));
    try {
      const response = await axios.post(`/api/prescriptions/${prescriptionId}/send-email`, { email });
      if (response.data.success) {
        toast.success('Prescription sent to email successfully!');
      } else {
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending prescription email:', error);
      toast.error(error.response?.data?.message || 'Failed to send prescription via email');
    } finally {
      setSendingPrescription(prev => ({ ...prev, email: false }));
    }
  };

  // Send prescription via WhatsApp
  const handleSendPrescriptionWhatsApp = async (prescriptionId, phone) => {
    if (!phone) {
      toast.error('Patient phone not available');
      return;
    }
    setSendingPrescription(prev => ({ ...prev, whatsapp: true }));
    try {
      const response = await axios.post(`/api/prescriptions/${prescriptionId}/send-whatsapp`, { phone });
      if (response.data.success && response.data.whatsappUrl) {
        // Open WhatsApp in new tab
        window.open(response.data.whatsappUrl, '_blank');
        toast.success('WhatsApp opened with prescription message!');
      } else {
        toast.error(response.data.message || 'Failed to generate WhatsApp link');
      }
    } catch (error) {
      console.error('Error sending prescription via WhatsApp:', error);
      toast.error(error.response?.data?.message || 'Failed to send prescription via WhatsApp');
    } finally {
      setSendingPrescription(prev => ({ ...prev, whatsapp: false }));
    }
  };

  const toggleClinicDay = () => {
    const newStatus = !clinicDayOpen;
    setClinicDayOpen(newStatus);
    localStorage.setItem('clinicDayOpen', JSON.stringify(newStatus));
    toast.success(newStatus ? '🟢 Clinic day started! Now accepting patients.' : '🔴 Clinic day closed. Queue locked.');
  };

  const menuSections = [
    { titleKey: 'main', items: [
      { id: 'overview', icon: 'fas fa-sun', labelKey: 'Today' },
      { id: 'appointments', icon: 'fas fa-calendar-check', labelKey: 'appointments' },
      { id: 'queue', icon: 'fas fa-list-ol', labelKey: 'todaysQueue' },
    ]},
    { titleKey: 'management', items: [
      { id: 'doctors', icon: 'fas fa-user-md', labelKey: 'doctors' },
      { id: 'patients', icon: 'fas fa-users', labelKey: 'patients' },
    ]},
    { titleKey: 'EMR', items: [
      { id: 'emr', icon: 'fas fa-notes-medical', labelKey: 'EMR System' },
      { id: 'advanced-queue', icon: 'fas fa-users-cog', labelKey: 'Queue Manager' },
      { id: 'pharmacy', icon: 'fas fa-pills', labelKey: 'Pharmacy' },
      { id: 'billing', icon: 'fas fa-file-invoice-dollar', labelKey: 'Billing' },
      { id: 'ipd', icon: 'fas fa-procedures', labelKey: 'IPD Management' },
      { id: 'beds', icon: 'fas fa-bed', labelKey: 'Bed Management' },
      { id: 'staff', icon: 'fas fa-user-clock', labelKey: 'Staff Schedule' },
      { id: 'analytics', icon: 'fas fa-chart-bar', labelKey: 'Analytics' },
      { id: 'audit-logs', icon: 'fas fa-history', labelKey: 'Audit Logs' },
    ]},
    { titleKey: 'Enterprise', items: [
      { id: 'insurance', icon: 'fas fa-file-invoice-dollar', labelKey: 'Insurance Claims' },
      { id: 'multi-branch', icon: 'fas fa-sitemap', labelKey: 'Multi-Branch' },
      { id: 'vendors', icon: 'fas fa-truck', labelKey: 'Vendors & PO' },
      { id: 'compliance', icon: 'fas fa-shield-alt', labelKey: 'Compliance' },
      { id: 'attendance', icon: 'fas fa-user-clock', labelKey: 'Attendance' },
      { id: 'staff-analytics', icon: 'fas fa-chart-line', labelKey: 'Staff Analytics' },
      { id: 'feedback', icon: 'fas fa-comment-dots', labelKey: 'Patient Feedback' },
    ]},
  ];

  useEffect(() => {
    fetchAllData();
    fetchStaffPresence();
    
    // Poll for real-time presence updates every 30 seconds
    const presenceInterval = setInterval(fetchStaffPresence, 30000);
    return () => clearInterval(presenceInterval);
  }, [receptionist]);

  // Fetch staff presence/check-in status
  const fetchStaffPresence = async () => {
    try {
      const res = await axios.get(`/api/branch-staff/presence/${receptionist.clinicId}`);
      setStaffPresence(res.data.presence || []);
    } catch (err) {
      console.error('Error fetching staff presence:', err);
      setStaffPresence([]);
    }
  };

  // Fetch prescriptions when EMR prescriptions section is opened
  useEffect(() => {
    if (activeSection === 'emr-prescriptions') {
      fetchPrescriptions();
    }
  }, [activeSection]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchDoctors(), fetchPatients()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      // If staff has assigned doctor, only fetch that doctor's appointments (department isolation)
      const params = receptionist.assignedDoctorId ? `?assignedDoctorId=${receptionist.assignedDoctorId}` : '';
      const response = await axios.get(`/api/receptionists/appointments/${receptionist.clinicId}${params}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      // If staff has assigned doctor, only fetch that doctor (department isolation)
      const params = receptionist.assignedDoctorId ? `?assignedDoctorId=${receptionist.assignedDoctorId}` : '';
      const response = await axios.get(`/api/receptionists/doctors/${receptionist.clinicId}${params}`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      // Fetch patients from both receptionist route (appointment-based) and EMR route (walk-in)
      const params = receptionist.assignedDoctorId ? `?assignedDoctorId=${receptionist.assignedDoctorId}` : '';
      
      // Try to get patients from both sources
      const [receptionistResponse, emrResponse] = await Promise.allSettled([
        axios.get(`/api/receptionists/patients/${receptionist.clinicId}${params}`),
        axios.get(`/api/emr/patients/clinic/${receptionist.clinicId}`)
      ]);
      
      // Combine patients from both sources
      const receptionistPatients = receptionistResponse.status === 'fulfilled' ? receptionistResponse.value.data : [];
      const emrPatients = emrResponse.status === 'fulfilled' && emrResponse.value.data.success ? emrResponse.value.data.patients : [];
      
      // Merge and deduplicate by _id, and format address
      const patientMap = new Map();
      [...receptionistPatients, ...emrPatients].forEach(p => {
        if (p._id && !patientMap.has(p._id)) {
          // Format address if it's an object
          const formattedPatient = {
            ...p,
            address: formatAddress(p.address)
          };
          patientMap.set(p._id, formattedPatient);
        }
      });
      
      setPatients(Array.from(patientMap.values()));
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await axios.put(`/api/receptionists/appointments/${appointmentId}/status`, { status: newStatus });
      fetchAppointments();
      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const updateDoctorAvailability = async (doctorId, availability) => {
    try {
      await axios.put(`/api/receptionists/doctors/${doctorId}/availability`, {
        availability,
        clinicId: receptionist.clinicId
      });
      toast.success(`Doctor status updated to ${availability}`);
      fetchDoctors();
    } catch (error) {
      toast.error('Failed to update doctor availability');
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await axios.put(`/api/doctors/${editingDoctor._id}`, { ...doctorForm, clinicId: receptionist.clinicId });
        toast.success('Doctor updated successfully');
      } else {
        await axios.post('/api/doctors', { ...doctorForm, clinicId: receptionist.clinicId });
        toast.success('Doctor added successfully');
      }
      setShowDoctorModal(false);
      setEditingDoctor(null);
      setDoctorForm({ name: '', email: '', phone: '', specialization: '', consultationFee: 500, experience: 0, qualification: 'MBBS' });
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save doctor');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to remove this doctor?')) return;
    try {
      await axios.delete(`/api/doctors/${doctorId}`);
      toast.success('Doctor removed successfully');
      fetchDoctors();
    } catch (error) {
      toast.error('Failed to remove doctor');
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
      } else {
        toast.error(response.data.message || "Failed to generate link", { id: "meet-gen" });
      }
    } catch (error) {
      console.error("Error generating meet link:", error);
      toast.error("Failed to generate meeting link", { id: "meet-gen" });
    }
  };

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter(apt => new Date(apt.date).toDateString() === today);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchFilter = filter === 'all' || apt.status === filter;
      const matchSearch = !searchTerm || 
        apt.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [appointments, filter, searchTerm]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const stats = {
    todayCount: todayAppointments.length,
    pendingCount: appointments.filter(a => a.status === 'pending').length,
    confirmedCount: appointments.filter(a => a.status === 'confirmed').length,
    availableDoctors: doctors.filter(d => d.availability === 'Available').length,
    totalDoctors: doctors.length,
    totalPatients: patients.length
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getUserInitials = () => (receptionist?.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatusColor = (status) => {
    const colors = { pending: 'amber', confirmed: 'emerald', completed: 'blue', cancelled: 'red', in_progress: 'indigo' };
    return colors[status] || 'slate';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200 flex">
      {/* Real-Time Staff Presence Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 ${showPresenceWidget ? 'w-80' : 'w-14'}`}>
          {/* Toggle Button */}
          <button 
            onClick={() => setShowPresenceWidget(!showPresenceWidget)}
            className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
            title={showPresenceWidget ? 'Minimize' : 'Show Staff Presence'}
          >
            <i className={`fas fa-${showPresenceWidget ? 'minus' : 'users'} text-xs`}></i>
          </button>
          
          {showPresenceWidget ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <h4 className="font-semibold text-slate-800 text-sm">Live Staff Status</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      {staffPresence.filter(s => s.isCheckedIn).length} In
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                      {staffPresence.filter(s => !s.isCheckedIn).length} Out
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Staff List */}
              <div className="max-h-64 overflow-y-auto p-2">
                {staffPresence.length > 0 ? (
                  <div className="space-y-1">
                    {staffPresence.slice(0, 10).map(staff => (
                      <div 
                        key={staff._id} 
                        className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${staff.isCheckedIn ? 'bg-emerald-50' : 'bg-slate-50'}`}
                      >
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${staff.isCheckedIn ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-400'}`}>
                            {staff.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${staff.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{staff.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            <span className="capitalize">{staff.role?.replace('_', ' ')}</span>
                            {staff.specialization && <span className="text-slate-400"> • {staff.specialization}</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium ${staff.isCheckedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {staff.isCheckedIn ? 'Checked In' : 'Out'}
                          </span>
                          {staff.lastActivity && (
                            <p className="text-[10px] text-slate-400">
                              {new Date(staff.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {staffPresence.length > 10 && (
                      <p className="text-center text-xs text-slate-400 py-2">+{staffPresence.length - 10} more staff</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <i className="fas fa-user-clock text-2xl mb-2"></i>
                    <p className="text-xs">No staff presence data</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span><i className="fas fa-sync-alt mr-1"></i>Updates every 30s</span>
                  <button 
                    onClick={fetchStaffPresence}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Refresh Now
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Collapsed State - Just show count */
            <div className="p-3 flex flex-col items-center">
              <div className="relative">
                <i className="fas fa-users text-slate-600 text-lg"></i>
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {staffPresence.filter(s => s.isCheckedIn).length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-gray-950 via-slate-950 to-black border-r border-slate-800/50 z-50 transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onMouseEnter={() => setSidebarCollapsed(false)} onMouseLeave={() => setSidebarCollapsed(true)}>
        <div className="h-20 flex items-center px-4 border-b border-slate-800/50">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-logo-glow">
            <svg className="w-8 h-8" viewBox="0 0 60 40" fill="none">
              <path d="M0 20 L10 20 L15 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              <path className="ecg-line" d="M15 20 L20 8 L25 32 L30 12 L35 28 L40 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 20 L50 20 L60 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <span className={`ml-3 font-bold text-white text-xl transition-opacity ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>HealthSync</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 ${sidebarCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100'}`}>{t(section.titleKey)}</h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }} title={t(item.labelKey)} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                    <i className={`${item.icon} ${sidebarCollapsed ? 'w-full text-lg' : 'w-5'} text-center`}></i>
                    <span className={`whitespace-nowrap transition-all ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">{getUserInitials()}</div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? 'hidden' : ''}`}>
              <p className="text-sm font-medium text-white truncate">{receptionist?.name}</p>
              <p className="text-xs text-slate-400">{receptionist?.clinicName || 'Staff'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-red-500/20">
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setMobileSidebarOpen(prev => !prev); }}><i className="fas fa-bars text-slate-600"></i></button>
            <LanguageSelector />
            <ThemeToggle compact />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Welcome, {(receptionist?.name || 'Staff').split(' ')[0]}! 👋</h1>
              <p className="text-xs text-slate-500"><i className="fas fa-hospital text-cyan-500 mr-1"></i>{receptionist?.clinicName || 'Clinic'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Start/Close Clinic Day Button */}
            <button 
              onClick={toggleClinicDay}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                clinicDayOpen 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${clinicDayOpen ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></span>
              {clinicDayOpen ? 'Close Clinic Day' : 'Start Clinic Day'}
            </button>
            <div className="hidden sm:block px-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600">
              <i className="fas fa-calendar mr-2"></i>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button onClick={fetchAllData} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center" title="Refresh"><i className="fas fa-sync-alt text-slate-600"></i></button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid - Clickable */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: 'fa-calendar-day', value: stats.todayCount, label: "Today's Appointments", color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', action: () => setActiveSection('queue') },
                  { icon: 'fa-clock', value: stats.pendingCount, label: 'Pending', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', action: () => { setActiveSection('appointments'); setFilter('pending'); } },
                  { icon: 'fa-check-circle', value: stats.confirmedCount, label: 'Confirmed', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', action: () => { setActiveSection('appointments'); setFilter('confirmed'); } },
                  { icon: 'fa-user-md', value: `${stats.availableDoctors}/${stats.totalDoctors}`, label: 'Doctors Available', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', action: () => setActiveSection('doctors') },
                ].map((stat, i) => (
                  <button key={i} onClick={stat.action} className={`${stat.bg} rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer text-left w-full`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow`}>
                        <i className={`fas ${stat.icon} text-white`}></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Clinic Actions */}
              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm" aria-label="Clinic Actions">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Clinic Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Walk-In Patient - Primary Action */}
                  <button 
                    onClick={() => { setActiveSection('appointments'); toast.success('Add walk-in patient from appointments'); }}
                    className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <i className="fas fa-user-plus text-white text-xl"></i>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">Walk-In Patient</span>
                  </button>
                  {[
                    { icon: 'fa-calendar-check', label: 'Appointments', section: 'appointments', color: 'from-blue-500 to-cyan-600' },
                    { icon: 'fa-list-ol', label: "Today's Queue", section: 'queue', color: 'from-indigo-500 to-purple-600' },
                    { icon: 'fa-user-md', label: 'Doctors', section: 'doctors', color: 'from-purple-500 to-pink-600' },
                    { icon: 'fa-users', label: 'Patients', section: 'patients', color: 'from-amber-500 to-orange-600' },
                  ].map((action, i) => (
                    <button key={i} onClick={() => setActiveSection(action.section)} className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-cyan-200 hover:shadow-lg transition-all">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${action.icon} text-white text-xl`}></i>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Today's Queue - Hero Section */}
              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm" aria-label="Today's Queue">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800">Today's Queue</h3>
                    {clinicDayOpen && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">LIVE</span>}
                  </div>
                  <button onClick={() => setActiveSection('queue')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">View Full Queue →</button>
                </div>
                
                {todayAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <i className="fas fa-calendar-day text-2xl text-slate-400"></i>
                    </div>
                    <h4 className="font-semibold text-slate-700 mb-2">No appointments today</h4>
                    <p className="text-sm text-slate-500">{clinicDayOpen ? 'Ready to accept walk-in patients' : 'Start clinic day to begin accepting patients'}</p>
                  </div>
                ) : (
                  <>
                    {/* Queue Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-700">{todayAppointments.filter(a => a.status === 'in_progress').length || '-'}</p>
                        <p className="text-xs text-slate-600">Current</p>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <p className="text-2xl font-bold text-amber-600">{todayAppointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length}</p>
                        <p className="text-xs text-slate-600">Waiting</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{todayAppointments.filter(a => a.status === 'completed').length}</p>
                        <p className="text-xs text-slate-600">Completed</p>
                      </div>
                    </div>
                    
                    {/* Patient List */}
                    <div className="space-y-3">
                      {todayAppointments.slice(0, 5).map((apt, idx) => (
                        <div key={apt._id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${apt.status === 'in_progress' ? 'bg-cyan-50 border-2 border-cyan-200' : 'bg-slate-50 hover:bg-cyan-50'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${apt.status === 'in_progress' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {apt.status === 'in_progress' ? <i className="fas fa-play"></i> : idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <i className="fas fa-user text-white text-sm"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800">{apt.userId?.name || 'Unknown'}</h4>
                            <p className="text-sm text-slate-500">Dr. {apt.doctorId?.name} • {formatTime(apt.time)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'in_progress' ? 'bg-cyan-100 text-cyan-700' :
                            apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>{apt.status === 'in_progress' ? 'In Progress' : apt.status}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Doctors Working Today */}
              <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm" aria-label="Doctors Working Today">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Doctors Working Today</h3>
                  <button onClick={() => setActiveSection('doctors')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">Manage →</button>
                </div>
                {doctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <i className="fas fa-user-md text-2xl text-slate-400"></i>
                    </div>
                    <h4 className="font-semibold text-slate-700 mb-2">No doctors added yet</h4>
                    <p className="text-sm text-slate-500 mb-4">Add doctors to start accepting appointments</p>
                    <button 
                      onClick={() => { setActiveSection('doctors'); setShowDoctorModal(true); }}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
                    >
                      <i className="fas fa-plus mr-2"></i>Add First Doctor
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {doctors.slice(0, 4).map(doc => (
                      <div key={doc._id} className={`p-4 rounded-xl border-2 ${doc.availability === 'Available' ? 'border-emerald-200 bg-emerald-50' : doc.availability === 'Busy' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-full ${doc.availability === 'Available' ? 'bg-emerald-500' : doc.availability === 'Busy' ? 'bg-red-500' : 'bg-amber-500'} flex items-center justify-center`}>
                            <i className="fas fa-user-md text-white text-sm"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">Dr. {doc.name}</p>
                            <p className="text-xs text-slate-500">{doc.specialization}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${doc.availability === 'Available' ? 'text-emerald-600' : doc.availability === 'Busy' ? 'text-red-600' : 'text-amber-600'}`}>{doc.availability}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Appointments Section */}
          {activeSection === 'appointments' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" placeholder="Search appointments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                    ))}
                    <button 
                      onClick={() => exportAppointmentsToPDF(filteredAppointments, 'Clinic Appointments Report')}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-file-pdf"></i>PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-calendar-times text-3xl text-slate-400"></i></div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No appointments found</h3>
                    <p className="text-slate-500">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Patient</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Doctor</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date & Time</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointments.map(apt => (
                          <tr key={apt._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">{apt.userId?.name?.charAt(0) || 'U'}</div>
                                <div><p className="font-semibold text-slate-800">{apt.userId?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{apt.userId?.phone || 'No phone'}</p></div>
                              </div>
                            </td>
                            <td className="px-6 py-4"><p className="font-medium text-slate-800">Dr. {apt.doctorId?.name || 'Unknown'}</p><p className="text-xs text-slate-500">{apt.doctorId?.specialization}</p></td>
                            <td className="px-6 py-4"><p className="font-medium text-slate-800">{formatDate(apt.date)}</p><p className="text-xs text-slate-500">{formatTime(apt.time)}</p></td>
                            <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(apt.status)}-100 text-${getStatusColor(apt.status)}-700`}>{apt.status}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {apt.status === 'pending' && (<><button onClick={() => updateAppointmentStatus(apt._id, 'confirmed')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200">Confirm</button><button onClick={() => updateAppointmentStatus(apt._id, 'cancelled')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">Cancel</button></>)}
                                {apt.status === 'confirmed' && <button onClick={() => updateAppointmentStatus(apt._id, 'completed')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">Complete</button>}
                              </div>
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


          {/* Today's Queue Section */}
          {activeSection === 'queue' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800"><i className="fas fa-list-ol text-cyan-500 mr-2"></i>Today's Queue</h2>
                  <select value={selectedQueueDoctor} onChange={(e) => setSelectedQueueDoctor(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="all">All Doctors</option>
                    {doctors.map(doc => <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const queueAppointments = todayAppointments
                  .filter(apt => selectedQueueDoctor === 'all' || apt.doctorId?._id === selectedQueueDoctor)
                  .sort((a, b) => {
                    const statusOrder = { 'in_progress': 0, 'confirmed': 1, 'pending': 2, 'completed': 3, 'cancelled': 4 };
                    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5) || a.time.localeCompare(b.time);
                  });

                return (
                  <>
                    {/* Queue Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Waiting', count: queueAppointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length, color: 'amber' },
                        { label: 'In Progress', count: queueAppointments.filter(a => a.status === 'in_progress').length, color: 'blue' },
                        { label: 'Completed', count: queueAppointments.filter(a => a.status === 'completed').length, color: 'emerald' },
                      ].map((s, i) => (
                        <div key={i} className={`bg-${s.color}-50 rounded-2xl p-4 text-center border border-${s.color}-100`}>
                          <p className={`text-3xl font-bold text-${s.color}-600`}>{s.count}</p>
                          <p className="text-sm text-slate-600">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Queue List */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      {queueAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-calendar-check text-3xl text-slate-400"></i></div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">No appointments today</h3>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {queueAppointments.map((apt, index) => (
                            <div key={apt._id} className={`p-4 flex items-center gap-4 ${apt.status === 'completed' ? 'bg-emerald-50' : apt.status === 'in_progress' ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${apt.status === 'completed' ? 'bg-emerald-500' : apt.status === 'in_progress' ? 'bg-blue-500' : apt.status === 'confirmed' ? 'bg-cyan-500' : 'bg-amber-500'}`}>
                                {apt.status === 'completed' ? <i className="fas fa-check"></i> : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-800">{apt.userId?.name || 'Unknown'}</p>
                                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">APT-{apt._id.slice(-6).toUpperCase()}</code>
                                </div>
                                <p className="text-sm text-slate-500">Dr. {apt.doctorId?.name} • {formatTime(apt.time)}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(apt.status)}-100 text-${getStatusColor(apt.status)}-700`}>{apt.status}</span>
                              <div className="flex gap-2 items-center">
                                {/* Meet Link for Online Appointments - Doctor joins as Host */}
                                {apt.consultationType === 'online' && apt.googleMeetLink && (
                                  <a href={apt.doctorMeetLink || apt.googleMeetLink} target="_blank" rel="noopener noreferrer" className={`px-3 py-1.5 ${apt.meetingProvider === 'jitsi' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg text-xs font-medium`} title="Join as Host (Moderator)">
                                    <i className="fas fa-video mr-1"></i>{apt.meetingProvider === 'jitsi' ? 'Host' : 'Meet'}
                                  </a>
                                )}
                                {apt.consultationType === 'online' && !apt.googleMeetLink && (
                                  <button onClick={() => regenerateMeetLink(apt._id)} className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600" title="Click to generate Meet link">
                                    <i className="fas fa-sync-alt mr-1"></i>Generate
                                  </button>
                                )}
                                {apt.status === 'pending' && (<><button onClick={() => updateAppointmentStatus(apt._id, 'confirmed')} className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-200"><i className="fas fa-check mr-1"></i>Confirm</button></>)}
                                {apt.status === 'confirmed' && <button onClick={() => updateAppointmentStatus(apt._id, 'in_progress')} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600"><i className="fas fa-play mr-1"></i>Start</button>}
                                {apt.status === 'in_progress' && <button onClick={() => updateAppointmentStatus(apt._id, 'completed')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600"><i className="fas fa-check-double mr-1"></i>Complete</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Doctors Section */}
          {activeSection === 'doctors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800"><i className="fas fa-user-md text-purple-500 mr-2"></i>Doctor Management</h2>
                <button onClick={() => { setEditingDoctor(null); setDoctorForm({ name: '', email: '', phone: '', specialization: '', consultationFee: 500, experience: 0, qualification: 'MBBS' }); setShowDoctorModal(true); }} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                  <i className="fas fa-plus mr-2"></i>Add Doctor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map(doc => (
                  <div key={doc._id} className={`bg-white rounded-2xl p-5 border-2 ${doc.availability === 'Available' ? 'border-emerald-200' : doc.availability === 'Busy' ? 'border-red-200' : 'border-amber-200'} shadow-sm hover:shadow-lg transition-all`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${doc.availability === 'Available' ? 'bg-emerald-500' : doc.availability === 'Busy' ? 'bg-red-500' : 'bg-amber-500'} flex items-center justify-center`}>
                        {doc.profilePhoto ? <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full rounded-2xl object-cover" /> : <i className="fas fa-user-md text-white text-xl"></i>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">Dr. {doc.name}</h3>
                        <p className="text-sm text-slate-500">{doc.specialization}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${doc.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' : doc.availability === 'Busy' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{doc.availability}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 mb-4">
                      <p><i className="fas fa-envelope w-5 text-slate-400"></i>{doc.email}</p>
                      <p><i className="fas fa-phone w-5 text-slate-400"></i>{doc.phone}</p>
                      <p><i className="fas fa-rupee-sign w-5 text-slate-400"></i>₹{doc.consultationFee} per visit</p>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {['Available', 'Busy', 'On Leave'].map(status => (
                        <button key={status} onClick={() => updateDoctorAvailability(doc._id, status)} disabled={doc.availability === status} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${doc.availability === status ? (status === 'Available' ? 'bg-emerald-500 text-white' : status === 'Busy' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{status === 'On Leave' ? 'Leave' : status}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingDoctor(doc); setDoctorForm({ name: doc.name, email: doc.email, phone: doc.phone, specialization: doc.specialization, consultationFee: doc.consultationFee, experience: doc.experience, qualification: doc.qualification }); setShowDoctorModal(true); }} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"><i className="fas fa-edit mr-1"></i>Edit</button>
                      <button onClick={() => handleDeleteDoctor(doc._id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"><i className="fas fa-trash mr-1"></i>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patients Section */}
          {activeSection === 'patients' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input type="text" placeholder="Search patients by name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-users text-3xl text-slate-400"></i></div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No patients found</h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Patient</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Contact</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Blood Group</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Visits</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPatients.map(patient => (
                          <tr key={patient._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">{patient.name?.charAt(0) || 'P'}</div>
                                <div><p className="font-semibold text-slate-800">{patient.name}</p><p className="text-xs text-slate-500">{patient.email}</p></div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{patient.phone || 'N/A'}</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">{patient.medicalHistory?.bloodGroup || 'Unknown'}</span></td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">{patient.appointmentCount || 0}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => { setActiveSection('appointments'); setSearchTerm(patient.name); }} className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-200"><i className="fas fa-calendar"></i></button>
                                <a href={`tel:${patient.phone}`} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200"><i className="fas fa-phone"></i></a>
                              </div>
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

          {/* EMR Section */}
          {activeSection === 'emr' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <i className="fas fa-notes-medical text-white text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">EMR System</h2>
                    <p className="text-slate-500">Electronic Medical Records for your clinic</p>
                  </div>
                </div>

                {/* EMR Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Subscription Plans */}
                  <button onClick={() => setActiveSection('emr-plans')} className="group p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-crown text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Subscription Plans</h3>
                    <p className="text-sm text-slate-500">View and manage your EMR subscription</p>
                  </button>

                  {/* Patient Registration */}
                  <button onClick={() => setActiveSection('emr-patients')} className="group p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-user-plus text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Patient Registration</h3>
                    <p className="text-sm text-slate-500">Register walk-in patients</p>
                  </button>

                  {/* Visit History */}
                  <button onClick={() => setActiveSection('emr-visits')} className="group p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-history text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Visit History</h3>
                    <p className="text-sm text-slate-500">View patient visit records</p>
                  </button>

                  {/* Vitals Recording */}
                  <button onClick={() => setActiveSection('emr-vitals')} className="group p-5 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-100 hover:border-red-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-heartbeat text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Vitals & Trends</h3>
                    <p className="text-sm text-slate-500">Record vitals and view trends</p>
                  </button>

                  {/* Prescriptions */}
                  <button onClick={() => setActiveSection('emr-prescriptions')} className="group p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-prescription text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Prescriptions</h3>
                    <p className="text-sm text-slate-500">Create and manage prescriptions</p>
                  </button>

                  {/* Reports */}
                  <button onClick={() => setActiveSection('emr-reports')} className="group p-5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-100 hover:border-rose-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-file-medical text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Medical Reports</h3>
                    <p className="text-sm text-slate-500">View uploaded patient reports</p>
                  </button>

                  {/* Analytics (Advanced) */}
                  <button onClick={() => setActiveSection('emr-analytics')} className="group p-5 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-100 hover:border-violet-300 hover:shadow-lg transition-all text-left">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <i className="fas fa-chart-line text-white"></i>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">Analytics</h3>
                    <p className="text-sm text-slate-500">Clinic performance insights</p>
                  </button>
                </div>

                {/* Quick Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-info-circle text-teal-600"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">EMR Module</h4>
                      <p className="text-sm text-slate-600">
                        The EMR system helps you manage patient records, prescriptions, and clinical data efficiently. 
                        Subscribe to a plan to unlock all features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMR Sub-screens */}
          {activeSection.startsWith('emr-') && (
            <div className="space-y-6">
              {/* Back Button */}
              <button 
                onClick={() => setActiveSection('emr')} 
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Back to EMR</span>
              </button>

              {/* EMR Plans */}
              {activeSection === 'emr-plans' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    <i className="fas fa-crown text-indigo-500 mr-2"></i>
                    Subscription Plans
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Basic', price: '₹999/mo', features: ['Patient Registration', 'Visit History', 'Basic Prescriptions', 'Report Uploads'], color: 'emerald' },
                      { name: 'Standard', price: '₹1,999/mo', features: ['All Basic features', 'Doctor Notes', 'Follow-up Scheduling', 'Medication History', 'Patient Timeline'], color: 'blue', popular: true },
                      { name: 'Advanced', price: '₹3,999/mo', features: ['All Standard features', 'EMR Dashboard', 'Analytics & Reports', 'Audit Logs', 'Staff Management', 'Data Export'], color: 'purple' }
                    ].map((plan) => (
                      <div key={plan.name} className={`p-5 rounded-xl border-2 ${plan.popular ? `border-${plan.color}-400 bg-${plan.color}-50` : 'border-slate-200'} relative`}>
                        {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">Popular</span>}
                        <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                        <p className="text-2xl font-bold text-slate-800 my-2">{plan.price}</p>
                        <ul className="space-y-2 mt-4">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                              <i className={`fas fa-check text-${plan.color}-500`}></i>{f}
                            </li>
                          ))}
                        </ul>
                        <button className={`w-full mt-4 py-2 rounded-lg font-medium ${plan.popular ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                          {plan.popular ? 'Current Plan' : 'Select Plan'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMR Patients */}
              {activeSection === 'emr-patients' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  {/* Header with view toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">
                      <i className="fas fa-users text-emerald-500 mr-2"></i>
                      Patient Records
                    </h2>
                    <div className="flex gap-2">
                      {(emrPatientView === 'details' || emrPatientView === 'appointments') && (
                        <button 
                          onClick={() => { setEmrPatientView('list'); setSelectedEmrPatient(null); }}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                        >
                          <i className="fas fa-arrow-left mr-2"></i>Back to List
                        </button>
                      )}
                      {emrPatientView === 'list' && (
                        <button 
                          onClick={() => setEmrPatientView('register')}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                        >
                          <i className="fas fa-user-plus mr-2"></i>Register New
                        </button>
                      )}
                      {emrPatientView === 'register' && (
                        <button 
                          onClick={() => setEmrPatientView('list')}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                        >
                          <i className="fas fa-list mr-2"></i>View All Patients
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Patient List View */}
                  {emrPatientView === 'list' && (
                    <div>
                      {/* Search */}
                      <div className="relative mb-4">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input 
                          type="text" 
                          placeholder="Search patients by name, phone, or email..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>

                      {/* Patient Count */}
                      <p className="text-sm text-slate-500 mb-4">
                        {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
                      </p>

                      {/* Patient Cards */}
                      {filteredPatients.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl">
                          <i className="fas fa-users text-4xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500 mb-4">No patients found</p>
                          <button 
                            onClick={() => setEmrPatientView('register')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                          >
                            Register First Patient
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredPatients.map(patient => (
                            <div 
                              key={patient._id} 
                              className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                              onClick={() => fetchPatientDetails(patient)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-800 truncate">{patient.name || 'Unknown'}</h3>
                                  <p className="text-sm text-slate-500 truncate">
                                    <i className="fas fa-phone text-xs mr-1"></i>
                                    {patient.phone || 'No phone'}
                                  </p>
                                  {patient.email && (
                                    <p className="text-xs text-slate-400 truncate">
                                      <i className="fas fa-envelope text-xs mr-1"></i>
                                      {patient.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  {patient.age && <><i className="fas fa-birthday-cake mr-1"></i>{patient.age} yrs</>}
                                  {patient.gender && <span className="ml-2 capitalize">{patient.gender}</span>}
                                </span>
                                <span className="text-emerald-600 font-medium">
                                  View Details <i className="fas fa-chevron-right ml-1"></i>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patient Details View */}
                  {emrPatientView === 'details' && selectedEmrPatient && (
                    <div>
                      {loadingPatientDetails ? (
                        <div className="text-center py-10">
                          <i className="fas fa-spinner fa-spin text-3xl text-emerald-500 mb-3"></i>
                          <p className="text-slate-500">Loading patient details...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Patient Info Card */}
                          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                {selectedEmrPatient.name?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800">{selectedEmrPatient.name}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                  <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="font-medium text-slate-700">{selectedEmrPatient.phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="font-medium text-slate-700 truncate">{selectedEmrPatient.email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Age</p>
                                    <p className="font-medium text-slate-700">{selectedEmrPatient.age ? `${selectedEmrPatient.age} years` : 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500">Gender</p>
                                    <p className="font-medium text-slate-700 capitalize">{selectedEmrPatient.gender || 'N/A'}</p>
                                  </div>
                                </div>
                                {selectedEmrPatient.address && (
                                  <div className="mt-3">
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="font-medium text-slate-700">
                                      {formatAddress(selectedEmrPatient.address) || 'N/A'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-emerald-200">
                              <button 
                                onClick={() => { setSelectedPatientForPrescription(selectedEmrPatient); setActiveSection('emr-prescriptions'); setPrescriptionView('create'); }}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                              >
                                <i className="fas fa-prescription mr-2"></i>New Prescription
                              </button>
                              <button 
                                onClick={() => fetchPatientAppointments(selectedEmrPatient)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                              >
                                <i className="fas fa-calendar-alt mr-2"></i>View Appointments
                              </button>
                              <button 
                                onClick={() => setShowMedicalHistoryForm(true)}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"
                              >
                                <i className="fas fa-notes-medical mr-2"></i>Medical History
                              </button>
                            </div>
                          </div>

                          {/* Medical History Summary */}
                          <MedicalHistorySummary
                            patientId={selectedEmrPatient._id}
                            clinicId={receptionist.clinicId}
                            onViewFullHistory={() => setShowMedicalHistoryForm(true)}
                          />

                          {/* Visit History */}
                          <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">
                              <i className="fas fa-history text-blue-500 mr-2"></i>
                              Visit History ({patientVisits.length})
                            </h4>
                            {patientVisits.length === 0 ? (
                              <p className="text-slate-500 text-sm py-4 text-center bg-slate-50 rounded-lg">No visit records found</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {patientVisits.map((visit, idx) => (
                                  <div key={visit._id || idx} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-slate-700">
                                        {new Date(visit.visitDate || visit.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${visit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {visit.status || 'Completed'}
                                      </span>
                                    </div>
                                    {visit.chiefComplaint && <p className="text-sm text-slate-600 mt-1">{visit.chiefComplaint}</p>}
                                    {visit.doctorId?.name && <p className="text-xs text-slate-500 mt-1">Dr. {visit.doctorId.name}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Prescriptions */}
                          <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">
                              <i className="fas fa-prescription text-amber-500 mr-2"></i>
                              Prescriptions ({patientPrescriptions.length})
                            </h4>
                            {patientPrescriptions.length === 0 ? (
                              <p className="text-slate-500 text-sm py-4 text-center bg-slate-50 rounded-lg">No prescriptions found</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {patientPrescriptions.map((rx, idx) => (
                                  <div key={rx._id || idx} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-slate-700">
                                        {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                      <span className="text-xs text-amber-700 font-medium">
                                        {rx.medicines?.length || 0} medicine{(rx.medicines?.length || 0) !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    {rx.diagnosis && <p className="text-sm text-slate-600 mt-1"><strong>Diagnosis:</strong> {rx.diagnosis}</p>}
                                    {rx.medicines && rx.medicines.length > 0 && (
                                      <div className="mt-2 text-xs text-slate-500">
                                        {rx.medicines.slice(0, 3).map((m, i) => (
                                          <span key={i} className="inline-block bg-white px-2 py-0.5 rounded mr-1 mb-1">{m.name}</span>
                                        ))}
                                        {rx.medicines.length > 3 && <span className="text-slate-400">+{rx.medicines.length - 3} more</span>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Patient Appointments View */}
                  {emrPatientView === 'appointments' && selectedEmrPatient && (
                    <div>
                      {/* Patient Header */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {selectedEmrPatient.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{selectedEmrPatient.name}</h3>
                            <p className="text-sm text-slate-500">{selectedEmrPatient.phone}</p>
                          </div>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-800 mb-3">
                        <i className="fas fa-calendar-alt text-blue-500 mr-2"></i>
                        Appointments ({patientAppointments.length})
                      </h4>

                      {loadingPatientAppointments ? (
                        <div className="text-center py-10">
                          <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-3"></i>
                          <p className="text-slate-500">Loading appointments...</p>
                        </div>
                      ) : patientAppointments.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl">
                          <i className="fas fa-calendar-times text-4xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500">No appointments found for this patient</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientAppointments.map((apt, idx) => (
                            <div key={apt._id || idx} className={`p-4 rounded-xl border ${
                              apt.status === 'completed' ? 'bg-green-50 border-green-200' :
                              apt.status === 'cancelled' ? 'bg-red-50 border-red-200' :
                              apt.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                              'bg-white border-slate-200'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                    <span className="text-slate-500 font-normal ml-2">{apt.time}</span>
                                  </p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    <i className="fas fa-user-md mr-1"></i>
                                    Dr. {apt.doctorId?.name || 'Unknown'}
                                    {apt.doctorId?.specialization && <span className="text-slate-400 ml-1">({apt.doctorId.specialization})</span>}
                                  </p>
                                  {apt.reason && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      <i className="fas fa-notes-medical mr-1"></i>
                                      {apt.reason}
                                    </p>
                                  )}
                                  {apt.consultationType && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      <i className={`fas ${apt.consultationType === 'online' ? 'fa-video' : 'fa-hospital'} mr-1`}></i>
                                      {apt.consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit'}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  apt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  apt.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {apt.status?.replace('_', ' ') || 'Pending'}
                                </span>
                              </div>
                              {apt.tokenNumber && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-xs text-slate-500">Token: #{apt.tokenNumber}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Back to Details Button */}
                      <button 
                        onClick={() => fetchPatientDetails(selectedEmrPatient)}
                        className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                      >
                        <i className="fas fa-arrow-left mr-2"></i>Back to Patient Details
                      </button>
                    </div>
                  )}

                  {/* Register New Patient View */}
                  {emrPatientView === 'register' && (
                    <div>
                      <p className="text-slate-500 mb-4">Register walk-in patients for your clinic.</p>
                      <form onSubmit={handleEmrPatientRegister}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Patient Name *" 
                            value={emrPatientForm.name}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, name: e.target.value})}
                            required
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                          />
                          <input 
                            type="tel" 
                            placeholder="Phone Number *" 
                            value={emrPatientForm.phone}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, phone: e.target.value})}
                            required
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                          />
                          <input 
                            type="email" 
                            placeholder="Email (optional)" 
                            value={emrPatientForm.email}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, email: e.target.value})}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                          />
                          <input 
                            type="number" 
                            placeholder="Age" 
                            value={emrPatientForm.age}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, age: e.target.value})}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                          />
                          <select 
                            value={emrPatientForm.gender}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, gender: e.target.value})}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          <select 
                            value={emrPatientForm.doctorId}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, doctorId: e.target.value})}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="">Select Doctor (optional)</option>
                            {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name}</option>)}
                          </select>
                          <input 
                            type="text" 
                            placeholder="Address (optional)" 
                            value={emrPatientForm.address}
                            onChange={(e) => setEmrPatientForm({...emrPatientForm, address: e.target.value})}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none md:col-span-2" 
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={emrRegistering}
                          className="mt-4 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {emrRegistering ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i>Registering...</>
                          ) : (
                            <><i className="fas fa-plus mr-2"></i>Register Patient</>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* EMR Visits */}
              {activeSection === 'emr-visits' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    <i className="fas fa-history text-blue-500 mr-2"></i>
                    Visit History
                  </h2>
                  <p className="text-slate-500">View and manage patient visit records.</p>
                  <div className="mt-4 text-center py-10 bg-slate-50 rounded-xl">
                    <i className="fas fa-clipboard-list text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500">No visits recorded yet</p>
                  </div>
                </div>
              )}

              {/* EMR Prescriptions */}
              {activeSection === 'emr-prescriptions' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">
                      <i className="fas fa-prescription text-amber-500 mr-2"></i>
                      Prescriptions
                    </h2>
                    {prescriptionView === 'list' && (
                      <button 
                        onClick={() => setPrescriptionView('create')}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        <i className="fas fa-plus mr-2"></i>New Prescription
                      </button>
                    )}
                    {prescriptionView !== 'list' && (
                      <button 
                        onClick={() => { setPrescriptionView('list'); setSelectedPatientForPrescription(null); }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                      >
                        <i className="fas fa-arrow-left mr-2"></i>Back to List
                      </button>
                    )}
                  </div>

                  {/* Prescription List View */}
                  {prescriptionView === 'list' && (
                    <div>
                      {prescriptions.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl">
                          <i className="fas fa-file-prescription text-4xl text-slate-300 mb-3"></i>
                          <p className="text-slate-500 mb-4">No prescriptions yet</p>
                          <button 
                            onClick={() => setPrescriptionView('create')}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                          >
                            Create First Prescription
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {prescriptions.map((rx) => (
                            <div key={rx._id} className="p-4 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-slate-800">{rx.patientName || 'Unknown Patient'}</p>
                                  <p className="text-sm text-slate-500">{rx.diagnosis || 'No diagnosis'}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {rx.medicines?.length || 0} medicines • {new Date(rx.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Quick Send Buttons */}
                                  {(rx.patientId?.phone || rx.patientPhone) && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleSendPrescriptionWhatsApp(rx._id, rx.patientId?.phone || rx.patientPhone); }}
                                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                      title="Send via WhatsApp"
                                    >
                                      <i className="fab fa-whatsapp"></i>
                                    </button>
                                  )}
                                  {(rx.patientId?.email || rx.patientEmail) && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleSendPrescriptionEmail(rx._id, rx.patientId?.email || rx.patientEmail); }}
                                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                      title="Send via Email"
                                    >
                                      <i className="fas fa-envelope"></i>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => { setSelectedPrescription(rx); setPrescriptionView('view'); }}
                                    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create Prescription View */}
                  {prescriptionView === 'create' && (
                    <div className="space-y-6">
                      {/* Patient Selection */}
                      {!selectedPatientForPrescription ? (
                        <div>
                          <h3 className="font-semibold text-slate-800 mb-3">Select Patient</h3>
                          <div className="relative mb-4">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                              type="text" 
                              placeholder="Search patients..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {filteredPatients.map(patient => (
                              <button 
                                key={patient._id}
                                onClick={() => setSelectedPatientForPrescription(patient)}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-amber-50 hover:border-amber-200 border-2 border-transparent transition-all text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                                  {patient.name?.charAt(0) || 'P'}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{patient.name}</p>
                                  <p className="text-xs text-slate-500">{patient.phone || patient.email}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          {filteredPatients.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No patients found. Register a patient first.</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {/* Selected Patient Info */}
                          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                {selectedPatientForPrescription.name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{selectedPatientForPrescription.name}</p>
                                <p className="text-sm text-slate-500">{selectedPatientForPrescription.phone || selectedPatientForPrescription.email}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedPatientForPrescription(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <i className="fas fa-times"></i> Change
                            </button>
                          </div>

                          {/* Diagnosis */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis</label>
                            <textarea
                              value={prescriptionForm.diagnosis}
                              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                              placeholder="Enter diagnosis..."
                              rows="2"
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>

                          {/* Add Medicine */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Add Medicines</label>
                            <div className="relative mb-3">
                              <input
                                type="text"
                                value={medicineSearch}
                                onChange={(e) => handleMedicineSearch(e.target.value)}
                                placeholder="Search medicine..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                              {medicineSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                  {medicineSearchResults.map((med, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setNewMedicine({ ...newMedicine, name: med });
                                        setMedicineSearch(med);
                                        setMedicineSearchResults([]);
                                      }}
                                      className="w-full px-4 py-2 text-left hover:bg-amber-50 text-sm"
                                    >
                                      {med}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <input
                                type="text"
                                value={newMedicine.name}
                                onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                                placeholder="Medicine name"
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                              <input
                                type="text"
                                value={newMedicine.dosage}
                                onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                                placeholder="Dosage (e.g., 500mg)"
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                              <select
                                value={newMedicine.frequency}
                                onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              >
                                <option value="">Frequency</option>
                                {frequencyOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={newMedicine.duration}
                                onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                                placeholder="Duration (e.g., 5 days)"
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            </div>
                            <div className="flex gap-3 items-center">
                              <select
                                value={newMedicine.timing}
                                onChange={(e) => setNewMedicine({ ...newMedicine, timing: e.target.value })}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              >
                                {timingOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={addMedicineToPrescription}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                              >
                                <i className="fas fa-plus mr-1"></i>Add
                              </button>
                            </div>
                          </div>

                          {/* Medicine List */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Medicines ({prescriptionForm.medicines.length})
                            </label>
                            {prescriptionForm.medicines.length === 0 ? (
                              <p className="text-sm text-slate-400 py-3 text-center bg-slate-50 rounded-lg">No medicines added yet</p>
                            ) : (
                              <div className="space-y-2">
                                {prescriptionForm.medicines.map((med, idx) => (
                                  <div key={med.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                      <span className="font-medium text-slate-800">{idx + 1}. {med.name}</span>
                                      {med.dosage && <span className="text-slate-500 ml-2">{med.dosage}</span>}
                                      <div className="text-xs text-slate-500 mt-1">
                                        {med.frequency && <span className="mr-2">{med.frequency}</span>}
                                        {med.duration && <span className="mr-2">× {med.duration}</span>}
                                        {med.timing && <span>({timingOptions.find(t => t.value === med.timing)?.label})</span>}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeMedicineFromPrescription(med.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Instructions */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">General Instructions</label>
                            <textarea
                              value={prescriptionForm.instructions}
                              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                              placeholder="Diet, lifestyle, precautions..."
                              rows="2"
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>

                          {/* Follow-up */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Date</label>
                              <input
                                type="date"
                                value={prescriptionForm.followUpDate}
                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpDate: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Follow-up Notes</label>
                              <input
                                type="text"
                                value={prescriptionForm.followUpNotes}
                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followUpNotes: e.target.value })}
                                placeholder="Follow-up instructions..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={handleSavePrescription}
                            disabled={savingPrescription}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingPrescription ? (
                              <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</>
                            ) : (
                              <><i className="fas fa-save mr-2"></i>Save Prescription</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View Prescription */}
                  {prescriptionView === 'view' && selectedPrescription && (
                    <div className="space-y-4">
                      {/* Patient Details Card */}
                      <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {selectedPrescription.patientName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800">{selectedPrescription.patientName || 'Unknown Patient'}</h3>
                            <p className="text-sm text-slate-500 mb-2">
                              <i className="fas fa-calendar-alt mr-1"></i>
                              Prescription Date: {new Date(selectedPrescription.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            
                            {/* Patient Contact Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-emerald-200">
                              <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="font-medium text-slate-700 text-sm">
                                  {selectedPrescription.patientId?.phone || selectedPrescription.patientPhone || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="font-medium text-slate-700 text-sm truncate">
                                  {selectedPrescription.patientId?.email || selectedPrescription.patientEmail || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Age</p>
                                <p className="font-medium text-slate-700 text-sm">
                                  {selectedPrescription.patientId?.age || selectedPrescription.patientAge || 'N/A'}
                                  {(selectedPrescription.patientId?.age || selectedPrescription.patientAge) && ' years'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Gender</p>
                                <p className="font-medium text-slate-700 text-sm capitalize">
                                  {selectedPrescription.patientId?.gender || selectedPrescription.patientGender || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Address if available */}
                            {selectedPrescription.patientAddress && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500">Address</p>
                                <p className="font-medium text-slate-700 text-sm">
                                  {selectedPrescription.patientAddress}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      {selectedPrescription.diagnosis && (
                        <div>
                          <h4 className="font-medium text-slate-700 mb-1">Diagnosis</h4>
                          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedPrescription.diagnosis}</p>
                        </div>
                      )}
                      
                      {/* Medicines */}
                      <div>
                        <h4 className="font-medium text-slate-700 mb-2">Medicines</h4>
                        <div className="space-y-2">
                          {selectedPrescription.medicines?.map((med, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                              <span className="font-medium">{idx + 1}. {med.name}</span>
                              {med.dosage && <span className="text-slate-500 ml-2">{med.dosage}</span>}
                              <div className="text-xs text-slate-500 mt-1">
                                {med.frequency} {med.duration && `× ${med.duration}`} {med.timing && `(${med.timing})`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      {selectedPrescription.instructions && (
                        <div>
                          <h4 className="font-medium text-slate-700 mb-1">Instructions</h4>
                          <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedPrescription.instructions}</p>
                        </div>
                      )}
                      
                      {/* Follow-up */}
                      {selectedPrescription.followUpDate && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">
                            <i className="fas fa-calendar-check mr-2"></i>
                            Follow-up: {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Send Prescription Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleSendPrescriptionEmail(
                            selectedPrescription._id,
                            selectedPrescription.patientId?.email || selectedPrescription.patientEmail
                          )}
                          disabled={sendingPrescription.email || !(selectedPrescription.patientId?.email || selectedPrescription.patientEmail)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                            selectedPrescription.patientId?.email || selectedPrescription.patientEmail
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {sendingPrescription.email ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <i className="fas fa-envelope"></i>
                          )}
                          <span>Send via Email</span>
                        </button>

                        <button
                          onClick={() => handleSendPrescriptionWhatsApp(
                            selectedPrescription._id,
                            selectedPrescription.patientId?.phone || selectedPrescription.patientPhone
                          )}
                          disabled={sendingPrescription.whatsapp || !(selectedPrescription.patientId?.phone || selectedPrescription.patientPhone)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                            selectedPrescription.patientId?.phone || selectedPrescription.patientPhone
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {sendingPrescription.whatsapp ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <i className="fab fa-whatsapp"></i>
                          )}
                          <span>Send via WhatsApp</span>
                        </button>

                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                        >
                          <i className="fas fa-print"></i>
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EMR Reports */}
              {activeSection === 'emr-reports' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    <i className="fas fa-file-medical text-rose-500 mr-2"></i>
                    Medical Reports
                  </h2>
                  <p className="text-slate-500">View uploaded patient reports and documents.</p>
                  <div className="mt-4 text-center py-10 bg-slate-50 rounded-xl">
                    <i className="fas fa-folder-open text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500">No reports uploaded yet</p>
                  </div>
                </div>
              )}

              {/* EMR Analytics */}
              {activeSection === 'emr-analytics' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">
                    <i className="fas fa-chart-line text-violet-500 mr-2"></i>
                    Analytics & Reports
                  </h2>
                  <p className="text-slate-500">View clinic performance insights and statistics.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {[
                      { label: 'Total Patients', value: patients.length, icon: 'fa-users', color: 'blue' },
                      { label: 'Total Visits', value: '0', icon: 'fa-calendar-check', color: 'emerald' },
                      { label: 'Prescriptions', value: '0', icon: 'fa-prescription', color: 'amber' },
                      { label: 'Revenue', value: '₹0', icon: 'fa-rupee-sign', color: 'purple' }
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
                        <i className={`fas ${stat.icon} text-${stat.color}-500 mb-2`}></i>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EMR Vitals */}
              {activeSection === 'emr-vitals' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                      <i className="fas fa-heartbeat text-red-500 mr-2"></i>
                      Vitals Recording & Trends
                    </h2>
                    <p className="text-slate-500 mb-6">Record patient vitals and view historical trends.</p>
                    
                    {/* Patient Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Patient</label>
                      <select 
                        className="w-full md:w-1/2 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        value={selectedEmrPatient?._id || ''}
                        onChange={(e) => {
                          const patient = patients.find(p => p._id === e.target.value);
                          setSelectedEmrPatient(patient || null);
                          if (patient) {
                            fetchLastVitals(patient._id);
                          } else {
                            setLastVitals(null);
                          }
                        }}
                      >
                        <option value="">-- Select a patient --</option>
                        {patients.map(patient => (
                          <option key={patient._id} value={patient._id}>
                            {patient.name} - {patient.phone}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedEmrPatient ? (
                      <div className="space-y-6">
                        {/* Patient Info */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                              {selectedEmrPatient.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800">{selectedEmrPatient.name}</h3>
                              <p className="text-sm text-slate-500">
                                {selectedEmrPatient.phone} • {selectedEmrPatient.age ? `${selectedEmrPatient.age} yrs` : 'Age N/A'} • {selectedEmrPatient.gender || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Vitals Action Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Record Vitals Card */}
                          <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-100">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <i className="fas fa-edit text-red-500"></i>
                              Record New Vitals
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                              Record blood pressure, pulse, temperature, SpO2, and other vital signs.
                            </p>
                            <button 
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                              onClick={() => setShowVitalsRecorder(true)}
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Record Vitals
                            </button>
                          </div>

                          {/* View Trends Card */}
                          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <i className="fas fa-chart-line text-blue-500"></i>
                              View Vitals Trends
                            </h3>
                            <p className="text-sm text-slate-600 mb-4">
                              View historical trends with charts showing normal ranges.
                            </p>
                            <button 
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                              onClick={() => setShowVitalsTrends(true)}
                            >
                              <i className="fas fa-chart-area mr-2"></i>
                              View Trends
                            </button>
                          </div>
                        </div>

                        {/* Quick Vitals Summary */}
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <h4 className="font-medium text-slate-700 mb-3">
                            Last Recorded Vitals
                            {loadingVitals && <i className="fas fa-spinner fa-spin ml-2 text-slate-400"></i>}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {[
                              { label: 'BP', value: lastVitals?.bloodPressure ? `${lastVitals.bloodPressure.systolic}/${lastVitals.bloodPressure.diastolic}` : '--/--', unit: 'mmHg', icon: '🩺' },
                              { label: 'Pulse', value: lastVitals?.pulse?.value || '--', unit: 'bpm', icon: '💓' },
                              { label: 'Temp', value: lastVitals?.temperature?.value || '--', unit: lastVitals?.temperature?.unit || '°F', icon: '🌡️' },
                              { label: 'SpO2', value: lastVitals?.spo2?.value || '--', unit: '%', icon: '🫁' },
                              { label: 'RR', value: lastVitals?.respiratoryRate?.value || '--', unit: '/min', icon: '🌬️' },
                              { label: 'Sugar', value: lastVitals?.bloodSugar?.value || '--', unit: 'mg/dL', icon: '🩸' }
                            ].map((vital, i) => (
                              <div key={i} className="p-3 bg-slate-50 rounded-lg text-center">
                                <span className="text-lg">{vital.icon}</span>
                                <p className="text-lg font-bold text-slate-800">{vital.value}</p>
                                <p className="text-xs text-slate-500">{vital.label} ({vital.unit})</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <i className="fas fa-user-circle text-6xl text-slate-300 mb-4"></i>
                        <p>Select a patient to record or view vitals</p>
                      </div>
                    )}
                  </div>

                  {/* VitalsRecorder Modal */}
                  {showVitalsRecorder && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex items-center justify-between z-10">
                          <h3 className="text-xl font-bold text-slate-800">
                            <i className="fas fa-heartbeat text-red-500 mr-2"></i>
                            Record Vitals - {selectedEmrPatient?.name}
                          </h3>
                          <button 
                            onClick={() => setShowVitalsRecorder(false)} 
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-slate-600"></i>
                          </button>
                        </div>
                        <div className="p-4">
                          <VitalsRecorder
                            patientId={selectedEmrPatient?._id}
                            onSave={handleSaveVitals}
                            onCancel={() => setShowVitalsRecorder(false)}
                            initialVitals={lastVitals}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VitalsTrends Modal */}
                  {showVitalsTrends && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex items-center justify-between z-10">
                          <h3 className="text-xl font-bold text-slate-800">
                            <i className="fas fa-chart-line text-blue-500 mr-2"></i>
                            Vitals Trends - {selectedEmrPatient?.name}
                          </h3>
                          <button 
                            onClick={() => setShowVitalsTrends(false)} 
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-slate-600"></i>
                          </button>
                        </div>
                        <div className="p-4">
                          <VitalsTrends
                            patientId={selectedEmrPatient?._id}
                            clinicId={receptionist.clinicId}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MedicalHistoryForm Modal */}
                  {showMedicalHistoryForm && selectedEmrPatient && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-4 border-b border-slate-200 flex items-center justify-between z-10">
                          <h3 className="text-xl font-bold text-slate-800">
                            <i className="fas fa-notes-medical text-purple-500 mr-2"></i>
                            Medical History - {selectedEmrPatient?.name}
                          </h3>
                          <button 
                            onClick={() => setShowMedicalHistoryForm(false)} 
                            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-slate-600"></i>
                          </button>
                        </div>
                        <div className="p-4">
                          <MedicalHistoryForm
                            patientId={selectedEmrPatient?._id}
                            clinicId={receptionist.clinicId}
                            onSave={() => {
                              setShowMedicalHistoryForm(false);
                              toast.success('Medical history saved successfully!');
                            }}
                            onCancel={() => setShowMedicalHistoryForm(false)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Advanced Queue Section */}
          {activeSection === 'advanced-queue' && (
            <AdvancedQueueSection 
              clinicId={receptionist.clinicId} 
              clinicName={receptionist.clinicName}
              doctors={doctors} 
            />
          )}

          {/* Pharmacy Section */}
          {activeSection === 'pharmacy' && (
            <PharmacySection clinicId={receptionist.clinicId} />
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <BillingSection 
              clinicId={receptionist.clinicId} 
              clinicName={receptionist.clinicName}
              clinicAddress={receptionist.clinicAddress}
              clinicPhone={receptionist.clinicPhone}
              patients={patients} 
              doctors={doctors} 
            />
          )}

          {/* Staff Schedule Section */}
          {activeSection === 'staff' && (
            <StaffScheduleSection clinicId={receptionist.clinicId} />
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <ClinicAnalyticsSection clinicId={receptionist.clinicId} />
          )}

          {/* IPD Management Section */}
          {activeSection === 'ipd' && (
            <IPDSection 
              clinicId={receptionist.clinicId} 
              clinicName={receptionist.clinicName}
              doctors={doctors}
              patients={patients}
            />
          )}

          {/* Bed Management Section */}
          {activeSection === 'beds' && (
            <BedManagementSection clinicId={receptionist.clinicId} />
          )}

          {/* Audit Logs Section */}
          {activeSection === 'audit-logs' && (
            <AuditLogSection clinicId={receptionist.clinicId} />
          )}

          {/* Enterprise Features */}
          {activeSection === 'insurance' && (
            <InsuranceClaimsSection clinicId={receptionist.clinicId} />
          )}

          {activeSection === 'multi-branch' && (
            <MultiBranchSection clinicId={receptionist.clinicId} organizationId={receptionist.clinicId} />
          )}

          {activeSection === 'vendors' && (
            <VendorManagementSection clinicId={receptionist.clinicId} />
          )}

          {activeSection === 'compliance' && (
            <ComplianceSection clinicId={receptionist.clinicId} />
          )}

          {activeSection === 'attendance' && (
            <StaffAttendanceSection clinicId={receptionist.clinicId} />
          )}

          {activeSection === 'feedback' && (
            <PatientFeedbackSection clinicId={receptionist.clinicId} />
          )}

          {activeSection === 'staff-analytics' && (
            <StaffAnalyticsSection clinicId={receptionist.clinicId} organizationId={receptionist.clinicId} />
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 60 40" fill="none">
                  <path d="M0 20 L10 20 L15 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                  <path d="M15 20 L20 8 L25 32 L30 12 L35 28 L40 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M40 20 L50 20 L60 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </div>
              <span className="font-semibold text-slate-700">HealthSync</span>
            </div>
            <p>© 2024 HealthSync. All rights reserved.</p>
          </div>
        </footer>
      </main>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                <button onClick={() => setShowDoctorModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times text-slate-600"></i></button>
              </div>
            </div>
            <form onSubmit={handleDoctorSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={doctorForm.name} onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={doctorForm.email} onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label><input type="tel" value={doctorForm.phone} onChange={(e) => setDoctorForm({...doctorForm, phone: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Specialization *</label><select value={doctorForm.specialization} onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"><option value="">Select</option><option value="General Physician">General Physician</option><option value="Cardiologist">Cardiologist</option><option value="Dermatologist">Dermatologist</option><option value="Pediatrician">Pediatrician</option><option value="Orthopedic">Orthopedic</option><option value="Gynecologist">Gynecologist</option><option value="ENT Specialist">ENT Specialist</option><option value="Neurologist">Neurologist</option><option value="Dentist">Dentist</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Fee (₹)</label><input type="number" value={doctorForm.consultationFee} onChange={(e) => setDoctorForm({...doctorForm, consultationFee: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Experience (yrs)</label><input type="number" value={doctorForm.experience} onChange={(e) => setDoctorForm({...doctorForm, experience: parseInt(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label><input type="text" value={doctorForm.qualification} onChange={(e) => setDoctorForm({...doctorForm, qualification: e.target.value})} placeholder="MBBS, MD" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDoctorModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:shadow-lg">{editingDoctor ? 'Update' : 'Add'} Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {[{ id: 'overview', icon: 'fa-home', label: 'Home' }, { id: 'appointments', icon: 'fa-calendar', label: 'Appointments' }, { id: 'queue', icon: 'fa-list-ol', label: 'Queue' }, { id: 'emr', icon: 'fa-notes-medical', label: 'EMR' }].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${activeSection === item.id ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400'}`}><i className={`fas ${item.icon}`}></i><span className="text-xs font-medium">{item.label}</span></button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ClinicDashboardPro;

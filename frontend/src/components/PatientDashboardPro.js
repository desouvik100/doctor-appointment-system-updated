import { useState, useEffect, useMemo } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/premium-saas.css';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { exportAppointmentsToPDF } from '../utils/pdfExport';
import MedicalTimeline from './MedicalTimeline';
import RescheduleModal from './RescheduleModal';
import FloatingActionButton from './FloatingActionButton';
import BookingModal from './BookingModal';
import CinemaStyleBooking from './CinemaStyleBooking';
import DoctorProfilePage from './DoctorProfilePage';
import AIAssistant from './AIAssistant';
import FindMyDoctorWizard from './FindMyDoctorWizard';
import ReviewModal from './ReviewModal';
import HealthProfile from './HealthProfile';
import LabReports from './LabReports';
// MedicineDelivery removed - medicine selling not supported for PayU compliance
import AmbulanceBooking from './AmbulanceBooking';
import DoctorChat from './DoctorChat';
import HealthTips from './HealthTips';
import NotificationCenter from './NotificationCenter';
import HealthCheckup from './HealthCheckup';
import { trackUserLocation, getUserLocation } from '../utils/locationService';
import MedicineReminder from './MedicineReminder';
import HealthAnalytics from './HealthAnalytics';
import EmergencyContacts from './EmergencyContacts';
import HealthInsurance from './HealthInsurance';
import ReferralRewards from './ReferralRewards';
import HealthWallet from './HealthWallet';
import SecondOpinion from './SecondOpinion';
import LoyaltyPoints from './LoyaltyPoints';
import UserProfileModal from './UserProfileModal';
import TransactionHistory from './TransactionHistory';
import QuickHealthTools from './QuickHealthTools';
import EmailReminders from './EmailReminders';
import HealthCalculators from './HealthCalculators';
import SecurityWarningBanner from './SecurityWarningBanner';
import LiveQueueTracker from './LiveQueueTracker';
import AIChatbotWidget from './AIChatbotWidget';
import AIHealthHub from './AIHealthHub';

// Get profile photo URL - checks profilePhoto field, then generates fallback
const getProfilePhotoUrl = (user) => {
  if (!user) return null;
  // Check if user has a valid profile photo URL
  if (user.profilePhoto) {
    // Accept any valid URL or base64 data
    if (user.profilePhoto.startsWith('http') || user.profilePhoto.startsWith('data:') || user.profilePhoto.startsWith('/')) {
      return user.profilePhoto;
    }
  }
  return null;
};

// Fallback avatar URL using UI Avatars (generates avatar from name)
const getFallbackAvatarUrl = (name, bgColor = '6366f1') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bgColor}&color=fff&size=100&bold=true`;
};

const PatientDashboardPro = ({ user, onLogout }) => {
  // Ensure user has id field (handle both id and _id from different sources)
  const normalizedUser = user ? { ...user, id: user.id || user._id } : null;
  const [currentUser, setCurrentUser] = useState(normalizedUser);
  const { t, language } = useLanguage();
  
  // Debug: Log user data to help troubleshoot
  console.log('PatientDashboardPro user:', { id: currentUser?.id, _id: currentUser?._id, name: currentUser?.name });
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatDoctor, setChatDoctor] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFindDoctorWizard, setShowFindDoctorWizard] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showQueueTracker, setShowQueueTracker] = useState(false);
  const [trackedAppointment, setTrackedAppointment] = useState(null);
  const [showAIHealthHub, setShowAIHealthHub] = useState(false);

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const fetchNearbyDoctors = async () => {
    const userId = getUserId();
    if (!userId || !userLocation?.latitude) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ maxDistance: maxDistance.toString() });
      if (selectedSpecialization) params.append('specialization', selectedSpecialization);
      const response = await axios.get(`/api/location/nearby-doctors/${userId}?${params}`);
      setDoctors(response.data.doctors || []);
      toast.success(`Found ${response.data.totalFound} doctors within ${maxDistance}km`);
    } catch (error) {
      toast.error('Failed to load nearby doctors');
      setNearbyMode(false);
      fetchDoctors();
    } finally {
      setLoading(false);
    }
  };

  const toggleNearbyMode = async () => {
    if (!nearbyMode) {
      if (!userLocation?.latitude) {
        toast.error('Please update your location first');
        return;
      }
      setNearbyMode(true);
      fetchNearbyDoctors();
    } else {
      setNearbyMode(false);
      fetchDoctors();
    }
  };

  const menuSections = [
    { titleKey: 'main', items: [
      { id: 'overview', icon: 'fas fa-home', labelKey: 'overview' },
      { id: 'find-my-doctor', icon: 'fas fa-robot', labelKey: 'findMyDoctor' },
      { id: 'doctors', icon: 'fas fa-user-md', labelKey: 'findDoctors' },
      { id: 'appointments', icon: 'fas fa-calendar-check', labelKey: 'appointments' },
    ]},
    { titleKey: 'health', items: [
      { id: 'ai-assistant', icon: 'fas fa-robot', labelKey: 'aiHealthAssistant' },
      { id: 'health', icon: 'fas fa-heartbeat', labelKey: 'healthProfile' },
      { id: 'medical-history', icon: 'fas fa-history', labelKey: 'medicalHistory' },
      { id: 'lab-reports', icon: 'fas fa-flask', labelKey: 'labReportsMenu' },
      { id: 'checkup', icon: 'fas fa-stethoscope', labelKey: 'healthCheckup' },
      { id: 'health-analytics', icon: 'fas fa-chart-line', labelKey: 'analytics' },
    ]},
    { titleKey: 'services', items: [
      { id: 'medicine-reminder', icon: 'fas fa-pills', labelKey: 'reminders' },
      { id: 'ambulance', icon: 'fas fa-ambulance', labelKey: 'ambulance' },
      { id: 'second-opinion', icon: 'fas fa-user-md', labelKey: 'secondOpinion' },
    ]},
    { titleKey: 'financial', items: [
      { id: 'wallet', icon: 'fas fa-wallet', labelKey: 'wallet' },
      { id: 'transactions', icon: 'fas fa-receipt', labelKey: 'transactions' },
      { id: 'insurance', icon: 'fas fa-shield-alt', labelKey: 'insurance' },
      { id: 'loyalty', icon: 'fas fa-coins', labelKey: 'loyaltyPoints' },
      { id: 'referrals', icon: 'fas fa-gift', labelKey: 'referEarn' },
    ]},
    { titleKey: 'support', items: [
      { id: 'emergency', icon: 'fas fa-phone-alt', labelKey: 'emergency' },
      { id: 'health-tips', icon: 'fas fa-lightbulb', labelKey: 'healthTips' },
      { id: 'quick-tools', icon: 'fas fa-tools', labelKey: 'quickTools' },
      { id: 'calculators', icon: 'fas fa-calculator', labelKey: 'calculators' },
      { id: 'email-reminders', icon: 'fas fa-envelope', labelKey: 'emailReminders' },
      { id: 'messages', icon: 'fas fa-comments', labelKey: 'messages' },
    ]}
  ];

  const getUserId = () => currentUser?.id || currentUser?._id;

  useEffect(() => { fetchDoctors(); fetchClinics(); if (getUserId()) { fetchAppointments(); fetchUserLocation(); fetchFavorites(); fetchUnreadNotifications(); } }, [currentUser]);

  const fetchUnreadNotifications = async () => { const userId = getUserId(); if (!userId) return; try { const res = await axios.get(`/api/notifications/unread-count/${userId}`); setUnreadNotifications(res.data.unreadCount || 0); } catch { setUnreadNotifications(0); } };
  const fetchUserLocation = async () => { const userId = getUserId(); if (!userId) return; try { const loc = await getUserLocation(userId); if (loc?.latitude) setUserLocation(loc); } catch { /* no location */ } };
  const fetchDoctors = async () => { try { setLoading(true); const res = await axios.get('/api/doctors'); setDoctors(res.data); } catch { toast.error('Failed to load doctors'); } finally { setLoading(false); } };
  const fetchAppointments = async () => { const userId = getUserId(); if (!userId) return; try { const res = await axios.get(`/api/appointments/user/${userId}`); setAppointments(res.data); } catch (e) { console.error(e); } };
  const fetchClinics = async () => { try { const res = await axios.get('/api/clinics'); setClinics(res.data); } catch (e) { console.error(e); } };
  const fetchFavorites = async () => { const userId = getUserId(); if (!userId) return; try { const res = await axios.get(`/api/favorites/${userId}`); setFavoriteDoctors(res.data.map(d => d._id)); } catch { /* no favorites */ } };
  const handleUpdateLocation = async () => { const userId = getUserId(); if (!userId) { toast.error('User not found'); return; } setUpdatingLocation(true); try { const result = await trackUserLocation(userId); if (result.success) { setUserLocation(result.location); toast.success(`Location: ${result.location.city || 'Unknown'}`); } else { toast.error(result.error || 'Failed'); } } catch { toast.error('Failed to get location'); } finally { setUpdatingLocation(false); } };
  const filteredDoctors = useMemo(() => doctors.filter(doc => { const matchSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()); const matchSpec = !selectedSpecialization || doc.specialization === selectedSpecialization; const matchClinic = !selectedClinic || doc.clinicId?._id === selectedClinic; return matchSearch && matchSpec && matchClinic; }), [doctors, searchTerm, selectedSpecialization, selectedClinic]);
  const specializations = useMemo(() => [...new Set(doctors.map(d => d.specialization))].sort(), [doctors]);
  const getUserInitials = () => (currentUser?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const toggleFavorite = async (doctorId) => { const userId = getUserId(); if (!userId) return; try { const res = await axios.post(`/api/favorites/${userId}/toggle`, { doctorId }); if (res.data.isFavorite) { setFavoriteDoctors([...favoriteDoctors, doctorId]); toast.success('Added'); } else { setFavoriteDoctors(favoriteDoctors.filter(id => id !== doctorId)); toast.success('Removed'); } } catch { toast.error('Failed'); } };
  const upcomingAppointments = appointments.filter(apt => new Date(apt.date) >= new Date() && apt.status !== 'cancelled').slice(0, 3);
  const recentDoctors = doctors.slice(0, 4);
  const stats = { upcomingCount: upcomingAppointments.length, completedCount: appointments.filter(a => a.status === 'completed').length, favoritesCount: favoriteDoctors.length };


  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Security Warning Banner */}
      <SecurityWarningBanner userId={getUserId()} />
      
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 bottom-0 bg-gradient-to-b from-gray-950 via-slate-950 to-black border-r border-slate-800/50 z-50 transition-all duration-300 flex flex-col ${mobileSidebarOpen ? 'w-72' : sidebarCollapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onMouseEnter={() => !mobileSidebarOpen && setSidebarCollapsed(false)} onMouseLeave={() => !mobileSidebarOpen && setSidebarCollapsed(true)}>
        <div className="h-20 flex items-center px-4 border-b border-slate-800/50 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg animate-logo-glow">
            <svg className="w-8 h-8" viewBox="0 0 60 40" fill="none">
              <path d="M0 20 L10 20 L15 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
              <path className="ecg-line" d="M15 20 L20 8 L25 32 L30 12 L35 28 L40 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M40 20 L50 20 L60 20" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <span className={`ml-3 font-bold text-white text-xl transition-opacity ${mobileSidebarOpen || !sidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}>HealthSync</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 ${mobileSidebarOpen || !sidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}>{t(section.titleKey)}</h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => { if (item.id === 'find-my-doctor') { setShowFindDoctorWizard(true); } else { setActiveSection(item.id); } setMobileSidebarOpen(false); }} title={t(item.labelKey)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                    <i className={`${item.icon} w-5 text-center`}></i>
                    <span className={`whitespace-nowrap ${mobileSidebarOpen || !sidebarCollapsed ? 'opacity-100' : 'opacity-0 w-0'}`}>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800/50 bg-black flex-shrink-0">
          <button onClick={() => setShowProfileModal(true)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer">
            <img 
              src={getProfilePhotoUrl(currentUser) || getFallbackAvatarUrl(currentUser?.name, '10b981')} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover" 
              onError={(e) => { e.target.src = getFallbackAvatarUrl(currentUser?.name, '10b981'); }} 
            />
            <div className={`flex-1 min-w-0 text-left ${mobileSidebarOpen || !sidebarCollapsed ? '' : 'hidden'}`}>
              <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1"><i className="fas fa-cog text-[10px]"></i> {t('edit')} {t('profile')}</p>
            </div>
          </button>
          <button onClick={onLogout} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-red-500/20">
            <i className="fas fa-sign-out-alt"></i>
            {(mobileSidebarOpen || !sidebarCollapsed) && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center" onClick={() => setMobileSidebarOpen(true)}><i className="fas fa-bars text-slate-600 text-sm"></i></button>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Welcome back, {(currentUser?.name || 'User').split(' ')[0]}</h1>
              <p className="text-xs text-slate-500">{userLocation?.city ? <><i className="fas fa-map-marker-alt text-indigo-500 mr-1"></i>{userLocation.city}</> : 'Have a healthy day'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSection('doctors')} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"><i className="fas fa-plus text-xs"></i>{t('bookNow')}</button>
            <LanguageSelector />
            <button onClick={handleUpdateLocation} disabled={updatingLocation} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className={`fas ${updatingLocation ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'} text-slate-500 text-sm`}></i></button>
            <button onClick={() => setShowNotifications(true)} className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <i className="fas fa-bell text-slate-500 text-sm"></i>
              {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadNotifications}</span>}
            </button>
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 ml-2 hover:bg-slate-50 rounded-lg p-1.5 transition-colors">
              <img 
                src={getProfilePhotoUrl(currentUser) || getFallbackAvatarUrl(currentUser?.name)} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg object-cover" 
                onError={(e) => { e.target.src = getFallbackAvatarUrl(currentUser?.name); }} 
              />
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6">

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: 'fa-calendar-check', value: stats.upcomingCount, label: 'Upcoming', gradient: 'from-blue-500 to-indigo-600', section: 'appointments' },
                  { icon: 'fa-check-circle', value: stats.completedCount, label: 'Completed', gradient: 'from-emerald-500 to-teal-600', section: 'appointments' },
                  { icon: 'fa-heart', value: stats.favoritesCount, label: 'Favorites', gradient: 'from-rose-500 to-pink-600', section: 'favorites' },
                  { icon: 'fa-user-md', value: doctors.length, label: 'Doctors', gradient: 'from-violet-500 to-purple-600', section: 'doctors' }
                ].map((s, i) => (
                  <button key={i} onClick={() => setActiveSection(s.section)} className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${s.gradient} hover:scale-[1.02] transition-all cursor-pointer text-left`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className={`fas ${s.icon} text-white`}></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-white/70">{s.label}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">Top Doctors</h3>
                  <button onClick={() => setActiveSection('doctors')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View All <i className="fas fa-arrow-right text-xs"></i></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentDoctors.map(doc => {
                    const docInitials = doc.name ? doc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR';
                    return (
                    <div key={doc._id} className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-center bg-white">
                      <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 overflow-hidden ring-4 ring-indigo-50">
                        {doc.profilePhoto ? <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : null}
                        {!doc.profilePhoto && <span className="text-white font-semibold">{docInitials}</span>}
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-0.5">Dr. {doc.name}</h4>
                      <p className="text-xs text-slate-500 mb-2">{doc.specialization}</p>
                      <p className="text-sm font-bold text-indigo-600 mb-3">₹{doc.consultationFee}</p>
                      <button onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); }} className="w-full py-2 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">Book Now</button>
                    </div>
                  );})}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[{ icon: 'fa-user-md', label: 'Book Appointment', section: 'doctors', color: 'text-indigo-600', bg: 'bg-indigo-50' }, { icon: 'fa-robot', label: 'AI Health Check', section: 'ai-assistant', color: 'text-emerald-600', bg: 'bg-emerald-50' }, { icon: 'fa-flask', label: 'Lab Reports', section: 'lab-reports', color: 'text-rose-600', bg: 'bg-rose-50' }, { icon: 'fa-bell', label: 'Medicine Reminder', section: 'medicine-reminder', color: 'text-amber-600', bg: 'bg-amber-50' }].map((a, i) => (
                    <button key={i} onClick={() => setActiveSection(a.section)} className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left">
                      <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}><i className={`fas ${a.icon} ${a.color}`}></i></div>
                      <span className="text-sm font-medium text-slate-700">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {upcomingAppointments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h3>
                    <button onClick={() => setActiveSection('appointments')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">View All <i className="fas fa-arrow-right text-xs"></i></button>
                  </div>
                  <div className="space-y-3">
                    {upcomingAppointments.map(apt => (
                      <div key={apt._id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><i className="fas fa-user-md text-indigo-600"></i></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 text-sm">Dr. {apt.doctorId?.name || 'Unknown'}</h4>
                          <p className="text-xs text-slate-500">{apt.doctorId?.specialization}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs text-slate-500">{apt.time}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : apt.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{apt.status}</span>
                        {/* Track Queue button for today's appointments */}
                        {new Date(apt.date).toDateString() === new Date().toDateString() && (apt.status === 'confirmed' || apt.status === 'pending') && (
                          <button 
                            onClick={() => { setTrackedAppointment(apt); setShowQueueTracker(true); }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <i className="fas fa-users text-[10px]"></i>
                            Queue
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeSection === 'doctors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative"><i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i><input type="text" placeholder="Search doctors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <select value={selectedSpecialization} onChange={(e) => { setSelectedSpecialization(e.target.value); if (nearbyMode) setTimeout(fetchNearbyDoctors, 100); }} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">All Specializations</option>{specializations.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  {!nearbyMode && <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">All Clinics</option>{clinics.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}
                  <button onClick={toggleNearbyMode} disabled={!userLocation?.latitude && !nearbyMode} className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${nearbyMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'} ${!userLocation?.latitude && !nearbyMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <i className="fas fa-map-marker-alt"></i>
                    {nearbyMode ? 'Show All' : 'Find Nearby'}
                  </button>
                  {nearbyMode && (
                    <select value={maxDistance} onChange={(e) => { setMaxDistance(Number(e.target.value)); setTimeout(fetchNearbyDoctors, 100); }} className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value={5}>Within 5 km</option>
                      <option value={10}>Within 10 km</option>
                      <option value={25}>Within 25 km</option>
                      <option value={50}>Within 50 km</option>
                      <option value={100}>Within 100 km</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">{nearbyMode ? doctors.length : filteredDoctors.length} doctors found {nearbyMode && userLocation?.city && <span className="text-indigo-600">near {userLocation.city}</span>}</p>
                {!userLocation?.latitude && <button onClick={handleUpdateLocation} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"><i className="fas fa-location-crosshairs"></i> Update location to find nearby doctors</button>}
              </div>
              {loading ? (<div className="flex flex-col items-center justify-center py-20"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div><p className="text-slate-500">Loading...</p></div>
              ) : filteredDoctors.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-user-md text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">No doctors found</h3><p className="text-slate-500">Try adjusting your filters</p></div>
              ) : (
                <div className="space-y-4">
                  {(nearbyMode ? doctors : filteredDoctors).map(doc => {
                    const docInitials = doc.name ? doc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR';
                    return (
                    <div key={doc._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {doc.profilePhoto ? <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : null}
                            {!doc.profilePhoto && <span className="text-white text-lg font-bold">{docInitials}</span>}
                          </div>
                          <div><h4 className="font-bold text-slate-800">Dr. {doc.name}</h4><p className="text-sm text-indigo-600 font-medium">{doc.specialization}</p><p className="text-sm text-slate-500"><i className="fas fa-hospital text-xs mr-1"></i>{doc.clinicId?.name || 'Independent'}</p>{nearbyMode && doc.distanceText && <p className="text-xs text-emerald-600 font-medium mt-1"><i className="fas fa-route mr-1"></i>{doc.distanceText}</p>}</div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500">{doc.experience && <span><i className="fas fa-award text-amber-500 mr-1"></i>{doc.experience} yrs</span>}{doc.rating > 0 && <span><i className="fas fa-star text-amber-500 mr-1"></i>{doc.rating.toFixed(1)}</span>}</div>
                        <div className="text-center lg:text-right"><p className="text-2xl font-bold text-slate-800">₹{doc.consultationFee}</p><p className="text-xs text-slate-500">per visit</p></div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleFavorite(doc._id)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${favoriteDoctors.includes(doc._id) ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}><i className={favoriteDoctors.includes(doc._id) ? 'fas fa-heart' : 'far fa-heart'}></i></button>
                          <button onClick={() => { setSelectedDoctor(doc); setShowDoctorProfile(true); }} className="px-4 py-2.5 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2"><i className="fas fa-calendar-alt"></i><span className="hidden sm:inline">Schedule</span></button>
                          <button disabled={doc.availability !== 'Available'} onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); }} className={`px-6 py-2.5 rounded-xl font-medium ${doc.availability === 'Available' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{doc.availability === 'Available' ? 'Book Now' : 'Unavailable'}</button>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}
          {activeSection === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">{t('appointments')}</h2>
                {appointments.length > 0 && (
                  <button 
                    onClick={() => exportAppointmentsToPDF(appointments, 'My Appointments')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <i className="fas fa-file-pdf text-red-500"></i>
                    Export PDF
                  </button>
                )}
              </div>
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-calendar-times text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">No appointments yet</h3><p className="text-slate-500 mb-4">Book your first appointment</p><button onClick={() => setActiveSection('doctors')} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Find Doctors</button></div>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div key={apt._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.consultationType === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}><i className={`fas ${apt.consultationType === 'online' ? 'fa-video' : 'fa-hospital'} mr-1`}></i>{apt.consultationType === 'online' ? 'Online' : 'In-Person'}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : apt.status === 'pending' ? 'bg-amber-100 text-amber-700' : apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{apt.status}</span>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><i className="fas fa-user-md text-white text-xl"></i></div>
                        <div><h4 className="font-bold text-slate-800">Dr. {apt.doctorId?.name || 'Unknown'}</h4><p className="text-sm text-slate-500">{apt.doctorId?.specialization}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                        <span><i className="fas fa-calendar text-indigo-500 mr-2"></i>{new Date(apt.date).toLocaleDateString()}</span>
                        <span><i className="fas fa-clock text-indigo-500 mr-2"></i>{apt.time}</span>
                        <span><i className="fas fa-hospital text-indigo-500 mr-2"></i>{apt.clinicId?.name || 'HealthSync'}</span>
                      </div>
                      {/* Track Queue Button - for today's confirmed/pending appointments */}
                      {(apt.status === 'confirmed' || apt.status === 'pending') && new Date(apt.date).toDateString() === new Date().toDateString() && (
                        <button 
                          onClick={() => { setTrackedAppointment(apt); setShowQueueTracker(true); }} 
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg mb-2"
                        >
                          <i className="fas fa-users mr-2"></i>Track Live Queue
                        </button>
                      )}
                      {apt.consultationType === 'online' && apt.googleMeetLink && <button onClick={() => window.open(apt.googleMeetLink, '_blank')} className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg"><i className="fas fa-video mr-2"></i>Join Meeting</button>}
                      {apt.status === 'completed' && <button onClick={() => { setReviewAppointment(apt); setShowReviewModal(true); }} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg mt-2"><i className="fas fa-star mr-2"></i>Write Review</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSection === 'ai-assistant' && <AIAssistant user={currentUser} />}
          {activeSection === 'health' && <HealthProfile userId={getUserId()} />}
          {activeSection === 'lab-reports' && <LabReports userId={getUserId()} />}
          {activeSection === 'checkup' && <HealthCheckup userId={getUserId()} userName={currentUser?.name} userEmail={currentUser?.email} userPhone={currentUser?.phone} />}
          {activeSection === 'medical-history' && <MedicalTimeline userId={getUserId()} />}
          {activeSection === 'health-analytics' && <HealthAnalytics userId={getUserId()} />}
          {activeSection === 'medicine-reminder' && <MedicineReminder userId={getUserId()} />}
          {activeSection === 'ambulance' && <AmbulanceBooking userId={getUserId()} userName={currentUser?.name} userPhone={currentUser?.phone} userLocation={userLocation} />}
          {activeSection === 'second-opinion' && <SecondOpinion userId={getUserId()} userName={currentUser?.name} />}
          {activeSection === 'wallet' && <HealthWallet userId={getUserId()} userName={currentUser?.name} />}
          {activeSection === 'transactions' && <TransactionHistory userId={getUserId()} appointments={appointments} />}
          {activeSection === 'insurance' && <HealthInsurance userId={getUserId()} />}
          {activeSection === 'loyalty' && <LoyaltyPoints userId={getUserId()} />}
          {activeSection === 'referrals' && <ReferralRewards userId={getUserId()} userName={currentUser?.name} />}
          {activeSection === 'emergency' && <EmergencyContacts userId={getUserId()} />}
          {activeSection === 'health-tips' && <HealthTips />}
          {activeSection === 'quick-tools' && <QuickHealthTools userId={getUserId()} />}
          {activeSection === 'calculators' && <HealthCalculators />}
          {activeSection === 'email-reminders' && <EmailReminders userId={getUserId()} userEmail={currentUser?.email} />}
          {activeSection === 'messages' && <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-comments text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">Chat with Doctors</h3><p className="text-slate-500 mb-4">Click on a doctor to start</p><button onClick={() => setActiveSection('doctors')} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Find Doctors</button></div>}
        </div>
        <footer className="bg-white border-t border-slate-200 px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">HS</div><span className="font-semibold text-slate-700">HealthSync</span></div>
            <div className="flex items-center gap-6"><a href="#privacy" className="hover:text-indigo-600">Privacy</a><a href="#terms" className="hover:text-indigo-600">Terms</a><a href="#support" className="hover:text-indigo-600">Support</a></div>
            <p>© 2024 HealthSync. All rights reserved.</p>
          </div>
        </footer>
      </main>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {[{ id: 'overview', icon: 'fa-home', label: 'Home' }, { id: 'doctors', icon: 'fa-user-md', label: 'Doctors' }, { id: 'appointments', icon: 'fa-calendar', label: 'Bookings' }, { id: 'ai-assistant', icon: 'fa-robot', label: 'AI' }].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${activeSection === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}><i className={`fas ${item.icon}`}></i><span className="text-xs font-medium">{item.label}</span></button>
          ))}
          <button onClick={() => setMobileSidebarOpen(true)} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-slate-400"><i className="fas fa-ellipsis-h"></i><span className="text-xs font-medium">More</span></button>
        </div>
      </nav>
      {showBookingModal && selectedDoctor && <CinemaStyleBooking doctor={selectedDoctor} user={currentUser} onClose={() => { setShowBookingModal(false); setSelectedDoctor(null); }} onSuccess={() => { fetchAppointments(); setShowBookingModal(false); setSelectedDoctor(null); }} />}
      {showDoctorProfile && selectedDoctor && <div className="fixed inset-0 z-50 overflow-y-auto"><DoctorProfilePage doctor={selectedDoctor} user={currentUser} onBack={() => { setShowDoctorProfile(false); setSelectedDoctor(null); }} onBookingSuccess={() => { fetchAppointments(); setShowDoctorProfile(false); setSelectedDoctor(null); }} /></div>}
      {showReviewModal && reviewAppointment && <ReviewModal appointment={reviewAppointment} onClose={() => { setShowReviewModal(false); setReviewAppointment(null); }} onSuccess={() => fetchAppointments()} />}
      {showNotifications && <NotificationCenter userId={getUserId()} onClose={() => { setShowNotifications(false); fetchUnreadNotifications(); }} />}
      {showChat && chatDoctor && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><DoctorChat user={currentUser} doctor={chatDoctor} onClose={() => { setShowChat(false); setChatDoctor(null); }} /></div>}
      {showProfileModal && <UserProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} onUpdate={handleProfileUpdate} />}
      {showFindDoctorWizard && <FindMyDoctorWizard onClose={() => setShowFindDoctorWizard(false)} onComplete={(recommendation) => { setShowFindDoctorWizard(false); setSelectedSpecialization(recommendation.primarySpecialist); setActiveSection('doctors'); }} onBookDoctor={(specialist) => { setSelectedSpecialization(specialist); setActiveSection('doctors'); }} />}
      {showQueueTracker && trackedAppointment && <LiveQueueTracker appointment={trackedAppointment} onClose={() => { setShowQueueTracker(false); setTrackedAppointment(null); }} />}
      
      {/* Floating Action Button for Mobile */}
      <div className="lg:hidden">
        <FloatingActionButton 
          actions={[
            { id: 'book', icon: 'fa-calendar-plus', label: 'Book Appointment', color: 'indigo', onClick: () => setActiveSection('doctors') },
            { id: 'ai', icon: 'fa-robot', label: 'AI Assistant', color: 'purple', onClick: () => setActiveSection('ai-assistant') },
            { id: 'emergency', icon: 'fa-ambulance', label: 'Emergency', color: 'red', onClick: () => setActiveSection('ambulance') },
            { id: 'history', icon: 'fa-history', label: 'Medical History', color: 'emerald', onClick: () => setActiveSection('medical-history') }
          ]}
        />
      </div>

      {/* AI Chatbot Widget - Floating */}
      <div className="hidden lg:block">
        <AIChatbotWidget userId={getUserId()} />
      </div>

      {/* AI Health Hub Button - Floating */}
      <button
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl hover:scale-110"
        onClick={() => setShowAIHealthHub(true)}
        title="AI Health Assistant"
      >
        🤖
      </button>

      {/* AI Health Hub Modal */}
      {showAIHealthHub && (
        <AIHealthHub 
          user={currentUser} 
          onClose={() => setShowAIHealthHub(false)} 
        />
      )}
    </div>
  );
};


export default PatientDashboardPro;
import { useState, useEffect, useMemo } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import '../styles/premium-saas.css';
import '../styles/skeleton-loaders.css';
import '../styles/bottom-navigation.css';
import '../styles/offline-indicator.css';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { exportAppointmentsToPDF } from '../utils/pdfExport';
import MedicalTimeline from './MedicalTimeline';
import RescheduleModal from './RescheduleModal';
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
import AIHealthHub from './AIHealthHub';
import MobileHeroSection from './MobileHeroSection';
import BottomNavigation from './BottomNavigation';
import OfflineIndicator from './OfflineIndicator';
import { DoctorCardSkeleton, AppointmentCardSkeleton, PageSkeleton } from './SkeletonLoaders';
import { successFeedback } from '../mobile/haptics';
import { Capacitor } from '@capacitor/core';

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
const getFallbackAvatarUrl = (name, bgColor = '0ea5e9') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=${bgColor}&color=fff&size=100&bold=true`;
};

const PatientDashboardPro = ({ user, onLogout }) => {
  // Ensure user has id field (handle id, _id, or userId from different sources)
  const normalizedUser = user ? { 
    ...user, 
    id: user.id || user._id || user.userId,
    _id: user._id || user.id || user.userId
  } : null;
  const [currentUser, setCurrentUser] = useState(normalizedUser);
  const { t, language } = useLanguage();
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
  
  // Appointment filter states
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('all');
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
  const [consultationTypeFilter, setConsultationTypeFilter] = useState('all'); // 'all', 'online', 'clinic'
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

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

  // Override landing page gradient background for dashboard
  useEffect(() => {
    const originalBg = document.documentElement.style.background;
    const theme = document.documentElement.getAttribute('data-theme');
    document.documentElement.style.background = theme === 'dark' ? '#0f172a' : '#f8fafc';
    return () => {
      document.documentElement.style.background = originalBg;
    };
  }, []);

  useEffect(() => { fetchDoctors(); fetchClinics(); if (getUserId()) { fetchAppointments(); fetchUserLocation(); fetchFavorites(); fetchUnreadNotifications(); } }, [currentUser]);

  // Auto-detect location on mobile when user logs in (since location button is hidden on mobile)
  useEffect(() => {
    const autoDetectLocation = async () => {
      const userId = getUserId();
      if (!userId) return;
      
      // Only auto-detect if location is not already set
      if (userLocation?.latitude) return;
      
      // Check if we're on mobile (screen width < 640px)
      const isMobile = window.innerWidth < 640;
      if (!isMobile) return;
      
      // Small delay to let the dashboard load first
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const result = await trackUserLocation(userId);
        if (result.success) {
          setUserLocation(result.location);
          toast.success(`📍 Location detected: ${result.location.city || 'Unknown'}`, { duration: 3000 });
        }
      } catch (error) {
        // Silent fail - don't bother user if auto-detection fails
        console.log('Auto location detection skipped:', error.message);
      }
    };
    
    autoDetectLocation();
  }, [currentUser, userLocation?.latitude]);

  const fetchUnreadNotifications = async () => { const userId = getUserId(); if (!userId) return; try { const res = await axios.get(`/api/notifications/unread-count/${userId}`); setUnreadNotifications(res.data.unreadCount || 0); } catch { setUnreadNotifications(0); } };
  const fetchUserLocation = async () => { const userId = getUserId(); if (!userId) return; try { const loc = await getUserLocation(userId); if (loc?.latitude) setUserLocation(loc); } catch { /* no location */ } };
  const fetchDoctors = async () => { try { setLoading(true); const res = await axios.get('/api/doctors'); setDoctors(res.data); } catch { toast.error('Failed to load doctors'); } finally { setLoading(false); } };
  const fetchAppointments = async () => { 
    const userId = getUserId(); 
    if (!userId) { console.log('No userId for fetchAppointments'); return; } 
    try { 
      console.log('Fetching appointments for userId:', userId);
      const res = await axios.get(`/api/appointments/user/${userId}`); 
      console.log('Appointments fetched:', res.data?.length || 0);
      setAppointments(res.data || []); 
    } catch (e) { 
      console.error('Error fetching appointments:', e.response?.data || e.message); 
    } 
  };
  const fetchClinics = async () => { try { const res = await axios.get('/api/clinics'); setClinics(res.data); } catch (e) { console.error(e); } };
  const fetchFavorites = async () => { const userId = getUserId(); if (!userId) return; try { const res = await axios.get(`/api/favorites/${userId}`); setFavoriteDoctors(res.data.map(d => d._id)); } catch { /* no favorites */ } };
  const handleUpdateLocation = async () => { const userId = getUserId(); if (!userId) { toast.error('User not found'); return; } setUpdatingLocation(true); try { const result = await trackUserLocation(userId); if (result.success) { setUserLocation(result.location); toast.success(`Location: ${result.location.city || 'Unknown'}`); } else { toast.error(result.error || 'Failed'); } } catch { toast.error('Failed to get location'); } finally { setUpdatingLocation(false); } };
  const filteredDoctors = useMemo(() => doctors.filter(doc => { 
    const matchSearch = !searchTerm || doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()); 
    const matchSpec = !selectedSpecialization || doc.specialization === selectedSpecialization; 
    const matchClinic = !selectedClinic || doc.clinicId?._id === selectedClinic;
    // Consultation type filter
    const consultTypes = doc.consultationTypes || ['clinic'];
    const matchConsultType = consultationTypeFilter === 'all' || 
      (consultationTypeFilter === 'online' && consultTypes.includes('online')) ||
      (consultationTypeFilter === 'clinic' && consultTypes.includes('clinic'));
    return matchSearch && matchSpec && matchClinic && matchConsultType; 
  }), [doctors, searchTerm, selectedSpecialization, selectedClinic, consultationTypeFilter]);
  const specializations = useMemo(() => [...new Set(doctors.map(d => d.specialization))].sort(), [doctors]);
  
  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const searchLower = appointmentSearch.toLowerCase();
      const matchesSearch = !appointmentSearch || 
        apt.doctorId?.name?.toLowerCase().includes(searchLower) ||
        apt.doctorId?.specialization?.toLowerCase().includes(searchLower) ||
        apt.reason?.toLowerCase().includes(searchLower);
      const matchesStatus = appointmentStatusFilter === 'all' || apt.status === appointmentStatusFilter;
      const matchesType = appointmentTypeFilter === 'all' || apt.consultationType === appointmentTypeFilter;
      let matchesDate = true;
      if (appointmentDateFilter !== 'all' && apt.date) {
        const aptDate = new Date(apt.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (appointmentDateFilter === 'today') {
          matchesDate = aptDate.toDateString() === today.toDateString();
        } else if (appointmentDateFilter === 'upcoming') {
          matchesDate = aptDate >= today;
        } else if (appointmentDateFilter === 'past') {
          matchesDate = aptDate < today;
        } else if (appointmentDateFilter === 'week') {
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          matchesDate = aptDate >= today && aptDate <= weekEnd;
        }
      }
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [appointments, appointmentSearch, appointmentStatusFilter, appointmentTypeFilter, appointmentDateFilter]);
  
  const resetAppointmentFilters = () => {
    setAppointmentSearch('');
    setAppointmentStatusFilter('all');
    setAppointmentTypeFilter('all');
    setAppointmentDateFilter('all');
  };
  const getUserInitials = () => (currentUser?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const toggleFavorite = async (doctorId) => { const userId = getUserId(); if (!userId) return; try { const res = await axios.post(`/api/favorites/${userId}/toggle`, { doctorId }); if (res.data.isFavorite) { setFavoriteDoctors([...favoriteDoctors, doctorId]); toast.success('Added'); } else { setFavoriteDoctors(favoriteDoctors.filter(id => id !== doctorId)); toast.success('Removed'); } } catch { toast.error('Failed'); } };
  const upcomingAppointments = appointments.filter(apt => {
    if (!apt.date || apt.status === 'cancelled') return false;
    const aptDate = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return aptDate >= today;
  }).slice(0, 3);
  const recentDoctors = doctors.slice(0, 4);
  
  // Platform stats for display - show real user data or attractive platform numbers
  const userUpcoming = upcomingAppointments.length;
  const userCompleted = appointments.filter(a => a.status === 'completed').length;
  const userFavorites = favoriteDoctors.length;
  
  const stats = { 
    upcomingCount: userUpcoming || 0,
    completedCount: userCompleted || 0, 
    favoritesCount: userFavorites || 0,
    doctorsCount: doctors.length || 0,
    // Platform-wide attractive stats for new users
    totalBookings: '15K+',
    happyPatients: '8K+',
    avgRating: '4.8'
  };


  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Security Warning Banner */}
      <SecurityWarningBanner userId={getUserId()} />
      
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 bottom-0 bg-gradient-to-b from-gray-950 via-slate-950 to-black border-r border-slate-800/50 z-50 transition-all duration-300 flex flex-col ${mobileSidebarOpen ? 'w-72' : sidebarCollapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onMouseEnter={() => !mobileSidebarOpen && setSidebarCollapsed(false)} onMouseLeave={() => !mobileSidebarOpen && setSidebarCollapsed(true)}>
        <div className="h-20 flex items-center px-4 border-b border-slate-800/50 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg animate-logo-glow">
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
              <h3 className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 ${mobileSidebarOpen || !sidebarCollapsed ? 'opacity-100' : 'opacity-0 h-0 mb-0'}`}>{t(section.titleKey)}</h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => { if (item.id === 'find-my-doctor') { setShowFindDoctorWizard(true); } else { setActiveSection(item.id); } setMobileSidebarOpen(false); }} title={t(item.labelKey)} className={`w-full flex items-center ${mobileSidebarOpen || !sidebarCollapsed ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                    <i className={`${item.icon} ${mobileSidebarOpen || !sidebarCollapsed ? 'w-5' : 'w-full text-lg'} text-center`}></i>
                    <span className={`whitespace-nowrap transition-all ${mobileSidebarOpen || !sidebarCollapsed ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>{t(item.labelKey)}</span>
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

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-2 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              type="button"
              className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 hover:bg-sky-100 flex items-center justify-center cursor-pointer active:scale-95 border border-sky-200" 
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              onPointerDown={() => setMobileSidebarOpen(true)}
            >
              <i className="fas fa-bars text-sky-600 text-base sm:text-lg"></i>
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">Welcome back, {(currentUser?.name || 'User').split(' ')[0]}</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">{userLocation?.city ? <><i className="fas fa-map-marker-alt text-sky-500 mr-1"></i>{userLocation.city}</> : 'Book an online consultation or visit a clinic near you'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setShowQuickSearch(true)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 hover:bg-sky-100 hover:text-sky-600 flex items-center justify-center transition-colors" title="Quick Search">
              <i className="fas fa-search text-slate-500 hover:text-sky-600 text-xs sm:text-sm"></i>
            </button>
            <button onClick={() => setActiveSection('doctors')} className="hidden md:flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"><i className="fas fa-plus text-xs"></i>{t('bookNow')}</button>
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            <button onClick={handleUpdateLocation} disabled={updatingLocation} className="hidden sm:flex w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center" title="Update Location"><i className={`fas ${updatingLocation ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'} ${userLocation?.city ? 'text-sky-500' : 'text-slate-400'} text-xs sm:text-sm`}></i></button>
            <button onClick={() => setShowNotifications(true)} className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <i className="fas fa-bell text-slate-500 text-xs sm:text-sm"></i>
              {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadNotifications}</span>}
            </button>
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 sm:p-1.5 transition-colors">
              <img 
                src={getProfilePhotoUrl(currentUser) || getFallbackAvatarUrl(currentUser?.name)} 
                alt="Profile" 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover" 
                onError={(e) => { e.target.src = getFallbackAvatarUrl(currentUser?.name); }} 
              />
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden has-bottom-nav" style={{ WebkitOverflowScrolling: 'touch' }}>
          {activeSection === 'overview' && (
            <div className="space-y-6">

              {/* Mobile Hero Section - Only visible on mobile */}
              <div className="lg:hidden">
                <MobileHeroSection 
                  user={currentUser}
                  onVideoConsult={() => {
                    setActiveSection('doctors');
                    // Could set a filter for online consultations
                  }}
                  onClinicVisit={() => {
                    setActiveSection('doctors');
                    // Could set a filter for clinic visits
                  }}
                  onSmartMatch={() => setShowFindDoctorWizard(true)}
                  onSearch={(query) => {
                    setSearchTerm(query);
                    setActiveSection('doctors');
                  }}
                />
              </div>

              {/* Desktop Stats - Modern Startup Style */}
              <div className="hidden lg:grid grid-cols-4 gap-4">
                {[
                  { icon: 'fa-calendar-check', value: stats.totalBookings, label: 'Bookings Made', color: 'sky' },
                  { icon: 'fa-smile-beam', value: stats.happyPatients, label: 'Happy Patients', color: 'emerald' },
                  { icon: 'fa-user-md', value: `${stats.doctorsCount}+`, label: 'Expert Doctors', color: 'violet' },
                  { icon: 'fa-star', value: stats.avgRating, label: 'Avg Rating', color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${s.color === 'sky' ? 'from-sky-400/20 to-cyan-400/20' : s.color === 'emerald' ? 'from-emerald-400/20 to-teal-400/20' : s.color === 'violet' ? 'from-violet-400/20 to-purple-400/20' : 'from-amber-400/20 to-orange-400/20'} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className="relative flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color === 'sky' ? 'bg-sky-50 text-sky-600' : s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : s.color === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                        <i className={`fas ${s.icon} text-lg`}></i>
                      </div>
                      <div>
                        <p className={`text-3xl font-bold tracking-tight ${s.color === 'sky' ? 'text-sky-600' : s.color === 'emerald' ? 'text-emerald-600' : s.color === 'violet' ? 'text-violet-600' : 'text-amber-600'}`}>{s.value}</p>
                        <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Why Trust Us Strip */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
                  <span className="flex items-center gap-2 text-emerald-700"><i className="fas fa-check-circle text-emerald-500"></i>Verified local doctors</span>
                  <span className="flex items-center gap-2 text-emerald-700"><i className="fas fa-check-circle text-emerald-500"></i>Transparent pricing</span>
                  <span className="flex items-center gap-2 text-emerald-700"><i className="fas fa-check-circle text-emerald-500"></i>No hidden charges</span>
                  <span className="flex items-center gap-2 text-emerald-700"><i className="fas fa-check-circle text-emerald-500"></i>Secure payments</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {userLocation?.city ? `Doctors Near ${userLocation.city}` : 'Available Today'}
                  </h3>
                  <button onClick={() => setActiveSection('doctors')} className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">View All <i className="fas fa-arrow-right text-xs"></i></button>
                </div>
                {/* Online vs In-Clinic Toggle */}
                <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All', icon: 'fa-th-large' },
                    { id: 'online', label: 'Online', icon: 'fa-video' },
                    { id: 'clinic', label: 'In-Clinic', icon: 'fa-hospital' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setConsultationTypeFilter(type.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        consultationTypeFilter === type.id
                          ? 'bg-white text-sky-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <i className={`fas ${type.icon} text-xs`}></i>
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentDoctors.map(doc => {
                    // Availability status
                    const availStatus = doc.availability === 'Available' ? 
                      (Math.random() > 0.3 ? 'available' : 'limited') : 'unavailable';
                    const availLabel = availStatus === 'available' ? '🟢 Available Today' : 
                      availStatus === 'limited' ? '🟡 Limited Slots' : '⚪ Next Available';
                    // Consultation type
                    const consultTypes = doc.consultationTypes || ['clinic'];
                    const typeLabel = consultTypes.includes('online') && consultTypes.includes('clinic') ? 'Both' :
                      consultTypes.includes('online') ? 'Online' : 'Clinic';
                    const docInitials = doc.name ? doc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR';
                    return (
                    <div key={doc._id} className="group p-4 rounded-xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all bg-white">
                      {/* Availability Badge */}
                      <div className="text-[10px] font-medium mb-2">{availLabel}</div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center overflow-hidden ring-2 ring-sky-50 flex-shrink-0">
                          {doc.profilePhoto ? <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : null}
                          {!doc.profilePhoto && <span className="text-white font-semibold text-sm">{docInitials}</span>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-800 text-sm truncate">{doc.name?.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}</h4>
                          <p className="text-xs text-slate-500 truncate">{doc.specialization}</p>
                        </div>
                      </div>
                      {/* Type & Locality Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeLabel === 'Online' ? 'bg-blue-100 text-blue-700' : typeLabel === 'Both' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          <i className={`fas ${typeLabel === 'Online' ? 'fa-video' : typeLabel === 'Both' ? 'fa-exchange-alt' : 'fa-hospital'} mr-1`}></i>{typeLabel}
                        </span>
                        {(doc.clinicId?.city || userLocation?.city) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            📍 {doc.clinicId?.city || userLocation?.city || 'Bankura'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-sky-600">₹{doc.consultationFee}</p>
                      </div>
                      <button onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); }} className="w-full py-2 px-4 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">Book Now</button>
                    </div>
                  );})}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4"><i className="fas fa-bolt text-amber-500 mr-2"></i>Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: 'fa-user-md', label: 'Book Appointment', desc: 'Find best doctor instantly', section: 'doctors', gradient: 'from-sky-500 to-teal-500', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
                    { icon: 'fa-robot', label: 'AI Health Check', desc: 'Get symptoms checked in 2 mins', section: 'ai-assistant', gradient: 'from-teal-500 to-emerald-500', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
                    { icon: 'fa-flask', label: 'Lab Reports', desc: 'View & upload test results', section: 'lab-reports', gradient: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
                    { icon: 'fa-pills', label: 'Medicine Reminder', desc: 'Never miss a dose', section: 'medicine-reminder', gradient: 'from-green-500 to-emerald-500', iconBg: 'bg-green-100', iconColor: 'text-green-600' }
                  ].map((a, i) => (
                    <button key={i} onClick={() => setActiveSection(a.section)} className="group relative overflow-hidden p-5 rounded-2xl border-2 border-slate-100 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-white">
                      {/* Hover gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      <div className={`w-14 h-14 rounded-2xl ${a.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`fas ${a.icon} text-xl ${a.iconColor}`}></i>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-sky-600 transition-colors">{a.label}</h4>
                      <p className="text-xs text-slate-500">{a.desc}</p>
                      
                      {/* Arrow indicator */}
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                        <i className="fas fa-arrow-right text-xs text-slate-500"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {upcomingAppointments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h3>
                    <button onClick={() => setActiveSection('appointments')} className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">View All <i className="fas fa-arrow-right text-xs"></i></button>
                  </div>
                  <div className="space-y-3">
                    {upcomingAppointments.map(apt => (
                      <div 
                        key={apt._id} 
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => { setTrackedAppointment(apt); setShowQueueTracker(true); }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors"><i className="fas fa-user-md text-sky-600"></i></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 text-sm">{apt.doctorId?.name?.startsWith('Dr.') ? apt.doctorId.name : `Dr. ${apt.doctorId?.name || 'Unknown'}`}</h4>
                          <p className="text-xs text-slate-500">{apt.doctorId?.specialization}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{apt.date ? new Date(apt.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}</p>
                          <p className="text-xs text-slate-500">{apt.time || 'N/A'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : apt.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{apt.status}</span>
                        {/* Tap for Queue indicator */}
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-sky-100 text-sky-700 flex items-center gap-1 animate-pulse">
                          <i className="fas fa-hand-pointer text-[10px]"></i>
                          Queue
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse by Clinic */}
              {clinics.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <i className="fas fa-hospital text-sky-500"></i>
                      Browse by Clinic
                    </h3>
                    <button onClick={() => setActiveSection('doctors')} className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
                      View All <i className="fas fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {clinics.slice(0, 4).map(clinic => (
                      <button
                        key={clinic._id}
                        onClick={() => { setSelectedClinic(clinic._id); setActiveSection('doctors'); }}
                        className="group p-4 rounded-xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all text-left bg-gradient-to-br from-white to-slate-50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3 group-hover:bg-sky-100 transition-colors">
                          <i className="fas fa-clinic-medical text-sky-600"></i>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm truncate group-hover:text-sky-600 transition-colors">{clinic.name}</h4>
                        <p className="text-xs text-slate-500 truncate mt-1">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {clinic.address || clinic.location || 'View doctors'}
                        </p>
                        <p className="text-xs text-sky-600 mt-2 font-medium">
                          {doctors.filter(d => d.clinicId?._id === clinic._id).length} doctors →
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeSection === 'doctors' && (
            <div className="space-y-6">
              {/* Promotional Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 rounded-2xl p-5 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold animate-pulse">🎉 LIMITED TIME</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Winter Health Week Special!</h3>
                    <p className="text-white/80 text-sm">Get 20% off on all Online Consultations today</p>
                  </div>
                  <button className="px-6 py-3 bg-white text-sky-600 font-bold rounded-xl hover:bg-sky-50 transition-all hover:scale-105 shadow-lg">
                    <i className="fas fa-bolt mr-2"></i>Book Now
                  </button>
                </div>
              </div>

              {/* Top Specialties Quick Filters */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-700 mb-3"><i className="fas fa-fire text-orange-500 mr-2"></i>Popular Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'All', icon: '👨‍⚕️', value: '', key: 'all' },
                    { name: 'Cardiologist', icon: '🫀', value: 'Cardiologist', key: 'cardio' },
                    { name: 'Dermatologist', icon: '🧴', value: 'Dermatologist', key: 'derma' },
                    { name: 'Psychiatrist', icon: '🧠', value: 'Psychiatrist', key: 'psych' },
                    { name: 'Gynecologist', icon: '👩‍⚕️', value: 'Gynecologist', key: 'gyne' },
                    { name: 'Orthopedic', icon: '🦴', value: 'Orthopedic', key: 'ortho' },
                    { name: 'Pediatrician', icon: '👶', value: 'Pediatrician', key: 'pedia' },
                    { name: 'ENT', icon: '👂', value: 'ENT', key: 'ent' },
                    { name: 'General Physician', icon: '🩺', value: 'General Physician', key: 'gp' },
                  ].map(spec => (
                    <button
                      key={spec.key}
                      onClick={() => setSelectedSpecialization(spec.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 ${
                        selectedSpecialization === spec.value
                          ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                      }`}
                    >
                      <span>{spec.icon}</span>
                      <span>{spec.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Online vs In-Clinic Toggle */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4">
                  {[
                    { id: 'all', label: 'All Doctors', icon: 'fa-th-large' },
                    { id: 'online', label: 'Online Consultation', icon: 'fa-video' },
                    { id: 'clinic', label: 'Visit Clinic', icon: 'fa-hospital' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setConsultationTypeFilter(type.id)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        consultationTypeFilter === type.id
                          ? 'bg-white text-sky-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <i className={`fas ${type.icon} text-xs`}></i>
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" placeholder="Search doctors by name, specialty..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <select value={selectedSpecialization} onChange={(e) => { setSelectedSpecialization(e.target.value); if (nearbyMode) setTimeout(fetchNearbyDoctors, 100); }} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="">All Specializations</option>
                    {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {!nearbyMode && (
                    <div className="relative min-w-[200px]">
                      <i className="fas fa-hospital absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer">
                        <option value="">🏥 All Clinics</option>
                        {clinics.map(c => <option key={c._id} value={c._id}>📍 {c.name}</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    </div>
                  )}
                  <button onClick={toggleNearbyMode} disabled={!userLocation?.latitude && !nearbyMode} className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${nearbyMode ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600'} ${!userLocation?.latitude && !nearbyMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <i className="fas fa-map-marker-alt"></i>
                    {nearbyMode ? 'Show All' : 'Find Nearby'}
                  </button>
                  {nearbyMode && (
                    <select value={maxDistance} onChange={(e) => { setMaxDistance(Number(e.target.value)); setTimeout(fetchNearbyDoctors, 100); }} className="px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
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
                <p className="text-sm text-slate-500 font-medium">{nearbyMode ? doctors.length : filteredDoctors.length} doctors found {nearbyMode && userLocation?.city && <span className="text-sky-600">near {userLocation.city}</span>}</p>
                {!userLocation?.latitude && <button onClick={handleUpdateLocation} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"><i className="fas fa-location-crosshairs"></i> Update location to find nearby doctors</button>}
              </div>
              {loading ? (<div className="flex flex-col items-center justify-center py-20"><div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div><p className="text-slate-500">Loading...</p></div>
              ) : filteredDoctors.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-user-md text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">No doctors found</h3><p className="text-slate-500">Try adjusting your filters</p></div>
              ) : (
                <div className="space-y-4">
                  {(nearbyMode ? doctors : filteredDoctors).map(doc => {
                    const docInitials = doc.name ? doc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'DR';
                    // Generate mock availability data (in production, fetch from API)
                    const mockRating = doc.rating || (4 + Math.random()).toFixed(1);
                    const mockReviews = doc.reviewCount || Math.floor(50 + Math.random() * 200);
                    const mockPatients = doc.patientCount || Math.floor(200 + Math.random() * 500);
                    const availabilityStatus = doc.availability === 'Available' ? 
                      (Math.random() > 0.3 ? 'available' : 'limited') : 'busy';
                    const nextSlotOnline = '5:30 PM';
                    const nextSlotClinic = '7:00 PM';
                    
                    return (
                    <div key={doc._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-sky-200 hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Doctor Avatar with Availability Badge */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-sky-100 transition-all">
                              {doc.profilePhoto ? <img src={doc.profilePhoto} alt={doc.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : null}
                              {!doc.profilePhoto && <span className="text-white text-xl font-bold">{docInitials}</span>}
                            </div>
                            {/* Availability Badge */}
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                              availabilityStatus === 'available' ? 'bg-emerald-500' : 
                              availabilityStatus === 'limited' ? 'bg-amber-500' : 'bg-red-500'
                            }`}>
                              <i className={`fas text-white text-[8px] ${
                                availabilityStatus === 'available' ? 'fa-check' : 
                                availabilityStatus === 'limited' ? 'fa-clock' : 'fa-times'
                              }`}></i>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-800 text-lg">{doc.name?.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}</h4>
                              {doc.isVerified && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full"><i className="fas fa-check-circle mr-1"></i>Verified</span>}
                            </div>
                            <p className="text-sm text-sky-600 font-semibold">{doc.specialization}</p>
                            <p className="text-sm text-slate-500 mt-0.5"><i className="fas fa-hospital text-xs mr-1"></i>{doc.clinicId?.name || 'Independent Practice'}</p>
                            
                            {/* Rating & Patient Count */}
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                <i className="fas fa-star text-amber-500 text-xs"></i>
                                <span className="text-sm font-bold text-amber-700">{mockRating}</span>
                                <span className="text-xs text-amber-600">({mockReviews})</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 text-sm">
                                <i className="fas fa-users text-sky-400 text-xs"></i>
                                <span>{mockPatients}+ patients</span>
                              </div>
                              {doc.experience && <div className="flex items-center gap-1 text-slate-500 text-sm">
                                <i className="fas fa-award text-emerald-500 text-xs"></i>
                                <span>{doc.experience} yrs exp</span>
                              </div>}
                            </div>
                            
                            {nearbyMode && doc.distanceText && <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded-lg"><i className="fas fa-route mr-1"></i>{doc.distanceText}</p>}
                          </div>
                        </div>
                        
                        {/* Price & Availability Section */}
                        <div className="lg:text-right space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-slate-800">₹{doc.consultationFee}</p>
                            <p className="text-xs text-slate-500">per consultation</p>
                          </div>
                          
                          {/* Next Available Slots */}
                          {doc.availability === 'Available' && (
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100 mt-2">
                              <p className="text-xs font-semibold text-emerald-700 mb-1.5"><i className="fas fa-bolt mr-1"></i>Next Available</p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600"><i className="fas fa-video text-blue-500 mr-1"></i>Online</span>
                                  <span className="font-semibold text-emerald-700">{nextSlotOnline}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600"><i className="fas fa-hospital text-green-500 mr-1"></i>Clinic</span>
                                  <span className="font-semibold text-emerald-700">{nextSlotClinic}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                        <button onClick={() => toggleFavorite(doc._id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${favoriteDoctors.includes(doc._id) ? 'bg-rose-100 text-rose-500 scale-110' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:scale-105'}`} title="Add to Favorites">
                          <i className={favoriteDoctors.includes(doc._id) ? 'fas fa-heart' : 'far fa-heart'}></i>
                        </button>
                        <button onClick={() => { setSelectedDoctor(doc); setShowDoctorProfile(true); }} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                          <i className="fas fa-user-md text-sm"></i>
                          <span>View Profile</span>
                        </button>
                        <button onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); }} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                          <i className="fas fa-calendar-check text-sm"></i>
                          <span>Next Available</span>
                        </button>
                        <button disabled={doc.availability !== 'Available'} onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); }} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${doc.availability === 'Available' ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white hover:shadow-lg hover:scale-[1.02] animate-pulse-subtle' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                          <i className="fas fa-bolt text-sm"></i>
                          <span>{doc.availability === 'Available' ? 'Book Now' : 'Unavailable'}</span>
                        </button>
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
                    onClick={() => exportAppointmentsToPDF(filteredAppointments, 'My Appointments')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <i className="fas fa-file-pdf text-red-500"></i>
                    Export PDF
                  </button>
                )}
              </div>
              
              {/* Appointment Filters */}
              {appointments.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  {/* Search */}
                  <div className="relative mb-4">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input
                      type="text"
                      placeholder="Search by doctor, specialization..."
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none transition-colors"
                    />
                    {appointmentSearch && (
                      <button onClick={() => setAppointmentSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Row */}
                  <div className="flex flex-wrap gap-3">
                    <select value={appointmentDateFilter} onChange={(e) => setAppointmentDateFilter(e.target.value)} className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white">
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past</option>
                    </select>
                    <select value={appointmentStatusFilter} onChange={(e) => setAppointmentStatusFilter(e.target.value)} className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={appointmentTypeFilter} onChange={(e) => setAppointmentTypeFilter(e.target.value)} className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:outline-none bg-white">
                      <option value="all">All Types</option>
                      <option value="in_person">In-Person</option>
                      <option value="online">Online</option>
                    </select>
                    {(appointmentSearch || appointmentStatusFilter !== 'all' || appointmentTypeFilter !== 'all' || appointmentDateFilter !== 'all') && (
                      <button onClick={resetAppointmentFilters} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors">
                        <i className="fas fa-undo mr-2"></i>Reset
                      </button>
                    )}
                  </div>
                  
                  {/* Results count */}
                  <div className="mt-3 text-sm text-slate-500">
                    Showing {filteredAppointments.length} of {appointments.length} appointments
                  </div>
                </div>
              )}
              
              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-calendar-times text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">No appointments yet</h3><p className="text-slate-500 mb-4">Book your first appointment</p><button onClick={() => setActiveSection('doctors')} className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg">Find Doctors</button></div>
              ) : filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-filter text-2xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">No matching appointments</h3><p className="text-slate-500 mb-4">Try adjusting your filters</p><button onClick={resetAppointmentFilters} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Clear Filters</button></div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(apt => (
                    <div 
                      key={apt._id} 
                      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all ${(apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'in_progress') ? 'cursor-pointer hover:border-sky-300' : ''}`}
                      onClick={() => {
                        if (apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'in_progress') {
                          setTrackedAppointment(apt);
                          setShowQueueTracker(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.consultationType === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}><i className={`fas ${apt.consultationType === 'online' ? 'fa-video' : 'fa-hospital'} mr-1`}></i>{apt.consultationType === 'online' ? 'Online' : 'In-Person'}</span>
                        <div className="flex items-center gap-2">
                          {(apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'in_progress') && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 animate-pulse">
                              <i className="fas fa-hand-pointer mr-1"></i>Tap for Queue
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : apt.status === 'pending' ? 'bg-amber-100 text-amber-700' : apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{apt.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center"><i className="fas fa-user-md text-white text-xl"></i></div>
                        <div><h4 className="font-bold text-slate-800">{apt.doctorId?.name?.startsWith('Dr.') ? apt.doctorId.name : `Dr. ${apt.doctorId?.name || 'Unknown'}`}</h4><p className="text-sm text-slate-500">{apt.doctorId?.specialization}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                        <span><i className="fas fa-calendar text-sky-500 mr-2"></i>{apt.date ? new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        <span><i className="fas fa-clock text-sky-500 mr-2"></i>{apt.time || 'N/A'}</span>
                        <span><i className="fas fa-hospital text-sky-500 mr-2"></i>{apt.clinicId?.name || 'HealthSync'}</span>
                      </div>
                      {/* Track Queue Button - for all upcoming appointments */}
                      {(apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'in_progress') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTrackedAppointment(apt); setShowQueueTracker(true); }} 
                          className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg mb-2"
                        >
                          <i className="fas fa-users mr-2"></i>View Live Queue
                        </button>
                      )}
                      {apt.consultationType === 'online' && apt.googleMeetLink && <button onClick={(e) => { e.stopPropagation(); window.open(apt.googleMeetLink, '_blank'); }} className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg"><i className="fas fa-video mr-2"></i>Join Meeting</button>}
                      {apt.status === 'completed' && <button onClick={(e) => { e.stopPropagation(); setReviewAppointment(apt); setShowReviewModal(true); }} className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg mt-2"><i className="fas fa-star mr-2"></i>Write Review</button>}
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
          {activeSection === 'messages' && <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"><i className="fas fa-comments text-3xl text-slate-400"></i></div><h3 className="text-lg font-semibold text-slate-800 mb-2">Chat with Doctors</h3><p className="text-slate-500 mb-4">Click on a doctor to start</p><button onClick={() => setActiveSection('doctors')} className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg">Find Doctors</button></div>}
        </div>
        <footer className="bg-white border-t border-slate-200 px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">HS</div><span className="font-semibold text-slate-700">HealthSync</span></div>
            <div className="flex items-center gap-6"><a href="#privacy" className="hover:text-sky-600">Privacy</a><a href="#terms" className="hover:text-sky-600">Terms</a><a href="#support" className="hover:text-sky-600">Support</a></div>
            <p>© 2024 HealthSync. All rights reserved.</p>
          </div>
        </footer>
      </main>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {[{ id: 'overview', icon: 'fa-home', label: 'Home' }, { id: 'doctors', icon: 'fa-user-md', label: 'Doctors' }, { id: 'appointments', icon: 'fa-calendar', label: 'Bookings' }, { id: 'ai-assistant', icon: 'fa-robot', label: 'AI' }].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${activeSection === item.id ? 'text-sky-600 bg-sky-50' : 'text-slate-400'}`}><i className={`fas ${item.icon}`}></i><span className="text-xs font-medium">{item.label}</span></button>
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
      
      {/* Quick Search Modal */}
      {showQuickSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={() => setShowQuickSearch(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search doctors, clinics, specialties..."
                  value={quickSearchTerm}
                  onChange={(e) => setQuickSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  autoFocus
                />
                {quickSearchTerm && (
                  <button onClick={() => setQuickSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {quickSearchTerm.length > 0 ? (
                <>
                  {/* Doctor Results */}
                  {doctors.filter(d => d.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()) || d.specialization?.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 4).map(doc => (
                    <button
                      key={doc._id}
                      onClick={() => { setSelectedDoctor(doc); setShowBookingModal(true); setShowQuickSearch(false); setQuickSearchTerm(''); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-sky-50 transition-colors text-left border-b border-slate-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                        <i className="fas fa-user-md"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.specialization}</p>
                      </div>
                      <span className="text-xs text-sky-600 font-medium">Book →</span>
                    </button>
                  ))}
                  {/* Clinic Results */}
                  {clinics.filter(c => c.name?.toLowerCase().includes(quickSearchTerm.toLowerCase())).slice(0, 3).map(clinic => (
                    <button
                      key={clinic._id}
                      onClick={() => { setSelectedClinic(clinic._id); setActiveSection('doctors'); setShowQuickSearch(false); setQuickSearchTerm(''); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <i className="fas fa-hospital"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{clinic.name}</p>
                        <p className="text-xs text-slate-500">{clinic.address || 'View doctors'}</p>
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">View →</span>
                    </button>
                  ))}
                  {doctors.filter(d => d.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()) || d.specialization?.toLowerCase().includes(quickSearchTerm.toLowerCase())).length === 0 &&
                   clinics.filter(c => c.name?.toLowerCase().includes(quickSearchTerm.toLowerCase())).length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <i className="fas fa-search text-2xl mb-2 text-slate-300"></i>
                      <p className="text-sm">No results found</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4">
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Quick Actions</p>
                  <div className="space-y-1">
                    <button onClick={() => { setActiveSection('doctors'); setShowQuickSearch(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left">
                      <i className="fas fa-user-md text-sky-500 w-5"></i>
                      <span className="text-sm text-slate-700">Browse all doctors</span>
                    </button>
                    <button onClick={() => { setShowFindDoctorWizard(true); setShowQuickSearch(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left">
                      <i className="fas fa-robot text-teal-500 w-5"></i>
                      <span className="text-sm text-slate-700">Find my doctor (AI)</span>
                    </button>
                    <button onClick={() => { setActiveSection('appointments'); setShowQuickSearch(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left">
                      <i className="fas fa-calendar-check text-violet-500 w-5"></i>
                      <span className="text-sm text-slate-700">My appointments</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">ESC</kbd> to close</span>
              <span><kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↵</kbd> to select</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-end gap-3">
        {/* Help choosing doctor - with tooltip */}
        <div className="group flex items-center gap-2">
          <span className="hidden group-hover:block px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            Need help choosing a doctor?
          </span>
          <button
            className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-xl hover:scale-110"
            onClick={() => setShowFindDoctorWizard(true)}
            title="Find My Doctor"
          >
            🤖
          </button>
        </div>
        
        {/* AI Health Hub */}
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          onClick={() => setShowAIHealthHub(true)}
          title="AI Health Assistant"
        >
          <i className="fas fa-brain text-sm"></i>
        </button>
        
        {/* Urgent Care Button */}
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          onClick={() => setActiveSection('ambulance')}
          title="Urgent Care"
        >
          <i className="fas fa-ambulance text-sm"></i>
        </button>
      </div>

      {/* AI Health Hub Modal */}
      {showAIHealthHub && (
        <AIHealthHub 
          user={currentUser} 
          onClose={() => setShowAIHealthHub(false)} 
        />
      )}

      {/* Offline Indicator */}
      <OfflineIndicator onRetry={() => {
        fetchDoctors();
        fetchAppointments();
      }} />

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation 
        activeTab={activeSection === 'health' || activeSection === 'medical-history' || activeSection === 'lab-reports' || activeSection === 'checkup' || activeSection === 'health-analytics' ? 'health' : activeSection}
        onTabChange={(tab) => {
          if (Capacitor.isNativePlatform()) {
            successFeedback();
          }
          if (tab === 'profile') {
            setShowProfileModal(true);
          } else {
            setActiveSection(tab);
          }
          setMobileSidebarOpen(false);
        }}
        unreadNotifications={unreadNotifications}
      />
    </div>
  );
};


export default PatientDashboardPro;
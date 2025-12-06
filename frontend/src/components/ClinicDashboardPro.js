import { useState, useEffect, useMemo } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import '../styles/premium-saas.css';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

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
  
  // Doctor modal state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '', email: '', phone: '', specialization: '', consultationFee: 500, experience: 0, qualification: 'MBBS'
  });

  const menuSections = [
    { titleKey: 'main', items: [
      { id: 'overview', icon: 'fas fa-home', labelKey: 'overview' },
      { id: 'appointments', icon: 'fas fa-calendar-check', labelKey: 'appointments' },
      { id: 'queue', icon: 'fas fa-list-ol', labelKey: 'todaysQueue' },
    ]},
    { titleKey: 'management', items: [
      { id: 'doctors', icon: 'fas fa-user-md', labelKey: 'doctors' },
      { id: 'patients', icon: 'fas fa-users', labelKey: 'patients' },
    ]},
  ];

  useEffect(() => {
    fetchAllData();
  }, [receptionist]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAppointments(), fetchDoctors(), fetchPatients()]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`/api/receptionists/appointments/${receptionist.clinicId}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`/api/receptionists/doctors/${receptionist.clinicId}`);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`/api/receptionists/patients/${receptionist.clinicId}`);
      setPatients(response.data);
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
              <h3 className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>{t(section.titleKey)}</h3>
              <div className="space-y-1">
                {section.items.map(item => (
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }} title={t(item.labelKey)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                    <i className={`${item.icon} w-5 text-center`}></i>
                    <span className={`whitespace-nowrap ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{t(item.labelKey)}</span>
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
            <button className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center" onClick={() => setMobileSidebarOpen(true)}><i className="fas fa-bars text-slate-600"></i></button>
            <LanguageSelector />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Welcome, {(receptionist?.name || 'Staff').split(' ')[0]}! 👋</h1>
              <p className="text-xs text-slate-500"><i className="fas fa-hospital text-cyan-500 mr-1"></i>{receptionist?.clinicName || 'Clinic'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block px-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600">
              <i className="fas fa-calendar mr-2"></i>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button onClick={fetchAllData} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-sync-alt text-slate-600"></i></button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: 'fa-calendar-day', value: stats.todayCount, label: "Today's Appointments", color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
                  { icon: 'fa-clock', value: stats.pendingCount, label: 'Pending', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
                  { icon: 'fa-check-circle', value: stats.confirmedCount, label: 'Confirmed', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
                  { icon: 'fa-user-md', value: `${stats.availableDoctors}/${stats.totalDoctors}`, label: 'Doctors Available', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} rounded-2xl p-4 border border-slate-100 hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow`}>
                        <i className={`fas ${stat.icon} text-white`}></i>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: 'fa-calendar-check', label: 'View Appointments', section: 'appointments', color: 'from-blue-500 to-cyan-600' },
                    { icon: 'fa-list-ol', label: "Today's Queue", section: 'queue', color: 'from-emerald-500 to-teal-600' },
                    { icon: 'fa-user-md', label: 'Manage Doctors', section: 'doctors', color: 'from-purple-500 to-pink-600' },
                    { icon: 'fa-users', label: 'View Patients', section: 'patients', color: 'from-amber-500 to-orange-600' },
                  ].map((action, i) => (
                    <button key={i} onClick={() => setActiveSection(action.section)} className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-cyan-200 hover:shadow-lg transition-all">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${action.icon} text-white text-xl`}></i>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Today's Appointments Preview */}
              {todayAppointments.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Today's Appointments</h3>
                    <button onClick={() => setActiveSection('queue')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">View Queue →</button>
                  </div>
                  <div className="space-y-3">
                    {todayAppointments.slice(0, 5).map(apt => (
                      <div key={apt._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-cyan-50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <i className="fas fa-user text-white"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800">{apt.userId?.name || 'Unknown'}</h4>
                          <p className="text-sm text-slate-500">Dr. {apt.doctorId?.name} • {formatTime(apt.time)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${getStatusColor(apt.status)}-100 text-${getStatusColor(apt.status)}-700`}>{apt.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors Status */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Doctors Status</h3>
                  <button onClick={() => setActiveSection('doctors')} className="text-sm font-medium text-cyan-600 hover:text-cyan-700">Manage →</button>
                </div>
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
              </div>
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
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                    ))}
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
                                {/* Google Meet Link for Online Appointments */}
                                {apt.consultationType === 'online' && apt.googleMeetLink && (
                                  <a href={apt.googleMeetLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600" title="Join Google Meet">
                                    <i className="fas fa-video mr-1"></i>Meet
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
          {[{ id: 'overview', icon: 'fa-home', label: 'Home' }, { id: 'appointments', icon: 'fa-calendar', label: 'Appointments' }, { id: 'queue', icon: 'fa-list-ol', label: 'Queue' }, { id: 'doctors', icon: 'fa-user-md', label: 'Doctors' }].map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${activeSection === item.id ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400'}`}><i className={`fas ${item.icon}`}></i><span className="text-xs font-medium">{item.label}</span></button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ClinicDashboardPro;

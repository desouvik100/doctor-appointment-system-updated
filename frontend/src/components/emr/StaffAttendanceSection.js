import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';
import { isFeatureAvailable } from './featureFlags';
import LockedFeature from './LockedFeature';
import BiometricCheckIn from './BiometricCheckIn';
import LocationCheckIn from './LocationCheckIn';

const StaffAttendanceSection = ({ clinicId, subscriptionPlan = 'basic' }) => {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveForm, setLeaveForm] = useState({
    staffId: '', leaveType: 'casual', startDate: '', endDate: '', reason: ''
  });
  const [staffForm, setStaffForm] = useState({
    name: '', email: '', phone: '', role: 'receptionist', department: '', password: ''
  });
  const [addingStaff, setAddingStaff] = useState(false);
  const [currentUserAttendance, setCurrentUserAttendance] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Feature access checks
  const canAccessAttendance = isFeatureAvailable('staffAttendance', subscriptionPlan);
  const canAddStaff = isFeatureAvailable('addStaff', subscriptionPlan);
  const canSendNotifications = isFeatureAvailable('staffNotifications', subscriptionPlan);
  const canManageLeave = isFeatureAvailable('leaveManagement', subscriptionPlan);
  const canUseBiometric = isFeatureAvailable('biometricCheckIn', subscriptionPlan);
  const canUseGPS = isFeatureAvailable('gpsLocationCheckIn', subscriptionPlan);

  const leaveTypes = ['casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid'];
  const staffRoles = ['receptionist', 'nurse', 'technician', 'pharmacist', 'accountant', 'manager'];
  const statusColors = {
    present: '#10b981', absent: '#ef4444', late: '#f59e0b', half_day: '#3b82f6', on_leave: '#8b5cf6',
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444'
  };

  useEffect(() => { fetchAttendance(); fetchLeaves(); fetchSummary(); fetchStaffList(); fetchCurrentUser(); }, [clinicId, selectedDate]);

  const fetchCurrentUser = async () => {
    try {
      // Try multiple sources to get current user ID
      const receptionist = localStorage.getItem('receptionist');
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      let userId = null;
      
      // First try receptionist data (most common for clinic dashboard)
      if (receptionist) {
        const data = JSON.parse(receptionist);
        userId = data.id || data._id || data.userId;
        console.log('Got userId from receptionist:', userId);
      }
      
      // Try user data
      if (!userId && user) {
        const data = JSON.parse(user);
        userId = data.id || data._id || data.userId;
        console.log('Got userId from user:', userId);
      }
      
      // Try token as fallback
      if (!userId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || payload.id || payload._id;
          console.log('Got userId from token:', userId);
        } catch (e) {
          console.error('Error parsing token:', e);
        }
      }
      
      // Also try to get from receptionist token
      if (!userId && receptionist) {
        const data = JSON.parse(receptionist);
        if (data.token) {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            userId = payload.userId || payload.id || payload._id;
            console.log('Got userId from receptionist token:', userId);
          } catch (e) {
            console.error('Error parsing receptionist token:', e);
          }
        }
      }
      
      if (userId) {
        setCurrentUserId(userId);
        console.log('Set currentUserId:', userId);
      } else {
        console.warn('Could not determine current user ID');
      }
    } catch (err) { 
      console.error('Error getting current user:', err); 
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`/api/staff-management/attendance/clinic/${clinicId}`, {
        params: { startDate: selectedDate, endDate: selectedDate }
      });
      setAttendance(res.data.attendance || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`/api/staff-management/leave/clinic/${clinicId}`);
      setLeaves(res.data.leaves || []);
    } catch (err) { console.error(err); }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/staff-management/attendance/summary/${clinicId}`);
      setSummary(res.data.summary || []);
    } catch (err) { console.error(err); }
  };

  const fetchStaffList = async () => {
    try {
      const res = await axios.get(`/api/staff-management/staff/clinic/${clinicId}`);
      setStaffList(res.data.staff || []);
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async (staffId, method = 'manual') => {
    try {
      console.log('Checking in:', { clinicId, staffId, method });
      const res = await axios.post('/api/staff-management/attendance/check-in', { clinicId, staffId, checkInMethod: method });
      console.log('Check-in response:', res.data);
      toast.success('Checked in successfully');
      fetchAttendance();
    } catch (err) { 
      console.error('Check-in error:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to check in'); 
    }
  };

  const handleCheckOut = async (staffId, method = 'manual') => {
    try {
      console.log('Checking out:', { clinicId, staffId, method });
      await axios.post('/api/staff-management/attendance/check-out', { clinicId, staffId, checkOutMethod: method });
      toast.success('Checked out successfully');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to check out'); }
  };

  // Get current user's attendance status
  const getCurrentUserAttendance = () => {
    if (!currentUserId) return null;
    return attendance.find(a => a.staffId?._id === currentUserId);
  };

  // Handle check-in with location data
  const handleCheckInWithLocation = async (staffId, method, location) => {
    try {
      await axios.post('/api/staff-management/attendance/check-in', { 
        clinicId, 
        staffId, 
        checkInMethod: method,
        location: location ? { lat: location.lat, lng: location.lng, address: 'GPS Verified' } : null
      });
      toast.success('Checked in with location verified!');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to check in'); }
  };

  // Handle check-out with location data
  const handleCheckOutWithLocation = async (staffId, method, location) => {
    try {
      await axios.post('/api/staff-management/attendance/check-out', { 
        clinicId, 
        staffId, 
        checkOutMethod: method,
        location: location ? { lat: location.lat, lng: location.lng, address: 'GPS Verified' } : null
      });
      toast.success('Checked out successfully!');
      fetchAttendance();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to check out'); }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/staff-management/leave/apply', { ...leaveForm, clinicId });
      toast.success('Leave request submitted');
      setShowLeaveModal(false);
      setLeaveForm({ staffId: '', leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit leave'); }
  };

  const handleLeaveAction = async (id, action) => {
    try {
      await axios.post(`/api/staff-management/leave/${id}/action`, { action });
      toast.success(`Leave ${action}d`);
      fetchLeaves();
    } catch (err) { toast.error('Failed to process leave'); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setAddingStaff(true);
    try {
      await axios.post('/api/staff-management/staff/add', { ...staffForm, clinicId });
      toast.success(`Staff ${staffForm.name} added successfully`);
      setShowAddStaffModal(false);
      setStaffForm({ name: '', email: '', phone: '', role: 'receptionist', department: '', password: '' });
      fetchAttendance();
      fetchStaffList();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to add staff'); 
    } finally {
      setAddingStaff(false);
    }
  };

  const formatTime = (date) => date ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-';

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  // Show locked screen if no access to staff attendance
  if (!canAccessAttendance) {
    return (
      <LockedFeature 
        featureId="staffAttendance"
        currentPlan={subscriptionPlan}
        title="Staff Attendance & Management"
        description="Track staff attendance, manage leaves, and send notifications. Upgrade to Standard plan to unlock."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-800">
        clinicId: {clinicId || 'null'} | userId: {currentUserId || 'null'}
      </div>
      
      {/* Biometric & Location Check-In Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {canUseBiometric ? (
          <BiometricCheckIn
            staffId={currentUserId || 'guest'}
            staffName="You"
            isCheckedIn={!!getCurrentUserAttendance()?.checkInTime && !getCurrentUserAttendance()?.checkOutTime}
            onCheckIn={(method) => {
              if (!currentUserId) {
                toast.error('User not identified. Please log in again.');
                return;
              }
              if (!clinicId) {
                toast.error('Clinic not identified. Please log in again.');
                return;
              }
              handleCheckIn(currentUserId, method);
            }}
            onCheckOut={(method) => {
              if (!currentUserId) {
                toast.error('User not identified. Please log in again.');
                return;
              }
              handleCheckOut(currentUserId, method);
            }}
          />
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                <i className="fas fa-fingerprint text-slate-400"></i>
              </div>
              <div>
                <h4 className="font-medium text-slate-600">Biometric Check-In</h4>
                <p className="text-xs text-slate-400">Fingerprint & Face ID</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
              <i className="fas fa-lock text-amber-500 mr-1"></i>
              <span className="text-xs text-amber-700">Advanced Plan Required</span>
            </div>
          </div>
        )}
        {canUseGPS ? (
          <LocationCheckIn
            clinicLocation={{ lat: 22.5726, lng: 88.3639, name: 'Clinic', radius: 200 }}
            isCheckedIn={!!getCurrentUserAttendance()?.checkInTime && !getCurrentUserAttendance()?.checkOutTime}
            onCheckIn={(method, location) => {
              if (!currentUserId) {
                toast.error('User not identified. Please log in again.');
                return;
              }
              handleCheckInWithLocation(currentUserId, method, location);
            }}
            onCheckOut={(method, location) => {
              if (!currentUserId) {
                toast.error('User not identified. Please log in again.');
                return;
              }
              handleCheckOutWithLocation(currentUserId, method, location);
            }}
          />
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-slate-400"></i>
              </div>
              <div>
                <h4 className="font-medium text-slate-600">GPS Location Check-In</h4>
                <p className="text-xs text-slate-400">Verify staff location</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
              <i className="fas fa-lock text-amber-500 mr-1"></i>
              <span className="text-xs text-amber-700">Advanced Plan Required</span>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3">Your Status Today</h4>
          {getCurrentUserAttendance() ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check In:</span>
                <span className="font-medium text-green-600">{formatTime(getCurrentUserAttendance()?.checkInTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Check Out:</span>
                <span className="font-medium text-red-600">{formatTime(getCurrentUserAttendance()?.checkOutTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[getCurrentUserAttendance()?.status]}15`, color: statusColors[getCurrentUserAttendance()?.status] }}>
                  {getCurrentUserAttendance()?.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Hours:</span>
                <span className="font-medium">{getCurrentUserAttendance()?.workedHours?.toFixed(1) || '0'} hrs</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attendance record for today. Check in to start.</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present Today', value: attendance.filter(a => a.status === 'present').length, color: '#10b981', icon: 'user-check' },
          { label: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: '#ef4444', icon: 'user-times' },
          { label: 'On Leave', value: attendance.filter(a => a.status === 'on_leave').length, color: '#8b5cf6', icon: 'calendar-minus' },
          { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'pending').length, color: '#f59e0b', icon: 'clock' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <i className={`fas fa-${stat.icon}`} style={{ color: stat.color }}></i>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-user-clock text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Staff Attendance & Leave</h2>
              <p className="text-sm text-slate-500">Track attendance and manage leave requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl" />
            {canAddStaff ? (
              <button onClick={() => setShowAddStaffModal(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg">
                <i className="fas fa-user-plus mr-2"></i>Add Staff
              </button>
            ) : (
              <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed" title="Upgrade to Standard plan">
                <i className="fas fa-lock mr-2"></i>Add Staff
              </button>
            )}
            {canManageLeave ? (
              <button onClick={() => setShowLeaveModal(true)} className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg">
                <i className="fas fa-plus mr-2"></i>Apply Leave
              </button>
            ) : (
              <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed" title="Upgrade to Standard plan">
                <i className="fas fa-lock mr-2"></i>Apply Leave
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['attendance', 'leaves', 'summary', 'staff'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-violet-50 text-violet-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab === 'staff' ? 'All Staff' : tab}</button>
          ))}
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Check In</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Check Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(record => (
                  <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{record.staffId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{record.staffId?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(record.checkInTime)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(record.checkOutTime)}</td>
                    <td className="py-3 px-4 text-slate-600">{record.workedHours?.toFixed(1) || '-'} hrs</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[record.status]}15`, color: statusColors[record.status] }}>
                        {record.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCheckIn(record.staffId?._id)} 
                          disabled={record.checkInTime}
                          className={`px-3 py-1 rounded-lg text-sm ${record.checkInTime ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          Check In
                        </button>
                        <button 
                          onClick={() => handleCheckOut(record.staffId?._id)} 
                          disabled={!record.checkInTime || record.checkOutTime}
                          className={`px-3 py-1 rounded-lg text-sm ${!record.checkInTime || record.checkOutTime ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          Check Out
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && <p className="text-center py-8 text-slate-500">No attendance records for this date</p>}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Days</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{leave.staffId?.name || 'Unknown'}</p>
                    </td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">{leave.leaveType}</span></td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {new Date(leave.startDate).toLocaleDateString('en-IN')} - {new Date(leave.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{leave.totalDays}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[leave.status]}15`, color: statusColors[leave.status] }}>{leave.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleLeaveAction(leave._id, 'approve')} className="p-2 hover:bg-green-50 rounded-lg"><i className="fas fa-check text-green-500"></i></button>
                          <button onClick={() => handleLeaveAction(leave._id, 'reject')} className="p-2 hover:bg-red-50 rounded-lg"><i className="fas fa-times text-red-500"></i></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && <p className="text-center py-8 text-slate-500">No leave requests</p>}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Present</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Absent</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Late</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Leave</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{s.staffName}</td>
                    <td className="py-3 px-4 text-green-600">{s.presentDays}</td>
                    <td className="py-3 px-4 text-red-600">{s.absentDays}</td>
                    <td className="py-3 px-4 text-amber-600">{s.lateDays}</td>
                    <td className="py-3 px-4 text-violet-600">{s.leaveDays}</td>
                    <td className="py-3 px-4 text-slate-600">{s.totalWorkedHours?.toFixed(1) || 0} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.length === 0 && <p className="text-center py-8 text-slate-500">No summary data available</p>}
          </div>
        )}

        {/* Staff List Tab */}
        {activeTab === 'staff' && (
          <div className="overflow-x-auto">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-slate-500">Total Staff: <span className="font-semibold text-slate-700">{staffList.length}</span></p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">#</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff, i) => (
                  <tr key={staff._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {staff.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{staff.name}</span>
                          <p className="text-xs text-slate-500">{staff.department || 'No department'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{staff.email}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{staff.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium capitalize">{staff.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {staff.phone && (
                          <a href={`tel:${staff.phone}`} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-1" title="Call Staff">
                            <i className="fas fa-phone"></i>
                            <span className="hidden sm:inline">Call</span>
                          </a>
                        )}
                        <button 
                          onClick={() => { 
                            const meetLink = `https://meet.google.com/new`;
                            window.open(meetLink, '_blank');
                            toast.success(`Opening meeting for ${staff.name}`);
                          }} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-1" 
                          title="Start Video Call"
                        >
                          <i className="fas fa-video"></i>
                          <span className="hidden sm:inline">Join</span>
                        </button>
                        {canSendNotifications ? (
                          <button 
                            onClick={async () => {
                              try {
                                await axios.post('/api/staff-management/notification/send', {
                                  clinicId,
                                  recipientId: staff._id,
                                  type: 'come_to_hospital',
                                  title: 'Please Come to Hospital',
                                  message: 'You are requested to come to the hospital immediately.',
                                  priority: 'high'
                                });
                                toast.success(`Notification sent to ${staff.name} to come to hospital`);
                              } catch (err) {
                                toast.error('Failed to send notification');
                              }
                            }} 
                            className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 flex items-center gap-1" 
                            title="Request to Come to Hospital"
                          >
                            <i className="fas fa-hospital"></i>
                            <span className="hidden sm:inline">Come In</span>
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-1" 
                            title="Upgrade to Standard plan"
                          >
                            <i className="fas fa-lock"></i>
                            <span className="hidden sm:inline">Come In</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staffList.length === 0 && (
              <div className="text-center py-8">
                <i className="fas fa-users text-4xl text-slate-300 mb-3"></i>
                <p className="text-slate-500">No staff members yet</p>
                <button onClick={() => setShowAddStaffModal(true)} className="mt-3 text-emerald-600 hover:underline text-sm font-medium">
                  <i className="fas fa-plus mr-1"></i>Add your first staff member
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Apply for Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                <select value={leaveForm.leaveType} onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                  {leaveTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add New Staff</h3>
                <p className="text-sm text-slate-500">Add staff member to your clinic</p>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Enter staff name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="staff@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="+91 9876543210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {staffRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input type="text" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="e.g., Front Desk" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Min 6 characters" minLength={6} />
                <p className="text-xs text-slate-500 mt-1">Staff will use this password to login</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={addingStaff} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50">
                  {addingStaff ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAttendanceSection;

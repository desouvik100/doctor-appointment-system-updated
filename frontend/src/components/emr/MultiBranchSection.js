import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';
import useFilterPresets from '../../hooks/useFilterPresets';
import usePresenceNotifications from '../../hooks/usePresenceNotifications';

const MultiBranchSection = ({ clinicId, organizationId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [branchStaff, setBranchStaff] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [staffPresence, setStaffPresence] = useState([]);
  const [showPresenceWidget, setShowPresenceWidget] = useState(true);
  const [showPresenceFilters, setShowPresenceFilters] = useState(false);
  const [presenceFilters, setPresenceFilters] = useState({
    role: '',
    branchId: '',
    department: '',
    status: ''
  });
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [currentUserStatus, setCurrentUserStatus] = useState(null);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [form, setForm] = useState({
    branchName: '', branchCode: '', branchType: 'satellite', city: '', state: '', address: '',
    phone: '', email: '', totalBeds: 0, operatingHours: { open: '08:00', close: '20:00' }
  });
  const [staffForm, setStaffForm] = useState({
    name: '', email: '', phone: '', role: 'receptionist', department: '', password: '', createNewUser: true
  });

  const branchTypes = ['main', 'satellite', 'clinic', 'diagnostic_center', 'pharmacy'];
  const staffRoles = ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'];
  const statusColors = { active: '#10b981', inactive: '#64748b', under_renovation: '#f59e0b', closed: '#ef4444' };
  const customStatusOptions = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'];
  const presenceStatusOptions = ['checked_in', 'checked_out', ...customStatusOptions];
  const customStatusColors = {
    available: { bg: '#dcfce7', text: '#16a34a', label: 'Available' },
    with_patient: { bg: '#dbeafe', text: '#2563eb', label: 'With Patient' },
    in_surgery: { bg: '#fce7f3', text: '#db2777', label: 'In Surgery' },
    on_break: { bg: '#fef3c7', text: '#d97706', label: 'On Break' },
    in_meeting: { bg: '#e0e7ff', text: '#4f46e5', label: 'In Meeting' },
    unavailable: { bg: '#f1f5f9', text: '#64748b', label: 'Unavailable' }
  };

  const orgId = organizationId || clinicId;

  // Initialize filter presets hook
  const { 
    presets, 
    savePreset, 
    loadPreset, 
    deletePreset 
  } = useFilterPresets({ 
    validBranches: branches, 
    validRoles: staffRoles 
  });

  // Initialize presence notifications hook (Requirements: 4.1, 4.2, 4.3)
  const {
    preferences: notificationPrefs,
    toggleWatch,
    isWatched,
    updatePreferences: updateNotificationPrefs,
    watchedCount
  } = usePresenceNotifications(staffPresence);

  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => { 
    fetchBranches(); 
    fetchDashboard(); 
    fetchAggregatedData();
    fetchStaffPresence();
    
    // Poll for real-time presence updates every 30 seconds
    const presenceInterval = setInterval(fetchStaffPresence, 30000);
    return () => clearInterval(presenceInterval);
  }, [orgId]);

  // Refetch presence when filters change
  useEffect(() => {
    fetchStaffPresence();
  }, [presenceFilters]);

  const fetchStaffPresence = async () => {
    try {
      // Build query params from filters
      const params = new URLSearchParams();
      if (presenceFilters.role) params.append('role', presenceFilters.role);
      if (presenceFilters.branchId) params.append('branchId', presenceFilters.branchId);
      if (presenceFilters.department) params.append('department', presenceFilters.department);
      if (presenceFilters.status) params.append('status', presenceFilters.status);
      
      const queryString = params.toString();
      const url = `/api/branch-staff/presence/${orgId}${queryString ? `?${queryString}` : ''}`;
      const res = await axios.get(url);
      setStaffPresence(res.data.presence || []);
    } catch (err) {
      console.error('Error fetching staff presence:', err);
      setStaffPresence([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`/api/branches/branches/organization/${orgId}`);
      setBranches(res.data.branches || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`/api/branches/dashboard/${orgId}`);
      setDashboard(res.data.dashboard);
    } catch (err) { console.error(err); }
  };

  const fetchAggregatedData = async () => {
    try {
      const res = await axios.get(`/api/branches/aggregated/${orgId}`);
      setAggregatedData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchBranchStaff = async (branchId) => {
    try {
      const res = await axios.get(`/api/branch-staff/branch/${branchId}`);
      setBranchStaff(res.data.staff || []);
    } catch (err) { console.error(err); setBranchStaff([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/branches/branches', { ...form, organizationId: orgId, organizationName: 'Care Hospital' });
      toast.success('Branch created successfully');
      setShowModal(false);
      setForm({ branchName: '', branchCode: '', branchType: 'satellite', city: '', state: '', address: '', phone: '', email: '', totalBeds: 0, operatingHours: { open: '08:00', close: '20:00' } });
      fetchBranches();
      fetchDashboard();
      fetchAggregatedData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create branch'); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;
    try {
      await axios.post('/api/branch-staff', { ...staffForm, branchId: selectedBranch._id });
      toast.success(`Staff ${staffForm.name} added to ${selectedBranch.branchName}`);
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', phone: '', role: 'receptionist', department: '', password: '', createNewUser: true });
      fetchBranchStaff(selectedBranch._id);
      fetchDashboard();
      fetchAggregatedData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add staff'); }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!window.confirm('Remove this staff from branch?')) return;
    try {
      await axios.delete(`/api/branch-staff/${staffId}`);
      toast.success('Staff removed from branch');
      fetchBranchStaff(selectedBranch._id);
      fetchDashboard();
    } catch (err) { toast.error('Failed to remove staff'); }
  };

  const openBranchDetails = (branch) => {
    setSelectedBranch(branch);
    fetchBranchStaff(branch._id);
  };

  // Clear all presence filters
  const clearPresenceFilters = () => {
    setPresenceFilters({ role: '', branchId: '', department: '', status: '' });
  };

  // Check if any filter is active
  const hasActiveFilters = presenceFilters.role || presenceFilters.branchId || presenceFilters.department || presenceFilters.status;

  // Get unique departments from staff presence for filter dropdown
  const uniqueDepartments = [...new Set(staffPresence.filter(s => s.department).map(s => s.department))];

  // Handle saving a new preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    const saved = savePreset(newPresetName, presenceFilters);
    if (saved) {
      toast.success(`Preset "${newPresetName}" saved`);
      setNewPresetName('');
      setShowSavePresetInput(false);
    }
  };

  // Handle loading a preset
  const handleLoadPreset = (presetId) => {
    const filters = loadPreset(presetId);
    if (filters) {
      setPresenceFilters(filters);
      toast.success('Preset loaded');
    }
  };

  // Handle deleting a preset
  const handleDeletePreset = (presetId, presetName) => {
    if (window.confirm(`Delete preset "${presetName}"?`)) {
      deletePreset(presetId);
      toast.success('Preset deleted');
    }
  };

  // Update current user's custom status (Requirements: 2.1, 2.2)
  const updateMyStatus = async (status, statusText = '') => {
    try {
      const res = await axios.post('/api/branch-staff/status', { 
        status: status || null, 
        statusText 
      });
      if (res.data.success) {
        setCurrentUserStatus(status);
        setShowStatusSelector(false);
        toast.success(status ? `Status set to ${customStatusColors[status]?.label || status}` : 'Status cleared');
        fetchStaffPresence(); // Refresh presence list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-8"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="space-y-6">
      {/* Real-Time Staff Presence Widget - Mobile responsive (Requirements: 10.3) */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
        <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 ${showPresenceWidget ? 'w-[calc(100vw-2rem)] sm:w-80 max-w-80' : 'w-14'}`}>
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
                    <button
                      onClick={() => setShowPresenceFilters(!showPresenceFilters)}
                      className={`p-1.5 rounded-lg transition-colors ${showPresenceFilters || hasActiveFilters ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      title="Filter staff"
                    >
                      <i className="fas fa-filter text-xs"></i>
                      {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>}
                    </button>
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
                
                {/* My Status Selector (Requirements: 2.1, 2.2) */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">My Status:</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusSelector(!showStatusSelector)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        {currentUserStatus && customStatusColors[currentUserStatus] ? (
                          <>
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: customStatusColors[currentUserStatus].text }}
                            ></span>
                            <span>{customStatusColors[currentUserStatus].label}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Set status...</span>
                        )}
                        <i className={`fas fa-chevron-${showStatusSelector ? 'up' : 'down'} text-[8px] text-slate-400`}></i>
                      </button>
                      
                      {/* Status Dropdown */}
                      {showStatusSelector && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                          {customStatusOptions.map(status => (
                            <button
                              key={status}
                              onClick={() => updateMyStatus(status)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-left"
                            >
                              <span 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: customStatusColors[status].text }}
                              ></span>
                              <span>{customStatusColors[status].label}</span>
                            </button>
                          ))}
                          {currentUserStatus && (
                            <>
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => updateMyStatus(null)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-left text-slate-500"
                              >
                                <i className="fas fa-times-circle text-[10px]"></i>
                                <span>Clear status</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filter Panel */}
              {showPresenceFilters && (
                <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Role Filter */}
                    <select
                      value={presenceFilters.role}
                      onChange={(e) => setPresenceFilters({ ...presenceFilters, role: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Roles</option>
                      {staffRoles.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                    
                    {/* Branch Filter */}
                    <select
                      value={presenceFilters.branchId}
                      onChange={(e) => setPresenceFilters({ ...presenceFilters, branchId: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>{branch.branchName}</option>
                      ))}
                    </select>
                    
                    {/* Department Filter */}
                    <select
                      value={presenceFilters.department}
                      onChange={(e) => setPresenceFilters({ ...presenceFilters, department: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Departments</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    
                    {/* Status Filter */}
                    <select
                      value={presenceFilters.status}
                      onChange={(e) => setPresenceFilters({ ...presenceFilters, status: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      {presenceStatusOptions.map(status => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearPresenceFilters}
                      className="w-full py-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                    >
                      <i className="fas fa-times-circle"></i>
                      Clear All Filters
                    </button>
                  )}
                  
                  {/* Preset Section */}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    {/* Preset Selector */}
                    {presets.length > 0 && (
                      <div className="mb-2">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 block">Load Preset</label>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {presets.map(preset => (
                            <div key={preset.id} className="flex items-center gap-1">
                              <button
                                onClick={() => handleLoadPreset(preset.id)}
                                className="flex-1 text-left px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 truncate"
                              >
                                {preset.name}
                              </button>
                              <button
                                onClick={() => handleDeletePreset(preset.id, preset.name)}
                                className="p-1 text-slate-400 hover:text-red-500"
                                title="Delete preset"
                              >
                                <i className="fas fa-trash-alt text-[10px]"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Save Preset */}
                    {hasActiveFilters && (
                      <div>
                        {showSavePresetInput ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newPresetName}
                              onChange={(e) => setNewPresetName(e.target.value)}
                              placeholder="Preset name..."
                              className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                            />
                            <button
                              onClick={handleSavePreset}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setShowSavePresetInput(false); setNewPresetName(''); }}
                              className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowSavePresetInput(true)}
                            className="w-full py-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded hover:border-blue-400"
                          >
                            <i className="fas fa-save"></i>
                            Save as Preset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Staff List */}
              <div className="max-h-64 overflow-y-auto p-2">
                {staffPresence.length > 0 ? (
                  <div className="space-y-1">
                    {staffPresence.slice(0, 10).map(staff => (
                      <div 
                        key={staff._id} 
                        className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${staff.isCheckedIn ? 'bg-emerald-50' : 'bg-slate-50'} ${isWatched(staff._id) ? 'ring-1 ring-amber-300' : ''}`}
                      >
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${staff.isCheckedIn ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-400'}`}>
                            {staff.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${staff.isCheckedIn ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-800 truncate">{staff.name}</p>
                            {/* Custom Status Badge (Requirements: 2.3) */}
                            {staff.customStatus && customStatusColors[staff.customStatus] && (
                              <span 
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap"
                                style={{ 
                                  backgroundColor: customStatusColors[staff.customStatus].bg,
                                  color: customStatusColors[staff.customStatus].text
                                }}
                                title={staff.customStatusText || customStatusColors[staff.customStatus].label}
                              >
                                {customStatusColors[staff.customStatus].label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            <span className="capitalize">{staff.role?.replace('_', ' ')}</span>
                            {staff.branchName && <span className="text-slate-400"> • {staff.branchName}</span>}
                          </p>
                          {/* Custom Status Text */}
                          {staff.customStatusText && (
                            <p className="text-[10px] text-slate-400 truncate italic">"{staff.customStatusText}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Watch/Unwatch Button (Requirements: 4.1, 4.4) */}
                          <button
                            onClick={() => {
                              const nowWatched = toggleWatch(staff._id);
                              toast.success(nowWatched ? `Watching ${staff.name}` : `Stopped watching ${staff.name}`, { duration: 2000 });
                            }}
                            className={`p-1 rounded transition-colors ${isWatched(staff._id) ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-400'}`}
                            title={isWatched(staff._id) ? 'Stop watching' : 'Watch for notifications'}
                          >
                            <i className={`fas fa-bell${isWatched(staff._id) ? '' : '-slash'} text-xs`}></i>
                          </button>
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
                  <div className="flex items-center gap-2">
                    <span><i className="fas fa-sync-alt mr-1"></i>Updates every 30s</span>
                    {watchedCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <i className="fas fa-bell text-[10px]"></i>
                        {watchedCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                      className={`p-1 rounded transition-colors ${showNotificationSettings ? 'text-blue-600' : 'text-slate-400 hover:text-slate-500'}`}
                      title="Notification settings"
                    >
                      <i className="fas fa-cog text-xs"></i>
                    </button>
                    <button 
                      onClick={fetchStaffPresence}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Refresh Now
                    </button>
                  </div>
                </div>
                
                {/* Notification Settings Panel (Requirements: 4.4, 4.5) */}
                {showNotificationSettings && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Notification Settings</p>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.notifyOnCheckIn}
                        onChange={(e) => updateNotificationPrefs({ notifyOnCheckIn: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600">Notify on check-in</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.notifyOnCheckOut}
                        onChange={(e) => updateNotificationPrefs({ notifyOnCheckOut: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600">Notify on check-out</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.soundEnabled}
                        onChange={(e) => updateNotificationPrefs({ soundEnabled: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-600">Play sound</span>
                    </label>
                    
                    {watchedCount > 0 && (
                      <p className="text-[10px] text-slate-400 pt-1">
                        Watching {watchedCount} staff member{watchedCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
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
      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Branches', value: dashboard.totalBranches, color: '#6366f1', icon: 'building' },
            { label: 'Active', value: dashboard.activeBranches, color: '#10b981', icon: 'check-circle' },
            { label: 'Total Beds', value: dashboard.totalBeds, color: '#3b82f6', icon: 'bed' },
            { label: 'Total Staff', value: aggregatedData?.staff?.total || dashboard.totalStaff || 0, color: '#8b5cf6', icon: 'users' },
            { label: 'Total Doctors', value: dashboard.totalDoctors, color: '#f59e0b', icon: 'user-md' }
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
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <i className="fas fa-sitemap text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Multi-Branch Management</h2>
              <p className="text-sm text-slate-500">Centralized hospital network control with real-time sync</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-plus mr-2"></i>Add Branch
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
          {['overview', 'comparison', 'staff', 'transfers'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-medium capitalize ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>{tab}</button>
          ))}
        </div>

        {/* Branches Grid */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map(branch => (
              <div key={branch._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{branch.branchName}</h3>
                    <p className="text-sm text-slate-500">{branch.branchCode}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[branch.status]}15`, color: statusColors[branch.status] }}>
                    {branch.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-600"><i className="fas fa-map-marker-alt w-5 text-slate-400"></i>{branch.city}, {branch.state}</p>
                  <p className="text-slate-600"><i className="fas fa-phone w-5 text-slate-400"></i>{branch.phone}</p>
                  <div className="flex gap-4 pt-2 border-t border-slate-100 mt-2">
                    <span className="text-slate-500"><i className="fas fa-bed mr-1"></i>{branch.totalBeds || 0} beds</span>
                    <span className="text-slate-500"><i className="fas fa-users mr-1"></i>{aggregatedData?.staff?.byBranch?.[branch._id] || branch.staffCount || 0} staff</span>
                  </div>
                </div>
                <button onClick={() => openBranchDetails(branch)} className="w-full mt-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-medium">
                  View Details & Staff
                </button>
              </div>
            ))}
            {branches.length === 0 && <p className="col-span-full text-center py-8 text-slate-500">No branches found. Add your first branch!</p>}
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Branch</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">City</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Beds</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Staff</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(branch => (
                  <tr key={branch._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{branch.branchName}<br/><span className="text-xs text-slate-400">{branch.branchCode}</span></td>
                    <td className="py-3 px-4 text-slate-600">{branch.city}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">{branch.branchType?.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-slate-600">{branch.totalBeds || 0}</td>
                    <td className="py-3 px-4 text-slate-600">{aggregatedData?.staff?.byBranch?.[branch._id] || branch.staffCount || 0}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[branch.status]}15`, color: statusColors[branch.status] }}>
                        {branch.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff Tab - All Staff Across Branches */}
        {activeTab === 'staff' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-blue-800 text-sm"><i className="fas fa-info-circle mr-2"></i>Staff assigned to branches can login with their email. Changes they make will sync to the main dashboard in real-time.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {branches.map(branch => (
                <div key={branch._id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-800">{branch.branchName}</h4>
                    <button onClick={() => { setSelectedBranch(branch); setShowStaffModal(true); }} className="text-sm text-blue-600 hover:text-blue-700">
                      <i className="fas fa-plus mr-1"></i>Add Staff
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{aggregatedData?.staff?.byBranch?.[branch._id] || 0} staff members</p>
                  <button onClick={() => openBranchDetails(branch)} className="text-sm text-blue-600 hover:underline">View all staff →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="text-center py-12 text-slate-500">
            <i className="fas fa-exchange-alt text-4xl mb-4 text-slate-300"></i>
            <p>Patient transfer functionality</p>
            <p className="text-sm">Transfer patients between branches seamlessly</p>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">Add New Branch</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name *</label>
                  <input type="text" value={form.branchName} onChange={e => setForm({...form, branchName: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code <span className="text-slate-400 font-normal">(auto-generated)</span></label>
                  <input type="text" value={form.branchCode} onChange={e => setForm({...form, branchCode: e.target.value.toUpperCase()})} placeholder="Leave blank for auto" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch Type</label>
                  <select value={form.branchType} onChange={e => setForm({...form, branchType: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {branchTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} required rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Beds</label>
                  <input type="number" value={form.totalBeds} onChange={e => setForm({...form, totalBeds: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add Staff to Branch</h3>
                <p className="text-sm text-slate-500">{selectedBranch.branchName}</p>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={staffForm.createNewUser} onChange={e => setStaffForm({...staffForm, createNewUser: e.target.checked})} className="w-4 h-4 rounded" />
                  <span className="text-sm text-blue-800">Create new user account (staff can login with this email)</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Staff will login with this email" />
                </div>
                {staffForm.createNewUser && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="Default: Branch@123" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl">
                    {staffRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input type="text" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl" placeholder="e.g., OPD, Emergency, Pharmacy" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Details Modal with Staff List */}
      {selectedBranch && !showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedBranch.branchName}</h3>
                <p className="text-sm text-slate-500">{selectedBranch.branchCode} • {selectedBranch.city}</p>
              </div>
              <button onClick={() => setSelectedBranch(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6">
              {/* Branch Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium capitalize">{selectedBranch.branchType?.replace('_', ' ')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ background: `${statusColors[selectedBranch.status]}15`, color: statusColors[selectedBranch.status] }}>{selectedBranch.status?.replace('_', ' ')}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Total Beds</p>
                  <p className="font-medium">{selectedBranch.totalBeds || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium">{selectedBranch.phone || '-'}</p>
                </div>
              </div>

              {/* Staff Section */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-slate-800"><i className="fas fa-users mr-2 text-blue-500"></i>Branch Staff ({branchStaff.length})</h4>
                  <button onClick={() => setShowStaffModal(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                    <i className="fas fa-plus mr-1"></i>Add Staff
                  </button>
                </div>
                
                {branchStaff.length > 0 ? (
                  <div className="space-y-2">
                    {branchStaff.map(staff => (
                      <div key={staff._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                            {staff.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{staff.name}</p>
                            <p className="text-sm text-slate-500">{staff.email} • <span className="capitalize">{staff.role?.replace('_', ' ')}</span></p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveStaff(staff._id)} className="text-red-500 hover:text-red-600 p-2">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <i className="fas fa-user-plus text-3xl mb-2 text-slate-300"></i>
                    <p>No staff assigned to this branch yet</p>
                    <button onClick={() => setShowStaffModal(true)} className="mt-2 text-blue-600 hover:underline text-sm">Add first staff member</button>
                  </div>
                )}

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-800"><i className="fas fa-sync-alt mr-2"></i>Staff members can login with their email. All changes made at this branch will automatically sync to the main dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiBranchSection;

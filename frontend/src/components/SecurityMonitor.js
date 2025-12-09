import { useState, useEffect, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const SecurityMonitor = ({ adminId }) => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('alerts'); // alerts, analytics, blocked, actions
  const [blockIPModal, setBlockIPModal] = useState(false);
  const [newBlockIP, setNewBlockIP] = useState({ ip: '', reason: '' });
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    activityType: '',
    userType: ''
  });

  const severityColors = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const statusColors = {
    new: 'bg-red-500',
    investigating: 'bg-yellow-500',
    confirmed: 'bg-orange-500',
    false_positive: 'bg-gray-400',
    resolved: 'bg-green-500'
  };

  const activityIcons = {
    unusual_login: 'fa-sign-in-alt',
    multiple_failed_logins: 'fa-lock',
    bulk_data_access: 'fa-database',
    off_hours_access: 'fa-moon',
    rapid_actions: 'fa-bolt',
    unauthorized_access: 'fa-shield-alt',
    data_modification: 'fa-edit',
    payment_anomaly: 'fa-credit-card',
    appointment_fraud: 'fa-calendar-times',
    prescription_abuse: 'fa-pills',
    account_manipulation: 'fa-user-cog',
    export_abuse: 'fa-file-export',
    api_abuse: 'fa-code',
    privilege_escalation: 'fa-user-shield',
    other: 'fa-exclamation-triangle'
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await axios.get(`/api/security/alerts?${params}`);
      if (response.data.success) {
        setAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/security/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/api/security/analytics?days=30');
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchBlockedIPs = useCallback(async () => {
    try {
      const response = await axios.get('/api/security/blocked-ips');
      if (response.data.success) {
        setBlockedIPs(response.data.blockedIPs);
      }
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchStats(), fetchAnalytics(), fetchBlockedIPs()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAlerts, fetchStats, fetchAnalytics, fetchBlockedIPs]);

  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      const response = await axios.put(`/api/security/alerts/${alertId}/status`, {
        status: newStatus,
        adminId,
        notes: `Status updated to ${newStatus}`
      });
      if (response.data.success) {
        toast.success('Alert status updated');
        fetchAlerts();
        fetchStats();
        if (selectedAlert?._id === alertId) {
          setSelectedAlert({ ...selectedAlert, status: newStatus });
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddAction = async (alertId, action, notes) => {
    try {
      await axios.post(`/api/security/alerts/${alertId}/action`, {
        action,
        adminId,
        notes
      });
      toast.success('Action recorded');
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to record action');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Block IP
  const handleBlockIP = async () => {
    if (!newBlockIP.ip) {
      toast.error('Please enter an IP address');
      return;
    }
    try {
      const response = await axios.post('/api/security/block-ip', newBlockIP);
      if (response.data.success) {
        toast.success(response.data.message);
        setBlockIPModal(false);
        setNewBlockIP({ ip: '', reason: '' });
        fetchBlockedIPs();
      }
    } catch (error) {
      toast.error('Failed to block IP');
    }
  };

  // Unblock IP
  const handleUnblockIP = async (ip) => {
    try {
      const response = await axios.delete(`/api/security/block-ip/${ip}`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchBlockedIPs();
      }
    } catch (error) {
      toast.error('Failed to unblock IP');
    }
  };

  // Suspend user
  const handleSuspendUser = async (userId, reason) => {
    try {
      console.log('Suspending user:', userId, 'Reason:', reason);
      const response = await axios.post('/api/security/suspend-user', { userId, reason, adminId });
      console.log('Suspend response:', response.data);
      if (response.data.success) {
        toast.success('User suspended and notified via email');
        fetchAlerts();
      } else {
        toast.error(response.data.message || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Suspend error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    }
  };

  // Force logout
  const handleForceLogout = async (userId, reason) => {
    try {
      const response = await axios.post('/api/security/force-logout', { userId, reason: reason || 'Security concern' });
      if (response.data.success) {
        toast.success('User logged out and notified via email');
      }
    } catch (error) {
      toast.error('Failed to force logout');
    }
  };

  // Unsuspend user
  const handleUnsuspendUser = async (userId) => {
    try {
      const response = await axios.post('/api/security/unsuspend-user', { userId, adminId });
      if (response.data.success) {
        toast.success('User unsuspended and notified via email');
        fetchAlerts();
      }
    } catch (error) {
      toast.error('Failed to unsuspend user');
    }
  };

  // Require password reset
  const handleRequirePasswordReset = async (userId, reason) => {
    try {
      const response = await axios.post('/api/security/require-password-reset', { userId, reason, adminId });
      if (response.data.success) {
        toast.success('Password reset required and user notified via email');
        fetchAlerts();
      }
    } catch (error) {
      toast.error('Failed to require password reset');
    }
  };

  // Generate test alerts for demonstration
  const handleGenerateTestAlerts = async () => {
    try {
      const response = await axios.post('/api/security/test-alerts');
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAlerts();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to generate test alerts');
    }
  };

  // Clear test alerts
  const handleClearTestAlerts = async () => {
    if (!window.confirm('Are you sure you want to delete all test alerts?')) return;
    try {
      const response = await axios.delete('/api/security/test-alerts');
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAlerts();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to clear test alerts');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'alerts', icon: 'fa-bell', label: 'Alerts' },
          { id: 'analytics', icon: 'fa-chart-bar', label: 'Analytics' },
          { id: 'blocked', icon: 'fa-ban', label: 'Blocked IPs' },
          { id: 'actions', icon: 'fa-gavel', label: 'Quick Actions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
            {tab.id === 'alerts' && stats.newAlerts > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{stats.newAlerts}</span>
            )}
            {tab.id === 'blocked' && blockedIPs.length > 0 && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">{blockedIPs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <i className="fas fa-exclamation-circle text-red-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.newAlerts || 0}</p>
              <p className="text-xs text-slate-500">New Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <i className="fas fa-clock text-orange-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.todayAlerts || 0}</p>
              <p className="text-xs text-slate-500">Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-calendar-week text-yellow-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.weekAlerts || 0}</p>
              <p className="text-xs text-slate-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i className="fas fa-shield-alt text-purple-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.bySeverity?.critical || 0}</p>
              <p className="text-xs text-slate-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-database text-blue-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
              <p className="text-xs text-slate-500">Total Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      {stats.bySeverity && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Severity Breakdown</h3>
          <div className="flex gap-4">
            {['critical', 'high', 'medium', 'low'].map(sev => (
              <div key={sev} className={`flex-1 p-3 rounded-lg border ${severityColors[sev]}`}>
                <p className="text-lg font-bold">{stats.bySeverity[sev] || 0}</p>
                <p className="text-xs capitalize">{sev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Security Analytics (Last 30 Days)</h3>
            
            {/* Top Offenders */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-600 mb-3">Top Offenders</h4>
              <div className="space-y-2">
                {analytics.topOffenders?.slice(0, 5).map((offender, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <span className="text-sm text-slate-700">{offender._id}</span>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">{offender.count} alerts</span>
                  </div>
                ))}
                {(!analytics.topOffenders || analytics.topOffenders.length === 0) && (
                  <p className="text-sm text-slate-500">No offenders found</p>
                )}
              </div>
            </div>

            {/* Top IPs */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-600 mb-3">Suspicious IPs</h4>
              <div className="space-y-2">
                {analytics.topIPs?.slice(0, 5).map((ip, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-mono text-sm text-slate-700">{ip._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">{ip.count} alerts</span>
                      <button
                        onClick={() => { setNewBlockIP({ ip: ip._id, reason: 'Suspicious activity' }); setBlockIPModal(true); }}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Rate */}
            {analytics.resolutionRate && (
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-3">Resolution Stats</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{analytics.resolutionRate.total}</p>
                    <p className="text-xs text-blue-600">Total Alerts</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">{analytics.resolutionRate.resolved}</p>
                    <p className="text-xs text-green-600">Resolved</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700">{analytics.resolutionRate.falsePositive}</p>
                    <p className="text-xs text-gray-600">False Positives</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === 'blocked' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">
              <i className="fas fa-ban text-red-600 mr-2"></i>
              Blocked IP Addresses ({blockedIPs.length})
            </h3>
            <button
              onClick={() => setBlockIPModal(true)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              <i className="fas fa-plus mr-1"></i> Block IP
            </button>
          </div>
          {blockedIPs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <i className="fas fa-check-circle text-3xl text-green-600"></i>
              </div>
              <p className="text-slate-500">No blocked IPs</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blockedIPs.map((block, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-slate-800">{block.ip}</p>
                    <p className="text-xs text-slate-500">{block.reason}</p>
                    <p className="text-xs text-slate-400">Expires in {Math.round(block.remainingTime / 60000)} minutes</p>
                  </div>
                  <button
                    onClick={() => handleUnblockIP(block.ip)}
                    className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions Tab */}
      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-user-slash text-red-600 mr-2"></i>
              Suspend User
            </h3>
            <p className="text-sm text-slate-500 mb-4">Temporarily disable a user account for security reasons.</p>
            <input
              type="text"
              placeholder="Enter User ID or Email"
              id="suspendUserId"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Reason for suspension"
              id="suspendReason"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <button
              onClick={() => {
                const userId = document.getElementById('suspendUserId').value;
                const reason = document.getElementById('suspendReason').value;
                if (userId) handleSuspendUser(userId, reason);
              }}
              className="w-full py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
            >
              Suspend User
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-sign-out-alt text-orange-600 mr-2"></i>
              Force Logout
            </h3>
            <p className="text-sm text-slate-500 mb-4">Force a user to log out from all sessions.</p>
            <input
              type="text"
              placeholder="Enter User ID or Email"
              id="logoutUserId"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Reason for logout"
              id="logoutReason"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <button
              onClick={() => {
                const userId = document.getElementById('logoutUserId').value;
                const reason = document.getElementById('logoutReason').value;
                if (userId) handleForceLogout(userId, reason);
              }}
              className="w-full py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
            >
              Force Logout
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-ban text-purple-600 mr-2"></i>
              Block IP Address
            </h3>
            <p className="text-sm text-slate-500 mb-4">Block an IP address from accessing the system.</p>
            <input
              type="text"
              placeholder="Enter IP Address"
              value={newBlockIP.ip}
              onChange={(e) => setNewBlockIP({ ...newBlockIP, ip: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Reason for blocking"
              value={newBlockIP.reason}
              onChange={(e) => setNewBlockIP({ ...newBlockIP, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <button
              onClick={handleBlockIP}
              className="w-full py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
            >
              Block IP
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-user-check text-green-600 mr-2"></i>
              Unsuspend User
            </h3>
            <p className="text-sm text-slate-500 mb-4">Restore a suspended user account.</p>
            <input
              type="text"
              placeholder="Enter User ID or Email"
              id="unsuspendUserId"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <button
              onClick={() => {
                const userId = document.getElementById('unsuspendUserId').value;
                if (userId) handleUnsuspendUser(userId);
              }}
              className="w-full py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Unsuspend User
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-key text-indigo-600 mr-2"></i>
              Require Password Reset
            </h3>
            <p className="text-sm text-slate-500 mb-4">Force a user to reset their password on next login.</p>
            <input
              type="text"
              placeholder="Enter User ID or Email"
              id="resetUserId"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Reason for password reset"
              id="resetReason"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <button
              onClick={() => {
                const userId = document.getElementById('resetUserId').value;
                const reason = document.getElementById('resetReason').value;
                if (userId) handleRequirePasswordReset(userId, reason);
              }}
              className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              Require Password Reset
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">
              <i className="fas fa-envelope text-blue-600 mr-2"></i>
              Test Email Alert
            </h3>
            <p className="text-sm text-slate-500 mb-4">Send a test security alert email to admin.</p>
            <button
              onClick={async () => {
                try {
                  const response = await axios.post('/api/security/test-email');
                  if (response.data.success) {
                    toast.success('Test email sent');
                  } else {
                    toast.error('Failed to send email');
                  }
                } catch (error) {
                  toast.error('Failed to send email');
                }
              }}
              className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Send Test Email
            </button>
          </div>
        </div>
      )}

      {/* Block IP Modal */}
      {blockIPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBlockIPModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Block IP Address</h3>
            <input
              type="text"
              placeholder="IP Address"
              value={newBlockIP.ip}
              onChange={(e) => setNewBlockIP({ ...newBlockIP, ip: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Reason"
              value={newBlockIP.reason}
              onChange={(e) => setNewBlockIP({ ...newBlockIP, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setBlockIPModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
              <button onClick={handleBlockIP} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab Content */}
      {activeTab === 'alerts' && (
        <>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="confirmed">Confirmed</option>
            <option value="false_positive">False Positive</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.userType}
            onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Users</option>
            <option value="User">Patients</option>
            <option value="Doctor">Doctors</option>
            <option value="Receptionist">Staff</option>
            <option value="Admin">Admins</option>
          </select>
          <select
            value={filters.activityType}
            onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="multiple_failed_logins">Failed Logins</option>
            <option value="unauthorized_access">Unauthorized Access</option>
            <option value="bulk_data_access">Bulk Data Access</option>
            <option value="rapid_actions">Rapid Actions</option>
            <option value="data_modification">Data Modification</option>
            <option value="payment_anomaly">Payment Anomaly</option>
            <option value="off_hours_access">Off-Hours Access</option>
            <option value="account_manipulation">Account Manipulation</option>
          </select>
          <button
            onClick={() => setFilters({ status: '', severity: '', activityType: '', userType: '' })}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            <i className="fas fa-times mr-1"></i> Clear
          </button>
          <button
            onClick={() => { fetchAlerts(); fetchStats(); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <i className="fas fa-sync-alt mr-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            <i className="fas fa-shield-alt text-indigo-600 mr-2"></i>
            Security Alerts ({alerts.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateTestAlerts}
              className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium"
            >
              <i className="fas fa-flask mr-1"></i> Generate Test Alerts
            </button>
            <button
              onClick={handleClearTestAlerts}
              className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium"
            >
              <i className="fas fa-trash mr-1"></i> Clear Test Data
            </button>
          </div>
        </div>
        
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <i className="fas fa-check-circle text-3xl text-green-600"></i>
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">All Clear!</h4>
            <p className="text-slate-500">No suspicious activities detected</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map(alert => (
              <div
                key={alert._id}
                className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedAlert?._id === alert._id ? 'bg-indigo-50' : ''}`}
                onClick={() => setSelectedAlert(selectedAlert?._id === alert._id ? null : alert)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[alert.severity]}`}>
                    <i className={`fas ${activityIcons[alert.activityType] || 'fa-exclamation'}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${statusColors[alert.status]}`}></span>
                      <span className="text-xs text-slate-500 capitalize">{alert.status.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400">{alert.userType}</span>
                    </div>
                    <p className="font-medium text-slate-800 text-sm">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span><i className="fas fa-user mr-1"></i>{alert.userName || alert.userEmail || 'Unknown'}</span>
                      <span><i className="fas fa-clock mr-1"></i>{formatDate(alert.createdAt)}</span>
                      {alert.confidenceScore && (
                        <span><i className="fas fa-robot mr-1"></i>{alert.confidenceScore}% confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.warningSent && (
                      <span className="text-xs text-amber-600" title="Warning sent to user">
                        <i className="fas fa-bell"></i>
                      </span>
                    )}
                    <i className={`fas fa-chevron-${selectedAlert?._id === alert._id ? 'up' : 'down'} text-slate-400`}></i>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedAlert?._id === alert._id && (
                  <div className="mt-4 pt-4 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {alert.details?.ipAddress && (
                        <div className="text-sm">
                          <span className="text-slate-500">IP Address:</span>
                          <span className="ml-2 font-mono text-slate-700">{alert.details.ipAddress}</span>
                        </div>
                      )}
                      {alert.details?.endpoint && (
                        <div className="text-sm">
                          <span className="text-slate-500">Endpoint:</span>
                          <span className="ml-2 font-mono text-slate-700">{alert.details.endpoint}</span>
                        </div>
                      )}
                      {alert.details?.actionCount && (
                        <div className="text-sm">
                          <span className="text-slate-500">Action Count:</span>
                          <span className="ml-2 font-medium text-slate-700">{alert.details.actionCount}</span>
                        </div>
                      )}
                      {alert.details?.affectedRecords && (
                        <div className="text-sm">
                          <span className="text-slate-500">Records Affected:</span>
                          <span className="ml-2 font-medium text-slate-700">{alert.details.affectedRecords}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500 mr-2">Update Status:</span>
                      {['investigating', 'confirmed', 'false_positive', 'resolved'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(alert._id, status)}
                          disabled={alert.status === status}
                          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                            alert.status === status
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddAction(alert._id, 'User notified', 'Sent additional warning')}
                        className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                      >
                        <i className="fas fa-bell mr-1"></i> Notify User
                      </button>
                      <button
                        onClick={async () => {
                          if (alert.userEmail || alert.userId) {
                            await handleSuspendUser(alert.userEmail || alert.userId, `Suspended due to: ${alert.activityType}`);
                            handleAddAction(alert._id, 'Account suspended', 'User account suspended');
                          } else {
                            toast.error('No user email/ID found for this alert');
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <i className="fas fa-ban mr-1"></i> Suspend Account
                      </button>
                      <button
                        onClick={async () => {
                          if (alert.userEmail || alert.userId) {
                            await handleRequirePasswordReset(alert.userEmail || alert.userId, `Required due to: ${alert.activityType}`);
                            handleAddAction(alert._id, 'Password reset required', 'Forced password reset');
                          } else {
                            toast.error('No user email/ID found for this alert');
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        <i className="fas fa-key mr-1"></i> Force Password Reset
                      </button>
                      <button
                        onClick={async () => {
                          if (alert.userEmail || alert.userId) {
                            await handleForceLogout(alert.userEmail || alert.userId, `Logged out due to: ${alert.activityType}`);
                            handleAddAction(alert._id, 'Force logout', 'User session terminated');
                          } else {
                            toast.error('No user email/ID found for this alert');
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                      >
                        <i className="fas fa-sign-out-alt mr-1"></i> Force Logout
                      </button>
                    </div>

                    {/* Action History */}
                    {alert.actionsTaken?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-2">Action History:</p>
                        <div className="space-y-1">
                          {alert.actionsTaken.map((action, idx) => (
                            <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                              <i className="fas fa-check-circle text-green-500"></i>
                              <span>{action.action}</span>
                              <span className="text-slate-400">
                                {new Date(action.takenAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default SecurityMonitor;

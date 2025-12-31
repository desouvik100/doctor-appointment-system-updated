/**
 * StaffAnalyticsSection Component
 * Analytics dashboard for staff attendance and presence data
 * Requirements: 6.1-6.7, 7.1-7.5, 8.1-8.6
 */

import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const StaffAnalyticsSection = ({ clinicId, organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orgId = organizationId || clinicId;
  
  // Check if viewing today's data (Requirements: 9.1)
  const today = new Date().toISOString().split('T')[0];
  const isViewingToday = dateRange.endDate === today;

  // Fetch branches for selector
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`/api/branches/branches/organization/${orgId}`);
        setBranches(res.data.branches || []);
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };
    fetchBranches();
  }, [orgId]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: 'day'
      });
      
      const res = await axios.get(`/api/branch-staff/analytics/${orgId}?${params}`);
      setAnalytics(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (!isAutoRefresh) {
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [orgId, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds when viewing today (Requirements: 9.1)
  useEffect(() => {
    if (!isViewingToday) return;
    
    const intervalId = setInterval(() => {
      fetchAnalytics(true);
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isViewingToday, fetchAnalytics]);

  // Manual refresh handler (Requirements: 9.3)
  const handleManualRefresh = () => {
    fetchAnalytics(true);
  };

  // Export to CSV (Requirements: 8.6)
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv'
      });
      
      const res = await axios.get(`/api/branch-staff/analytics/${orgId}/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  // Format time from minutes since midnight
  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Format hours
  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0h';
    return `${Math.round(hours * 10) / 10}h`;
  };

  // Sort staff data
  const sortedStaffData = () => {
    if (!analytics?.analytics?.hoursWorked) return [];
    
    const staffArray = Object.entries(analytics.analytics.hoursWorked).map(([staffId, data]) => ({
      staffId,
      ...data
    }));

    return staffArray.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Staff Analytics</h2>
              <p className="text-sm text-slate-500">Attendance patterns, hours worked, and performance insights</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Date Range - Stack on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-auto"
              />
              <span className="text-slate-400 text-center hidden sm:inline">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full sm:w-auto"
              />
            </div>
            
            {/* Branch Selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1 sm:flex-none min-w-0"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>{branch.branchName}</option>
              ))}
            </select>
            
            {/* Action Buttons - Icon only on mobile */}
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg flex items-center gap-2"
                title="Export CSV"
              >
                <i className="fas fa-download"></i>
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              
              {/* Manual Refresh Button (Requirements: 9.3) */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`px-3 sm:px-4 py-2 border border-slate-200 rounded-lg font-medium flex items-center gap-2 ${
                  isRefreshing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="Refresh analytics data"
              >
                <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Auto-refresh indicator (Requirements: 9.1, 9.2) */}
        {isViewingToday && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Auto-refreshing every 30 seconds
            </span>
            {lastRefresh && (
              <span className="text-slate-400">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          {['overview', 'staff', 'branches', 'alerts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab 
                  ? 'bg-violet-50 text-violet-600' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>


      {/* Overview Tab - Metric Cards (Requirements: 6.1, 6.2, 6.3, 8.2) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Avg Check-in"
              value={formatTime(analytics?.analytics?.averageTimings?.avgCheckInMinutes)}
              icon="sign-in-alt"
              color="#10b981"
              subtitle="Average arrival time"
            />
            <MetricCard
              title="Avg Check-out"
              value={formatTime(analytics?.analytics?.averageTimings?.avgCheckOutMinutes)}
              icon="sign-out-alt"
              color="#3b82f6"
              subtitle="Average departure time"
            />
            <MetricCard
              title="Total Hours"
              value={formatHours(analytics?.analytics?.averageTimings?.totalHoursWorked)}
              icon="clock"
              color="#8b5cf6"
              subtitle="Hours worked this period"
            />
            <MetricCard
              title="Overtime"
              value={formatHours(analytics?.summary?.totalOvertimeHours)}
              icon="hourglass-half"
              color="#f59e0b"
              subtitle={`${analytics?.summary?.staffWithOvertime || 0} staff with overtime`}
            />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <i className="fas fa-clock text-red-500"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{analytics?.summary?.totalLateArrivals || 0}</p>
                  <p className="text-xs text-slate-500">Late Arrivals</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <i className="fas fa-running text-orange-500"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{analytics?.summary?.totalEarlyDepartures || 0}</p>
                  <p className="text-xs text-slate-500">Early Departures</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{analytics?.summary?.patternsDetected || 0}</p>
                  <p className="text-xs text-slate-500">Patterns Detected</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <i className="fas fa-user-clock text-purple-500"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{analytics?.summary?.staffExceedingOvertimeThreshold || 0}</p>
                  <p className="text-xs text-slate-500">Excessive Overtime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours Worked Chart (Simple Bar Visualization) - Scrollable on mobile */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm sm:text-base">Hours Worked by Staff</h3>
            <div className="space-y-3 overflow-x-auto">
              {sortedStaffData().slice(0, 10).map(staff => {
                const maxHours = Math.max(...sortedStaffData().map(s => s.totalHours || 0), 1);
                const percentage = ((staff.totalHours || 0) / maxHours) * 100;
                const overtimePercentage = staff.overtimeHours ? ((staff.overtimeHours / (staff.totalHours || 1)) * percentage) : 0;
                
                return (
                  <div key={staff.staffId} className="flex items-center gap-2 sm:gap-3 min-w-[280px]">
                    <div className="w-20 sm:w-32 text-xs sm:text-sm text-slate-600 truncate">{staff.staffName || 'Unknown'}</div>
                    <div className="flex-1 h-5 sm:h-6 bg-slate-100 rounded-full overflow-hidden relative min-w-[100px]">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                        style={{ width: `${percentage - overtimePercentage}%` }}
                      ></div>
                      {overtimePercentage > 0 && (
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-r-full absolute top-0"
                          style={{ left: `${percentage - overtimePercentage}%`, width: `${overtimePercentage}%` }}
                        ></div>
                      )}
                    </div>
                    <div className="w-12 sm:w-16 text-xs sm:text-sm text-slate-600 text-right">{formatHours(staff.totalHours)}</div>
                  </div>
                );
              })}
              {sortedStaffData().length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">No data available for selected period</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded"></span>
                Regular Hours
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded"></span>
                Overtime
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Staff Tab - Detailed Table (Requirements: 6.1, 6.2, 6.3, 6.5, 8.2) */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    { key: 'staffName', label: 'Staff Name' },
                    { key: 'avgCheckIn', label: 'Avg Check-in' },
                    { key: 'avgCheckOut', label: 'Avg Check-out' },
                    { key: 'totalHours', label: 'Total Hours' },
                    { key: 'lateCount', label: 'Late Count' },
                    { key: 'overtimeHours', label: 'Overtime' }
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="text-left py-3 px-4 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortConfig.key === col.key && (
                          <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} text-violet-500`}></i>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStaffData().map((staff, index) => {
                  const lateData = analytics?.analytics?.lateArrivals?.find(l => l.staffId === staff.staffId);
                  const overtimeData = analytics?.analytics?.overtimeReport?.[staff.staffId];
                  
                  return (
                    <tr key={staff.staffId} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {staff.staffName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-slate-800">{staff.staffName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatTime(staff.avgCheckInMinutes)}</td>
                      <td className="py-3 px-4 text-slate-600">{formatTime(staff.avgCheckOutMinutes)}</td>
                      <td className="py-3 px-4 text-slate-600">{formatHours(staff.totalHours)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (lateData?.count || 0) > 3 
                            ? 'bg-red-100 text-red-600' 
                            : (lateData?.count || 0) > 0 
                              ? 'bg-amber-100 text-amber-600' 
                              : 'bg-green-100 text-green-600'
                        }`}>
                          {lateData?.count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (overtimeData?.totalOvertimeHours || 0) > 10 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {formatHours(overtimeData?.totalOvertimeHours || 0)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {sortedStaffData().length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No staff data available for selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branches Tab - Branch Comparison (Requirements: 7.1, 7.2, 7.3) */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(analytics?.analytics?.branchComparison) && analytics.analytics.branchComparison.map(branch => (
              <div key={branch.branchId} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate mr-2">{branch.branchName || 'Unknown Branch'}</h4>
                  <span className="px-2 py-1 bg-violet-100 text-violet-600 rounded-full text-xs font-medium whitespace-nowrap">
                    {branch.staffCount} staff
                  </span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Hours</span>
                    <span className="font-medium text-slate-800">{formatHours(branch.totalHours)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Avg Hours/Staff</span>
                    <span className="font-medium text-slate-800">{formatHours(branch.avgHoursPerStaff)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Peak Hour</span>
                    <span className="font-medium text-slate-800">
                      {branch.peakHour !== undefined ? `${branch.peakHour}:00` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Normalized Hours</span>
                    <span className="font-medium text-slate-800">{formatHours(branch.normalizedHours)}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!Array.isArray(analytics?.analytics?.branchComparison) || analytics.analytics.branchComparison.length === 0) && (
              <div className="col-span-full text-center py-8 text-slate-400">
                No branch comparison data available
              </div>
            )}
          </div>
        </div>
      )}


      {/* Alerts Tab - Patterns and Alerts (Requirements: 8.3, 8.4, 8.5) */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Excessive Overtime Alerts */}
          {Array.isArray(analytics?.analytics?.excessiveOvertime) && analytics.analytics.excessiveOvertime.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 sm:p-4 bg-orange-50 border-b border-orange-100">
                <h4 className="font-semibold text-orange-800 flex items-center gap-2 text-sm sm:text-base">
                  <i className="fas fa-exclamation-circle"></i>
                  Excessive Overtime ({analytics.analytics.excessiveOvertime.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.analytics.excessiveOvertime.map((alert, index) => (
                  <div key={index} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-user-clock text-orange-500 text-sm sm:text-base"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{alert.staffName || 'Unknown'}</p>
                        <p className="text-xs sm:text-sm text-slate-500">{formatHours(alert.totalOvertimeHours)} overtime</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs sm:text-sm font-medium self-start sm:self-center whitespace-nowrap">
                      Exceeds threshold
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern Alerts */}
          {Array.isArray(analytics?.analytics?.patterns) && analytics.analytics.patterns.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 sm:p-4 bg-amber-50 border-b border-amber-100">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2 text-sm sm:text-base">
                  <i className="fas fa-chart-line"></i>
                  Detected Patterns ({analytics.analytics.patterns.length})
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.analytics.patterns.map((pattern, index) => (
                  <div key={index} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        pattern.type === 'consecutive_late' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        <i className={`fas text-sm sm:text-base ${
                          pattern.type === 'consecutive_late' ? 'fa-clock text-red-500' : 'fa-running text-amber-500'
                        }`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{pattern.staffName || 'Unknown'}</p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          {pattern.type === 'consecutive_late' 
                            ? `${pattern.consecutiveCount} consecutive late arrivals`
                            : `${pattern.consecutiveCount} consecutive early departures`
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-center whitespace-nowrap ${
                      pattern.type === 'consecutive_late' 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {pattern.type === 'consecutive_late' ? 'Late Pattern' : 'Early Pattern'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Alerts */}
          {((!Array.isArray(analytics?.analytics?.excessiveOvertime) || analytics.analytics.excessiveOvertime.length === 0) && 
            (!Array.isArray(analytics?.analytics?.patterns) || analytics.analytics.patterns.length === 0)) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-500 text-xl sm:text-2xl"></i>
              </div>
              <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">No Alerts</h4>
              <p className="text-slate-500 text-sm">No concerning patterns or excessive overtime detected for this period.</p>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {analytics?.generatedAt && (
        <div className="text-center text-xs text-slate-400">
          Last updated: {new Date(analytics.generatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <i className={`fas fa-${icon}`} style={{ color }}></i>
      </div>
    </div>
  </div>
);

export default StaffAnalyticsSection;

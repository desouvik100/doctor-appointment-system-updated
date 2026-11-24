import { useState, useEffect } from 'react';
import axios from '../../api/config';
import toast from 'react-hot-toast';

const AuditLogSection = ({ clinicId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    entityType: '', action: '', userId: '', severity: '', startDate: '', endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { fetchLogs(); fetchStats(); }, [clinicId, filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        clinicId,
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };
      const res = await axios.get('/api/audit-logs', { params });
      setLogs(res.data.logs || []);
      setPagination(prev => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (err) { console.error(err); toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`/api/audit-logs/stats/${clinicId}`);
      setStats(res.data.stats || {});
    } catch (err) { console.error(err); }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting logs...', { id: 'export' });
      const res = await axios.get(`/api/audit-logs/export/${clinicId}`, {
        params: filters,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Logs exported', { id: 'export' });
    } catch (err) { toast.error('Export failed', { id: 'export' }); }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      low: 'bg-slate-100 text-slate-600',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-amber-100 text-amber-700',
      critical: 'bg-red-100 text-red-700'
    };
    return badges[severity] || 'bg-slate-100 text-slate-600';
  };

  const getActionIcon = (action) => {
    const icons = {
      create: 'fa-plus-circle text-emerald-500',
      update: 'fa-edit text-blue-500',
      delete: 'fa-trash text-red-500',
      view: 'fa-eye text-slate-500',
      login: 'fa-sign-in-alt text-indigo-500',
      logout: 'fa-sign-out-alt text-slate-500',
      admit: 'fa-user-plus text-blue-500',
      discharge: 'fa-user-check text-emerald-500',
      lock: 'fa-lock text-amber-500',
      sign: 'fa-signature text-purple-500',
      transfer: 'fa-exchange-alt text-indigo-500'
    };
    return icons[action] || 'fa-circle text-slate-400';
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && logs.length === 0) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Logs', value: stats.totalLogs || 0, icon: 'fa-list', color: 'slate' },
          { label: 'Today', value: stats.todayLogs || 0, icon: 'fa-calendar-day', color: 'blue' },
          { label: 'Critical', value: stats.criticalLogs || 0, icon: 'fa-exclamation-triangle', color: 'red' },
          { label: 'Active Users', value: stats.activeUsers || 0, icon: 'fa-users', color: 'emerald' }
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
            <i className={`fas ${stat.icon} text-${stat.color}-500 mb-2`}></i>
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <i className="fas fa-history text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Audit Logs</h2>
              <p className="text-sm text-slate-500">Track all system activities for compliance</p>
            </div>
          </div>
          <button onClick={handleExport} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg">
            <i className="fas fa-download mr-2"></i>Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <select value={filters.entityType} onChange={(e) => setFilters({...filters, entityType: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
            <option value="">All Entities</option>
            <option value="patient">Patient</option>
            <option value="appointment">Appointment</option>
            <option value="prescription">Prescription</option>
            <option value="admission">Admission</option>
            <option value="bill">Bill</option>
            <option value="lab_report">Lab Report</option>
          </select>
          <select value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="view">View</option>
            <option value="admit">Admit</option>
            <option value="discharge">Discharge</option>
            <option value="lock">Lock</option>
            <option value="sign">Sign</option>
          </select>
          <select value={filters.severity} onChange={(e) => setFilters({...filters, severity: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
            <option value="">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Start Date" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" placeholder="End Date" />
          <button onClick={() => setFilters({ entityType: '', action: '', userId: '', severity: '', startDate: '', endDate: '' })} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200">
            <i className="fas fa-times mr-1"></i>Clear
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Action</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Entity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{log.userName}</p>
                    <p className="text-xs text-slate-500">{log.userRole}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <i className={`fas ${getActionIcon(log.action)}`}></i>
                      <span className="capitalize">{log.action}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm capitalize">{log.entityType}</span>
                    {log.entityName && <p className="text-xs text-slate-500 mt-1">{log.entityName}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{log.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedLog(log)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-center py-8 text-slate-500">No audit logs found</p>}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">Showing {logs.length} of {pagination.total} logs</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination(p => ({...p, page: p.page - 1}))} disabled={pagination.page === 1} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50">
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="px-3 py-1 text-sm">{pagination.page} / {totalPages}</span>
              <button onClick={() => setPagination(p => ({...p, page: p.page + 1}))} disabled={pagination.page >= totalPages} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Severity</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(selectedLog.severity)}`}>
                    {selectedLog.severity}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">User</p>
                  <p className="font-medium">{selectedLog.userName}</p>
                  <p className="text-sm text-slate-500">{selectedLog.userRole}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Action</p>
                  <p className="font-medium capitalize flex items-center gap-2">
                    <i className={`fas ${getActionIcon(selectedLog.action)}`}></i>
                    {selectedLog.action}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Entity</p>
                <p className="font-medium capitalize">{selectedLog.entityType}</p>
                {selectedLog.entityName && <p className="text-sm text-slate-600">{selectedLog.entityName}</p>}
                {selectedLog.entityId && <p className="text-xs text-slate-400 font-mono">{selectedLog.entityId}</p>}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500">Description</p>
                <p className="text-slate-800">{selectedLog.description}</p>
              </div>
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-2">Changes</p>
                  <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">IP Address</p>
                  <p className="font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">User Agent</p>
                  <p className="text-xs truncate">{selectedLog.userAgent || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogSection;

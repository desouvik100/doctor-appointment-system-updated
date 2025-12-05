import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const LabReports = ({ userId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [newReport, setNewReport] = useState({
    reportType: 'Blood Test',
    testName: '',
    labName: '',
    reportDate: new Date().toISOString().split('T')[0],
    results: [],
    notes: ''
  });

  const reportTypes = ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'ECG', 'Other'];

  useEffect(() => { fetchReports(); }, [userId]);

  const fetchReports = async () => {
    try { const response = await axios.get(`/api/lab-reports/user/${userId}`); setReports(response.data); }
    catch (error) { console.error('Error fetching reports:', error); }
    finally { setLoading(false); }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/lab-reports', { ...newReport, userId });
      toast.success('Lab report added successfully!');
      setShowAddModal(false);
      setNewReport({ reportType: 'Blood Test', testName: '', labName: '', reportDate: new Date().toISOString().split('T')[0], results: [], notes: '' });
      fetchReports();
    } catch { toast.error('Failed to add report'); }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try { await axios.delete(`/api/lab-reports/${reportId}`); toast.success('Report deleted'); fetchReports(); }
    catch { toast.error('Failed to delete report'); }
  };

  const filteredReports = filterType ? reports.filter(r => r.reportType === filterType) : reports;

  const getStatusColor = (status) => {
    const colors = { Normal: 'text-emerald-600 bg-emerald-100', Low: 'text-amber-600 bg-amber-100', High: 'text-red-600 bg-red-100', Critical: 'text-red-700 bg-red-200' };
    return colors[status] || 'text-slate-600 bg-slate-100';
  };

  const getReportIcon = (type) => {
    const icons = { 'Blood Test': 'fa-tint', 'Urine Test': 'fa-flask', 'X-Ray': 'fa-x-ray', 'MRI': 'fa-brain', 'CT Scan': 'fa-radiation', 'Ultrasound': 'fa-wave-square', 'ECG': 'fa-heartbeat' };
    return icons[type] || 'fa-file-medical';
  };

  const getReportGradient = (type) => {
    const gradients = { 'Blood Test': 'from-red-500 to-rose-600', 'Urine Test': 'from-amber-500 to-orange-600', 'X-Ray': 'from-slate-500 to-slate-600', 'MRI': 'from-purple-500 to-violet-600', 'CT Scan': 'from-cyan-500 to-blue-600', 'Ultrasound': 'from-teal-500 to-emerald-600', 'ECG': 'from-pink-500 to-rose-600' };
    return gradients[type] || 'from-indigo-500 to-purple-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Loading lab reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-flask text-indigo-500"></i> Lab Reports
        </h2>
        <div className="flex gap-3">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {reportTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Add Report
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <i className="fas fa-file-medical-alt text-3xl text-slate-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No lab reports found</h3>
          <p className="text-slate-500 mb-6">Upload your lab reports to keep track of your health</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Add Your First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <div 
              key={report._id} 
              onClick={() => setSelectedReport(report)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getReportGradient(report.reportType)} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                  <i className={`fas ${getReportIcon(report.reportType)} text-white text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{report.reportType}</span>
                  <h3 className="font-bold text-slate-800 mt-1 truncate">{report.testName}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <i className="fas fa-hospital text-xs"></i> {report.labName}
                  </p>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <i className="fas fa-calendar text-xs"></i> {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteReport(report._id); }}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              </div>
              {report.results?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                  {report.results.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{r.parameter}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                        {r.value} {r.unit}
                      </span>
                    </div>
                  ))}
                  {report.results.length > 2 && (
                    <p className="text-xs text-indigo-500 font-medium">+{report.results.length - 2} more results</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-plus-circle text-indigo-500"></i> Add Lab Report
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <i className="fas fa-times text-slate-500"></i>
              </button>
            </div>
            <form onSubmit={handleAddReport} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                <select 
                  value={newReport.reportType}
                  onChange={(e) => setNewReport({...newReport, reportType: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {reportTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Name</label>
                <input 
                  type="text"
                  value={newReport.testName}
                  onChange={(e) => setNewReport({...newReport, testName: e.target.value})}
                  placeholder="e.g., Complete Blood Count (CBC)"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lab Name</label>
                <input 
                  type="text"
                  value={newReport.labName}
                  onChange={(e) => setNewReport({...newReport, labName: e.target.value})}
                  placeholder="e.g., Apollo Diagnostics"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Date</label>
                <input 
                  type="date"
                  value={newReport.reportDate}
                  onChange={(e) => setNewReport({...newReport, reportDate: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                <textarea 
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                  <i className="fas fa-save mr-2"></i> Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${getReportGradient(selectedReport.reportType)} p-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <i className={`fas ${getReportIcon(selectedReport.reportType)} text-white text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedReport.testName}</h3>
                    <p className="text-white/80 text-sm">{selectedReport.reportType}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center">
                  <i className="fas fa-times text-white"></i>
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Lab</p>
                  <p className="font-semibold text-slate-800">{selectedReport.labName}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="font-semibold text-slate-800">{new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedReport.doctorRemarks && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Doctor's Remarks</p>
                  <p className="text-slate-700">{selectedReport.doctorRemarks}</p>
                </div>
              )}
              {selectedReport.results?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3">Test Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left p-3 font-semibold text-slate-600 rounded-tl-xl">Parameter</th>
                          <th className="text-left p-3 font-semibold text-slate-600">Value</th>
                          <th className="text-left p-3 font-semibold text-slate-600">Normal Range</th>
                          <th className="text-left p-3 font-semibold text-slate-600 rounded-tr-xl">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.results.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="p-3 text-slate-800">{r.parameter}</td>
                            <td className="p-3 text-slate-800 font-medium">{r.value} {r.unit}</td>
                            <td className="p-3 text-slate-500">{r.normalRange}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {selectedReport.notes && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-2">Notes</h4>
                  <p className="text-slate-600">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabReports;

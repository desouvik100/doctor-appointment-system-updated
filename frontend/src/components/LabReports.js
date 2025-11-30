import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import './LabReports.css';

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

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`/api/lab-reports/user/${userId}`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/lab-reports', { ...newReport, userId });
      toast.success('Lab report added successfully!');
      setShowAddModal(false);
      setNewReport({
        reportType: 'Blood Test',
        testName: '',
        labName: '',
        reportDate: new Date().toISOString().split('T')[0],
        results: [],
        notes: ''
      });
      fetchReports();
    } catch (error) {
      toast.error('Failed to add report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`/api/lab-reports/${reportId}`);
      toast.success('Report deleted');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const filteredReports = filterType 
    ? reports.filter(r => r.reportType === filterType)
    : reports;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return '#10b981';
      case 'Low': return '#f59e0b';
      case 'High': return '#ef4444';
      case 'Critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'Blood Test': return 'fa-tint';
      case 'Urine Test': return 'fa-flask';
      case 'X-Ray': return 'fa-x-ray';
      case 'MRI': return 'fa-brain';
      case 'CT Scan': return 'fa-radiation';
      case 'Ultrasound': return 'fa-wave-square';
      case 'ECG': return 'fa-heartbeat';
      default: return 'fa-file-medical';
    }
  };

  if (loading) {
    return (
      <div className="lab-reports__loading">
        <div className="lab-reports__spinner"></div>
        <p>Loading lab reports...</p>
      </div>
    );
  }

  return (
    <div className="lab-reports">
      <div className="lab-reports__header">
        <h2><i className="fas fa-flask"></i> Lab Reports</h2>
        <div className="lab-reports__actions">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="lab-reports__filter"
          >
            <option value="">All Types</option>
            {reportTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button className="lab-reports__add-btn" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add Report
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="lab-reports__empty">
          <i className="fas fa-file-medical-alt"></i>
          <h3>No lab reports found</h3>
          <p>Upload your lab reports to keep track of your health</p>
          <button onClick={() => setShowAddModal(true)}>
            <i className="fas fa-plus"></i> Add Your First Report
          </button>
        </div>
      ) : (
        <div className="lab-reports__grid">
          {filteredReports.map(report => (
            <div key={report._id} className="lab-report-card" onClick={() => setSelectedReport(report)}>
              <div className="lab-report-card__icon">
                <i className={`fas ${getReportIcon(report.reportType)}`}></i>
              </div>
              <div className="lab-report-card__content">
                <span className="lab-report-card__type">{report.reportType}</span>
                <h3>{report.testName}</h3>
                <p className="lab-report-card__lab">
                  <i className="fas fa-hospital"></i> {report.labName}
                </p>
                <p className="lab-report-card__date">
                  <i className="fas fa-calendar"></i> {new Date(report.reportDate).toLocaleDateString()}
                </p>
                {report.results?.length > 0 && (
                  <div className="lab-report-card__summary">
                    {report.results.slice(0, 2).map((r, i) => (
                      <span key={i} style={{ color: getStatusColor(r.status) }}>
                        {r.parameter}: {r.value} {r.unit}
                      </span>
                    ))}
                    {report.results.length > 2 && (
                      <span className="lab-report-card__more">+{report.results.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
              <button 
                className="lab-report-card__delete"
                onClick={(e) => { e.stopPropagation(); handleDeleteReport(report._id); }}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Report Modal */}
      {showAddModal && (
        <div className="lab-reports__modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="lab-reports__modal" onClick={e => e.stopPropagation()}>
            <div className="lab-reports__modal-header">
              <h3><i className="fas fa-plus-circle"></i> Add Lab Report</h3>
              <button onClick={() => setShowAddModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAddReport}>
              <div className="lab-reports__form-group">
                <label>Report Type</label>
                <select 
                  value={newReport.reportType}
                  onChange={(e) => setNewReport({...newReport, reportType: e.target.value})}
                  required
                >
                  {reportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="lab-reports__form-group">
                <label>Test Name</label>
                <input 
                  type="text"
                  value={newReport.testName}
                  onChange={(e) => setNewReport({...newReport, testName: e.target.value})}
                  placeholder="e.g., Complete Blood Count (CBC)"
                  required
                />
              </div>
              <div className="lab-reports__form-group">
                <label>Lab Name</label>
                <input 
                  type="text"
                  value={newReport.labName}
                  onChange={(e) => setNewReport({...newReport, labName: e.target.value})}
                  placeholder="e.g., Apollo Diagnostics"
                  required
                />
              </div>
              <div className="lab-reports__form-group">
                <label>Report Date</label>
                <input 
                  type="date"
                  value={newReport.reportDate}
                  onChange={(e) => setNewReport({...newReport, reportDate: e.target.value})}
                  required
                />
              </div>
              <div className="lab-reports__form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
              <div className="lab-reports__form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="lab-reports__submit-btn">
                  <i className="fas fa-save"></i> Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="lab-reports__modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="lab-reports__modal lab-reports__modal--detail" onClick={e => e.stopPropagation()}>
            <div className="lab-reports__modal-header">
              <h3><i className={`fas ${getReportIcon(selectedReport.reportType)}`}></i> {selectedReport.testName}</h3>
              <button onClick={() => setSelectedReport(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="lab-reports__detail">
              <div className="lab-reports__detail-info">
                <p><strong>Type:</strong> {selectedReport.reportType}</p>
                <p><strong>Lab:</strong> {selectedReport.labName}</p>
                <p><strong>Date:</strong> {new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                {selectedReport.doctorRemarks && (
                  <p><strong>Doctor's Remarks:</strong> {selectedReport.doctorRemarks}</p>
                )}
              </div>
              {selectedReport.results?.length > 0 && (
                <div className="lab-reports__results">
                  <h4>Test Results</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Normal Range</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.results.map((r, i) => (
                        <tr key={i}>
                          <td>{r.parameter}</td>
                          <td>{r.value} {r.unit}</td>
                          <td>{r.normalRange}</td>
                          <td style={{ color: getStatusColor(r.status) }}>{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedReport.notes && (
                <div className="lab-reports__notes">
                  <h4>Notes</h4>
                  <p>{selectedReport.notes}</p>
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

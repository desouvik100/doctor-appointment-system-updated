import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import FamilyMembers from './FamilyMembers';
import './HealthProfile.css';

const HealthProfile = ({ userId }) => {
  const [activeSection, setActiveSection] = useState('medical');
  const [medicalHistory, setMedicalHistory] = useState({
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    emergencyContact: { name: '', phone: '', relationship: '' }
  });
  const [healthReports, setHealthReports] = useState([]);
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: true,
    reminderHoursBefore: 24
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [medRes, reportsRes, notifRes] = await Promise.all([
        axios.get(`/api/health/medical-history/${userId}`),
        axios.get(`/api/health/reports/${userId}`),
        axios.get(`/api/health/notifications/${userId}`)
      ]);
      setMedicalHistory(medRes.data || {});
      setHealthReports(reportsRes.data || []);
      setNotifications(notifRes.data || {});
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMedicalHistory = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/health/medical-history/${userId}`, medicalHistory);
      toast.success('Medical history saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/health/notifications/${userId}`, notifications);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addReport = async () => {
    const name = prompt('Enter report name:');
    if (!name) return;
    
    const type = prompt('Enter type (lab_report, xray, mri, prescription, other):') || 'other';
    
    try {
      await axios.post(`/api/health/reports/${userId}`, { name, type });
      toast.success('Report added');
      fetchData();
    } catch (error) {
      toast.error('Failed to add report');
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await axios.delete(`/api/health/reports/${userId}/${reportId}`);
      toast.success('Report deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="health-profile__loading"><i className="fas fa-spinner fa-spin"></i> Loading...</div>;
  }

  return (
    <div className="health-profile">
      <div className="health-profile__tabs">
        <button 
          className={activeSection === 'medical' ? 'active' : ''}
          onClick={() => setActiveSection('medical')}
        >
          <i className="fas fa-heartbeat"></i> Medical History
        </button>
        <button 
          className={activeSection === 'family' ? 'active' : ''}
          onClick={() => setActiveSection('family')}
        >
          <i className="fas fa-users"></i> Family Members
        </button>
        <button 
          className={activeSection === 'reports' ? 'active' : ''}
          onClick={() => setActiveSection('reports')}
        >
          <i className="fas fa-file-medical"></i> Health Reports
        </button>
        <button 
          className={activeSection === 'settings' ? 'active' : ''}
          onClick={() => setActiveSection('settings')}
        >
          <i className="fas fa-cog"></i> Settings
        </button>
      </div>

      <div className="health-profile__content">
        {activeSection === 'medical' && (
          <div className="health-profile__section">
            <h3><i className="fas fa-heartbeat"></i> Medical History</h3>
            
            <div className="health-profile__form">
              <div className="health-profile__field">
                <label>Blood Group</label>
                <select 
                  value={medicalHistory.bloodGroup || ''} 
                  onChange={(e) => setMedicalHistory({...medicalHistory, bloodGroup: e.target.value})}
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="health-profile__field health-profile__full">
                <label>Allergies (comma separated)</label>
                <input 
                  type="text"
                  value={medicalHistory.allergies?.join(', ') || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    allergies: e.target.value.split(',').map(a => a.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Penicillin, Peanuts, Dust"
                />
              </div>

              <div className="health-profile__field health-profile__full">
                <label>Chronic Conditions</label>
                <input 
                  type="text"
                  value={medicalHistory.chronicConditions?.join(', ') || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    chronicConditions: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Diabetes, Hypertension"
                />
              </div>

              <div className="health-profile__field health-profile__full">
                <label>Current Medications</label>
                <input 
                  type="text"
                  value={medicalHistory.currentMedications?.join(', ') || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    currentMedications: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                  })}
                  placeholder="e.g., Metformin 500mg, Aspirin"
                />
              </div>

              <h4>Emergency Contact</h4>
              <div className="health-profile__field">
                <label>Name</label>
                <input 
                  type="text"
                  value={medicalHistory.emergencyContact?.name || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, name: e.target.value}
                  })}
                />
              </div>
              <div className="health-profile__field">
                <label>Phone</label>
                <input 
                  type="tel"
                  value={medicalHistory.emergencyContact?.phone || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, phone: e.target.value}
                  })}
                />
              </div>
              <div className="health-profile__field">
                <label>Relationship</label>
                <input 
                  type="text"
                  value={medicalHistory.emergencyContact?.relationship || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, relationship: e.target.value}
                  })}
                />
              </div>

              <button className="health-profile__save" onClick={saveMedicalHistory} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'family' && (
          <FamilyMembers userId={userId} />
        )}

        {activeSection === 'reports' && (
          <div className="health-profile__section">
            <div className="health-profile__section-header">
              <h3><i className="fas fa-file-medical"></i> Health Reports</h3>
              <button className="health-profile__add-btn" onClick={addReport}>
                <i className="fas fa-plus"></i> Add Report
              </button>
            </div>

            {healthReports.length === 0 ? (
              <div className="health-profile__empty">
                <i className="fas fa-folder-open"></i>
                <p>No health reports uploaded</p>
                <span>Upload lab reports, X-rays, prescriptions etc.</span>
              </div>
            ) : (
              <div className="health-profile__reports">
                {healthReports.map((report) => (
                  <div key={report._id} className="health-profile__report">
                    <div className="health-profile__report-icon">
                      <i className={`fas fa-${report.type === 'xray' ? 'x-ray' : report.type === 'prescription' ? 'prescription' : 'file-medical'}`}></i>
                    </div>
                    <div className="health-profile__report-info">
                      <h4>{report.name}</h4>
                      <span>{report.type} • {new Date(report.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => deleteReport(report._id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="health-profile__section">
            <h3><i className="fas fa-bell"></i> Notification Preferences</h3>
            
            <div className="health-profile__settings">
              <label className="health-profile__toggle">
                <input 
                  type="checkbox"
                  checked={notifications.emailReminders}
                  onChange={(e) => setNotifications({...notifications, emailReminders: e.target.checked})}
                />
                <span className="health-profile__toggle-slider"></span>
                <span>Email Reminders</span>
              </label>

              <label className="health-profile__toggle">
                <input 
                  type="checkbox"
                  checked={notifications.smsReminders}
                  onChange={(e) => setNotifications({...notifications, smsReminders: e.target.checked})}
                />
                <span className="health-profile__toggle-slider"></span>
                <span>SMS Reminders</span>
              </label>

              <div className="health-profile__field">
                <label>Remind me before appointment</label>
                <select 
                  value={notifications.reminderHoursBefore}
                  onChange={(e) => setNotifications({...notifications, reminderHoursBefore: parseInt(e.target.value)})}
                >
                  <option value={1}>1 hour before</option>
                  <option value={2}>2 hours before</option>
                  <option value={6}>6 hours before</option>
                  <option value={12}>12 hours before</option>
                  <option value={24}>24 hours before</option>
                  <option value={48}>48 hours before</option>
                </select>
              </div>

              <button className="health-profile__save" onClick={saveNotifications} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Preferences</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthProfile;

import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';
import FamilyMembers from './FamilyMembers';

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

  useEffect(() => { fetchData(); }, [userId]);

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
    } catch (error) { console.error('Error fetching health data:', error); }
    finally { setLoading(false); }
  };

  const saveMedicalHistory = async () => {
    setSaving(true);
    try { await axios.put(`/api/health/medical-history/${userId}`, medicalHistory); toast.success('Medical history saved'); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const saveNotifications = async () => {
    setSaving(true);
    try { await axios.put(`/api/health/notifications/${userId}`, notifications); toast.success('Preferences saved'); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const addReport = async () => {
    const name = prompt('Enter report name:');
    if (!name) return;
    const type = prompt('Enter type (lab_report, xray, mri, prescription, other):') || 'other';
    try { await axios.post(`/api/health/reports/${userId}`, { name, type }); toast.success('Report added'); fetchData(); }
    catch { toast.error('Failed to add report'); }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    try { await axios.delete(`/api/health/reports/${userId}/${reportId}`); toast.success('Report deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Loading health profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'medical', icon: 'fa-heartbeat', label: 'Medical History' },
    { id: 'family', icon: 'fa-users', label: 'Family Members' },
    { id: 'reports', icon: 'fa-file-medical', label: 'Health Reports' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${activeSection === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Medical History */}
      {activeSection === 'medical' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-heartbeat text-rose-500"></i> Medical History
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
              <select 
                value={medicalHistory.bloodGroup || ''} 
                onChange={(e) => setMedicalHistory({...medicalHistory, bloodGroup: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Allergies (comma separated)</label>
              <input 
                type="text"
                value={medicalHistory.allergies?.join(', ') || ''}
                onChange={(e) => setMedicalHistory({
                  ...medicalHistory, 
                  allergies: e.target.value.split(',').map(a => a.trim()).filter(Boolean)
                })}
                placeholder="e.g., Penicillin, Peanuts, Dust"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Chronic Conditions</label>
              <input 
                type="text"
                value={medicalHistory.chronicConditions?.join(', ') || ''}
                onChange={(e) => setMedicalHistory({
                  ...medicalHistory, 
                  chronicConditions: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                })}
                placeholder="e.g., Diabetes, Hypertension"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Medications</label>
              <input 
                type="text"
                value={medicalHistory.currentMedications?.join(', ') || ''}
                onChange={(e) => setMedicalHistory({
                  ...medicalHistory, 
                  currentMedications: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                })}
                placeholder="e.g., Metformin 500mg, Aspirin"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-phone-alt text-emerald-500"></i> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input 
                  type="text"
                  value={medicalHistory.emergencyContact?.name || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, name: e.target.value}
                  })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input 
                  type="tel"
                  value={medicalHistory.emergencyContact?.phone || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, phone: e.target.value}
                  })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Relationship</label>
                <input 
                  type="text"
                  value={medicalHistory.emergencyContact?.relationship || ''}
                  onChange={(e) => setMedicalHistory({
                    ...medicalHistory, 
                    emergencyContact: {...medicalHistory.emergencyContact, relationship: e.target.value}
                  })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={saveMedicalHistory} 
            disabled={saving}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : <><i className="fas fa-save mr-2"></i> Save Changes</>}
          </button>
        </div>
      )}

      {/* Family Members */}
      {activeSection === 'family' && <FamilyMembers userId={userId} />}

      {/* Health Reports */}
      {activeSection === 'reports' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fas fa-file-medical text-blue-500"></i> Health Reports
            </h3>
            <button 
              onClick={addReport}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
            >
              <i className="fas fa-plus mr-2"></i> Add Report
            </button>
          </div>

          {healthReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <i className="fas fa-folder-open text-3xl text-slate-400"></i>
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">No health reports uploaded</h4>
              <p className="text-slate-500 text-sm">Upload lab reports, X-rays, prescriptions etc.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthReports.map((report) => (
                <div key={report._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <i className={`fas fa-${report.type === 'xray' ? 'x-ray' : report.type === 'prescription' ? 'prescription' : 'file-medical'} text-white`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800">{report.name}</h4>
                    <p className="text-sm text-slate-500">{report.type} • {new Date(report.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => deleteReport(report._id)}
                    className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-bell text-amber-500"></i> Notification Preferences
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-500"></i>
                </div>
                <span className="font-medium text-slate-700">Email Reminders</span>
              </div>
              <div className="relative">
                <input 
                  type="checkbox"
                  checked={notifications.emailReminders}
                  onChange={(e) => setNotifications({...notifications, emailReminders: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-checked:bg-indigo-500 rounded-full transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-sms text-emerald-500"></i>
                </div>
                <span className="font-medium text-slate-700">SMS Reminders</span>
              </div>
              <div className="relative">
                <input 
                  type="checkbox"
                  checked={notifications.smsReminders}
                  onChange={(e) => setNotifications({...notifications, smsReminders: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-checked:bg-indigo-500 rounded-full transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>

            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 mb-2">Remind me before appointment</label>
              <select 
                value={notifications.reminderHoursBefore}
                onChange={(e) => setNotifications({...notifications, reminderHoursBefore: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 hour before</option>
                <option value={2}>2 hours before</option>
                <option value={6}>6 hours before</option>
                <option value={12}>12 hours before</option>
                <option value={24}>24 hours before</option>
                <option value={48}>48 hours before</option>
              </select>
            </div>

            <button 
              onClick={saveNotifications} 
              disabled={saving}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : <><i className="fas fa-save mr-2"></i> Save Preferences</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthProfile;

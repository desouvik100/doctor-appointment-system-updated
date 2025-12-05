import { useState, useEffect } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const EmailReminders = ({ userId, userEmail }) => {
  const [preferences, setPreferences] = useState({
    emailReminders: true,
    appointmentReminders: true,
    medicineReminders: true,
    waterReminders: false,
    healthCheckupReminders: true,
    reminderHoursBefore: 24
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(null);

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(`/api/reminders/preferences/${userId}`);
      if (response.data.success) {
        setPreferences(prev => ({ ...prev, ...response.data.preferences }));
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/reminders/preferences/${userId}`, { preferences });
      toast.success('Reminder preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const sendTestReminder = async (type) => {
    setSendingTest(type);
    try {
      const response = await axios.post(`/api/reminders/test/${type}/${userId}`);
      if (response.data.success) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} reminder sent to ${userEmail}!`);
      } else {
        toast.error(response.data.message || 'Failed to send reminder');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test reminder');
    } finally {
      setSendingTest(null);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const reminderTypes = [
    {
      key: 'appointmentReminders',
      icon: 'fa-calendar-check',
      title: 'Appointment Reminders',
      description: 'Get email reminders before your scheduled appointments',
      color: 'indigo',
      testType: 'appointment'
    },
    {
      key: 'medicineReminders',
      icon: 'fa-pills',
      title: 'Medicine Reminders',
      description: 'Daily reminders to take your prescribed medicines',
      color: 'emerald',
      testType: 'medicine'
    },
    {
      key: 'waterReminders',
      icon: 'fa-tint',
      title: 'Hydration Reminders',
      description: 'Periodic reminders to drink water and stay hydrated',
      color: 'blue',
      testType: 'water'
    },
    {
      key: 'healthCheckupReminders',
      icon: 'fa-stethoscope',
      title: 'Health Checkup Reminders',
      description: 'Reminders for annual health checkups and screenings',
      color: 'purple',
      testType: 'checkup'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className="fas fa-envelope text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">Email Reminders</h2>
            <p className="text-indigo-100">Manage your health reminder notifications</p>
          </div>
        </div>
      </div>

      {/* Email Display */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <i className="fas fa-at text-slate-600"></i>
          </div>
          <div>
            <p className="text-sm text-slate-500">Reminders will be sent to:</p>
            <p className="font-semibold text-slate-800">{userEmail}</p>
          </div>
        </div>
        
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-medium text-slate-800">Enable Email Reminders</p>
            <p className="text-sm text-slate-500">Turn on/off all email notifications</p>
          </div>
          <button
            onClick={() => togglePreference('emailReminders')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              preferences.emailReminders ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              preferences.emailReminders ? 'left-8' : 'left-1'
            }`}></span>
          </button>
        </div>
      </div>

      {/* Reminder Types */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Reminder Types</h3>
        <div className="space-y-4">
          {reminderTypes.map(reminder => (
            <div key={reminder.key} className={`p-4 rounded-xl border-2 transition-all ${
              preferences[reminder.key] && preferences.emailReminders
                ? `border-${reminder.color}-200 bg-${reminder.color}-50`
                : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    preferences[reminder.key] && preferences.emailReminders
                      ? `bg-${reminder.color}-500 text-white`
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    <i className={`fas ${reminder.icon}`}></i>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{reminder.title}</p>
                    <p className="text-sm text-slate-500">{reminder.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference(reminder.key)}
                  disabled={!preferences.emailReminders}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences[reminder.key] && preferences.emailReminders
                      ? 'bg-indigo-600'
                      : 'bg-slate-300'
                  } ${!preferences.emailReminders ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    preferences[reminder.key] ? 'left-6' : 'left-0.5'
                  }`}></span>
                </button>
              </div>
              
              {/* Test Button */}
              {preferences[reminder.key] && preferences.emailReminders && (
                <button
                  onClick={() => sendTestReminder(reminder.testType)}
                  disabled={sendingTest === reminder.testType}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  {sendingTest === reminder.testType ? (
                    <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Send Test Email</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Timing */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Reminder Timing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Send appointment reminders before:
            </label>
            <select
              value={preferences.reminderHoursBefore}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                reminderHoursBefore: parseInt(e.target.value) 
              }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value={1}>1 hour before</option>
              <option value={2}>2 hours before</option>
              <option value={6}>6 hours before</option>
              <option value={12}>12 hours before</option>
              <option value={24}>24 hours before</option>
              <option value={48}>48 hours before</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
      >
        {saving ? (
          <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</>
        ) : (
          <><i className="fas fa-save mr-2"></i> Save Preferences</>
        )}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">About Email Reminders</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Appointment reminders are sent based on your timing preference</li>
              <li>Medicine reminders are sent daily at your scheduled times</li>
              <li>Water reminders are sent every 2 hours during daytime</li>
              <li>Health checkup reminders are sent annually</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailReminders;

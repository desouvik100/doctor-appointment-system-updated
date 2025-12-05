import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

const MedicineReminder = ({ userId }) => {
  const [medicines, setMedicines] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [todayReminders, setTodayReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', frequency: 'daily', times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', notes: '', color: '#6366f1', emailReminders: true
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice', label: 'Twice a day' },
    { value: 'thrice', label: 'Three times a day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'asNeeded', label: 'As needed' }
  ];
  const colorOptions = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const fetchMedicines = useCallback(async () => {
    try { const r = await axios.get(`/api/medicines/user/${userId}`); setMedicines(r.data); }
    catch { console.error('Error fetching medicines'); }
  }, [userId]);

  const fetchTodayReminders = useCallback(async () => {
    try { const r = await axios.get(`/api/medicines/user/${userId}/today`); setTodayReminders(r.data); }
    catch { buildLocalReminders(); }
    finally { setLoading(false); }
  }, [userId]);

  const buildLocalReminders = () => {
    const reminders = [];
    medicines.forEach(med => {
      if (med.frequency !== 'asNeeded') {
        (med.times || []).forEach(time => {
          reminders.push({ medicineId: med._id || med.id, name: med.name, dosage: med.dosage, time, color: med.color, taken: false });
        });
      }
    });
    reminders.sort((a, b) => a.time.localeCompare(b.time));
    setTodayReminders(reminders);
  };

  useEffect(() => { fetchMedicines(); fetchTodayReminders(); const interval = setInterval(fetchTodayReminders, 60000); return () => clearInterval(interval); }, [fetchMedicines, fetchTodayReminders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') toast.success('Browser notifications enabled!');
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage) { toast.error('Name and dosage are required'); return; }
    try {
      const r = await axios.post('/api/medicines', { userId, ...newMedicine });
      setMedicines([r.data, ...medicines]);
      setNewMedicine({ name: '', dosage: '', frequency: 'daily', times: ['08:00'], startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '', color: '#6366f1', emailReminders: true });
      setShowAddForm(false);
      toast.success('Medicine added! Email reminders will be sent at scheduled times.');
      fetchTodayReminders();
    } catch { toast.error('Failed to add medicine'); }
  };

  const handleDeleteMedicine = async (id) => {
    try { await axios.delete(`/api/medicines/${id}`); setMedicines(medicines.filter(m => (m._id || m.id) !== id)); toast.success('Medicine removed'); fetchTodayReminders(); }
    catch { toast.error('Failed to delete medicine'); }
  };

  const markAsTaken = async (reminder) => {
    try {
      await axios.post(`/api/medicines/${reminder.medicineId}/taken`, { time: reminder.time });
      setTodayReminders(prev => prev.map(r => r.medicineId === reminder.medicineId && r.time === reminder.time ? { ...r, taken: true } : r));
      toast.success(`${reminder.name} marked as taken ✓`);
    } catch { toast.error('Failed to mark as taken'); }
  };

  const toggleEmailReminders = async (medicineId, enabled) => {
    try {
      await axios.put(`/api/medicines/${medicineId}/email-reminders`, { enabled });
      setMedicines(prev => prev.map(m => (m._id || m.id) === medicineId ? { ...m, emailReminders: enabled } : m));
      toast.success(`Email reminders ${enabled ? 'enabled' : 'disabled'}`);
    } catch { console.error('Error toggling email reminders'); }
  };

  const updateTimes = (index, value) => { const newTimes = [...newMedicine.times]; newTimes[index] = value; setNewMedicine({ ...newMedicine, times: newTimes }); };
  const addTimeSlot = () => setNewMedicine({ ...newMedicine, times: [...newMedicine.times, '12:00'] });
  const removeTimeSlot = (index) => setNewMedicine({ ...newMedicine, times: newMedicine.times.filter((_, i) => i !== index) });

  const getProgress = () => todayReminders.length === 0 ? 100 : Math.round((todayReminders.filter(r => r.taken).length / todayReminders.length) * 100);
  const formatTime = (time) => { if (!time) return ''; const [hours, minutes] = time.split(':'); const hour = parseInt(hours); return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`; };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500">Loading medicines...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Today's Medicines</h3>
          <span className="text-2xl font-bold">{getProgress()}%</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${getProgress()}%` }}></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={requestNotificationPermission} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
            <i className="fas fa-bell"></i> Enable Browser Alerts
          </button>
          <span className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm">
            <i className="fas fa-envelope"></i> Email reminders active
          </span>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-clock text-indigo-500"></i> Today's Schedule
        </h3>
        {todayReminders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No medicines scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayReminders.map((reminder, index) => (
              <div key={`${reminder.medicineId}-${reminder.time}-${index}`}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${reminder.taken ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 hover:bg-indigo-50'}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: reminder.color }}>
                  {formatTime(reminder.time).split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800">{reminder.name}</h4>
                  <p className="text-sm text-slate-500">{reminder.dosage}</p>
                </div>
                {!reminder.taken ? (
                  <button onClick={() => markAsTaken(reminder)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all">
                    <i className="fas fa-check mr-1"></i> Take
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-xl">
                    <i className="fas fa-check-circle"></i> Taken
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Medicines */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-pills text-indigo-500"></i> My Medicines
          </h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:shadow-lg transition-all">
            <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-5 bg-slate-50 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Medicine Name" value={newMedicine.name} onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="Dosage (e.g., 500mg)" value={newMedicine.dosage} onChange={(e) => setNewMedicine({...newMedicine, dosage: e.target.value})}
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={newMedicine.frequency} onChange={(e) => setNewMedicine({...newMedicine, frequency: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reminder Times</label>
              <div className="flex flex-wrap gap-2">
                {newMedicine.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="time" value={time} onChange={(e) => updateTimes(index, e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {newMedicine.times.length > 1 && (
                      <button type="button" onClick={() => removeTimeSlot(index)} className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200">
                        <i className="fas fa-times text-sm"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTimeSlot} className="px-3 py-2 bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors">
                  <i className="fas fa-plus mr-1"></i> Add Time
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
              <div className="flex gap-2">
                {colorOptions.map(color => (
                  <button key={color} type="button" onClick={() => setNewMedicine({...newMedicine, color})}
                    className={`w-8 h-8 rounded-full transition-transform ${newMedicine.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ background: color }} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer">
              <input type="checkbox" checked={newMedicine.emailReminders} onChange={(e) => setNewMedicine({...newMedicine, emailReminders: e.target.checked})} className="w-5 h-5 rounded text-indigo-500" />
              <span className="text-sm text-slate-700">Send email reminders at scheduled times</span>
            </label>
            <textarea placeholder="Notes (optional)" value={newMedicine.notes} onChange={(e) => setNewMedicine({...newMedicine, notes: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} />
            <button onClick={handleAddMedicine} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              <i className="fas fa-save mr-2"></i> Save Medicine
            </button>
          </div>
        )}

        {/* Medicines List */}
        {medicines.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No medicines added yet. Add your first medicine to get reminders!</p>
        ) : (
          <div className="space-y-3">
            {medicines.map(med => (
              <div key={med._id || med.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors">
                <div className="w-2 h-16 rounded-full" style={{ background: med.color }}></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800">{med.name}</h4>
                  <p className="text-sm text-slate-500">{med.dosage}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><i className="fas fa-clock"></i> {frequencyOptions.find(f => f.value === med.frequency)?.label}</span>
                    <span className="flex items-center gap-1"><i className="fas fa-bell"></i> {(med.times || []).map(t => formatTime(t)).join(', ')}</span>
                    <span className={`flex items-center gap-1 ${med.emailReminders ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <i className="fas fa-envelope"></i> {med.emailReminders ? 'Email on' : 'Email off'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleEmailReminders(med._id || med.id, !med.emailReminders)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${med.emailReminders ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    <i className="fas fa-envelope"></i>
                  </button>
                  <button onClick={() => handleDeleteMedicine(med._id || med.id)} className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineReminder;

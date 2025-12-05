import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const HealthAnalytics = ({ userId }) => {
  const [activeMetric, setActiveMetric] = useState('weight');
  const [showAddForm, setShowAddForm] = useState(false);
  const [healthData, setHealthData] = useState({ weight: [], bloodPressure: [], bloodSugar: [], heartRate: [], sleep: [], water: [] });
  const [newEntry, setNewEntry] = useState({ value: '', value2: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), notes: '' });

  const metrics = [
    { id: 'weight', name: 'Weight', unit: 'kg', icon: 'fa-weight', gradient: 'from-indigo-500 to-purple-600', single: true },
    { id: 'bloodPressure', name: 'Blood Pressure', unit: 'mmHg', icon: 'fa-heartbeat', gradient: 'from-red-500 to-rose-600', single: false },
    { id: 'bloodSugar', name: 'Blood Sugar', unit: 'mg/dL', icon: 'fa-tint', gradient: 'from-amber-500 to-orange-600', single: true },
    { id: 'heartRate', name: 'Heart Rate', unit: 'bpm', icon: 'fa-heart', gradient: 'from-pink-500 to-rose-600', single: true },
    { id: 'sleep', name: 'Sleep', unit: 'hours', icon: 'fa-moon', gradient: 'from-violet-500 to-purple-600', single: true },
    { id: 'water', name: 'Water Intake', unit: 'glasses', icon: 'fa-glass-water', gradient: 'from-cyan-500 to-blue-600', single: true }
  ];

  useEffect(() => { loadHealthData(); }, []);

  const loadHealthData = () => { const saved = localStorage.getItem(`health_data_${userId}`); if (saved) setHealthData(JSON.parse(saved)); };
  const saveHealthData = (newData) => { localStorage.setItem(`health_data_${userId}`, JSON.stringify(newData)); setHealthData(newData); };

  const handleAddEntry = () => {
    const metric = metrics.find(m => m.id === activeMetric);
    if (!newEntry.value || (metric && !metric.single && !newEntry.value2)) { toast.error('Please fill in all required fields'); return; }
    const entry = { id: Date.now(), value: parseFloat(newEntry.value), value2: newEntry.value2 ? parseFloat(newEntry.value2) : null, date: newEntry.date, time: newEntry.time, notes: newEntry.notes, timestamp: new Date(`${newEntry.date}T${newEntry.time}`).getTime() };
    const updated = { ...healthData, [activeMetric]: [...(healthData[activeMetric] || []), entry].sort((a, b) => b.timestamp - a.timestamp) };
    saveHealthData(updated);
    setNewEntry({ value: '', value2: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), notes: '' });
    setShowAddForm(false);
    toast.success('Entry added successfully');
  };

  const deleteEntry = (metricId, entryId) => { saveHealthData({ ...healthData, [metricId]: healthData[metricId].filter(e => e.id !== entryId) }); toast.success('Entry deleted'); };

  const getMetricData = () => healthData[activeMetric] || [];
  const currentMetric = metrics.find(m => m.id === activeMetric);

  const getStats = () => {
    const data = getMetricData();
    if (data.length === 0) return null;
    const values = data.map(d => d.value);
    const latest = data[0];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const thisWeek = data.filter(d => d.timestamp >= weekAgo);
    const lastWeek = data.filter(d => d.timestamp >= twoWeeksAgo && d.timestamp < weekAgo);
    let trend = 'stable';
    if (thisWeek.length > 0 && lastWeek.length > 0) {
      const thisAvg = thisWeek.reduce((a, b) => a + b.value, 0) / thisWeek.length;
      const lastAvg = lastWeek.reduce((a, b) => a + b.value, 0) / lastWeek.length;
      const diff = ((thisAvg - lastAvg) / lastAvg) * 100;
      if (diff > 5) trend = 'up'; else if (diff < -5) trend = 'down';
    }
    return { latest, avg: avg.toFixed(1), min, max, trend, count: data.length };
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Metric Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {metrics.map(metric => (
          <button key={metric.id} onClick={() => setActiveMetric(metric.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeMetric === metric.id ? `bg-gradient-to-r ${metric.gradient} text-white shadow-lg` : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
            <i className={`fas ${metric.icon}`}></i>
            <span className="hidden sm:inline">{metric.name}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`bg-gradient-to-br ${currentMetric?.gradient} rounded-2xl p-5 text-white`}>
            <p className="text-white/80 text-sm mb-1">Latest</p>
            <p className="text-3xl font-bold">{currentMetric?.single ? stats.latest.value : `${stats.latest.value}/${stats.latest.value2}`}</p>
            <p className="text-white/80 text-sm">{currentMetric?.unit}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Average</p>
            <p className="text-3xl font-bold text-slate-800">{stats.avg}</p>
            <p className="text-slate-400 text-sm">{currentMetric?.unit}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Range</p>
            <p className="text-2xl font-bold text-slate-800">{stats.min} - {stats.max}</p>
            <p className="text-slate-400 text-sm">{currentMetric?.unit}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm mb-1">Trend</p>
            <div className={`flex items-center gap-2 text-lg font-semibold ${stats.trend === 'up' ? 'text-emerald-500' : stats.trend === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
              <i className={`fas fa-arrow-${stats.trend === 'up' ? 'up' : stats.trend === 'down' ? 'down' : 'right'}`}></i>
              {stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Button */}
      <button onClick={() => setShowAddForm(!showAddForm)}
        className={`w-full py-3 rounded-xl font-medium transition-all ${showAddForm ? 'bg-slate-100 text-slate-600' : `bg-gradient-to-r ${currentMetric?.gradient} text-white hover:shadow-lg`}`}>
        <i className={`fas fa-${showAddForm ? 'times' : 'plus'} mr-2`}></i>
        {showAddForm ? 'Cancel' : `Add ${currentMetric?.name} Entry`}
      </button>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            {currentMetric?.single ? (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
                <div className="relative">
                  <input type="number" placeholder={`Enter ${currentMetric?.name}`} value={newEntry.value} onChange={(e) => setNewEntry({...newEntry, value: e.target.value})} step="0.1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currentMetric?.unit}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Systolic</label>
                  <input type="number" placeholder="120" value={newEntry.value} onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Diastolic</label>
                  <input type="number" placeholder="80" value={newEntry.value2} onChange={(e) => setNewEntry({...newEntry, value2: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </>
            )}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
              <input type="time" value={newEntry.time} onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
            <textarea placeholder="Any additional notes..." value={newEntry.notes} onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})} rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleAddEntry} className={`w-full py-3 bg-gradient-to-r ${currentMetric?.gradient} text-white font-medium rounded-xl hover:shadow-lg transition-all`}>
            <i className="fas fa-save mr-2"></i> Save Entry
          </button>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-history text-indigo-500"></i> History ({getMetricData().length} entries)
        </h3>
        {getMetricData().length === 0 ? (
          <p className="text-slate-500 text-center py-8">No data recorded yet. Start tracking your {currentMetric?.name.toLowerCase()}!</p>
        ) : (
          <div className="space-y-3">
            {getMetricData().slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentMetric?.gradient} flex flex-col items-center justify-center text-white text-xs font-medium`}>
                  <span>{formatDate(entry.date).split(' ')[0]}</span>
                  <span>{formatDate(entry.date).split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-slate-800">
                    {currentMetric?.single ? entry.value : `${entry.value}/${entry.value2}`}
                    <span className="text-sm font-normal text-slate-400 ml-1">{currentMetric?.unit}</span>
                  </p>
                  <p className="text-sm text-slate-500">{entry.time}</p>
                  {entry.notes && <p className="text-sm text-slate-400 truncate">{entry.notes}</p>}
                </div>
                <button onClick={() => deleteEntry(activeMetric, entry.id)}
                  className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-all">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAnalytics;

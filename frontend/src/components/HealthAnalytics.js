import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './HealthAnalytics.css';

const HealthAnalytics = ({ userId }) => {
  const [activeMetric, setActiveMetric] = useState('weight');
  const [showAddForm, setShowAddForm] = useState(false);
  const [healthData, setHealthData] = useState({
    weight: [],
    bloodPressure: [],
    bloodSugar: [],
    heartRate: [],
    sleep: [],
    water: []
  });
  const [newEntry, setNewEntry] = useState({
    value: '',
    value2: '', // For blood pressure (systolic/diastolic)
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  const metrics = [
    { id: 'weight', name: 'Weight', unit: 'kg', icon: 'fa-weight', color: '#667eea', single: true },
    { id: 'bloodPressure', name: 'Blood Pressure', unit: 'mmHg', icon: 'fa-heartbeat', color: '#ef4444', single: false },
    { id: 'bloodSugar', name: 'Blood Sugar', unit: 'mg/dL', icon: 'fa-tint', color: '#f59e0b', single: true },
    { id: 'heartRate', name: 'Heart Rate', unit: 'bpm', icon: 'fa-heart', color: '#ec4899', single: true },
    { id: 'sleep', name: 'Sleep', unit: 'hours', icon: 'fa-moon', color: '#8b5cf6', single: true },
    { id: 'water', name: 'Water Intake', unit: 'glasses', icon: 'fa-glass-water', color: '#06b6d4', single: true }
  ];

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = () => {
    const saved = localStorage.getItem(`health_data_${userId}`);
    if (saved) {
      setHealthData(JSON.parse(saved));
    }
  };

  const saveHealthData = (newData) => {
    localStorage.setItem(`health_data_${userId}`, JSON.stringify(newData));
    setHealthData(newData);
  };

  const handleAddEntry = () => {
    const metric = metrics.find(m => m.id === activeMetric);
    if (!newEntry.value || (metric && !metric.single && !newEntry.value2)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entry = {
      id: Date.now(),
      value: parseFloat(newEntry.value),
      value2: newEntry.value2 ? parseFloat(newEntry.value2) : null,
      date: newEntry.date,
      time: newEntry.time,
      notes: newEntry.notes,
      timestamp: new Date(`${newEntry.date}T${newEntry.time}`).getTime()
    };

    const updated = {
      ...healthData,
      [activeMetric]: [...(healthData[activeMetric] || []), entry].sort((a, b) => b.timestamp - a.timestamp)
    };

    saveHealthData(updated);
    setNewEntry({ value: '', value2: '', date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), notes: '' });
    setShowAddForm(false);
    toast.success('Entry added successfully');
  };

  const deleteEntry = (metricId, entryId) => {
    const updated = {
      ...healthData,
      [metricId]: healthData[metricId].filter(e => e.id !== entryId)
    };
    saveHealthData(updated);
    toast.success('Entry deleted');
  };

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

    // Get trend (comparing last 7 days avg to previous 7 days)
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
      if (diff > 5) trend = 'up';
      else if (diff < -5) trend = 'down';
    }

    return { latest, avg: avg.toFixed(1), min, max, trend, count: data.length };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    });
  };

  const stats = getStats();

  return (
    <div className="health-analytics">
      {/* Metric Tabs */}
      <div className="metric-tabs">
        {metrics.map(metric => (
          <button
            key={metric.id}
            className={`metric-tab ${activeMetric === metric.id ? 'active' : ''}`}
            onClick={() => setActiveMetric(metric.id)}
            style={{ '--tab-color': metric.color }}
          >
            <i className={`fas ${metric.icon}`}></i>
            <span>{metric.name}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card latest" style={{ '--stat-color': currentMetric?.color }}>
            <span className="stat-label">Latest</span>
            <span className="stat-value">
              {currentMetric?.single 
                ? stats.latest.value 
                : `${stats.latest.value}/${stats.latest.value2}`}
            </span>
            <span className="stat-unit">{currentMetric?.unit}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average</span>
            <span className="stat-value">{stats.avg}</span>
            <span className="stat-unit">{currentMetric?.unit}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Range</span>
            <span className="stat-value">{stats.min} - {stats.max}</span>
            <span className="stat-unit">{currentMetric?.unit}</span>
          </div>
          <div className="stat-card trend">
            <span className="stat-label">Trend</span>
            <span className={`trend-indicator ${stats.trend}`}>
              <i className={`fas fa-arrow-${stats.trend === 'up' ? 'up' : stats.trend === 'down' ? 'down' : 'right'}`}></i>
              {stats.trend === 'up' ? 'Increasing' : stats.trend === 'down' ? 'Decreasing' : 'Stable'}
            </span>
          </div>
        </div>
      )}

      {/* Add Entry Button */}
      <button 
        className="add-entry-btn"
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ '--btn-color': currentMetric?.color }}
      >
        <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
        {showAddForm ? 'Cancel' : `Add ${currentMetric?.name} Entry`}
      </button>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="add-entry-form" style={{ '--form-color': currentMetric?.color }}>
          <div className="form-row">
            {currentMetric?.single ? (
              <div className="input-group">
                <input
                  type="number"
                  placeholder={`Enter ${currentMetric?.name}`}
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                  step="0.1"
                />
                <span className="input-unit">{currentMetric?.unit}</span>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Systolic"
                    value={newEntry.value}
                    onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                  />
                  <span className="input-unit">mmHg</span>
                </div>
                <span className="separator">/</span>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Diastolic"
                    value={newEntry.value2}
                    onChange={(e) => setNewEntry({...newEntry, value2: e.target.value})}
                  />
                  <span className="input-unit">mmHg</span>
                </div>
              </>
            )}
          </div>
          <div className="form-row">
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
            />
            <input
              type="time"
              value={newEntry.time}
              onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
            />
          </div>
          <textarea
            placeholder="Notes (optional)"
            value={newEntry.notes}
            onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
          />
          <button className="save-btn" onClick={handleAddEntry}>
            <i className="fas fa-save"></i> Save Entry
          </button>
        </div>
      )}

      {/* History */}
      <div className="history-section">
        <h3><i className="fas fa-history"></i> History ({getMetricData().length} entries)</h3>
        {getMetricData().length === 0 ? (
          <p className="no-data">No data recorded yet. Start tracking your {currentMetric?.name.toLowerCase()}!</p>
        ) : (
          <div className="history-list">
            {getMetricData().slice(0, 20).map(entry => (
              <div key={entry.id} className="history-item" style={{ '--item-color': currentMetric?.color }}>
                <div className="history-date">
                  <span className="date">{formatDate(entry.date)}</span>
                  <span className="time">{entry.time}</span>
                </div>
                <div className="history-value">
                  {currentMetric?.single 
                    ? entry.value 
                    : `${entry.value}/${entry.value2}`}
                  <span className="unit">{currentMetric?.unit}</span>
                </div>
                {entry.notes && <p className="history-notes">{entry.notes}</p>}
                <button 
                  className="delete-btn"
                  onClick={() => deleteEntry(activeMetric, entry.id)}
                >
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

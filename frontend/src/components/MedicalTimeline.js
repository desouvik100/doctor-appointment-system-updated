// frontend/src/components/MedicalTimeline.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './MedicalTimeline.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const MedicalTimeline = ({ userId }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [userId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/export/timeline/${userId}`);
      setTimeline(response.data.timeline || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      toast.error('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = filter === 'all' 
    ? timeline 
    : timeline.filter(item => item.type === filter);

  const getTypeColor = (type) => {
    switch (type) {
      case 'appointment': return '#667eea';
      case 'prescription': return '#10b981';
      case 'lab_report': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const groupByMonth = (items) => {
    const groups = {};
    items.forEach(item => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) {
        groups[key] = { label, items: [] };
      }
      groups[key].items.push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  if (loading) {
    return (
      <div className="timeline-loading">
        <div className="timeline-loading__spinner"></div>
        <p>Loading your medical history...</p>
      </div>
    );
  }

  const groupedTimeline = groupByMonth(filteredTimeline);

  return (
    <div className="medical-timeline">
      <div className="timeline-header">
        <h2>
          <i className="fas fa-history"></i>
          Medical History Timeline
        </h2>
        <div className="timeline-filters">
          <button 
            className={`timeline-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`timeline-filter ${filter === 'appointment' ? 'active' : ''}`}
            onClick={() => setFilter('appointment')}
          >
            <i className="fas fa-calendar-check"></i> Appointments
          </button>
          <button 
            className={`timeline-filter ${filter === 'prescription' ? 'active' : ''}`}
            onClick={() => setFilter('prescription')}
          >
            <i className="fas fa-prescription"></i> Prescriptions
          </button>
          <button 
            className={`timeline-filter ${filter === 'lab_report' ? 'active' : ''}`}
            onClick={() => setFilter('lab_report')}
          >
            <i className="fas fa-flask"></i> Lab Reports
          </button>
        </div>
      </div>

      {filteredTimeline.length === 0 ? (
        <div className="timeline-empty">
          <i className="fas fa-clipboard-list"></i>
          <h3>No medical history yet</h3>
          <p>Your appointments, prescriptions, and lab reports will appear here.</p>
        </div>
      ) : (
        <div className="timeline-content">
          {groupedTimeline.map(([key, group]) => (
            <div key={key} className="timeline-month">
              <div className="timeline-month__header">
                <span>{group.label}</span>
                <span className="timeline-month__count">{group.items.length} events</span>
              </div>
              
              <div className="timeline-items">
                {group.items.map((item, index) => (
                  <div 
                    key={`${item.type}-${index}`}
                    className={`timeline-item ${expandedItem === `${key}-${index}` ? 'expanded' : ''}`}
                    onClick={() => setExpandedItem(
                      expandedItem === `${key}-${index}` ? null : `${key}-${index}`
                    )}
                  >
                    <div 
                      className="timeline-item__marker"
                      style={{ backgroundColor: getTypeColor(item.type) }}
                    >
                      <span>{item.icon}</span>
                    </div>
                    
                    <div className="timeline-item__content">
                      <div className="timeline-item__header">
                        <h4>{item.title}</h4>
                        <span className="timeline-item__date">{formatDate(item.date)}</span>
                      </div>
                      
                      {item.subtitle && (
                        <p className="timeline-item__subtitle">{item.subtitle}</p>
                      )}
                      
                      <p className="timeline-item__description">{item.description}</p>
                      
                      {expandedItem === `${key}-${index}` && item.data && (
                        <div className="timeline-item__details">
                          {item.type === 'appointment' && (
                            <>
                              <div className="detail-row">
                                <span>Time:</span>
                                <strong>{item.data.time}</strong>
                              </div>
                              <div className="detail-row">
                                <span>Type:</span>
                                <strong>{item.data.consultationType || 'In-Person'}</strong>
                              </div>
                              <div className="detail-row">
                                <span>Status:</span>
                                <span className={`status-badge status-${item.data.status}`}>
                                  {item.data.status}
                                </span>
                              </div>
                            </>
                          )}
                          
                          {item.type === 'prescription' && item.data.medicines && (
                            <>
                              <div className="detail-row">
                                <span>Medicines:</span>
                                <strong>{item.data.medicines.length}</strong>
                              </div>
                              <ul className="medicines-list">
                                {item.data.medicines.slice(0, 3).map((med, i) => (
                                  <li key={i}>{med.name} - {med.dosage}</li>
                                ))}
                                {item.data.medicines.length > 3 && (
                                  <li className="more">+{item.data.medicines.length - 3} more</li>
                                )}
                              </ul>
                            </>
                          )}
                          
                          {item.type === 'lab_report' && (
                            <div className="detail-row">
                              <span>Type:</span>
                              <strong>{item.data.type || 'General'}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="timeline-item__expand">
                      <i className={`fas fa-chevron-${expandedItem === `${key}-${index}` ? 'up' : 'down'}`}></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="timeline-stats">
        <div className="stat-card">
          <i className="fas fa-calendar-check"></i>
          <div>
            <span className="stat-number">
              {timeline.filter(t => t.type === 'appointment').length}
            </span>
            <span className="stat-label">Appointments</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-prescription"></i>
          <div>
            <span className="stat-number">
              {timeline.filter(t => t.type === 'prescription').length}
            </span>
            <span className="stat-label">Prescriptions</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-flask"></i>
          <div>
            <span className="stat-number">
              {timeline.filter(t => t.type === 'lab_report').length}
            </span>
            <span className="stat-label">Lab Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalTimeline;

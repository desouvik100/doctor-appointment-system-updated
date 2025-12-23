/**
 * LabOrderTracker Component
 * Displays lab order status with visual indicators and result highlighting
 * Requirements: 2.5, 2.6, 2.7
 */

import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/config';
import './LabOrderTracker.css';

// Status configuration
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', icon: '⏳', step: 1 },
  ordered: { label: 'Ordered', color: '#3b82f6', icon: '📋', step: 1 },
  sample_collected: { label: 'Sample Collected', color: '#8b5cf6', icon: '🧪', step: 2 },
  processing: { label: 'Processing', color: '#6366f1', icon: '⚙️', step: 3 },
  partial: { label: 'Partial Results', color: '#0ea5e9', icon: '📊', step: 3 },
  completed: { label: 'Completed', color: '#10b981', icon: '✓', step: 4 },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✕', step: 0 }
};

// Urgency configuration
const URGENCY_CONFIG = {
  routine: { label: 'Routine', color: '#10b981' },
  urgent: { label: 'Urgent', color: '#f59e0b' },
  stat: { label: 'STAT', color: '#ef4444' }
};

const LabOrderTracker = ({
  patientId,
  clinicId,
  orderId,
  onViewResults,
  onPrintRequisition,
  onClose
}) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedTests, setExpandedTests] = useState({});

  // Fetch orders
  useEffect(() => {
    if (orderId) {
      fetchSingleOrder(orderId);
    } else if (patientId) {
      fetchPatientOrders();
    }
  }, [patientId, orderId]);

  const fetchSingleOrder = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/emr/lab-orders/${id}`);
      if (response.data.success || response.data.order) {
        const order = response.data.order || response.data;
        setOrders([order]);
        setSelectedOrder(order);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load lab order');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientOrders = async () => {
    setLoading(true);
    try {
      const params = { clinicId };
      if (filter !== 'all') params.status = filter;
      
      const response = await axios.get(`/api/emr/patients/${patientId}/lab-orders`, { params });
      if (response.data.success || response.data.orders) {
        setOrders(response.data.orders || []);
        if (response.data.orders?.length > 0 && !selectedOrder) {
          setSelectedOrder(response.data.orders[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  // Refresh orders
  const handleRefresh = useCallback(() => {
    if (orderId) {
      fetchSingleOrder(orderId);
    } else {
      fetchPatientOrders();
    }
  }, [orderId, patientId, filter]);

  // Toggle test expansion
  const toggleTestExpansion = (testCode) => {
    setExpandedTests(prev => ({
      ...prev,
      [testCode]: !prev[testCode]
    }));
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get progress percentage
  const getProgressPercentage = (order) => {
    if (!order?.tests?.length) return 0;
    const completedTests = order.tests.filter(t => t.status === 'completed').length;
    return Math.round((completedTests / order.tests.length) * 100);
  };

  // Get abnormal count
  const getAbnormalCount = (order) => {
    if (!order?.tests) return 0;
    let count = 0;
    order.tests.forEach(test => {
      if (test.results?.values) {
        count += test.results.values.filter(v => v.isAbnormal).length;
      }
    });
    return count;
  };

  if (loading) {
    return (
      <div className="lab-order-tracker loading">
        <div className="loading-spinner"></div>
        <p>Loading lab orders...</p>
      </div>
    );
  }

  return (
    <div className="lab-order-tracker">
      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      {/* Header */}
      <div className="tracker-header">
        <h2 className="tracker-title">
          <span className="title-icon">🔬</span>
          Lab Orders
        </h2>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh} title="Refresh">
            🔄
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {/* Filter (only when viewing multiple orders) */}
      {!orderId && (
        <div className="filter-bar">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="partial">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="order-count">{orders.length} order(s)</span>
        </div>
      )}

      <div className="tracker-content">
        {/* Orders List (sidebar when multiple) */}
        {!orderId && orders.length > 1 && (
          <div className="orders-sidebar">
            {orders.map(order => (
              <div
                key={order._id}
                className={`order-card ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-card-header">
                  <span className="order-number">{order.orderNumber}</span>
                  <span 
                    className="order-status-badge"
                    style={{ background: STATUS_CONFIG[order.orderStatus]?.color }}
                  >
                    {STATUS_CONFIG[order.orderStatus]?.label}
                  </span>
                </div>
                <div className="order-card-meta">
                  <span>{formatDate(order.orderDate)}</span>
                  <span>{order.tests?.length || 0} tests</span>
                </div>
                <div className="order-progress-mini">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(order)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details */}
        {selectedOrder ? (
          <div className="order-details">
            {/* Order Header */}
            <div className="order-header">
              <div className="order-info">
                <h3 className="order-number-large">{selectedOrder.orderNumber}</h3>
                <div className="order-meta-row">
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {formatDate(selectedOrder.orderDate)}
                  </span>
                  <span 
                    className="urgency-badge"
                    style={{ background: URGENCY_CONFIG[selectedOrder.tests?.[0]?.urgency]?.color }}
                  >
                    {URGENCY_CONFIG[selectedOrder.tests?.[0]?.urgency]?.label}
                  </span>
                </div>
              </div>
              <div className="order-status-large">
                <span 
                  className="status-icon"
                  style={{ color: STATUS_CONFIG[selectedOrder.orderStatus]?.color }}
                >
                  {STATUS_CONFIG[selectedOrder.orderStatus]?.icon}
                </span>
                <span className="status-label">
                  {STATUS_CONFIG[selectedOrder.orderStatus]?.label}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="order-progress">
              <div className="progress-steps">
                {['Ordered', 'Sample Collected', 'Processing', 'Completed'].map((step, idx) => {
                  const currentStep = STATUS_CONFIG[selectedOrder.orderStatus]?.step || 0;
                  const isActive = idx + 1 <= currentStep;
                  const isCurrent = idx + 1 === currentStep;
                  return (
                    <div 
                      key={step}
                      className={`progress-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-dot">{isActive ? '✓' : idx + 1}</div>
                      <span className="step-label">{step}</span>
                    </div>
                  );
                })}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage(selectedOrder)}%` }}
                />
              </div>
              <div className="progress-text">
                {getProgressPercentage(selectedOrder)}% Complete
                {getAbnormalCount(selectedOrder) > 0 && (
                  <span className="abnormal-indicator">
                    ⚠️ {getAbnormalCount(selectedOrder)} abnormal result(s)
                  </span>
                )}
              </div>
            </div>

            {/* Tests List */}
            <div className="tests-section">
              <h4 className="section-title">Ordered Tests ({selectedOrder.tests?.length || 0})</h4>
              <div className="tests-list">
                {selectedOrder.tests?.map(test => (
                  <div 
                    key={test.testCode}
                    className={`test-item ${expandedTests[test.testCode] ? 'expanded' : ''}`}
                  >
                    <div 
                      className="test-header"
                      onClick={() => toggleTestExpansion(test.testCode)}
                    >
                      <div className="test-info">
                        <span className="test-code">{test.testCode}</span>
                        <span className="test-name">{test.testName}</span>
                        {test.fromPanel && (
                          <span className="panel-badge">Panel</span>
                        )}
                      </div>
                      <div className="test-status">
                        <span 
                          className="status-dot"
                          style={{ background: STATUS_CONFIG[test.status]?.color }}
                        />
                        <span className="status-text">
                          {STATUS_CONFIG[test.status]?.label}
                        </span>
                        {test.results?.values?.some(v => v.isAbnormal) && (
                          <span className="abnormal-flag">⚠️</span>
                        )}
                        <span className="expand-icon">
                          {expandedTests[test.testCode] ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Test Details */}
                    {expandedTests[test.testCode] && (
                      <div className="test-details">
                        {/* Status Timeline */}
                        {test.statusHistory?.length > 0 && (
                          <div className="status-timeline">
                            <h5>Status History</h5>
                            {test.statusHistory.map((entry, idx) => (
                              <div key={idx} className="timeline-entry">
                                <span className="timeline-dot" />
                                <span className="timeline-status">{entry.status}</span>
                                <span className="timeline-date">
                                  {formatDate(entry.changedAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Results */}
                        {test.results?.values?.length > 0 && (
                          <div className="test-results">
                            <h5>Results</h5>
                            <table className="results-table">
                              <thead>
                                <tr>
                                  <th>Parameter</th>
                                  <th>Value</th>
                                  <th>Unit</th>
                                  <th>Reference Range</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {test.results.values.map((result, idx) => (
                                  <tr 
                                    key={idx}
                                    className={result.isAbnormal ? 'abnormal' : ''}
                                  >
                                    <td>{result.parameter}</td>
                                    <td className="value-cell">
                                      <span className={`value ${result.isAbnormal ? 'abnormal-value' : ''}`}>
                                        {result.value}
                                      </span>
                                      {result.abnormalFlag && (
                                        <span className={`flag flag-${result.abnormalFlag.toLowerCase()}`}>
                                          {result.abnormalFlag}
                                        </span>
                                      )}
                                    </td>
                                    <td>{result.unit}</td>
                                    <td>{result.referenceRange || '-'}</td>
                                    <td>
                                      {result.isAbnormal ? (
                                        <span className="status-abnormal">Abnormal</span>
                                      ) : (
                                        <span className="status-normal">Normal</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {test.results.comments && (
                              <p className="results-comments">
                                <strong>Comments:</strong> {test.results.comments}
                              </p>
                            )}
                          </div>
                        )}

                        {/* No results yet */}
                        {test.status !== 'completed' && !test.results?.values?.length && (
                          <p className="no-results">Results pending...</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            {selectedOrder.clinicalNotes && (
              <div className="notes-section">
                <h4 className="section-title">Clinical Notes</h4>
                <p className="notes-text">{selectedOrder.clinicalNotes}</p>
              </div>
            )}

            {/* Patient Instructions */}
            {selectedOrder.patientInstructions && (
              <div className="instructions-section">
                <h4 className="section-title">Patient Instructions</h4>
                <p className="instructions-text">{selectedOrder.patientInstructions}</p>
              </div>
            )}

            {/* Actions */}
            <div className="order-actions">
              {onPrintRequisition && selectedOrder.orderStatus !== 'cancelled' && (
                <button 
                  className="action-btn print-btn"
                  onClick={() => onPrintRequisition(selectedOrder)}
                >
                  🖨️ Print Requisition
                </button>
              )}
              {onViewResults && selectedOrder.orderStatus === 'completed' && (
                <button 
                  className="action-btn results-btn"
                  onClick={() => onViewResults(selectedOrder)}
                >
                  📊 View Full Results
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="no-orders">
            <span className="no-orders-icon">📋</span>
            <p>No lab orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabOrderTracker;

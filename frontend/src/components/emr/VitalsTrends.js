/**
 * VitalsTrends Component
 * Displays vital signs trends with line charts and normal range bands
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../api/config';
import './VitalsTrends.css';

// Normal ranges for reference bands
const NORMAL_RANGES = {
  bloodPressure: { systolic: { min: 90, max: 140 }, diastolic: { min: 60, max: 90 } },
  pulse: { min: 60, max: 100 },
  temperature: { F: { min: 97, max: 99.5 }, C: { min: 36.1, max: 37.5 } },
  spo2: { min: 95, max: 100 },
  respiratoryRate: { min: 12, max: 20 },
  bloodSugar: { fasting: { min: 70, max: 100 }, random: { min: 70, max: 140 } },
  weight: { min: 0, max: 200 },
  bmi: { min: 18.5, max: 25 }
};

const TIME_PERIODS = [
  { value: '1m', label: '1 Month', days: 30 },
  { value: '3m', label: '3 Months', days: 90 },
  { value: '6m', label: '6 Months', days: 180 },
  { value: '1y', label: '1 Year', days: 365 }
];

const VITAL_TYPES = [
  { key: 'bloodPressure', label: 'Blood Pressure', icon: '🩺', unit: 'mmHg' },
  { key: 'pulse', label: 'Pulse Rate', icon: '💓', unit: 'bpm' },
  { key: 'temperature', label: 'Temperature', icon: '🌡️', unit: '°F' },
  { key: 'spo2', label: 'SpO2', icon: '🫁', unit: '%' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', icon: '🌬️', unit: '/min' },
  { key: 'bloodSugar', label: 'Blood Sugar', icon: '🩸', unit: 'mg/dL' },
  { key: 'weight', label: 'Weight', icon: '⚖️', unit: 'kg' },
  { key: 'bmi', label: 'BMI', icon: '📊', unit: '' }
];

const VitalsTrends = ({ patientId, clinicId }) => {
  const [trendsData, setTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('3m');
  const [selectedVital, setSelectedVital] = useState('bloodPressure');

  useEffect(() => {
    if (patientId) {
      fetchTrendsData();
    }
  }, [patientId, selectedPeriod]);

  const fetchTrendsData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/emr/patients/${patientId}/vitals/trends`, {
        params: { period: selectedPeriod, clinicId }
      });
      
      if (response.data.success) {
        // Backend returns { trends: { data: [...], period, totalReadings, summary } }
        const trendsResponse = response.data.trends;
        setTrendsData(trendsResponse?.data || []);
      } else {
        setError(response.data.message || 'Failed to load trends');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vitals trends');
      // Use mock data for demo if API fails
      setTrendsData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demo purposes
  const generateMockData = () => {
    const data = [];
    const period = TIME_PERIODS.find(p => p.value === selectedPeriod);
    const numPoints = Math.min(period.days, 30);
    
    for (let i = numPoints - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * Math.floor(period.days / numPoints));
      
      data.push({
        date: date.toISOString(),
        bloodPressure: { systolic: 110 + Math.random() * 30, diastolic: 70 + Math.random() * 20 },
        pulse: { value: 65 + Math.random() * 25 },
        temperature: { value: 97.5 + Math.random() * 2, unit: 'F' },
        spo2: { value: 95 + Math.random() * 5 },
        respiratoryRate: { value: 14 + Math.random() * 6 },
        bloodSugar: { value: 90 + Math.random() * 40, type: 'random' },
        weight: { value: 65 + Math.random() * 5, unit: 'kg' },
        bmi: 22 + Math.random() * 4
      });
    }
    return data;
  };

  // Process data for the selected vital
  const chartData = useMemo(() => {
    if (!trendsData.length) return { points: [], min: 0, max: 100 };

    let points = [];
    let allValues = [];

    trendsData.forEach(record => {
      const date = new Date(record.date);
      const dateLabel = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      if (selectedVital === 'bloodPressure' && record.bloodPressure) {
        points.push({
          date: dateLabel,
          fullDate: date,
          systolic: record.bloodPressure.systolic,
          diastolic: record.bloodPressure.diastolic
        });
        allValues.push(record.bloodPressure.systolic, record.bloodPressure.diastolic);
      } else if (selectedVital === 'bmi' && record.bmi) {
        points.push({ date: dateLabel, fullDate: date, value: record.bmi });
        allValues.push(record.bmi);
      } else if (record[selectedVital]?.value !== undefined) {
        points.push({ date: dateLabel, fullDate: date, value: record[selectedVital].value });
        allValues.push(record[selectedVital].value);
      }
    });

    if (!allValues.length) return { points: [], min: 0, max: 100 };

    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const padding = (dataMax - dataMin) * 0.15 || 10;

    return {
      points,
      min: Math.floor(dataMin - padding),
      max: Math.ceil(dataMax + padding)
    };
  }, [trendsData, selectedVital]);

  // Calculate position percentage for a value
  const getYPosition = (value) => {
    const { min, max } = chartData;
    if (max === min) return 50;
    return 100 - ((value - min) / (max - min)) * 100;
  };

  // Get normal range band positions
  const getNormalRangeBand = () => {
    const range = NORMAL_RANGES[selectedVital];
    if (!range) return null;

    if (selectedVital === 'bloodPressure') {
      return {
        systolic: {
          top: getYPosition(range.systolic.max),
          bottom: getYPosition(range.systolic.min)
        },
        diastolic: {
          top: getYPosition(range.diastolic.max),
          bottom: getYPosition(range.diastolic.min)
        }
      };
    }

    const rangeData = range.min !== undefined ? range : range.F || range.random;
    return {
      top: getYPosition(rangeData.max),
      bottom: getYPosition(rangeData.min)
    };
  };

  // Get latest value for summary
  const getLatestValue = () => {
    if (!chartData.points.length) return null;
    const latest = chartData.points[chartData.points.length - 1];
    
    if (selectedVital === 'bloodPressure') {
      return `${Math.round(latest.systolic)}/${Math.round(latest.diastolic)}`;
    }
    return typeof latest.value === 'number' ? latest.value.toFixed(1) : latest.value;
  };

  // Check if latest value is abnormal
  const isLatestAbnormal = () => {
    if (!chartData.points.length) return false;
    const latest = chartData.points[chartData.points.length - 1];
    const range = NORMAL_RANGES[selectedVital];
    if (!range) return false;

    if (selectedVital === 'bloodPressure') {
      return latest.systolic < range.systolic.min || latest.systolic > range.systolic.max ||
             latest.diastolic < range.diastolic.min || latest.diastolic > range.diastolic.max;
    }

    const rangeData = range.min !== undefined ? range : range.F || range.random;
    return latest.value < rangeData.min || latest.value > rangeData.max;
  };

  const selectedVitalInfo = VITAL_TYPES.find(v => v.key === selectedVital);
  const normalBand = getNormalRangeBand();
  const latestValue = getLatestValue();
  const isAbnormal = isLatestAbnormal();

  if (loading) {
    return (
      <div className="vitals-trends">
        <div className="trends-loading">
          <div className="trends-spinner"></div>
          <p>Loading vitals trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vitals-trends">
      <div className="trends-header">
        <h2>📈 Vitals Trends</h2>
        <div className="trends-controls">
          <div className="period-selector">
            {TIME_PERIODS.map(period => (
              <button
                key={period.value}
                className={`period-btn ${selectedPeriod === period.value ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="trends-error">{error}</div>}

      {/* Vital Type Selector */}
      <div className="vital-selector">
        {VITAL_TYPES.map(vital => (
          <button
            key={vital.key}
            className={`vital-btn ${selectedVital === vital.key ? 'active' : ''}`}
            onClick={() => setSelectedVital(vital.key)}
          >
            <span className="vital-icon">{vital.icon}</span>
            <span className="vital-name">{vital.label}</span>
          </button>
        ))}
      </div>

      {/* Current Value Summary */}
      {latestValue && (
        <div className={`current-value-card ${isAbnormal ? 'abnormal' : 'normal'}`}>
          <div className="current-value-icon">{selectedVitalInfo?.icon}</div>
          <div className="current-value-info">
            <span className="current-value-label">Latest {selectedVitalInfo?.label}</span>
            <span className="current-value-number">
              {latestValue} {selectedVitalInfo?.unit}
            </span>
          </div>
          <span className={`current-value-status ${isAbnormal ? 'status-abnormal' : 'status-normal'}`}>
            {isAbnormal ? '⚠️ Abnormal' : '✓ Normal'}
          </span>
        </div>
      )}

      {/* Chart Area */}
      <div className="chart-container">
        {chartData.points.length === 0 ? (
          <div className="chart-empty">
            <span className="empty-icon">📊</span>
            <p>No data available for this vital sign</p>
          </div>
        ) : (
          <>
            {/* Y-Axis Labels */}
            <div className="chart-y-axis">
              <span>{chartData.max}</span>
              <span>{Math.round((chartData.max + chartData.min) / 2)}</span>
              <span>{chartData.min}</span>
            </div>

            {/* Chart Body */}
            <div className="chart-body">
              {/* Normal Range Band */}
              {normalBand && selectedVital !== 'bloodPressure' && (
                <div
                  className="normal-range-band"
                  style={{
                    top: `${normalBand.top}%`,
                    height: `${normalBand.bottom - normalBand.top}%`
                  }}
                >
                  <span className="range-label">Normal Range</span>
                </div>
              )}

              {/* BP has two bands */}
              {normalBand && selectedVital === 'bloodPressure' && (
                <>
                  <div
                    className="normal-range-band systolic-band"
                    style={{
                      top: `${normalBand.systolic.top}%`,
                      height: `${normalBand.systolic.bottom - normalBand.systolic.top}%`
                    }}
                  >
                    <span className="range-label">Systolic</span>
                  </div>
                  <div
                    className="normal-range-band diastolic-band"
                    style={{
                      top: `${normalBand.diastolic.top}%`,
                      height: `${normalBand.diastolic.bottom - normalBand.diastolic.top}%`
                    }}
                  >
                    <span className="range-label">Diastolic</span>
                  </div>
                </>
              )}

              {/* Data Points and Lines */}
              <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Line for single value vitals */}
                {selectedVital !== 'bloodPressure' && chartData.points.length > 1 && (
                  <polyline
                    className="chart-line"
                    fill="none"
                    stroke="var(--emr-primary, #3b82f6)"
                    strokeWidth="0.5"
                    points={chartData.points.map((p, i) => 
                      `${(i / (chartData.points.length - 1)) * 100},${getYPosition(p.value)}`
                    ).join(' ')}
                  />
                )}

                {/* Lines for BP (systolic and diastolic) */}
                {selectedVital === 'bloodPressure' && chartData.points.length > 1 && (
                  <>
                    <polyline
                      className="chart-line systolic-line"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="0.5"
                      points={chartData.points.map((p, i) => 
                        `${(i / (chartData.points.length - 1)) * 100},${getYPosition(p.systolic)}`
                      ).join(' ')}
                    />
                    <polyline
                      className="chart-line diastolic-line"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="0.5"
                      points={chartData.points.map((p, i) => 
                        `${(i / (chartData.points.length - 1)) * 100},${getYPosition(p.diastolic)}`
                      ).join(' ')}
                    />
                  </>
                )}
              </svg>

              {/* Data Points */}
              <div className="chart-points">
                {chartData.points.map((point, index) => (
                  <div
                    key={index}
                    className="point-column"
                    style={{ left: `${(index / (chartData.points.length - 1 || 1)) * 100}%` }}
                  >
                    {selectedVital === 'bloodPressure' ? (
                      <>
                        <div
                          className="data-point systolic-point"
                          style={{ top: `${getYPosition(point.systolic)}%` }}
                          title={`Systolic: ${Math.round(point.systolic)} mmHg`}
                        />
                        <div
                          className="data-point diastolic-point"
                          style={{ top: `${getYPosition(point.diastolic)}%` }}
                          title={`Diastolic: ${Math.round(point.diastolic)} mmHg`}
                        />
                      </>
                    ) : (
                      <div
                        className="data-point"
                        style={{ top: `${getYPosition(point.value)}%` }}
                        title={`${point.value?.toFixed(1)} ${selectedVitalInfo?.unit}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* X-Axis Labels */}
              <div className="chart-x-axis">
                {chartData.points.filter((_, i) => 
                  i === 0 || i === chartData.points.length - 1 || 
                  i === Math.floor(chartData.points.length / 2)
                ).map((point, index) => (
                  <span key={index}>{point.date}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      {selectedVital === 'bloodPressure' && chartData.points.length > 0 && (
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot systolic"></span>
            <span>Systolic</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot diastolic"></span>
            <span>Diastolic</span>
          </div>
          <div className="legend-item">
            <span className="legend-band"></span>
            <span>Normal Range</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalsTrends;

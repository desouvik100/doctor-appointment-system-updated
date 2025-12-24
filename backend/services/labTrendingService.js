/**
 * Lab Result Trending Service
 * Analyzes lab results over time and identifies trends
 */

class LabTrendingService {
  
  constructor() {
    this.normalRanges = this.initializeNormalRanges();
  }
  
  initializeNormalRanges() {
    return {
      // Complete Blood Count
      'WBC': { min: 4.5, max: 11.0, unit: 'K/uL', criticalLow: 2.0, criticalHigh: 30.0 },
      'RBC': { min: 4.5, max: 5.5, unit: 'M/uL', criticalLow: 2.5, criticalHigh: 7.0 },
      'Hemoglobin': { min: 12.0, max: 17.5, unit: 'g/dL', criticalLow: 7.0, criticalHigh: 20.0 },
      'Hematocrit': { min: 36, max: 50, unit: '%', criticalLow: 20, criticalHigh: 60 },
      'Platelets': { min: 150, max: 400, unit: 'K/uL', criticalLow: 50, criticalHigh: 1000 },
      
      // Basic Metabolic Panel
      'Sodium': { min: 136, max: 145, unit: 'mEq/L', criticalLow: 120, criticalHigh: 160 },
      'Potassium': { min: 3.5, max: 5.0, unit: 'mEq/L', criticalLow: 2.5, criticalHigh: 6.5 },
      'Chloride': { min: 98, max: 106, unit: 'mEq/L' },
      'CO2': { min: 23, max: 29, unit: 'mEq/L', criticalLow: 10, criticalHigh: 40 },
      'BUN': { min: 7, max: 20, unit: 'mg/dL', criticalHigh: 100 },
      'Creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL', criticalHigh: 10 },
      'Glucose': { min: 70, max: 100, unit: 'mg/dL', criticalLow: 40, criticalHigh: 500 },
      'Calcium': { min: 8.5, max: 10.5, unit: 'mg/dL', criticalLow: 6.0, criticalHigh: 13.0 },
      
      // Liver Function
      'AST': { min: 10, max: 40, unit: 'U/L', criticalHigh: 1000 },
      'ALT': { min: 7, max: 56, unit: 'U/L', criticalHigh: 1000 },
      'ALP': { min: 44, max: 147, unit: 'U/L' },
      'Bilirubin Total': { min: 0.1, max: 1.2, unit: 'mg/dL', criticalHigh: 15 },
      'Albumin': { min: 3.5, max: 5.0, unit: 'g/dL', criticalLow: 1.5 },
      
      // Cardiac
      'Troponin I': { min: 0, max: 0.04, unit: 'ng/mL', criticalHigh: 0.5 },
      'BNP': { min: 0, max: 100, unit: 'pg/mL', criticalHigh: 500 },
      
      // Diabetes
      'HbA1c': { min: 4.0, max: 5.6, unit: '%' },
      
      // Thyroid
      'TSH': { min: 0.4, max: 4.0, unit: 'mIU/L' },
      'Free T4': { min: 0.8, max: 1.8, unit: 'ng/dL' },
      
      // Lipids
      'Total Cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
      'LDL': { min: 0, max: 100, unit: 'mg/dL' },
      'HDL': { min: 40, max: 999, unit: 'mg/dL' },
      'Triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
      
      // Coagulation
      'PT': { min: 11, max: 13.5, unit: 'seconds' },
      'INR': { min: 0.8, max: 1.1, unit: '' },
      'PTT': { min: 25, max: 35, unit: 'seconds' },
      
      // Urinalysis
      'Urine pH': { min: 4.5, max: 8.0, unit: '' },
      'Urine Specific Gravity': { min: 1.005, max: 1.030, unit: '' }
    };
  }
  
  // Analyze lab results and generate trending data
  async analyzeLabTrends(patientId, labName, timeRange = '1y') {
    const LabResult = require('../models/LabResult');
    
    const dateFilter = this.getDateFilter(timeRange);
    
    const results = await LabResult.find({
      patientId,
      testName: labName,
      collectedAt: { $gte: dateFilter }
    }).sort({ collectedAt: 1 }).lean();
    
    if (results.length === 0) {
      return { labName, data: [], trend: null, analysis: null };
    }
    
    const normalRange = this.normalRanges[labName];
    const values = results.map(r => r.value);
    
    // Calculate statistics
    const stats = this.calculateStatistics(values);
    
    // Determine trend
    const trend = this.calculateTrend(values);
    
    // Generate analysis
    const analysis = this.generateAnalysis(labName, values, normalRange, trend);
    
    return {
      labName,
      unit: normalRange?.unit || results[0]?.unit,
      normalRange: normalRange ? { min: normalRange.min, max: normalRange.max } : null,
      data: results.map(r => ({
        date: r.collectedAt,
        value: r.value,
        status: this.getValueStatus(r.value, normalRange)
      })),
      statistics: stats,
      trend,
      analysis,
      alerts: this.generateAlerts(labName, values, normalRange)
    };
  }
  
  // Get multiple lab trends for a patient
  async getPatientLabTrends(patientId, labNames = [], timeRange = '1y') {
    const trends = {};
    
    for (const labName of labNames) {
      trends[labName] = await this.analyzeLabTrends(patientId, labName, timeRange);
    }
    
    return trends;
  }
  
  // Get all available labs for a patient
  async getAvailableLabs(patientId) {
    const LabResult = require('../models/LabResult');
    
    const labs = await LabResult.distinct('testName', { patientId });
    return labs.map(name => ({
      name,
      hasNormalRange: !!this.normalRanges[name],
      unit: this.normalRanges[name]?.unit
    }));
  }
  
  // Calculate statistics
  calculateStatistics(values) {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    // Standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: Math.round(mean * 100) / 100,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.round(stdDev * 100) / 100,
      latest: values[values.length - 1],
      previous: values.length > 1 ? values[values.length - 2] : null,
      change: values.length > 1 ? 
        Math.round((values[values.length - 1] - values[values.length - 2]) * 100) / 100 : null,
      changePercent: values.length > 1 && values[values.length - 2] !== 0 ?
        Math.round(((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2]) * 10000) / 100 : null
    };
  }
  
  // Calculate trend direction
  calculateTrend(values) {
    if (values.length < 2) return { direction: 'stable', confidence: 0 };
    
    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    // Calculate R-squared for confidence
    const predictions = values.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - predictions[i], 2), 0);
    const ssTot = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0);
    const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
    
    // Determine direction based on slope relative to mean
    const slopePercent = yMean !== 0 ? (slope / yMean) * 100 : 0;
    
    let direction;
    if (Math.abs(slopePercent) < 1) {
      direction = 'stable';
    } else if (slopePercent > 5) {
      direction = 'increasing_rapidly';
    } else if (slopePercent > 0) {
      direction = 'increasing';
    } else if (slopePercent < -5) {
      direction = 'decreasing_rapidly';
    } else {
      direction = 'decreasing';
    }
    
    return {
      direction,
      slope: Math.round(slope * 1000) / 1000,
      confidence: Math.round(rSquared * 100),
      slopePercent: Math.round(slopePercent * 100) / 100
    };
  }
  
  // Generate analysis text
  generateAnalysis(labName, values, normalRange, trend) {
    const latest = values[values.length - 1];
    const analysis = [];
    
    // Current status
    if (normalRange) {
      if (latest < normalRange.min) {
        analysis.push(`Current ${labName} is below normal range (${latest} ${normalRange.unit})`);
      } else if (latest > normalRange.max) {
        analysis.push(`Current ${labName} is above normal range (${latest} ${normalRange.unit})`);
      } else {
        analysis.push(`Current ${labName} is within normal range (${latest} ${normalRange.unit})`);
      }
    }
    
    // Trend analysis
    if (trend.direction === 'increasing_rapidly') {
      analysis.push('Values are increasing rapidly - recommend close monitoring');
    } else if (trend.direction === 'decreasing_rapidly') {
      analysis.push('Values are decreasing rapidly - recommend evaluation');
    } else if (trend.direction === 'increasing') {
      analysis.push('Values show gradual upward trend');
    } else if (trend.direction === 'decreasing') {
      analysis.push('Values show gradual downward trend');
    } else {
      analysis.push('Values are relatively stable');
    }
    
    // Critical value check
    if (normalRange?.criticalLow && latest < normalRange.criticalLow) {
      analysis.unshift(`⚠️ CRITICAL LOW VALUE - Immediate attention required`);
    } else if (normalRange?.criticalHigh && latest > normalRange.criticalHigh) {
      analysis.unshift(`⚠️ CRITICAL HIGH VALUE - Immediate attention required`);
    }
    
    return analysis;
  }
  
  // Generate alerts
  generateAlerts(labName, values, normalRange) {
    const alerts = [];
    const latest = values[values.length - 1];
    
    if (!normalRange) return alerts;
    
    if (normalRange.criticalLow && latest < normalRange.criticalLow) {
      alerts.push({ type: 'critical', message: `${labName} critically low: ${latest}` });
    } else if (normalRange.criticalHigh && latest > normalRange.criticalHigh) {
      alerts.push({ type: 'critical', message: `${labName} critically high: ${latest}` });
    } else if (latest < normalRange.min) {
      alerts.push({ type: 'abnormal', message: `${labName} below normal: ${latest}` });
    } else if (latest > normalRange.max) {
      alerts.push({ type: 'abnormal', message: `${labName} above normal: ${latest}` });
    }
    
    // Check for significant change
    if (values.length >= 2) {
      const previous = values[values.length - 2];
      const changePercent = ((latest - previous) / previous) * 100;
      
      if (Math.abs(changePercent) > 20) {
        alerts.push({
          type: 'change',
          message: `${labName} changed ${changePercent > 0 ? '+' : ''}${Math.round(changePercent)}% from previous`
        });
      }
    }
    
    return alerts;
  }
  
  // Get value status
  getValueStatus(value, normalRange) {
    if (!normalRange) return 'unknown';
    
    if (normalRange.criticalLow && value < normalRange.criticalLow) return 'critical_low';
    if (normalRange.criticalHigh && value > normalRange.criticalHigh) return 'critical_high';
    if (value < normalRange.min) return 'low';
    if (value > normalRange.max) return 'high';
    return 'normal';
  }
  
  // Get date filter based on time range
  getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1m': return new Date(now.setMonth(now.getMonth() - 1));
      case '3m': return new Date(now.setMonth(now.getMonth() - 3));
      case '6m': return new Date(now.setMonth(now.getMonth() - 6));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      case '2y': return new Date(now.setFullYear(now.getFullYear() - 2));
      case '5y': return new Date(now.setFullYear(now.getFullYear() - 5));
      default: return new Date(now.setFullYear(now.getFullYear() - 1));
    }
  }
  
  // Get normal ranges
  getNormalRanges() {
    return this.normalRanges;
  }
}

module.exports = new LabTrendingService();

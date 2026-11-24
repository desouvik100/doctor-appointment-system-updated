

const AttendanceRecord = require('../models/AttendanceRecord');
const BranchStaff = require('../models/BranchStaff');
const HospitalBranch = require('../models/HospitalBranch');
const mongoose = require('mongoose');

class AttendanceAnalyticsService {
  
  async getAverageTimings(orgId, dateRange, filters = {}) {
    const matchStage = {
      organizationId: orgId,
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    };

    if (filters.staffId) matchStage.staffId = filters.staffId;
    if (filters.branchId) matchStage.branchId = filters.branchId;

    const records = await AttendanceRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { staffId: '$staffId', eventType: '$eventType' },
          timestamps: { $push: '$timestamp' }
        }
      }
    ]);
    const staffTimings = {};
    
    for (const record of records) {
      const staffId = record._id.staffId.toString();
      const eventType = record._id.eventType;
      
      if (!staffTimings[staffId]) {
        staffTimings[staffId] = { avgCheckIn: null, avgCheckOut: null };
      }
      const avgMinutes = this._calculateAverageTimeOfDay(record.timestamps);
      
      if (eventType === 'check_in') {
        staffTimings[staffId].avgCheckIn = avgMinutes;
        staffTimings[staffId].avgCheckInFormatted = this._minutesToTimeString(avgMinutes);
      } else {
        staffTimings[staffId].avgCheckOut = avgMinutes;
        staffTimings[staffId].avgCheckOutFormatted = this._minutesToTimeString(avgMinutes);
      }
    }

    return staffTimings;
  }

  async getHoursWorked(orgId, dateRange, groupBy = 'day') {
    const matchStage = {
      organizationId: orgId,
      eventType: 'check_out',
      shiftDuration: { $exists: true, $ne: null },
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    };

    const groupByExpression = this._getGroupByExpression(groupBy);

    const results = await AttendanceRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            staffId: '$staffId',
            period: groupByExpression
          },
          totalMinutes: { $sum: '$shiftDuration' },
          shiftCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.staffId',
          periods: {
            $push: {
              period: '$_id.period',
              totalMinutes: '$totalMinutes',
              totalHours: { $divide: ['$totalMinutes', 60] },
              shiftCount: '$shiftCount'
            }
          },
          grandTotalMinutes: { $sum: '$totalMinutes' },
          totalShifts: { $sum: '$shiftCount' }
        }
      }
    ]);
    const hoursWorked = {};
    for (const result of results) {
      hoursWorked[result._id.toString()] = {
        totalMinutes: result.grandTotalMinutes,
        totalHours: Math.round((result.grandTotalMinutes / 60) * 100) / 100,
        totalShifts: result.totalShifts,
        periods: result.periods.map(p => ({
          ...p,
          totalHours: Math.round((p.totalMinutes / 60) * 100) / 100
        }))
      };
    }

    return hoursWorked;
  }

  _calculateAverageTimeOfDay(timestamps) {
    if (!timestamps || timestamps.length === 0) return null;

    const totalMinutes = timestamps.reduce((sum, ts) => {
      const date = new Date(ts);
      return sum + (date.getHours() * 60 + date.getMinutes());
    }, 0);

    return Math.round(totalMinutes / timestamps.length);
  }

  _minutesToTimeString(minutes) {
    if (minutes === null || minutes === undefined) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  _timeStringToMinutes(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  _getGroupByExpression(groupBy) {
    switch (groupBy) {
      case 'week':
        return { $isoWeek: '$timestamp' };
      case 'month':
        return { $month: '$timestamp' };
      default: 
        return { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
    }
  }

  async getLateArrivals(orgId, dateRange, thresholdMinutes = 0) {
    const checkIns = await AttendanceRecord.find({
      organizationId: orgId,
      eventType: 'check_in',
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    }).populate('staffId', 'name scheduledStartTime');

    const lateArrivals = [];

    for (const record of checkIns) {
      if (!record.staffId?.scheduledStartTime) continue;

      const scheduledMinutes = this._timeStringToMinutes(record.staffId.scheduledStartTime);
      const actualDate = new Date(record.timestamp);
      const actualMinutes = actualDate.getHours() * 60 + actualDate.getMinutes();

      const deviationMinutes = actualMinutes - scheduledMinutes;

      if (deviationMinutes > thresholdMinutes) {
        lateArrivals.push({
          staffId: record.staffId._id,
          staffName: record.staffId.name,
          date: actualDate.toISOString().split('T')[0],
          scheduledTime: record.staffId.scheduledStartTime,
          actualTime: this._minutesToTimeString(actualMinutes),
          deviationMinutes: deviationMinutes,
          recordId: record._id
        });
      }
    }

    return lateArrivals;
  }

  async getEarlyDepartures(orgId, dateRange, thresholdMinutes = 0) {
    const checkOuts = await AttendanceRecord.find({
      organizationId: orgId,
      eventType: 'check_out',
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    }).populate('staffId', 'name scheduledEndTime');

    const earlyDepartures = [];

    for (const record of checkOuts) {
      if (!record.staffId?.scheduledEndTime) continue;

      const scheduledMinutes = this._timeStringToMinutes(record.staffId.scheduledEndTime);
      const actualDate = new Date(record.timestamp);
      const actualMinutes = actualDate.getHours() * 60 + actualDate.getMinutes();

      const deviationMinutes = scheduledMinutes - actualMinutes;

      if (deviationMinutes > thresholdMinutes) {
        earlyDepartures.push({
          staffId: record.staffId._id,
          staffName: record.staffId.name,
          date: actualDate.toISOString().split('T')[0],
          scheduledTime: record.staffId.scheduledEndTime,
          actualTime: this._minutesToTimeString(actualMinutes),
          deviationMinutes: deviationMinutes,
          recordId: record._id
        });
      }
    }

    return earlyDepartures;
  }

  async getOvertimeReport(orgId, dateRange, standardHoursPerDay = 8) {
    const standardMinutesPerDay = standardHoursPerDay * 60;
    const checkOuts = await AttendanceRecord.find({
      organizationId: orgId,
      eventType: 'check_out',
      shiftDuration: { $exists: true, $ne: null },
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    }).populate('staffId', 'name');
    const staffOvertime = {};

    for (const record of checkOuts) {
      if (!record.staffId) continue;

      const staffId = record.staffId._id.toString();
      
      if (!staffOvertime[staffId]) {
        staffOvertime[staffId] = {
          staffId: record.staffId._id,
          staffName: record.staffId.name,
          totalMinutesWorked: 0,
          totalOvertimeMinutes: 0,
          dailyRecords: [],
          shiftCount: 0
        };
      }

      const dailyOvertimeMinutes = Math.max(0, record.shiftDuration - standardMinutesPerDay);
      const date = new Date(record.timestamp).toISOString().split('T')[0];

      staffOvertime[staffId].totalMinutesWorked += record.shiftDuration;
      staffOvertime[staffId].totalOvertimeMinutes += dailyOvertimeMinutes;
      staffOvertime[staffId].shiftCount += 1;
      staffOvertime[staffId].dailyRecords.push({
        date,
        minutesWorked: record.shiftDuration,
        overtimeMinutes: dailyOvertimeMinutes,
        hoursWorked: Math.round((record.shiftDuration / 60) * 100) / 100,
        overtimeHours: Math.round((dailyOvertimeMinutes / 60) * 100) / 100
      });
    }
    for (const staffId in staffOvertime) {
      const data = staffOvertime[staffId];
      data.totalHoursWorked = Math.round((data.totalMinutesWorked / 60) * 100) / 100;
      data.totalOvertimeHours = Math.round((data.totalOvertimeMinutes / 60) * 100) / 100;
      data.averageHoursPerShift = data.shiftCount > 0 
        ? Math.round((data.totalMinutesWorked / data.shiftCount / 60) * 100) / 100 
        : 0;
    }

    return staffOvertime;
  }

  calculateOvertimeMinutes(shiftDurationMinutes, standardMinutes) {
    return Math.max(0, shiftDurationMinutes - standardMinutes);
  }

  async getBranchComparison(orgId, dateRange, filters = {}) {
    const orgObjectId = typeof orgId === 'string' 
      ? new mongoose.Types.ObjectId(orgId) 
      : orgId;
    const branches = await HospitalBranch.find({ 
      organizationId: orgObjectId, 
      isActive: true 
    });

    if (branches.length === 0) {
      return { branches: [], summary: {} };
    }

    const branchIds = branches.map(b => b._id);
    const branchMap = new Map(branches.map(b => [b._id.toString(), b]));
    const matchStage = {
      organizationId: orgObjectId,
      branchId: { $in: branchIds },
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    };
    const staffQuery = { 
      organizationId: orgObjectId, 
      branchId: { $in: branchIds },
      isActive: true 
    };
    if (filters.role) {
      staffQuery.role = filters.role;
    }

    const staffByBranch = await BranchStaff.aggregate([
      { $match: staffQuery },
      { $group: { _id: '$branchId', staffCount: { $sum: 1 } } }
    ]);

    const staffCountMap = new Map(
      staffByBranch.map(s => [s._id.toString(), s.staffCount])
    );
    const hoursWorkedAgg = await AttendanceRecord.aggregate([
      { 
        $match: { 
          ...matchStage, 
          eventType: 'check_out',
          shiftDuration: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$branchId',
          totalMinutes: { $sum: '$shiftDuration' },
          shiftCount: { $sum: 1 }
        }
      }
    ]);

    const hoursWorkedMap = new Map(
      hoursWorkedAgg.map(h => [h._id.toString(), {
        totalMinutes: h.totalMinutes,
        shiftCount: h.shiftCount
      }])
    );
    const peakHoursAgg = await AttendanceRecord.aggregate([
      { $match: { ...matchStage, eventType: 'check_in' } },
      {
        $project: {
          branchId: 1,
          hour: { $hour: '$timestamp' }
        }
      },
      {
        $group: {
          _id: { branchId: '$branchId', hour: '$hour' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $group: {
          _id: '$_id.branchId',
          peakHour: { $first: '$_id.hour' },
          peakCount: { $first: '$count' }
        }
      }
    ]);

    const peakHoursMap = new Map(
      peakHoursAgg.map(p => [p._id.toString(), {
        peakHour: p.peakHour,
        peakCount: p.peakCount
      }])
    );
    const branchResults = branches.map(branch => {
      const branchIdStr = branch._id.toString();
      const staffCount = staffCountMap.get(branchIdStr) || 0;
      const hoursData = hoursWorkedMap.get(branchIdStr) || { totalMinutes: 0, shiftCount: 0 };
      const peakData = peakHoursMap.get(branchIdStr) || { peakHour: null, peakCount: 0 };

      const totalHours = Math.round((hoursData.totalMinutes / 60) * 100) / 100;
      const avgHoursPerStaff = staffCount > 0 
        ? Math.round((totalHours / staffCount) * 100) / 100 
        : 0;

      return {
        branchId: branch._id,
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        staffCount,
        totalHoursWorked: totalHours,
        totalMinutesWorked: hoursData.totalMinutes,
        shiftCount: hoursData.shiftCount,
        avgHoursPerStaff,
        peakHour: peakData.peakHour,
        peakHourFormatted: peakData.peakHour !== null 
          ? `${String(peakData.peakHour).padStart(2, '0')}:00` 
          : null,
        peakCheckInCount: peakData.peakCount,
        normalizedHours: avgHoursPerStaff,
        normalizedShifts: staffCount > 0 
          ? Math.round((hoursData.shiftCount / staffCount) * 100) / 100 
          : 0
      };
    });
    const totalStaff = branchResults.reduce((sum, b) => sum + b.staffCount, 0);
    const totalHours = branchResults.reduce((sum, b) => sum + b.totalHoursWorked, 0);
    const avgHoursPerBranch = branchResults.length > 0 
      ? Math.round((totalHours / branchResults.length) * 100) / 100 
      : 0;

    return {
      branches: branchResults,
      summary: {
        totalBranches: branches.length,
        totalStaff,
        totalHoursWorked: Math.round(totalHours * 100) / 100,
        avgHoursPerBranch,
        dateRange
      }
    };
  }

  calculateBranchStaffCount(staffList, branchId) {
    return staffList.filter(s => 
      s.branchId && s.branchId.toString() === branchId.toString() && s.isActive
    ).length;
  }

  calculateNormalizedHours(totalHours, staffCount) {
    if (staffCount === 0) return 0;
    return Math.round((totalHours / staffCount) * 100) / 100;
  }

  calculatePeakHour(checkInRecords) {
    if (!checkInRecords || checkInRecords.length === 0) {
      return { peakHour: null, count: 0 };
    }

    const hourCounts = {};
    for (const record of checkInRecords) {
      const hour = new Date(record.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    let peakHour = null;
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    }

    return { peakHour, count: maxCount };
  }

  async detectPatterns(orgId, dateRange, consecutiveThreshold = 3) {
    const lateArrivals = await this.getLateArrivals(orgId, dateRange, 0);
    const earlyDepartures = await this.getEarlyDepartures(orgId, dateRange, 0);
    const lateByStaff = this._groupByStaff(lateArrivals);
    const earlyByStaff = this._groupByStaff(earlyDepartures);

    const patterns = [];
    for (const [staffId, records] of Object.entries(lateByStaff)) {
      const consecutiveCount = this.detectConsecutivePattern(
        records.map(r => r.date)
      );
      
      if (consecutiveCount >= consecutiveThreshold) {
        patterns.push({
          staffId,
          staffName: records[0]?.staffName || 'Unknown',
          patternType: 'consecutive_late_arrivals',
          consecutiveCount,
          totalOccurrences: records.length,
          dates: records.map(r => r.date),
          severity: this._calculateSeverity(consecutiveCount, consecutiveThreshold)
        });
      }
    }
    for (const [staffId, records] of Object.entries(earlyByStaff)) {
      const consecutiveCount = this.detectConsecutivePattern(
        records.map(r => r.date)
      );
      
      if (consecutiveCount >= consecutiveThreshold) {
        patterns.push({
          staffId,
          staffName: records[0]?.staffName || 'Unknown',
          patternType: 'consecutive_early_departures',
          consecutiveCount,
          totalOccurrences: records.length,
          dates: records.map(r => r.date),
          severity: this._calculateSeverity(consecutiveCount, consecutiveThreshold)
        });
      }
    }

    return patterns;
  }

  async getExcessiveOvertime(orgId, dateRange, thresholdHours = 10, standardHoursPerDay = 8) {
    const overtimeReport = await this.getOvertimeReport(orgId, dateRange, standardHoursPerDay);
    
    const excessiveOvertimeStaff = [];
    
    for (const [staffId, data] of Object.entries(overtimeReport)) {
      if (data.totalOvertimeHours >= thresholdHours) {
        excessiveOvertimeStaff.push({
          staffId: data.staffId,
          staffName: data.staffName,
          totalOvertimeHours: data.totalOvertimeHours,
          totalOvertimeMinutes: data.totalOvertimeMinutes,
          totalHoursWorked: data.totalHoursWorked,
          shiftCount: data.shiftCount,
          thresholdExceededBy: Math.round((data.totalOvertimeHours - thresholdHours) * 100) / 100,
          severity: this._calculateOvertimeSeverity(data.totalOvertimeHours, thresholdHours)
        });
      }
    }

    return excessiveOvertimeStaff.sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
  }

  detectConsecutivePattern(dates) {
    if (!dates || dates.length === 0) return 0;
    if (dates.length === 1) return 1;
    const sortedDates = [...dates].sort();
    
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else if (diffDays > 1) {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  exceedsOvertimeThreshold(totalOvertimeHours, thresholdHours) {
    return totalOvertimeHours >= thresholdHours;
  }

  async exportToCSV(orgId, dateRange) {
    const records = await AttendanceRecord.find({
      organizationId: orgId,
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      }
    })
    .populate('staffId', 'name scheduledStartTime scheduledEndTime')
    .sort({ timestamp: 1 });
    const lateArrivals = await this.getLateArrivals(orgId, dateRange, 0);
    const earlyDepartures = await this.getEarlyDepartures(orgId, dateRange, 0);
    const overtimeReport = await this.getOvertimeReport(orgId, dateRange, 8);
    const lateRecordIds = new Set(lateArrivals.map(r => r.recordId?.toString()));
    const earlyRecordIds = new Set(earlyDepartures.map(r => r.recordId?.toString()));
    const overtimeStaffIds = new Set(
      Object.values(overtimeReport)
        .filter(r => r.totalOvertimeHours > 0)
        .map(r => r.staffId?.toString())
    );
    const rows = this.buildCSVRows(records, lateRecordIds, earlyRecordIds, overtimeStaffIds);
    const header = 'staffName,date,checkInTime,checkOutTime,shiftDuration,customStatus,isLate,isEarly,hasOvertime';
    
    return header + '\n' + rows.join('\n');
  }

  buildCSVRows(records, lateRecordIds, earlyRecordIds, overtimeStaffIds) {
    const groupedRecords = {};
    
    for (const record of records) {
      const staffId = record.staffId?._id?.toString() || 'unknown';
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      const key = `${staffId}_${date}`;
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          staffName: record.staffId?.name || 'Unknown',
          staffId,
          date,
          checkIn: null,
          checkOut: null,
          shiftDuration: null,
          customStatus: null,
          checkInRecordId: null,
          checkOutRecordId: null
        };
      }
      
      if (record.eventType === 'check_in') {
        groupedRecords[key].checkIn = record.timestamp;
        groupedRecords[key].checkInRecordId = record._id?.toString();
        if (record.customStatus) {
          groupedRecords[key].customStatus = record.customStatus;
        }
      } else if (record.eventType === 'check_out') {
        groupedRecords[key].checkOut = record.timestamp;
        groupedRecords[key].checkOutRecordId = record._id?.toString();
        groupedRecords[key].shiftDuration = record.shiftDuration;
      }
    }
    const rows = [];
    for (const data of Object.values(groupedRecords)) {
      const checkInTime = data.checkIn 
        ? this._minutesToTimeString(new Date(data.checkIn).getHours() * 60 + new Date(data.checkIn).getMinutes())
        : '';
      const checkOutTime = data.checkOut
        ? this._minutesToTimeString(new Date(data.checkOut).getHours() * 60 + new Date(data.checkOut).getMinutes())
        : '';
      const shiftDurationHours = data.shiftDuration 
        ? Math.round((data.shiftDuration / 60) * 100) / 100
        : '';
      
      const isLate = data.checkInRecordId && lateRecordIds.has(data.checkInRecordId) ? 'Yes' : 'No';
      const isEarly = data.checkOutRecordId && earlyRecordIds.has(data.checkOutRecordId) ? 'Yes' : 'No';
      const hasOvertime = overtimeStaffIds.has(data.staffId) ? 'Yes' : 'No';
      const escapedName = this._escapeCSV(data.staffName);
      const escapedStatus = this._escapeCSV(data.customStatus || '');
      
      rows.push(`${escapedName},${data.date},${checkInTime},${checkOutTime},${shiftDurationHours},${escapedStatus},${isLate},${isEarly},${hasOvertime}`);
    }

    return rows;
  }

  _groupByStaff(records) {
    const grouped = {};
    for (const record of records) {
      const staffId = record.staffId?.toString() || 'unknown';
      if (!grouped[staffId]) {
        grouped[staffId] = [];
      }
      grouped[staffId].push(record);
    }
    return grouped;
  }

  _calculateSeverity(count, threshold) {
    const ratio = count / threshold;
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  _calculateOvertimeSeverity(overtimeHours, threshold) {
    const ratio = overtimeHours / threshold;
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  _escapeCSV(value) {
    if (!value) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

module.exports = new AttendanceAnalyticsService();

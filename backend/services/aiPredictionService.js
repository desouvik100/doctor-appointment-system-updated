

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const doctorAvgTimes = new Map();

async function getDoctorAverageConsultationTime(doctorId) {
  const cached = doctorAvgTimes.get(doctorId.toString());
  if (cached && Date.now() - cached.timestamp < 3600000) {
   return cached.avgTime;
  }

  try {
   const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const completedAppointments = await Appointment.find({
      doctorId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
      meetingStartTime: { $exists: true },
      meetingEndTime: { $exists: true }
   }).select('meetingStartTime meetingEndTime consultationType');

    if (completedAppointments.length < 5) {
      const doctor = await Doctor.findById(doctorId).select('consultationDuration');
      return doctor?.consultationDuration || 15;
    }
    let totalMinutes = 0;
    let validCount = 0;

    completedAppointments.forEach(apt => {
      if (apt.meetingStartTime && apt.meetingEndTime) {
        const duration = (new Date(apt.meetingEndTime) - new Date(apt.meetingStartTime)) / 60000;
        if (duration >= 5 && duration <= 60) {
          totalMinutes += duration;
          validCount++;
        }
     }
    });

    const avgTime = validCount > 0 ? Math.round(totalMinutes / validCount) : 15;
   doctorAvgTimes.set(doctorId.toString(), {
      avgTime,
      timestamp: Date.now(),
      sampleSize: validCount
    });

    return avgTime;
  } catch (error) {
    console.error('Error calculating average consultation time:', error);
    return 15; 
  }
}

function getTimeOfDayFactor(hour) {
  if (hour >= 9 && hour < 11) return 1.0;
  if (hour >= 11 && hour < 13) return 0.95;
  if (hour >= 14 && hour < 16) return 1.1;
  if (hour >= 16 && hour < 19) return 1.0;
  return 1.0;
}

function getDayOfWeekFactor(dayOfWeek) {
  const factors = {
    0: 0.9,  
   1: 1.15, 
    2: 1.05, 
    3: 1.0,  
    4: 1.0,  
    5: 1.1,  
    6: 0.95  
  };
  return factors[dayOfWeek] || 1.0;
}

async function predictWaitTime(doctorId, queuePosition, appointmentTime) {
  try {
    const avgConsultationTime = await getDoctorAverageConsultationTime(doctorId);
    const now = new Date();
   const timeOfDayFactor = getTimeOfDayFactor(now.getHours());
    const dayOfWeekFactor = getDayOfWeekFactor(now.getDay());
    const baseWaitMinutes = (queuePosition - 1) * avgConsultationTime;
    const adjustedWaitMinutes = Math.round(
      baseWaitMinutes * timeOfDayFactor * dayOfWeekFactor
    );
    const bufferTime = (queuePosition - 1) * 2;
    
    const totalPredictedWait = adjustedWaitMinutes + bufferTime;
    const cached = doctorAvgTimes.get(doctorId.toString());
    const confidence = cached?.sampleSize >= 20 ? 'high' : 
                      cached?.sampleSize >= 10 ? 'medium' : 'low';
    
    return {
      predictedWaitMinutes: totalPredictedWait,
      avgConsultationTime,
      confidence,
      factors: {
       timeOfDay: timeOfDayFactor,
        dayOfWeek: dayOfWeekFactor
      },
      estimatedCallTime: new Date(Date.now() + totalPredictedWait * 60000)
    };
  } catch (error) {
   console.error('Error predicting wait time:', error);
    return {
      predictedWaitMinutes: queuePosition * 15,
      confidence: 'low',
      error: error.message
    };
  }
}

async function predictNoShowRisk(userId, appointmentDetails) {
  try {
    const pastAppointments = await Appointment.find({
      userId,
      date: { $lt: new Date() }
    }).select('status date time').sort({ date: -1 }).limit(20);

    if (pastAppointments.length === 0) {
      return {
       riskScore: 30,
        riskLevel: 'medium',
        factors: ['new_patient'],
        recommendation: 'Send reminder 2 hours before appointment'
      };
    }

    let riskScore = 0;
   const factors = [];
    const noShows = pastAppointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length;
    const noShowRate = noShows / pastAppointments.length;
    riskScore += noShowRate * 40;
    if (noShowRate > 0.3) factors.push('high_cancellation_history');
    const recentAppointments = pastAppointments.slice(0, 5);
    const recentNoShows = recentAppointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length;
    riskScore += (recentNoShows / 5) * 20;
    if (recentNoShows >= 2) factors.push('recent_cancellations');
    if (appointmentDetails?.time) {
      const hour = parseInt(appointmentDetails.time.split(':')[0]);
      if (hour < 10 || hour >= 18) {
       riskScore += 10;
        factors.push('off_peak_time');
      }
    }
    if (appointmentDetails?.date) {
      const dayOfWeek = new Date(appointmentDetails.date).getDay(); 
     if (dayOfWeek === 1 || dayOfWeek === 5) {
        riskScore += 8;
        factors.push('high_noshow_day');
     }
    }
    if (appointmentDetails?.date) {
      const daysInAdvance = Math.floor(
        (new Date(appointmentDetails.date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysInAdvance > 7) {
        riskScore += 12;
        factors.push('far_advance_booking');
      }
    }
    let riskLevel, recommendation;
   if (riskScore >= 60) {
      riskLevel = 'high';
      recommendation = 'Require confirmation 24h before. Consider overbooking slot.';
    } else if (riskScore >= 35) {
      riskLevel = 'medium';
      recommendation = 'Send multiple reminders (24h, 2h before)';
    } else {
      riskLevel = 'low';
      recommendation = 'Standard reminder sufficient';
    }

    return {
      riskScore: Math.round(riskScore), 
      riskLevel,
      factors,
      recommendation,
      historicalNoShowRate: Math.round(noShowRate * 100) + '%'
    };
  } catch (error) {
    console.error('Error predicting no-show risk:', error);
    return {
     riskScore: 25,
      riskLevel: 'medium',
      factors: ['prediction_error'],
      recommendation: 'Send standard reminders'
    };
  }
}

async function getOptimalSlots(doctorId, date) {
  try {
    const doctor = await Doctor.findById(doctorId)
      .select('consultationDuration weeklySchedule');
    
    const consultationDuration = doctor?.consultationDuration || 30;
    const dayOfWeek = new Date(date).getDay();
   const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = doctor?.weeklySchedule?.[dayNames[dayOfWeek]];

    if (!daySchedule?.isWorking) {
      return { slots: [], message: 'Doctor not available on this day' };
    }
    const existingAppointments = await Appointment.find({
      doctorId,
      date: {
       $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      },
      status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).select('time queueNumber');

    const bookedTimes = existingAppointments.map(a => a.time);
    const slots = [];
    const startHour = parseInt(daySchedule.startTime?.split(':')[0]) || 9;
    const endHour = parseInt(daySchedule.endTime?.split(':')[0]) || 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      if (hour === 13) continue;
      
      for (let min = 0; min < 60; min += consultationDuration) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const isBooked = bookedTimes.includes(timeStr);
       let score = 50; 
        if (hour >= 10 && hour <= 12) score += 20;
        if (hour >= 15 && hour <= 17) score += 15;
        if (hour < 10) score -= 10;
        if (hour >= 18) score -= 15;
        if (hour === 14 && min === 0) score -= 10;
         
       slots.push({
          time: timeStr,
          isAvailable: !isBooked,
          score: isBooked ? 0 : score,
          recommendation: score >= 60 ? 'optimal' : score >= 40 ? 'good' : 'available'
        });
      }
    }
   const availableSlots = slots
      .filter(s => s.isAvailable)
      .sort((a, b) => b.score - a.score);

    return {
      slots: availableSlots,
      totalSlots: slots.length,
      bookedSlots: bookedTimes.length,
      availableCount: availableSlots.length,
     optimalSlots: availableSlots.filter(s => s.recommendation === 'optimal').slice(0, 3)
    };
  } catch (error) {
   console.error('Error getting optimal slots:', error);
    return { slots: [], error: error.message };
  }
}

async function suggestBestAppointmentTime(doctorId, patientId, preferredDate) {
  try {
    const { optimalSlots, availableCount } = await getOptimalSlots(doctorId, preferredDate);
    const noShowRisk = await predictNoShowRisk(patientId, { date: preferredDate });
    const avgTime = await getDoctorAverageConsultationTime(doctorId);
    
    let suggestion = {
      recommendedSlots: optimalSlots,
      availableCount,
      avgConsultationTime: avgTime
    };
    if (noShowRisk.riskLevel === 'high') {
      suggestion.note = 'Earlier slots recommended for this patient (easier to fill if rescheduled)';
      suggestion.recommendedSlots = optimalSlots.filter(s => {
        const hour = parseInt(s.time.split(':')[0]);
        return hour < 14;
      }).slice(0, 3);
    }

   return suggestion;
  } catch (error) {
    console.error('Error suggesting appointment time:', error);
    return { error: error.message };
  }
}

module.exports = {
  predictWaitTime,
  getDoctorAverageConsultationTime,
  predictNoShowRisk,
  getOptimalSlots,
  suggestBestAppointmentTime
};

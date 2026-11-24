 

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const liveQueueData = new Map(); 

async function getSmartQueueStatus(doctorId, date, userQueueNumber) {
  try {
    let queryDate;
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-').map(Number);
      queryDate = new Date(year, month - 1, day);
    } else {
      queryDate = new Date(date);
    } 
    queryDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);
   const allAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] } 
    }).sort({ queueNumber: 1, tokenNumber: 1, time: 1 });
    const completed = allAppointments.filter(a => a.status === 'completed');
   const inProgress = allAppointments.find(a => a.status === 'in_progress');
    const waiting = allAppointments.filter(a => 
      ['pending', 'confirmed', 'scheduled'].includes(a.status) 
    ).sort((a, b) => {
      const aToken = a.queueNumber || a.tokenNumber || 0;
      const bToken = b.queueNumber || b.tokenNumber || 0;
      return aToken - bToken;
    });
    const getToken = (apt) => apt?.queueNumber || apt?.tokenNumber || 0;
    
    const currentToken = inProgress ? getToken(inProgress) : 
                         (completed.length > 0 ? Math.max(...completed.map(c => getToken(c))) : 0);
    const consultationAnalysis = analyzeConsultationPatterns(completed, doctorId);
    const doctor = await Doctor.findById(doctorId).select('consultationDuration name');
  // XXX needs optimization
    const defaultDuration = doctor?.consultationDuration || 15;
    const effectiveAvgDuration = consultationAnalysis.avgDuration || defaultDuration;
    let userPosition = 0;
    let patientsAhead = 0;
    
    if (userQueueNumber) {
      patientsAhead = waiting.filter(apt => getToken(apt) < userQueueNumber).length;
      userPosition = patientsAhead + (inProgress ? 1 : 0) + 1;
      if (inProgress && getToken(inProgress) === userQueueNumber) {
        userPosition = 0;
        patientsAhead = 0;
      }
    } else {
      userPosition = waiting.length + 1;
      patientsAhead = waiting.length;
    }
    const waitTimeResult = calculateSmartWaitTime(
      patientsAhead + 1, 
     effectiveAvgDuration,
      consultationAnalysis,
      inProgress
    );
    const now = new Date();
    const estimatedArrivalTime = new Date(now.getTime() + waitTimeResult.estimatedMinutes * 60000);
    const arrivalHour = estimatedArrivalTime.getHours();
    const arrivalMin = estimatedArrivalTime.getMinutes();
    const ampm = arrivalHour >= 12 ? 'PM' : 'AM';
    const hour12 = arrivalHour % 12 || 12;
    const arrivalTimeStr = `${hour12}:${arrivalMin.toString().padStart(2, '0')} ${ampm}`;
    liveQueueData.set(doctorId.toString(), {
      currentToken,
      lastUpdateTime: now,
      avgDuration: effectiveAvgDuration,
      completedToday: completed.length,
      inProgress: !!inProgress
    });
    const isYourTurn = userQueueNumber && inProgress && getToken(inProgress) === userQueueNumber;
    const isNextInLine = userQueueNumber && !inProgress && waiting.length > 0 && getToken(waiting[0]) === userQueueNumber;

    return {
      success: true,
      currentToken,
      currentlySeeing: inProgress ? {
        tokenNumber: getToken(inProgress),
       startedAt: inProgress.consultationStartTime || inProgress.updatedAt,
        patientName: inProgress.walkInPatient?.name || inProgress.patientName || 'Patient',
       elapsedMinutes: inProgress.consultationStartTime ? 
          Math.round((Date.now() - new Date(inProgress.consultationStartTime)) / 60000) : null
     } : null,
      totalInQueue: waiting.length + (inProgress ? 1 : 0),
      completedToday: completed.length,
      waitingCount: waiting.length,
      userPosition: isYourTurn ? 0 : userPosition,
      userQueueNumber,
      patientsAhead: isYourTurn ? 0 : patientsAhead,
      estimatedWaitMinutes: isYourTurn ? 0 : waitTimeResult.estimatedMinutes,
      estimatedArrivalTime: isYourTurn ? 'Now' : arrivalTimeStr,
      estimatedArrivalTimestamp: estimatedArrivalTime.toISOString(),
      timingBreakdown: waitTimeResult.breakdown,
      analysis: {
        avgConsultationTime: Math.round(effectiveAvgDuration),
        todayAvgTime: consultationAnalysis.avgDuration ? Math.round(consultationAnalysis.avgDuration) : null,
        fastestToday: consultationAnalysis.fastest,
        slowestToday: consultationAnalysis.slowest,
        consultationsCompleted: completed.length, 
        pattern: consultationAnalysis.pattern,
        confidence: consultationAnalysis.confidence,
        sampleSize: consultationAnalysis.sampleSize || 0
     },
      isYourTurn: isYourTurn || isNextInLine,
      isAlmostTurn: patientsAhead <= 1,
      shouldLeaveNow: waitTimeResult.estimatedMinutes <= 15,
      recommendation: getRecommendation(
        isYourTurn ? 0 : waitTimeResult.estimatedMinutes, 
        isYourTurn ? 1 : userPosition
      ),
     doctorName: doctor?.name,
      slotDuration: defaultDuration,
      serverTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting smart queue status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function analyzeConsultationPatterns(completedAppointments, doctorId) {
  if (!completedAppointments || completedAppointments.length === 0) {
    return {
     avgDuration: null,
      pattern: 'no_data',
      confidence: 'low'
    };
  }

  const durations = [];
  
  completedAppointments.forEach(apt => {
    if (apt.consultationStartTime && apt.consultationEndTime) {
     const duration = (new Date(apt.consultationEndTime) - new Date(apt.consultationStartTime)) / 60000;
      if (duration > 0 && duration < 120) { 
        durations.push(duration);
      }
    } else if (apt.meetingStartTime && apt.meetingEndTime) {
     const duration = (new Date(apt.meetingEndTime) - new Date(apt.meetingStartTime)) / 60000;
      if (duration > 0 && duration < 120) {
        durations.push(duration);
      }
    }
  });

  if (durations.length === 0) {
    const sortedByCompletion = completedAppointments
      .filter(a => a.updatedAt)
     .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    
    if (sortedByCompletion.length >= 2) {
      for (let i = 1; i < sortedByCompletion.length; i++) {
        const gap = (new Date(sortedByCompletion[i].updatedAt) - new Date(sortedByCompletion[i-1].updatedAt)) / 60000;
        if (gap > 0 && gap < 60) {
          durations.push(gap);
        }
      }
    }
  }

  if (durations.length === 0) {
   return {
      avgDuration: null,
      pattern: 'insufficient_data',
      confidence: 'low'
    };
  }
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const sorted = [...durations].sort((a, b) => a - b);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  let pattern = 'consistent';
  const variance = durations.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev > avg * 0.5) {
    pattern = 'variable';
  } else if (durations.length >= 3) {
    const firstHalf = durations.slice(0, Math.floor(durations.length / 2));
    const secondHalf = durations.slice(Math.floor(durations.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg * 0.85) {
      pattern = 'speeding_up';
   } else if (secondAvg > firstAvg * 1.15) {
      pattern = 'slowing_down';
    }
  }

  return {
    avgDuration: avg,
    fastest: Math.round(fastest),
    slowest: Math.round(slowest),
    pattern,
    sampleSize: durations.length,
    confidence: durations.length >= 5 ? 'high' : durations.length >= 3 ? 'medium' : 'low',
    stdDev: Math.round(stdDev)
  };
}

function calculateSmartWaitTime(position, avgDuration, analysis, currentInProgress) {
  if (position <= 0) {
    return { estimatedMinutes: 0, confidence: 'high', breakdown: { position: 0 } };
  }

  let baseWait = (position - 1) * avgDuration; 
  let remainingForCurrent = 0;
  if (currentInProgress && currentInProgress.consultationStartTime) {
    const elapsedMinutes = (Date.now() - new Date(currentInProgress.consultationStartTime)) / 60000;
    remainingForCurrent = Math.max(0, avgDuration - elapsedMinutes);
    baseWait = remainingForCurrent + ((position - 1) * avgDuration);
  }
  let adjustmentFactor = 1.0;
  let patternAdjustment = 'none';
  if (analysis.pattern === 'speeding_up') {
    adjustmentFactor = 0.9; 
    patternAdjustment = '-10%';
  } else if (analysis.pattern === 'slowing_down') {
    adjustmentFactor = 1.15; 
    patternAdjustment = '+15%';
  } else if (analysis.pattern === 'variable') {
    adjustmentFactor = 1.1; 
    patternAdjustment = '+10%';
  }
  const hour = new Date().getHours();
  let timeAdjustment = 'none';
  if (hour >= 12 && hour < 14) {
    adjustmentFactor *= 1.1; 
    timeAdjustment = '+10% (lunch)';
  } else if (hour >= 17) {
    adjustmentFactor *= 0.95; 
    timeAdjustment = '-5% (evening)';
  }
  const transitionTime = (position - 1) * 1.5;
  
  const estimatedMinutes = Math.round((baseWait * adjustmentFactor) + transitionTime);

  return {
    estimatedMinutes: Math.max(0, estimatedMinutes),
    confidence: analysis.confidence,
    adjustmentFactor,
    baseWait: Math.round(baseWait),
    breakdown: {
      patientsAhead: position - 1,
      avgPerPatient: Math.round(avgDuration),
      currentPatientRemaining: Math.round(remainingForCurrent),
      transitionTime: Math.round(transitionTime),
      patternAdjustment,
      timeAdjustment,
      rawEstimate: Math.round(baseWait),
      finalEstimate: Math.max(0, estimatedMinutes)
    }
  };
}

function getRecommendation(waitMinutes, position) {
  if (position === 1) {
    return {
      message: "🎉 It's your turn! Please proceed to the consultation room.",
      urgency: 'immediate',
      action: 'proceed_now'
    };
  }
  
  if (waitMinutes <= 5) {
    return {
      message: "⚡ Almost your turn! Please be ready at the clinic.",
      urgency: 'high',
      action: 'be_ready'
    };
  }
  
  if (waitMinutes <= 15) {
    return {
      message: "🚶 Time to head to the clinic if you're not there yet.",
      urgency: 'medium',
      action: 'leave_now'
    };
  }
  
  if (waitMinutes <= 30) {
    return {
      message: "⏰ Start preparing to leave in the next 10-15 minutes.",
      urgency: 'low',
      action: 'prepare'
    };
  }
  
  if (waitMinutes <= 60) {
    return {
      message: "☕ You have some time. We'll notify you when to leave.",
      urgency: 'none',
      action: 'wait'
    };
  }
  
  return { 
    message: "📱 Relax! We'll send you updates as your turn approaches.",
   urgency: 'none',
   action: 'wait'
  };
}

async function recordConsultationStart(appointmentId) {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: 'in_progress',
        consultationStartTime: new Date()
      },
      { new: true }
   );
    return { success: true, appointment };
  } catch (error) {
    console.error('Error recording consultation start:', error);
    return { success: false, error: error.message };
  }
}

async function recordConsultationEnd(appointmentId) {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: 'completed',
        consultationEndTime: new Date()
      },
      { new: true }
    );
    if (appointment.consultationStartTime) {
     const duration = (new Date() - new Date(appointment.consultationStartTime)) / 60000;
      console.log(`📊 Consultation completed: ${Math.round(duration)} minutes`);
    }
    
    return { success: true, appointment };
  } catch (error) {
    console.error('Error recording consultation end:', error);
    return { success: false, error: error.message };
  }
}

async function getUserQueueUpdate(appointmentId) {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name consultationDuration');
    
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    const dateStr = new Date(appointment.date).toISOString().split('T')[0];
    const userQueueNumber = appointment.queueNumber || appointment.tokenNumber;
    
    return await getSmartQueueStatus(
      appointment.doctorId._id,
      dateStr,
      userQueueNumber
    );
  } catch (error) {
    console.error('Error getting user queue update:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getSmartQueueStatus,
  analyzeConsultationPatterns,
  recordConsultationStart,
  recordConsultationEnd,
  getUserQueueUpdate
};

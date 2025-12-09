// backend/services/smartQueueService.js
// Smart Real-Time Queue Analysis Service

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// In-memory cache for real-time tracking
const liveQueueData = new Map(); // doctorId -> { currentToken, lastUpdateTime, avgDuration, completedToday }

/**
 * Get real-time queue status with smart predictions
 */
async function getSmartQueueStatus(doctorId, date, userQueueNumber) {
  try {
    // Parse date correctly
    const [year, month, day] = date.split('-').map(Number);
    const queryDate = new Date(year, month - 1, day);
    queryDate.setHours(0, 0, 0, 0);
    
    const startOfDay = new Date(queryDate);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all appointments for this doctor today
    const allAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ queueNumber: 1, tokenNumber: 1 });

    // Separate by status
    const completed = allAppointments.filter(a => a.status === 'completed');
    const inProgress = allAppointments.find(a => a.status === 'in_progress');
    const waiting = allAppointments.filter(a => 
      ['pending', 'confirmed'].includes(a.status)
    ).sort((a, b) => (a.queueNumber || a.tokenNumber || 0) - (b.queueNumber || b.tokenNumber || 0));

    // Calculate real-time metrics
    const currentToken = inProgress?.queueNumber || inProgress?.tokenNumber || 
                         (completed.length > 0 ? Math.max(...completed.map(c => c.queueNumber || c.tokenNumber || 0)) : 0);
    
    // Analyze consultation patterns from today's completed appointments
    const consultationAnalysis = analyzeConsultationPatterns(completed, doctorId);
    
    // Get doctor's default duration
    const doctor = await Doctor.findById(doctorId).select('consultationDuration name');
    const defaultDuration = doctor?.consultationDuration || 15;
    
    // Use analyzed average or default
    const effectiveAvgDuration = consultationAnalysis.avgDuration || defaultDuration;
    
    // Calculate user's position and wait time
    const userPosition = userQueueNumber ? 
      Math.max(0, userQueueNumber - currentToken) : 
      waiting.length + 1;
    
    // Smart wait time calculation
    const waitTimeResult = calculateSmartWaitTime(
      userPosition,
      effectiveAvgDuration,
      consultationAnalysis,
      inProgress
    );

    // Calculate estimated arrival time
    const now = new Date();
    const estimatedArrivalTime = new Date(now.getTime() + waitTimeResult.estimatedMinutes * 60000);
    
    // Format arrival time
    const arrivalHour = estimatedArrivalTime.getHours();
    const arrivalMin = estimatedArrivalTime.getMinutes();
    const ampm = arrivalHour >= 12 ? 'PM' : 'AM';
    const hour12 = arrivalHour % 12 || 12;
    const arrivalTimeStr = `${hour12}:${arrivalMin.toString().padStart(2, '0')} ${ampm}`;

    // Update live cache
    liveQueueData.set(doctorId.toString(), {
      currentToken,
      lastUpdateTime: now,
      avgDuration: effectiveAvgDuration,
      completedToday: completed.length,
      inProgress: !!inProgress
    });

    return {
      success: true,
      // Current queue state
      currentToken,
      currentlySeeing: inProgress ? {
        tokenNumber: inProgress.queueNumber || inProgress.tokenNumber,
        startedAt: inProgress.consultationStartTime || inProgress.updatedAt,
        patientName: inProgress.walkInPatient?.name || 'Patient'
      } : null,
      
      // Queue counts
      totalInQueue: waiting.length + (inProgress ? 1 : 0),
      completedToday: completed.length,
      waitingCount: waiting.length,
      
      // User's position
      userPosition,
      userQueueNumber,
      patientsAhead: Math.max(0, userPosition - 1),
      
      // Time predictions
      estimatedWaitMinutes: waitTimeResult.estimatedMinutes,
      estimatedArrivalTime: arrivalTimeStr,
      estimatedArrivalTimestamp: estimatedArrivalTime.toISOString(),
      
      // Consultation analysis
      analysis: {
        avgConsultationTime: Math.round(effectiveAvgDuration),
        todayAvgTime: consultationAnalysis.avgDuration ? Math.round(consultationAnalysis.avgDuration) : null,
        fastestToday: consultationAnalysis.fastest,
        slowestToday: consultationAnalysis.slowest,
        consultationsCompleted: completed.length,
        pattern: consultationAnalysis.pattern,
        confidence: consultationAnalysis.confidence
      },
      
      // Status indicators
      isYourTurn: userPosition === 1 && !inProgress,
      isAlmostTurn: userPosition <= 2,
      shouldLeaveNow: waitTimeResult.estimatedMinutes <= 15,
      
      // Recommendations
      recommendation: getRecommendation(waitTimeResult.estimatedMinutes, userPosition),
      
      // Doctor info
      doctorName: doctor?.name,
      slotDuration: defaultDuration
    };
  } catch (error) {
    console.error('Error getting smart queue status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze consultation patterns from completed appointments
 */
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
    // Try to calculate actual duration from timestamps
    if (apt.consultationStartTime && apt.consultationEndTime) {
      const duration = (new Date(apt.consultationEndTime) - new Date(apt.consultationStartTime)) / 60000;
      if (duration > 0 && duration < 120) { // Valid range: 0-120 minutes
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
    // No timing data, estimate from completion times
    const sortedByCompletion = completedAppointments
      .filter(a => a.updatedAt)
      .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    
    if (sortedByCompletion.length >= 2) {
      // Calculate gaps between completions
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

  // Calculate statistics
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const sorted = [...durations].sort((a, b) => a - b);
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  
  // Determine pattern
  let pattern = 'consistent';
  const variance = durations.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev > avg * 0.5) {
    pattern = 'variable';
  } else if (durations.length >= 3) {
    // Check if getting faster or slower
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

/**
 * Calculate smart wait time with multiple factors
 */
function calculateSmartWaitTime(position, avgDuration, analysis, currentInProgress) {
  if (position <= 0) {
    return { estimatedMinutes: 0, confidence: 'high' };
  }

  let baseWait = (position - 1) * avgDuration;
  
  // If someone is currently being seen, estimate remaining time
  if (currentInProgress && currentInProgress.consultationStartTime) {
    const elapsedMinutes = (Date.now() - new Date(currentInProgress.consultationStartTime)) / 60000;
    const remainingForCurrent = Math.max(0, avgDuration - elapsedMinutes);
    baseWait = remainingForCurrent + ((position - 1) * avgDuration);
  }

  // Adjust based on pattern
  let adjustmentFactor = 1.0;
  if (analysis.pattern === 'speeding_up') {
    adjustmentFactor = 0.9; // Doctor is getting faster
  } else if (analysis.pattern === 'slowing_down') {
    adjustmentFactor = 1.15; // Doctor is getting slower
  } else if (analysis.pattern === 'variable') {
    adjustmentFactor = 1.1; // Add buffer for unpredictability
  }

  // Time of day adjustment
  const hour = new Date().getHours();
  if (hour >= 12 && hour < 14) {
    adjustmentFactor *= 1.1; // Lunch time slowdown
  } else if (hour >= 17) {
    adjustmentFactor *= 0.95; // End of day, often faster
  }

  // Add transition time between patients (1-2 min each)
  const transitionTime = (position - 1) * 1.5;
  
  const estimatedMinutes = Math.round((baseWait * adjustmentFactor) + transitionTime);

  return {
    estimatedMinutes: Math.max(0, estimatedMinutes),
    confidence: analysis.confidence,
    adjustmentFactor,
    baseWait: Math.round(baseWait)
  };
}

/**
 * Get recommendation based on wait time
 */
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

/**
 * Record consultation start (called when doctor starts seeing a patient)
 */
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

/**
 * Record consultation end (called when doctor completes a patient)
 */
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
    
    // Calculate and log duration for analytics
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

/**
 * Get live queue updates for a specific user
 */
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

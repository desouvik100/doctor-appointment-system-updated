import { useState, useEffect, useCallback } from "react";
import axios from "../api/config";
import "./LiveQueueTracker.css";

const LiveQueueTracker = ({ appointment, onClose }) => {
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  const doctorId = appointment?.doctorId?._id || appointment?.doctorId;
  const userQueueNumber =
    appointment?.queueNumber || appointment?.tokenNumber || 1;

  // Format date as YYYY-MM-DD
  const getDateString = useCallback(() => {
    if (!appointment?.date) return null;
    const d = new Date(appointment.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [appointment?.date]);

  const fetchSmartQueueStatus = useCallback(async () => {
    const dateStr = getDateString();
    if (!doctorId || !dateStr) {
      setError("Missing doctor or date information");
      setLoading(false);
      return;
    }

    try {
      // Use the smart queue API with pattern analysis
      const response = await axios.get(
        `/api/appointments/smart-queue/${doctorId}/${dateStr}?queueNumber=${userQueueNumber}`
      );
      const data = response.data;

      if (data.success) {
        setQueueInfo({
          // Position info
          position: data.userPosition,
          tokenNumber: data.userQueueNumber || userQueueNumber,
          patientsAhead: data.patientsAhead,
          totalInQueue: data.totalInQueue,
          waitingCount: data.waitingCount,
          completedToday: data.completedToday,

          // Current status
          currentToken: data.currentToken,
          currentlySeeing: data.currentlySeeing,

          // Time predictions
          estimatedWaitMinutes: data.estimatedWaitMinutes,
          estimatedArrivalTime: data.estimatedArrivalTime,

          // Analysis data
          analysis: data.analysis,

          // Status flags
          isYourTurn: data.isYourTurn,
          isAlmostTurn: data.isAlmostTurn,
          shouldLeaveNow: data.shouldLeaveNow,

          // Recommendation
          recommendation: data.recommendation,

          // Doctor info
          doctorName: data.doctorName,
          slotDuration: data.slotDuration,

          // Appointment status
          appointmentStatus: appointment.status || "confirmed",
        });
        setError(null);
        setLastUpdate(new Date());
        setUpdateCount((prev) => prev + 1);
      } else {
        throw new Error(data.error || "Failed to fetch queue status");
      }
    } catch (err) {
      console.error("Error fetching smart queue status:", err);
      // Fallback to basic queue info
      try {
        const fallbackResponse = await axios.get(
          `/api/appointments/queue-info/${doctorId}/${dateStr}`
        );
        const fallbackData = fallbackResponse.data;

        setQueueInfo({
          position: userQueueNumber,
          tokenNumber: userQueueNumber,
          patientsAhead: Math.max(0, userQueueNumber - 1),
          totalInQueue: fallbackData.currentQueueCount || 0,
          estimatedWaitMinutes:
            Math.max(0, userQueueNumber - 1) *
            (fallbackData.slotDuration || 15),
          estimatedArrivalTime:
            appointment.estimatedArrivalTime || fallbackData.estimatedTime,
          slotDuration: fallbackData.slotDuration || 15,
          appointmentStatus: appointment.status || "confirmed",
          recommendation: {
            message: "Queue information available",
            urgency: "none",
          },
        });
        setError(null);
      } catch {
        setError("Unable to fetch queue status. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [doctorId, getDateString, userQueueNumber, appointment]);

  useEffect(() => {
    fetchSmartQueueStatus();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchSmartQueueStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchSmartQueueStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case "in_progress":
        return "status-active";
      case "confirmed":
        return "status-confirmed";
      case "pending":
        return "status-pending";
      case "completed":
        return "status-completed";
      default:
        return "status-default";
    }
  };

  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case "immediate":
        return "urgency-immediate";
      case "high":
        return "urgency-high";
      case "medium":
        return "urgency-medium";
      default:
        return "urgency-low";
    }
  };

  const getWaitBadge = (minutes, isYourTurn) => {
    if (isYourTurn) return { text: "🎉 Your Turn!", class: "wait-now" };
    if (minutes === 0) return { text: "Your Turn!", class: "wait-now" };
    if (minutes <= 10) return { text: "⚡ Almost There", class: "wait-short" };
    if (minutes <= 20) return { text: "🚶 Leave Now", class: "wait-moderate" };
    if (minutes <= 45) return { text: "⏰ Get Ready", class: "wait-long" };
    return { text: "☕ Relax", class: "wait-very-long" };
  };

  const getPatternIcon = (pattern) => {
    switch (pattern) {
      case "speeding_up":
        return "🚀";
      case "slowing_down":
        return "🐢";
      case "consistent":
        return "✅";
      case "variable":
        return "📊";
      default:
        return "📈";
    }
  };

  const getPatternText = (pattern) => {
    switch (pattern) {
      case "speeding_up":
        return "Doctor is faster today";
      case "slowing_down":
        return "Consultations taking longer";
      case "consistent":
        return "Consistent pace";
      case "variable":
        return "Variable consultation times";
      default:
        return "Analyzing pattern...";
    }
  };

  if (loading) {
    return (
      <div className="queue-tracker-modal">
        <div className="queue-tracker-content">
          <div className="queue-loading">
            <div className="pulse-loader"></div>
            <p>Analyzing queue patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-tracker-modal">
        <div className="queue-tracker-content">
          <div className="queue-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            <button onClick={fetchSmartQueueStatus} className="retry-btn">
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
          <button className="close-tracker" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    );
  }

  const waitBadge = getWaitBadge(
    queueInfo?.estimatedWaitMinutes || 0,
    queueInfo?.isYourTurn
  );

  return (
    <div className="queue-tracker-modal" onClick={onClose}>
      <div
        className="queue-tracker-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tracker-header">
          <div className="header-info">
            <h2>
              <i className="fas fa-users"></i> Live Queue Status
            </h2>
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
          </div>
          <button className="close-tracker" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="tracker-body">
          {/* Doctor Info */}
          <div className="doctor-info-card">
            <div className="doctor-avatar">
              {appointment.doctorId?.profilePhoto ? (
                <img
                  src={appointment.doctorId.profilePhoto}
                  alt={appointment.doctorId.name}
                />
              ) : (
                <span className="avatar-letter">
                  {(appointment.doctorId?.name || "D")[0]}
                </span>
              )}
            </div>
            <div className="doctor-details">
              <h3>Dr. {appointment.doctorId?.name || queueInfo?.doctorName || "Doctor"}</h3>
              <p>{appointment.doctorId?.specialization}</p>
              <p className="clinic-name">
                <i className="fas fa-hospital"></i>
                {appointment.clinicId?.name || "Clinic"}
              </p>
            </div>
          </div>

          {/* Smart Recommendation Banner */}
          {queueInfo?.recommendation && (
            <div
              className={`recommendation-banner ${getUrgencyClass(queueInfo.recommendation.urgency)}`}
            >
              <div className="recommendation-icon">
                {queueInfo.recommendation.urgency === "immediate" && "🎉"}
                {queueInfo.recommendation.urgency === "high" && "⚡"}
                {queueInfo.recommendation.urgency === "medium" && "🚶"}
                {queueInfo.recommendation.urgency === "low" && "⏰"}
                {queueInfo.recommendation.urgency === "none" && "☕"}
              </div>
              <p className="recommendation-text">
                {queueInfo.recommendation.message}
              </p>
            </div>
          )}

          {/* Queue Position */}
          <div className="queue-position-card">
            <div className="position-circle">
              <span className="position-number">
                {queueInfo?.position ?? userQueueNumber}
              </span>
              <span className="position-label">Your Position</span>
            </div>
            <div className="queue-stats">
              <div className="stat">
                <i className="fas fa-ticket-alt"></i>
                <span>Token #{queueInfo?.tokenNumber ?? userQueueNumber}</span>
              </div>
              <div className="stat">
                <i className="fas fa-users"></i>
                <span>{queueInfo?.totalInQueue ?? 0} in queue</span>
              </div>
              <div className="stat">
                <i className="fas fa-user-clock"></i>
                <span>{queueInfo?.patientsAhead ?? 0} before you</span>
              </div>
              {queueInfo?.completedToday > 0 && (
                <div className="stat completed">
                  <i className="fas fa-check-circle"></i>
                  <span>{queueInfo.completedToday} seen today</span>
                </div>
              )}
            </div>
          </div>

          {/* Wait Time Estimate */}
          <div className={`wait-estimate-card ${waitBadge.class}`}>
            <div className="wait-badge">{waitBadge.text}</div>
            <div className="wait-details">
              <div className="wait-time">
                <i className="fas fa-hourglass-half"></i>
                <span>~{queueInfo?.estimatedWaitMinutes ?? 0} min wait</span>
              </div>
              <div className="arrival-time">
                <i className="fas fa-clock"></i>
                <span>
                  Est. arrival:{" "}
                  {queueInfo?.estimatedArrivalTime ||
                    appointment?.estimatedArrivalTime ||
                    "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Currently Seeing */}
          {queueInfo?.currentlySeeing && (
            <div className="current-patient-card">
              <div className="current-label">
                <i className="fas fa-user-check"></i>
                Currently Seeing
              </div>
              <div className="current-token">
                Token #{queueInfo.currentlySeeing.tokenNumber}
              </div>
            </div>
          )}

          {queueInfo?.currentToken > 0 && !queueInfo?.currentlySeeing && (
            <div className="current-patient-card">
              <div className="current-label">
                <i className="fas fa-user-check"></i>
                Last Completed
              </div>
              <div className="current-token">
                Token #{queueInfo.currentToken}
              </div>
            </div>
          )}

          {/* Analysis Card - Shows consultation pattern */}
          {queueInfo?.analysis && (
            <div className="analysis-card">
              <h4>
                <i className="fas fa-chart-line"></i> Today's Pattern
              </h4>
              <div className="analysis-grid">
                <div className="analysis-item">
                  <span className="analysis-icon">
                    {getPatternIcon(queueInfo.analysis.pattern)}
                  </span>
                  <span className="analysis-text">
                    {getPatternText(queueInfo.analysis.pattern)}
                  </span>
                </div>
                {queueInfo.analysis.avgConsultationTime && (
                  <div className="analysis-item">
                    <span className="analysis-icon">⏱️</span>
                    <span className="analysis-text">
                      ~{queueInfo.analysis.avgConsultationTime} min/patient
                    </span>
                  </div>
                )}
                {queueInfo.analysis.confidence && (
                  <div className="analysis-item confidence">
                    <span
                      className={`confidence-badge ${queueInfo.analysis.confidence}`}
                    >
                      {queueInfo.analysis.confidence === "high" && "🎯 High accuracy"}
                      {queueInfo.analysis.confidence === "medium" && "📊 Good estimate"}
                      {queueInfo.analysis.confidence === "low" && "📈 Estimated"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment Status */}
          <div
            className={`status-card ${getStatusColor(queueInfo?.appointmentStatus)}`}
          >
            <span className="status-label">Appointment Status</span>
            <span className="status-value">
              {queueInfo?.appointmentStatus?.replace("_", " ")}
            </span>
          </div>

          {/* Tips */}
          <div className="queue-tips">
            <h4>
              <i className="fas fa-lightbulb"></i> Smart Tips
            </h4>
            <ul>
              {queueInfo?.shouldLeaveNow && (
                <li className="tip-urgent">
                  <strong>Leave now!</strong> Your turn is approaching.
                </li>
              )}
              {queueInfo?.isAlmostTurn && !queueInfo?.isYourTurn && (
                <li className="tip-important">
                  Be ready at the clinic entrance
                </li>
              )}
              <li>Keep this screen open for live updates</li>
              <li>Carry your previous prescriptions if any</li>
            </ul>
          </div>
        </div>

        <div className="tracker-footer">
          <p className="update-info">
            <i className="fas fa-sync-alt"></i>
            Auto-updates every 10 seconds
            {lastUpdate && (
              <span className="last-update">
                {" "}
                • Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
              </span>
            )}
          </p>
          <button className="refresh-btn" onClick={fetchSmartQueueStatus}>
            <i className="fas fa-redo"></i> Refresh Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveQueueTracker;

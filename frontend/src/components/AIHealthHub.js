import { useState } from "react";
import axios from "../api/config";
import toast from "react-hot-toast";
import "./AIHealthHub.css";

const AIHealthHub = ({ user, onClose }) => {
  const [activeFeature, setActiveFeature] = useState("doctor-match");
  const [loading, setLoading] = useState(false);

  // Doctor Match State
  const [symptoms, setSymptoms] = useState("");
  const [matchResults, setMatchResults] = useState(null);

  // Health Insights State
  const [healthInsights, setHealthInsights] = useState(null);

  // Report Analyzer State
  const [reportValues, setReportValues] = useState({});
  const [reportAnalysis, setReportAnalysis] = useState(null);

  // Consultation Notes State
  const [consultationNotes, setConsultationNotes] = useState("");
  const [parsedNotes, setParsedNotes] = useState(null);

  const features = [
    { id: "doctor-match", icon: "🩺", label: "Find Doctor", desc: "AI matches you to best doctors" },
    { id: "health-insights", icon: "📊", label: "Health Insights", desc: "Predictive health analysis" },
    { id: "report-analyzer", icon: "📋", label: "Report Analyzer", desc: "Analyze lab reports" },
    { id: "notes-parser", icon: "🎤", label: "Smart Notes", desc: "Parse consultation notes" },
  ];


  // Smart Doctor Match
  const handleDoctorMatch = async () => {
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/ai-health/match-doctor", { symptoms });
      if (response.data.success) {
        setMatchResults(response.data);
        toast.success(`Found ${response.data.totalMatches} matching doctors!`);
      }
    } catch (error) {
      toast.error("Failed to find doctors");
    } finally {
      setLoading(false);
    }
  };

  // Get Health Insights
  const handleGetInsights = async () => {
    setLoading(true);
    try {
      const userId = user?.id || user?._id;
      const response = await axios.get(`/api/ai-health/health-insights/${userId}`);
      if (response.data.success) {
        setHealthInsights(response.data.insights);
      }
    } catch (error) {
      toast.error("Failed to get health insights");
    } finally {
      setLoading(false);
    }
  };

  // Analyze Report
  const handleAnalyzeReport = async () => {
    if (Object.keys(reportValues).length === 0) {
      toast.error("Please enter at least one test value");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/ai-health/analyze-report", { reportData: reportValues });
      if (response.data.success) {
        setReportAnalysis(response.data.analysis);
        toast.success("Report analyzed!");
      }
    } catch (error) {
      toast.error("Failed to analyze report");
    } finally {
      setLoading(false);
    }
  };

  // Parse Consultation Notes
  const handleParseNotes = async () => {
    if (!consultationNotes.trim()) {
      toast.error("Please enter consultation notes");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("/api/ai-health/parse-notes", {
        notes: consultationNotes,
        patientName: user?.name || "Patient"
      });
      if (response.data.success) {
        setParsedNotes(response.data);
        toast.success("Notes parsed successfully!");
      }
    } catch (error) {
      toast.error("Failed to parse notes");
    } finally {
      setLoading(false);
    }
  };

  const commonTests = [
    { key: "hemoglobin", label: "Hemoglobin (g/dL)" },
    { key: "glucose_fasting", label: "Fasting Glucose (mg/dL)" },
    { key: "cholesterol_total", label: "Total Cholesterol (mg/dL)" },
    { key: "creatinine", label: "Creatinine (mg/dL)" },
    { key: "tsh", label: "TSH (mIU/L)" },
    { key: "vitamin_d", label: "Vitamin D (ng/mL)" },
  ];


  return (
    <div className="ai-health-modal" onClick={onClose}>
      <div className="ai-health-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-health-header">
          <div className="header-content">
            <div className="ai-icon">🤖</div>
            <div>
              <h2>AI Health Assistant</h2>
              <p>Powered by intelligent health analytics</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Feature Tabs */}
        <div className="feature-tabs">
          {features.map((f) => (
            <button
              key={f.id}
              className={`feature-tab ${activeFeature === f.id ? "active" : ""}`}
              onClick={() => setActiveFeature(f.id)}
            >
              <span className="tab-icon">{f.icon}</span>
              <span className="tab-label">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="ai-health-content">
          {/* Smart Doctor Match */}
          {activeFeature === "doctor-match" && (
            <div className="feature-section">
              <div className="section-header">
                <h3>🩺 Smart Doctor Matching</h3>
                <p>Describe your symptoms and AI will find the best doctors for you</p>
              </div>

              <div className="input-group">
                <textarea
                  placeholder="Describe your symptoms... (e.g., I have chest pain and shortness of breath)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                />
                <button className="action-btn primary" onClick={handleDoctorMatch} disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                  Find Doctors
                </button>
              </div>

              {/* Quick Symptoms */}
              <div className="quick-options">
                <span>Quick select:</span>
                {["Fever & Cold", "Headache", "Stomach Pain", "Skin Issue", "Joint Pain"].map((s) => (
                  <button key={s} className="quick-btn" onClick={() => setSymptoms(s)}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Results */}
              {matchResults && (
                <div className="results-section">
                  <div className="results-header">
                    <h4>Recommended Doctors</h4>
                    <span className="badge">{matchResults.matchedSpecializations?.join(", ")}</span>
                  </div>
                  <div className="doctor-list">
                    {matchResults.recommendations?.map((rec, i) => (
                      <div key={i} className="doctor-card">
                        <div className="doctor-avatar">
                          {rec.doctor.profilePhoto ? (
                            <img src={rec.doctor.profilePhoto} alt={rec.doctor.name} />
                          ) : (
                            <span>{rec.doctor.name?.[0]}</span>
                          )}
                        </div>
                        <div className="doctor-info">
                          <h5>Dr. {rec.doctor.name}</h5>
                          <p>{rec.doctor.specialization}</p>
                          <div className="doctor-meta">
                            <span><i className="fas fa-star"></i> {rec.doctor.rating || "N/A"}</span>
                            <span><i className="fas fa-rupee-sign"></i> {rec.doctor.consultationFee}</span>
                          </div>
                        </div>
                        <div className="match-score">
                          <span className="score">{rec.matchScore}%</span>
                          <span className="label">Match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Health Insights */}
          {activeFeature === "health-insights" && (
            <div className="feature-section">
              <div className="section-header">
                <h3>📊 Predictive Health Insights</h3>
                <p>AI analyzes your health history to provide personalized insights</p>
              </div>

              <button className="action-btn primary full-width" onClick={handleGetInsights} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-brain"></i>}
                Analyze My Health
              </button>

              {healthInsights && (
                <div className="insights-results">
                  {/* Risk Assessment */}
                  {healthInsights.riskAssessment?.length > 0 && (
                    <div className="insight-card risk">
                      <h4><i className="fas fa-exclamation-triangle"></i> Risk Assessment</h4>
                      {healthInsights.riskAssessment.map((risk, i) => (
                        <div key={i} className={`risk-item ${risk.riskLevel}`}>
                          <div className="risk-header">
                            <span className="risk-name">{risk.condition}</span>
                            <span className={`risk-badge ${risk.riskLevel}`}>{risk.riskLevel}</span>
                          </div>
                          <div className="risk-bar">
                            <div className="risk-fill" style={{ width: `${risk.riskScore}%` }}></div>
                          </div>
                          <div className="risk-tips">
                            <strong>Prevention Tips:</strong>
                            <ul>
                              {risk.preventiveTips?.slice(0, 2).map((tip, j) => (
                                <li key={j}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Wellness Tips */}
                  {healthInsights.wellnessTips?.length > 0 && (
                    <div className="insight-card wellness">
                      <h4><i className="fas fa-heart"></i> Wellness Tips</h4>
                      <ul>
                        {healthInsights.wellnessTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Upcoming Checkups */}
                  {healthInsights.upcomingCheckups?.length > 0 && (
                    <div className="insight-card checkups">
                      <h4><i className="fas fa-calendar-check"></i> Recommended Checkups</h4>
                      {healthInsights.upcomingCheckups.map((checkup, i) => (
                        <div key={i} className="checkup-item">
                          <span className="checkup-type">{checkup.type}</span>
                          <span className="checkup-freq">{checkup.recommended}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Report Analyzer */}
          {activeFeature === "report-analyzer" && (
            <div className="feature-section">
              <div className="section-header">
                <h3>📋 Health Report Analyzer</h3>
                <p>Enter your lab test values for AI analysis</p>
              </div>

              <div className="report-inputs">
                {commonTests.map((test) => (
                  <div key={test.key} className="report-input">
                    <label>{test.label}</label>
                    <input
                      type="number"
                      placeholder="Enter value"
                      value={reportValues[test.key] || ""}
                      onChange={(e) => setReportValues({ ...reportValues, [test.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <button className="action-btn primary full-width" onClick={handleAnalyzeReport} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microscope"></i>}
                Analyze Report
              </button>

              {reportAnalysis && (
                <div className="report-results">
                  <div className={`overall-status ${reportAnalysis.overallStatus}`}>
                    <span className="status-icon">
                      {reportAnalysis.overallStatus === "normal" && "✅"}
                      {reportAnalysis.overallStatus === "minor_concerns" && "⚠️"}
                      {reportAnalysis.overallStatus === "needs_attention" && "🔶"}
                      {reportAnalysis.overallStatus === "critical" && "🔴"}
                    </span>
                    <span className="status-text">
                      {reportAnalysis.overallStatus.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {reportAnalysis.abnormal?.length > 0 && (
                    <div className="abnormal-section">
                      <h4>⚠️ Abnormal Values</h4>
                      {reportAnalysis.abnormal.map((item, i) => (
                        <div key={i} className={`test-result ${item.status}`}>
                          <span className="test-name">{item.test}</span>
                          <span className="test-value">{item.value} {item.unit}</span>
                          <span className={`test-status ${item.status}`}>{item.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {reportAnalysis.recommendations?.length > 0 && (
                    <div className="recommendations">
                      <h4>💡 Recommendations</h4>
                      <ul>
                        {reportAnalysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Consultation Notes Parser */}
          {activeFeature === "notes-parser" && (
            <div className="feature-section">
              <div className="section-header">
                <h3>🎤 Smart Consultation Notes</h3>
                <p>Enter or dictate consultation notes for AI to structure</p>
              </div>

              <div className="input-group">
                <textarea
                  placeholder="Enter consultation notes... (e.g., Patient complains of fever for 3 days, BP 120/80, temperature 101F, prescribed paracetamol 500mg, follow-up in 1 week)"
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  rows={5}
                />
                <button className="action-btn primary" onClick={handleParseNotes} disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                  Parse Notes
                </button>
              </div>

              {parsedNotes && (
                <div className="parsed-results">
                  <div className="parsed-section">
                    <h4>📝 Structured Summary</h4>
                    
                    {parsedNotes.structured.chiefComplaint && (
                      <div className="parsed-item">
                        <label>Chief Complaint</label>
                        <p>{parsedNotes.structured.chiefComplaint}</p>
                      </div>
                    )}

                    {parsedNotes.structured.symptoms?.length > 0 && (
                      <div className="parsed-item">
                        <label>Symptoms Detected</label>
                        <div className="tags">
                          {parsedNotes.structured.symptoms.map((s, i) => (
                            <span key={i} className="tag">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(parsedNotes.structured.vitals || {}).length > 0 && (
                      <div className="parsed-item">
                        <label>Vitals</label>
                        <div className="vitals-grid">
                          {Object.entries(parsedNotes.structured.vitals).map(([key, value]) => (
                            <div key={key} className="vital">
                              <span className="vital-label">{key}</span>
                              <span className="vital-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {parsedNotes.structured.followUp && (
                      <div className="parsed-item">
                        <label>Follow-up</label>
                        <p className="follow-up">{parsedNotes.structured.followUp}</p>
                      </div>
                    )}
                  </div>

                  <div className="prescription-preview">
                    <h4>📄 Prescription Template</h4>
                    <pre>{parsedNotes.prescriptionTemplate?.template}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ai-health-footer">
          <p>
            <i className="fas fa-info-circle"></i>
            AI suggestions are for informational purposes only. Always consult a healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIHealthHub;

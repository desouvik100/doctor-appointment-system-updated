import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './SecondOpinion.css';

const SecondOpinion = ({ userId, userName }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [requests, setRequests] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    condition: '',
    currentDiagnosis: '',
    symptoms: '',
    duration: '',
    currentTreatment: '',
    specialization: '',
    urgency: 'normal',
    documents: [],
    additionalNotes: ''
  });

  const specializations = [
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 
    'Gastroenterology', 'Pulmonology', 'Nephrology', 'Endocrinology',
    'Dermatology', 'Psychiatry', 'Rheumatology', 'Urology'
  ];

  const expertDoctors = [
    { id: 1, name: 'Dr. Rajesh Sharma', specialization: 'Cardiology', experience: '25 years', hospital: 'AIIMS Delhi', rating: 4.9, fee: 2500 },
    { id: 2, name: 'Dr. Priya Mehta', specialization: 'Oncology', experience: '20 years', hospital: 'Tata Memorial', rating: 4.8, fee: 3000 },
    { id: 3, name: 'Dr. Amit Kumar', specialization: 'Neurology', experience: '22 years', hospital: 'NIMHANS', rating: 4.9, fee: 2800 },
    { id: 4, name: 'Dr. Sunita Reddy', specialization: 'Orthopedics', experience: '18 years', hospital: 'Apollo', rating: 4.7, fee: 2000 }
  ];

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const saved = localStorage.getItem(`second_opinion_${userId}`);
    if (saved) setRequests(JSON.parse(saved));
  };

  const saveRequests = (data) => {
    localStorage.setItem(`second_opinion_${userId}`, JSON.stringify(data));
    setRequests(data);
  };

  const handleSubmit = () => {
    if (!formData.condition || !formData.currentDiagnosis || !formData.specialization) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const request = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        requestNumber: `SO${Date.now().toString().slice(-8)}`,
        submittedAt: new Date().toISOString(),
        estimatedResponse: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };
      
      saveRequests([request, ...requests]);
      setFormData({
        condition: '', currentDiagnosis: '', symptoms: '', duration: '',
        currentTreatment: '', specialization: '', urgency: 'normal',
        documents: [], additionalNotes: ''
      });
      setShowNewRequest(false);
      setActiveStep(1);
      setLoading(false);
      toast.success('Second opinion request submitted!');
    }, 1500);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      reviewing: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="second-opinion">
      {/* Hero Section */}
      <div className="so-hero">
        <div className="hero-content">
          <h2><i className="fas fa-user-md"></i> Get Expert Second Opinion</h2>
          <p>Connect with India's top specialists for a comprehensive review of your diagnosis</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="value">500+</span>
              <span className="label">Expert Doctors</span>
            </div>
            <div className="stat">
              <span className="value">48hrs</span>
              <span className="label">Response Time</span>
            </div>
            <div className="stat">
              <span className="value">95%</span>
              <span className="label">Satisfaction</span>
            </div>
          </div>
        </div>
        <button className="request-btn" onClick={() => setShowNewRequest(true)}>
          <i className="fas fa-plus"></i> Request Second Opinion
        </button>
      </div>

      {/* Why Second Opinion */}
      <div className="why-section">
        <h3>Why Get a Second Opinion?</h3>
        <div className="reasons-grid">
          <div className="reason-card">
            <i className="fas fa-check-double"></i>
            <h4>Confirm Diagnosis</h4>
            <p>Ensure accuracy of your current diagnosis with expert review</p>
          </div>
          <div className="reason-card">
            <i className="fas fa-lightbulb"></i>
            <h4>Explore Options</h4>
            <p>Discover alternative treatment approaches you might have missed</p>
          </div>
          <div className="reason-card">
            <i className="fas fa-heart"></i>
            <h4>Peace of Mind</h4>
            <p>Make informed decisions about your health with confidence</p>
          </div>
          <div className="reason-card">
            <i className="fas fa-hospital"></i>
            <h4>Top Specialists</h4>
            <p>Access doctors from premier institutions across India</p>
          </div>
        </div>
      </div>

      {/* Expert Doctors */}
      <div className="experts-section">
        <h3><i className="fas fa-star"></i> Our Expert Panel</h3>
        <div className="experts-grid">
          {expertDoctors.map(doctor => (
            <div key={doctor.id} className="expert-card">
              <div className="expert-avatar">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="expert-info">
                <h4>{doctor.name}</h4>
                <span className="specialization">{doctor.specialization}</span>
                <p className="hospital"><i className="fas fa-hospital"></i> {doctor.hospital}</p>
                <p className="experience"><i className="fas fa-briefcase"></i> {doctor.experience}</p>
              </div>
              <div className="expert-footer">
                <div className="rating">
                  <i className="fas fa-star"></i> {doctor.rating}
                </div>
                <div className="fee">₹{doctor.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Requests */}
      <div className="requests-section">
        <h3><i className="fas fa-file-medical"></i> My Second Opinion Requests</h3>
        {requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <p>No requests yet</p>
            <span>Submit your first second opinion request</span>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-header">
                  <div>
                    <h4>{req.condition}</h4>
                    <span className="request-number">#{req.requestNumber}</span>
                  </div>
                  <span className="status-badge" style={{background: getStatusColor(req.status)}}>
                    {req.status}
                  </span>
                </div>
                <div className="request-details">
                  <p><i className="fas fa-stethoscope"></i> {req.specialization}</p>
                  <p><i className="fas fa-calendar"></i> {new Date(req.submittedAt).toLocaleDateString()}</p>
                  <p><i className="fas fa-clock"></i> Response by: {new Date(req.estimatedResponse).toLocaleDateString()}</p>
                </div>
                <div className="request-diagnosis">
                  <strong>Current Diagnosis:</strong> {req.currentDiagnosis}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="modal-overlay" onClick={() => setShowNewRequest(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-file-medical-alt"></i> Request Second Opinion</h3>
              <button className="close-btn" onClick={() => setShowNewRequest(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              {[1, 2, 3].map(step => (
                <div key={step} className={`step ${activeStep >= step ? 'active' : ''} ${activeStep > step ? 'completed' : ''}`}>
                  <div className="step-number">{activeStep > step ? <i className="fas fa-check"></i> : step}</div>
                  <span>{step === 1 ? 'Medical Info' : step === 2 ? 'Documents' : 'Review'}</span>
                </div>
              ))}
            </div>

            <div className="modal-body">
              {/* Step 1: Medical Information */}
              {activeStep === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label>Medical Condition *</label>
                    <input
                      type="text"
                      placeholder="e.g., Heart Disease, Cancer, etc."
                      value={formData.condition}
                      onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Diagnosis *</label>
                    <textarea
                      placeholder="Describe your current diagnosis in detail"
                      value={formData.currentDiagnosis}
                      onChange={(e) => setFormData({...formData, currentDiagnosis: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Specialization Needed *</label>
                      <select
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      >
                        <option value="">Select Specialization</option>
                        {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Urgency Level</label>
                      <select
                        value={formData.urgency}
                        onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                      >
                        <option value="normal">Normal (48-72 hrs)</option>
                        <option value="urgent">Urgent (24 hrs) +₹500</option>
                        <option value="emergency">Emergency (12 hrs) +₹1000</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Symptoms</label>
                    <textarea
                      placeholder="List your symptoms"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Treatment</label>
                    <textarea
                      placeholder="Describe your current treatment plan"
                      value={formData.currentTreatment}
                      onChange={(e) => setFormData({...formData, currentTreatment: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Documents */}
              {activeStep === 2 && (
                <div className="form-step">
                  <div className="upload-section">
                    <div className="upload-area">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <h4>Upload Medical Documents</h4>
                      <p>Drag & drop or click to upload</p>
                      <span>Supported: PDF, JPG, PNG (Max 10MB each)</span>
                    </div>
                    <div className="document-types">
                      <h5>Recommended Documents:</h5>
                      <ul>
                        <li><i className="fas fa-check"></i> Medical reports & test results</li>
                        <li><i className="fas fa-check"></i> X-rays, MRI, CT scans</li>
                        <li><i className="fas fa-check"></i> Previous prescriptions</li>
                        <li><i className="fas fa-check"></i> Discharge summaries</li>
                        <li><i className="fas fa-check"></i> Pathology reports</li>
                      </ul>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      placeholder="Any additional information for the specialist"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {activeStep === 3 && (
                <div className="form-step review-step">
                  <div className="review-card">
                    <h4>Review Your Request</h4>
                    <div className="review-item">
                      <span>Condition:</span>
                      <strong>{formData.condition}</strong>
                    </div>
                    <div className="review-item">
                      <span>Specialization:</span>
                      <strong>{formData.specialization}</strong>
                    </div>
                    <div className="review-item">
                      <span>Urgency:</span>
                      <strong>{formData.urgency}</strong>
                    </div>
                    <div className="review-item">
                      <span>Diagnosis:</span>
                      <strong>{formData.currentDiagnosis}</strong>
                    </div>
                  </div>
                  <div className="pricing-card">
                    <h4>Pricing</h4>
                    <div className="price-row">
                      <span>Consultation Fee</span>
                      <span>₹1,500</span>
                    </div>
                    {formData.urgency === 'urgent' && (
                      <div className="price-row">
                        <span>Urgent Processing</span>
                        <span>₹500</span>
                      </div>
                    )}
                    {formData.urgency === 'emergency' && (
                      <div className="price-row">
                        <span>Emergency Processing</span>
                        <span>₹1,000</span>
                      </div>
                    )}
                    <div className="price-row total">
                      <span>Total</span>
                      <span>₹{1500 + (formData.urgency === 'urgent' ? 500 : formData.urgency === 'emergency' ? 1000 : 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {activeStep > 1 && (
                <button className="back-btn" onClick={() => setActiveStep(activeStep - 1)}>
                  <i className="fas fa-arrow-left"></i> Back
                </button>
              )}
              {activeStep < 3 ? (
                <button className="next-btn" onClick={() => setActiveStep(activeStep + 1)}>
                  Next <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> Submit & Pay</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondOpinion;

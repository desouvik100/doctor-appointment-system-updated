import React, { useState } from "react";
import axios from "../api/config";
import toast from 'react-hot-toast';
import PaymentGateway from "./PaymentGateway";

// Check if Stripe payments are enabled
const USE_STRIPE_PAYMENTS = process.env.REACT_APP_USE_STRIPE_PAYMENTS === 'true';

function BookAppointment({ doctor, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    consultationType: "in_person"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const appointmentData = {
        doctorId: doctor._id,
        userId: user.id,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        clinicId: doctor.clinicId,
        consultationType: formData.consultationType
      };

      console.log("Booking appointment with data:", appointmentData);
      const response = await axios.post("/api/appointments", appointmentData);
      console.log("Appointment booked successfully:", response.data);
      
      // Check if payment is required (only if Stripe is enabled)
      if (response.data.requiresPayment && USE_STRIPE_PAYMENTS) {
        setAppointmentId(response.data._id);
        setPaymentBreakdown(response.data.paymentBreakdown);
        setShowPayment(true);
        
        // Show appropriate success message based on consultation type
        if (formData.consultationType === 'online') {
          toast.success('Online consultation booked successfully!', {
            duration: 4000,
            icon: '🎥'
          });
          toast('Please complete payment to confirm your booking.', {
            duration: 5000,
            icon: 'ℹ️'
          });
        } else {
          toast.success('Appointment booked successfully!', {
            duration: 4000
          });
          toast('Please complete payment to confirm your booking.', {
            duration: 5000,
            icon: 'ℹ️'
          });
        }
      } else {
        // Test mode - no payment required
        onSuccess();
        if (formData.consultationType === 'online') {
          toast.success('✅ Online consultation booked successfully (Test Mode - No Payment Required)!', {
            duration: 5000,
            icon: '🎥'
          });
          toast('You can join 15 minutes before the scheduled time.', {
            duration: 5000,
            icon: 'ℹ️'
          });
        } else {
          toast.success('✅ Appointment booked successfully (Test Mode - No Payment Required)!', {
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowPayment(false);
    onSuccess();
    toast.success(`Payment successful! Transaction ID: ${paymentData.transactionId}`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    // Optionally delete the appointment if payment is cancelled
  };

  // Get today's date for min date input
  const today = new Date().toISOString().split('T')[0];

  // Show payment gateway if payment is required
  if (showPayment) {
    return (
      <PaymentGateway
        appointmentId={appointmentId}
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-calendar-plus me-2"></i>
              Book Appointment
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-2">
                <i className="fas fa-user-md me-2"></i>
                Dr. {doctor.name}
              </h6>
              <p className="mb-1 small text-muted">
                <i className="fas fa-stethoscope me-1"></i>
                {doctor.specialization}
              </p>
              <p className="mb-1 small text-muted">
                <i className="fas fa-envelope me-1"></i>
                {doctor.email}
              </p>
              <p className="mb-0 small">
                <i className="fas fa-rupee-sign me-1 text-success"></i>
                <strong className="text-success">Consultation Fee: ₹{doctor.consultationFee}</strong>
              </p>
            </div>

            {/* Payment Info Alert */}
            {USE_STRIPE_PAYMENTS ? (
              <div className="alert alert-info" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Payment Required:</strong> After booking, you'll be redirected to secure payment gateway.
                <br />
                <small>
                  Total: ₹{doctor.consultationFee} + GST (22%) + Platform Fee (7%)
                </small>
              </div>
            ) : (
              <div className="alert alert-success" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                <strong>Test Mode:</strong> No payment required. Appointments are free for testing.
                <br />
                <small className="text-muted">
                  Consultation Fee: ₹{doctor.consultationFee} (Payment disabled in test mode)
                </small>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-laptop-medical me-1"></i>
                  Consultation Type
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <div 
                      className={`consultation-type-card ${formData.consultationType === 'in_person' ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, consultationType: 'in_person'})}
                      style={{
                        border: formData.consultationType === 'in_person' ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        background: formData.consultationType === 'in_person' ? 'rgba(102, 126, 234, 0.1)' : 'white'
                      }}
                    >
                      <i className="fas fa-hospital fa-2x mb-2" style={{color: formData.consultationType === 'in_person' ? '#667eea' : '#64748b'}}></i>
                      <div style={{fontWeight: '600', color: formData.consultationType === 'in_person' ? '#667eea' : '#1e293b'}}>
                        In-Person
                      </div>
                      <small className="text-muted">Visit clinic</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div 
                      className={`consultation-type-card ${formData.consultationType === 'online' ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, consultationType: 'online'})}
                      style={{
                        border: formData.consultationType === 'online' ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        background: formData.consultationType === 'online' ? 'rgba(102, 126, 234, 0.1)' : 'white'
                      }}
                    >
                      <i className="fas fa-video fa-2x mb-2" style={{color: formData.consultationType === 'online' ? '#667eea' : '#64748b'}}></i>
                      <div style={{fontWeight: '600', color: formData.consultationType === 'online' ? '#667eea' : '#1e293b'}}>
                        Online
                      </div>
                      <small className="text-muted">Video call</small>
                    </div>
                  </div>
                </div>
              </div>

              {formData.consultationType === 'online' && (
                <div className="alert alert-info mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Online Consultation:</strong> You'll receive a meeting link after payment. 
                  The consultation can be joined 15 minutes before the scheduled time.
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-calendar me-1"></i>
                  Appointment Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-clock me-1"></i>
                  Appointment Time
                </label>
                <select
                  className="form-select"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="09:30">09:30 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-notes-medical me-1"></i>
                  Reason for Visit
                </label>
                <textarea
                  className="form-control"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe your symptoms or reason for the appointment..."
                  required
                ></textarea>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  {error}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary flex-fill"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-fill"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Booking...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookAppointment;
